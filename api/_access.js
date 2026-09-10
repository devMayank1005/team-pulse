// api/_access.js — single source of truth for "who may sign in" and "who is
// an admin". Before this existed the same two privileged emails were copied
// into auth-microsoft.js (DEFAULT_ADMINS), _mail.js (ALLOWED_SENDERS) and
// js/app.js — three places to forget when the team changes.
//
// Two independent locks guard sign-in, and BOTH must pass:
//   1. The users table itself. SSO no longer auto-provisions, so a row must
//      already exist — admins add people via the Team UI.
//   2. ALLOWED_LOGIN_EMAILS, an optional comma-separated env allowlist.
//      Enforced only when non-empty, so leaving it unset never locks anyone
//      out; set it in Vercel to turn the second lock on.
//
// _mail.js keeps its own ALLOWED_SENDERS: that list is about which Microsoft
// Graph mailboxes may send mail, which only coincidentally holds the same
// two addresses today.

const ADMIN_EMAILS = [
  'mayank@kognozconsulting.com',
  'yashwanth.krishna@kognozconsulting.com',
];

const SUPPORT_CONTACTS = ADMIN_EMAILS.join(' or ');

const DENIED_MESSAGE =
  'Permission denied. Team Pulse is limited to approved Kognoz team members. ' +
  `To request access, email ${SUPPORT_CONTACTS}.`;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isAdminEmail(email) {
  return ADMIN_EMAILS.includes(normalizeEmail(email));
}

// null  -> the env allowlist is not configured, so it imposes no restriction
// array -> the exact set of emails permitted to sign in
function allowedLoginEmails() {
  const raw = process.env.ALLOWED_LOGIN_EMAILS;
  if (!raw) return null;
  const list = String(raw).split(',').map(normalizeEmail).filter(Boolean);
  return list.length ? list : null;
}

function isLoginAllowed(email) {
  const list = allowedLoginEmails();
  if (!list) return true;
  return list.includes(normalizeEmail(email));
}

module.exports = {
  ADMIN_EMAILS,
  SUPPORT_CONTACTS,
  DENIED_MESSAGE,
  normalizeEmail,
  isAdminEmail,
  allowedLoginEmails,
  isLoginAllowed,
};
