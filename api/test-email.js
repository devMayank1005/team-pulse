// api/test-email.js — authenticated Resend smoke test.
// Sends the fixed Hello World message from the Resend onboarding example.

const { validateToken } = require('./_auth');
const { applyCors } = require('./_cors');
const { serverError, safeError } = require('./_errors');

module.exports = async function handler(req, res) {
  applyCors(req, res, 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SESSION_SECRET, RESEND_API_KEY, REMINDER_FROM_EMAIL } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SESSION_SECRET) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }
  if (!RESEND_API_KEY || !REMINDER_FROM_EMAIL) {
    return safeError(res, 503, 'Resend is not configured');
  }

  const token = req.headers['x-session-token'];
  const check = await validateToken(token, SESSION_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  if (!check.valid) return res.status(401).json({ error: 'Not authenticated' });
  if (check.payload.role !== 'admin') return safeError(res, 403, 'Admin only');

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: REMINDER_FROM_EMAIL,
        to: ['devmayank1005@gmail.com'],
        subject: 'Hello World',
        html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
      }),
    });

    if (!resendResponse.ok) {
      const detail = await resendResponse.text().catch(() => '');
      const error = new Error(`Resend ${resendResponse.status}: ${detail.slice(0, 200)}`);
      error.statusCode = 502;
      throw error;
    }

    return res.status(200).json({ ok: true, message: 'Test email sent' });
  } catch (err) {
    return serverError(res, err, 'test-email.js');
  }
};
