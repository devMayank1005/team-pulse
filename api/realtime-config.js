// api/realtime-config.js — provides authenticated clients with Realtime WebSocket configuration.

const { validateToken } = require('./_auth');
const { applyCors } = require('./_cors');
const { serverError } = require('./_errors');

module.exports = async function handler(req, res) {
  applyCors(req, res, 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, SESSION_SECRET } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SESSION_SECRET) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const token = req.headers['x-session-token'];
  const check = await validateToken(token, SESSION_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  if (!check.valid) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const wsBase = SUPABASE_URL.replace(/^http/, 'ws');
    const anonKey = SUPABASE_ANON_KEY;

    if (anonKey) {
      const wsUrl = `${wsBase}/realtime/v1/websocket?apikey=${encodeURIComponent(anonKey)}&vsn=1.0.0`;
      return res.status(200).json({
        enabled: true,
        wsUrl,
        supabaseUrl: SUPABASE_URL,
        pollFallbackMs: 4000,
      });
    }

    // If SUPABASE_ANON_KEY is not configured yet, use fast delta polling
    return res.status(200).json({
      enabled: false,
      supabaseUrl: SUPABASE_URL,
      pollFallbackMs: 4000,
    });
  } catch (err) {
    return serverError(res, err, 'realtime-config.js');
  }
};
