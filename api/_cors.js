// api/_cors.js — shared CORS allow-list for every endpoint. Blocks a
// malicious webpage's JS from reading cross-origin responses; does NOT
// block direct server-to-server calls — real access control is the
// token + role checks in _auth.js. Add every real deploy/preview URL here.
const ALLOWED_ORIGINS = [
  'https://team-pulse.vercel.app', // placeholder — replace with your real Vercel domain(s)
  'http://localhost:3000',
];

function applyCors(req, res, methods) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-session-token');
}

module.exports = { applyCors, ALLOWED_ORIGINS };
