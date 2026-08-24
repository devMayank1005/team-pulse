// api/tasks.js — task CRUD, single endpoint dispatched by method.
//   GET    /api/tasks              -> list all tasks (with assignee/creator names joined client-side)
//   POST   /api/tasks              -> create task { title, description, assigneeId, dueDate, priority }
//   PATCH  /api/tasks?id=...       -> update task (any subset of fields, incl. status)
//   DELETE /api/tasks?id=...       -> delete task
// Every write is attributed + audited. Any logged-in user can create/edit
// any task (small-team tool) — tighten to "own tasks only" later if needed.

const { validateToken } = require('./_auth');
const { logAudit, clientIp } = require('./_audit');
const { applyCors } = require('./_cors');
const { serverError, safeError } = require('./_errors');

const STATUSES = ['open', 'in_progress', 'done'];
const PRIORITIES = ['low', 'normal', 'high'];

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
      const r = await fetch(`${SUPABASE_URL}/rest/v1/tasks?select=*&order=due_date.asc.nullslast,created_at.desc`, { headers: sbHeaders });
      if (!r.ok) return res.status(500).json({ error: 'Database error' });
      return res.status(200).json({ tasks: await r.json() });
    }

    if (req.method === 'POST') {
      const { title, description, assigneeId, dueDate, priority } = req.body || {};
      if (!title || !title.trim()) return safeError(res, 400, 'title required');
      if (priority && !PRIORITIES.includes(priority)) return safeError(res, 400, 'invalid priority');

      const row = {
        title: title.trim(),
        description: description || null,
        assignee_id: assigneeId || null,
        due_date: dueDate || null,
        priority: priority || 'normal',
        status: 'open',
        created_by: actor.id,
      };
      const r = await fetch(`${SUPABASE_URL}/rest/v1/tasks`, {
        method: 'POST', headers: { ...sbHeaders, Prefer: 'return=representation' }, body: JSON.stringify(row),
      });
      if (!r.ok) return res.status(500).json({ error: 'Database error' });
      const [created] = await r.json();
      await logAudit(env, { actorId: actor.id, username: actor.username, role: actor.role, action: `Created task "${row.title}"`, entity: 'task', screen: 'tasks', ip, userAgent });
      return res.status(201).json({ task: created });
    }

    const id = (req.query || {}).id;
    if (!id) return safeError(res, 400, 'id required');

    if (req.method === 'PATCH') {
      const body = req.body || {};
      const update = { updated_at: new Date().toISOString() };
      if (body.title !== undefined) update.title = String(body.title).trim();
      if (body.description !== undefined) update.description = body.description;
      if (body.assigneeId !== undefined) update.assignee_id = body.assigneeId;
      if (body.dueDate !== undefined) update.due_date = body.dueDate;
      if (body.priority !== undefined) {
        if (!PRIORITIES.includes(body.priority)) return safeError(res, 400, 'invalid priority');
        update.priority = body.priority;
      }
      if (body.status !== undefined) {
        if (!STATUSES.includes(body.status)) return safeError(res, 400, 'invalid status');
        update.status = body.status;
        update.completed_at = body.status === 'done' ? new Date().toISOString() : null;
      }

      const r = await fetch(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH', headers: { ...sbHeaders, Prefer: 'return=representation' }, body: JSON.stringify(update),
      });
      if (!r.ok) return res.status(500).json({ error: 'Database error' });
      const rows = await r.json();
      if (!rows.length) return safeError(res, 404, 'Task not found');
      await logAudit(env, { actorId: actor.id, username: actor.username, role: actor.role, action: `Updated task ${id}${body.status ? ` -> ${body.status}` : ''}`, entity: 'task', screen: 'tasks', ip, userAgent });
      return res.status(200).json({ task: rows[0] });
    }

    if (req.method === 'DELETE') {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE', headers: { ...sbHeaders, Prefer: 'return=representation' },
      });
      if (!r.ok) return res.status(500).json({ error: 'Database error' });
      const rows = await r.json();
      if (!rows.length) return safeError(res, 404, 'Task not found');
      await logAudit(env, { actorId: actor.id, username: actor.username, role: actor.role, action: `Deleted task ${id}`, entity: 'task', screen: 'tasks', ip, userAgent });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'GET, POST, PATCH, or DELETE only' });
  } catch (err) {
    return serverError(res, err, 'tasks.js');
  }
};
