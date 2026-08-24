// api/_errors.js — never forward err.message (can leak table/constraint
// names) straight to the client. Log the real error server-side (Vercel
// logs) and return a generic message + short correlation id instead.

function corrId() {
  return Math.random().toString(36).slice(2, 8);
}

function safeError(res, statusCode, message, extra = {}) {
  return res.status(statusCode).json({ error: message, ...extra });
}

function serverError(res, err, context) {
  const id = corrId();
  console.error(`[${id}] ${context}:`, err && err.stack ? err.stack : err);
  const statusCode = (err && err.statusCode) || 500;
  if (statusCode >= 400 && statusCode < 500 && err && err.statusCode) {
    return res.status(statusCode).json({ error: err.message });
  }
  return res.status(statusCode).json({ error: 'Something went wrong. Please try again.', ref: id });
}

module.exports = { safeError, serverError };
