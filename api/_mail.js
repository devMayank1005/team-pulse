// api/_mail.js — Microsoft Graph mail sending for the approved Team Pulse senders.

const ALLOWED_SENDERS = [
  'mayank@kognozconsulting.com',
  'yashwanth.krishna@kognozconsulting.com',
];

function normalizeSender(sender) {
  const value = String(sender || process.env.AZURE_DEFAULT_MAIL_SENDER || ALLOWED_SENDERS[0]).trim().toLowerCase();
  return ALLOWED_SENDERS.includes(value) ? value : null;
}

function senderAllowed(sender) {
  return ALLOWED_SENDERS.includes(String(sender || '').trim().toLowerCase());
}

function canSendAs(actorEmail) {
  return senderAllowed(actorEmail);
}

async function graphToken() {
  const { AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET } = process.env;
  if (!AZURE_TENANT_ID || !AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET) return null;
  const response = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(AZURE_TENANT_ID)}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: AZURE_CLIENT_ID,
      client_secret: AZURE_CLIENT_SECRET,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    }),
  });
  if (!response.ok) throw new Error(`Microsoft token request failed (${response.status})`);
  const data = await response.json();
  return data.access_token;
}

async function sendMicrosoftEmail({ sender, to, subject, text, html, attachments = [] }) {
  const normalizedSender = normalizeSender(sender);
  if (!normalizedSender) {
    const error = new Error('Sender is not approved');
    error.statusCode = 400;
    throw error;
  }
  if (!Array.isArray(to) || !to.length || to.some(address => !String(address).trim())) {
    const error = new Error('At least one recipient is required');
    error.statusCode = 400;
    throw error;
  }

  const accessToken = await graphToken();
  if (!accessToken) {
    const error = new Error('Microsoft mail is not configured');
    error.statusCode = 503;
    throw error;
  }

  const message = {
    subject: String(subject || ''),
    body: { contentType: html ? 'HTML' : 'Text', content: String(html || text || '') },
    toRecipients: to.map(address => ({ emailAddress: { address: String(address).trim() } })),
  };

  if (Array.isArray(attachments) && attachments.length > 0) {
    message.attachments = attachments
      .filter(att => att && att.name && att.contentBytes)
      .map(att => ({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: String(att.name),
        contentType: String(att.contentType || 'application/octet-stream'),
        contentBytes: String(att.contentBytes),
      }));
  }

  const response = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(normalizedSender)}/sendMail`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      saveToSentItems: true,
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    const error = new Error(`Microsoft Graph send failed (${response.status}): ${detail.slice(0, 200)}`);
    error.statusCode = 502;
    throw error;
  }
  return { sender: normalizedSender };
}

module.exports = { ALLOWED_SENDERS, normalizeSender, senderAllowed, canSendAs, sendMicrosoftEmail };
