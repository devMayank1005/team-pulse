// api/audit.js — retrieve recent team activity / audit logs.
//   GET /api/audit -> returns recent 100 audit entries ordered by created_at desc.

const { validateToken } = require('./_auth');
const { applyCors } = require('./_cors');
const { serverError } = require('./_errors');

module.exports = async function handler(req, res) {
  applyCors(req, res, 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SESSION_SECRET } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SESSION_SECRET) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const token = req.headers['x-session-token'];
  const check = await validateToken(token, SESSION_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  if (!check.valid) return res.status(401).json({ error: 'Not authenticated', reason: check.reason });

  const sbHeaders = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };

  try {
    const limit = Math.min(parseInt(req.query?.limit || '100', 10), 200);
    const r = await fetch(`${SUPABASE_URL}/rest/v1/audit_log?select=*&order=created_at.desc&limit=${limit}`, { headers: sbHeaders });
    if (!r.ok) return res.status(500).json({ error: 'Database error' });
    const logs = await r.json();
    return res.status(200).json({ logs });
  } catch (err) {
    return serverError(res, err, 'audit.js');
  }
};
