// api/login.js — bcrypt password verification, escalating per-username
// lockout, independent IP-based throttle, generic error responses. Same
// pattern as Kora's login.js.

const bcrypt = require('bcryptjs');
const { signToken } = require('./_auth');
const { logAudit, clientIp } = require('./_audit');
const { applyCors } = require('./_cors');
const { checkIpThrottle, recordIpFailure } = require('./_throttle');
const { serverError } = require('./_errors');

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS_BEFORE_LOCK = 5;
const LOCKOUT_MINUTES = [30, 240, 1440]; // 30min -> 4hr -> 24hr, repeats at 24hr after
const BCRYPT_COST = 12;

// Fixed precomputed hash so an "unknown username" request takes about the
// same time as a "wrong password" request — otherwise the two are
// distinguishable by response time even with identical status/body.
const DUMMY_HASH = '$2b$12$qs9g9NfuP.AOlgY5K24XsekwE.GxJ5.99rmHJDYy9O1ZIlKjBS/Pa';

module.exports = async function handler(req, res) {
  applyCors(req, res, 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SESSION_SECRET } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SESSION_SECRET) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const env = { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY };
  const ip = clientIp(req), userAgent = req.headers['user-agent'];

  const throttle = await checkIpThrottle(env, ip);
  if (throttle.locked) {
    return res.status(429).json({
      error: `Too many attempts from your network. Try again in ${throttle.remainingMin} minute${throttle.remainingMin !== 1 ? 's' : ''}.`,
    });
  }

  const sbHeaders = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/users?username=eq.${encodeURIComponent(username)}&select=*&limit=1`,
      { headers: sbHeaders }
    );
    if (!r.ok) return res.status(500).json({ error: 'Database error' });
    const rows = await r.json();
    const INVALID = { error: 'Invalid username or password' };

    if (!rows.length) {
      await bcrypt.compare(password, DUMMY_HASH); // keep timing consistent
      await logAudit(env, { username, action: 'Login failed: unknown user', entity: 'session', screen: 'login', ip, userAgent });
      await recordIpFailure(env, ip, throttle.row);
      return res.status(401).json(INVALID);
    }

    const user = rows[0];

    if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
      const remainingMin = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
      await logAudit(env, { username, action: `Login failed: locked out (${remainingMin}min left)`, entity: 'session', screen: 'login', ip, userAgent });
      await recordIpFailure(env, ip, throttle.row);
      return res.status(423).json({
        error: `Too many failed attempts. Try again in ${remainingMin} minute${remainingMin !== 1 ? 's' : ''}.`,
        lockedUntil: user.locked_until,
      });
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      const newAttempts = (user.failed_attempts || 0) + 1;
      const update = { failed_attempts: newAttempts };
      if (newAttempts >= MAX_ATTEMPTS_BEFORE_LOCK) {
        const level = user.lockout_level || 0;
        const minutes = LOCKOUT_MINUTES[Math.min(level, LOCKOUT_MINUTES.length - 1)];
        update.locked_until = new Date(Date.now() + minutes * 60000).toISOString();
        update.lockout_level = level + 1;
        update.failed_attempts = 0;
      }
      await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(user.id)}`, {
        method: 'PATCH', headers: sbHeaders, body: JSON.stringify(update),
      });
      await logAudit(env, { username, action: 'Login failed: wrong password', entity: 'session', screen: 'login', ip, userAgent });
      await recordIpFailure(env, ip, throttle.row);
      return res.status(401).json(INVALID);
    }

    await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(user.id)}`, {
      method: 'PATCH', headers: sbHeaders,
      body: JSON.stringify({ failed_attempts: 0, lockout_level: 0, locked_until: null }),
    });

    const iat = Date.now();
    const token = signToken({
      id: user.id, username: user.username, role: user.role,
      tokenVersion: user.token_version || 0, iat, exp: iat + SEVEN_DAYS_MS,
    }, SESSION_SECRET);

    await logAudit(env, { actorId: user.id, username: user.username, role: user.role, action: 'Login success', entity: 'session', screen: 'login', ip, userAgent });

    const userOut = { id: user.id, username: user.username, name: user.name, email: user.email || '', role: user.role };
    return res.status(200).json({ token, user: userOut });
  } catch (err) {
    return serverError(res, err, 'login.js');
  }
};
