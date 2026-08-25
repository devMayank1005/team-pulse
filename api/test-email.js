// api/test-email.js — authenticated Microsoft Graph smoke test.

const { validateToken } = require('./_auth');
const { applyCors } = require('./_cors');
const { serverError, safeError } = require('./_errors');
const { ALLOWED_SENDERS, senderAllowed, canSendAs, sendMicrosoftEmail } = require('./_mail');
const { renderKognozEmailTemplate } = require('./_email_templates');

module.exports = async function handler(req, res) {
  applyCors(req, res, 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SESSION_SECRET } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SESSION_SECRET) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }
  const token = req.headers['x-session-token'];
  const check = await validateToken(token, SESSION_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  if (!check.valid) return res.status(401).json({ error: 'Not authenticated' });
  if (!canSendAs(check.payload.email)) return safeError(res, 403, 'Only approved mail senders can send email');
  const { sender = ALLOWED_SENDERS[0], to, subject, body, attachments = [] } = req.body || {};
  if (!senderAllowed(sender)) return safeError(res, 403, 'This sender is not approved');
  if (!to || !subject || !body) return safeError(res, 400, 'to, subject, and body are required');

  const senderName = sender.startsWith('mayank') ? 'Mayank' : sender.startsWith('yashwanth') ? 'Yashwanth Krishna' : 'Team Pulse Operations';
  const recipientName = to.includes('@') ? to.split('@')[0].replace(/[._-]/g, ' ') : '';

  const html = renderKognozEmailTemplate({
    title: subject,
    subtitle: 'Kognoz Consulting • Team Pulse Communications',
    recipientName: recipientName ? recipientName.charAt(0).toUpperCase() + recipientName.slice(1) : '',
    contentText: body,
    senderName,
    senderRole: 'Kognoz Consulting',
  });

  try {
    const result = await sendMicrosoftEmail({
      sender,
      to: [to],
      subject,
      text: body,
      html,
      attachments: Array.isArray(attachments) ? attachments : [],
    });
    return res.status(200).json({ ok: true, message: 'Email sent successfully', sender: result.sender });
  } catch (err) {
    return serverError(res, err, 'test-email.js');
  }
};
