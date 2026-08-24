// api/users.js — team roster.
//   GET    /api/users          -> list (id, username, name, email, role — never password_hash)
//   POST   /api/users          -> admin only: add team member { username, name, email, password, role }
//   PATCH  /api/users?id=...   -> admin only: edit name/email/role, or self: nothing here (see account.js if added later)
//   DELETE /api/users?id=...   -> admin only: remove member (blocked if it's the last admin)
// Passwords are bcrypt-hashed here, server-side, before ever touching Supabase.

const bcrypt = require('bcryptjs');
const { validateToken } = require('./_auth');
const { logAudit, clientIp } = require('./_audit');
const { applyCors } = require('./_cors');
const { serverError, safeError } = require('./_errors');

const BCRYPT_COST = 12;

module.exports = async function handler(req, res) {
  applyCors(req, res, 'GET, POST, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SESSION_SECRET } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SESSION_SECRET) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const token = req.headers['x-session-token'];
  const check = await validateToken(token, SESSION_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  if (!check.valid) return res.status(401).json({ error: 'Not authenticated', reason: check.reason });
  const actor = check.payload;

  const env = { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY };
  const sbHeaders = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };
  const ip = clientIp(req), userAgent = req.headers['user-agent'];

  try {
    if (req.method === 'GET') {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,username,name,email,role&order=name.asc`, { headers: sbHeaders });
      if (!r.ok) return res.status(500).json({ error: 'Database error' });
      return res.status(200).json({ users: await r.json() });
    }

    if (actor.role !== 'admin') return safeError(res, 403, 'Admin only');

    if (req.method === 'POST') {
      const { username, name, email, password, role } = req.body || {};
      if (!username || !name || !email || !password) return safeError(res, 400, 'username, name, email, password required');
      if (password.length < 8) return safeError(res, 400, 'password must be at least 8 characters');
      const password_hash = await bcrypt.hash(password, BCRYPT_COST);
      const row = { username: username.trim(), name: name.trim(), email: email.trim(), password_hash, role: role === 'admin' ? 'admin' : 'member' };

      const r = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST', headers: { ...sbHeaders, Prefer: 'return=representation' }, body: JSON.stringify(row),
      });
      if (!r.ok) {
        const body = await r.text().catch(() => '');
        if (body.includes('duplicate') || body.includes('unique')) return safeError(res, 409, 'Username or email already exists');
        return res.status(500).json({ error: 'Database error' });
      }
      const [created] = await r.json();
      await logAudit(env, { actorId: actor.id, username: actor.username, role: actor.role, action: `Added user ${row.username}`, entity: 'user', screen: 'admin', ip, userAgent });
      return res.status(201).json({ user: { id: created.id, username: created.username, name: created.name, email: created.email, role: created.role } });
    }

    const id = (req.query || {}).id;
    if (!id) return safeError(res, 400, 'id required');

    if (req.method === 'PATCH') {
      const body = req.body || {};
      const update = {};
      if (body.name !== undefined) update.name = String(body.name).trim();
      if (body.email !== undefined) update.email = String(body.email).trim();
      if (body.role !== undefined) update.role = body.role === 'admin' ? 'admin' : 'member';
      if (body.password) {
        if (body.password.length < 8) return safeError(res, 400, 'password must be at least 8 characters');
        update.password_hash = await bcrypt.hash(body.password, BCRYPT_COST);
        update.token_version = 1; // bump handled below via read-modify-write
      }

      if (update.role) {
        // Last-admin guard: refuse to demote the only remaining admin.
        const countRes = await fetch(`${SUPABASE_URL}/rest/v1/users?role=eq.admin&select=id`, { headers: sbHeaders });
        const admins = countRes.ok ? await countRes.json() : [];
        if (update.role !== 'admin' && admins.length === 1 && admins[0].id === id) {
          return safeError(res, 400, 'Cannot demote the last remaining admin');
        }
      }

      if (update.token_version) {
        const curRes = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(id)}&select=token_version`, { headers: sbHeaders });
        const cur = curRes.ok ? await curRes.json() : [];
        update.token_version = ((cur[0] && cur[0].token_version) || 0) + 1;
      }

      const r = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH', headers: { ...sbHeaders, Prefer: 'return=representation' }, body: JSON.stringify(update),
      });
      if (!r.ok) return res.status(500).json({ error: 'Database error' });
      const rows = await r.json();
      if (!rows.length) return safeError(res, 404, 'User not found');
      await logAudit(env, { actorId: actor.id, username: actor.username, role: actor.role, action: `Updated user ${id}`, entity: 'user', screen: 'admin', ip, userAgent });
      const u = rows[0];
      return res.status(200).json({ user: { id: u.id, username: u.username, name: u.name, email: u.email, role: u.role } });
    }

    if (req.method === 'DELETE') {
      const countRes = await fetch(`${SUPABASE_URL}/rest/v1/users?role=eq.admin&select=id`, { headers: sbHeaders });
      const admins = countRes.ok ? await countRes.json() : [];
      if (admins.length === 1 && admins[0].id === id) return safeError(res, 400, 'Cannot delete the last remaining admin');

      const r = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE', headers: { ...sbHeaders, Prefer: 'return=representation' },
      });
      if (!r.ok) return res.status(500).json({ error: 'Database error' });
      const rows = await r.json();
      if (!rows.length) return safeError(res, 404, 'User not found');
      await logAudit(env, { actorId: actor.id, username: actor.username, role: actor.role, action: `Removed user ${id}`, entity: 'user', screen: 'admin', ip, userAgent });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'GET, POST, PATCH, or DELETE only' });
  } catch (err) {
    return serverError(res, err, 'users.js');
  }
};
