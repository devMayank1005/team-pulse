// api/_auth.js — shared token sign/verify + full validation w/ revocation
// check. Same pattern as Kora's api/_auth.js: signed (not encrypted)
// base64url payload + HMAC-SHA256 signature, token_version embedded for
// instant force-logout (bump a user's token_version, every prior token for
// them stops validating immediately).

const crypto = require('crypto');

function verifySignature(token, secret) {
  if (!token || !secret) return null;
  const dot = token.lastIndexOf('.');
  if (dot === -1) return null;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');
  if (!/^[0-9a-f]{64}$/i.test(sig)) return null;
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(sig, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
  } catch {
    return null;
  }
}

function signToken(payload, secret) {
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(b64).digest('hex');
  return `${b64}.${sig}`;
}

// Full validation: signature -> not expired -> token_version still current.
// Needs a Supabase lookup for the revocation check, so async.
async function validateToken(token, secret, supabaseUrl, supabaseKey) {
  const effectiveSecret = secret || process.env.SESSION_SECRET;
  if (!effectiveSecret) return { valid: false, reason: 'missing_secret' };
  const payload = verifySignature(token, effectiveSecret);
  if (!payload) return { valid: false, reason: 'bad_signature' };
  if (typeof payload.exp === 'number' && Date.now() > payload.exp) {
    return { valid: false, reason: 'expired' };
  }
  try {
    const r = await fetch(
      `${supabaseUrl}/rest/v1/users?id=eq.${encodeURIComponent(payload.id)}&select=token_version,role`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    );
    if (!r.ok) return { valid: false, reason: 'lookup_failed' };
    const rows = await r.json();
    if (!rows.length) return { valid: false, reason: 'user_not_found' };
    const current = rows[0];
    if ((current.token_version || 0) !== (payload.tokenVersion || 0)) {
      return { valid: false, reason: 'revoked' };
    }
    // Always trust the freshly-fetched role, not the one embedded in the
    // token — a role change takes effect immediately, not on next login.
    return { valid: true, payload: { ...payload, role: current.role } };
  } catch (err) {
    return { valid: false, reason: 'lookup_error' };
  }
}

module.exports = { verifySignature, signToken, validateToken };
