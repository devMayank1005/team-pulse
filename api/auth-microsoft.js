// api/auth-microsoft.js — "Sign in with Microsoft", 3 steps in one file
// (start / callback / exchange), same pattern as Kora's auth-microsoft.js.
//
//   GET  /api/auth-microsoft                      -> START
//   GET  /api/auth-microsoft?code=...&state=...    -> CALLBACK (success)
//   GET  /api/auth-microsoft?error=...&state=...   -> CALLBACK (cancelled/error)
//   POST /api/auth-microsoft   { ticket }          -> EXCHANGE
//
// SECURITY GATE: signing in with Microsoft only grants access to accounts
// from the configured tenant and email domain. Missing users are provisioned
// as members with an unusable random password.

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { signToken, verifySignature } = require('./_auth');
const { logAudit, clientIp } = require('./_audit');
const { applyCors, ALLOWED_ORIGINS } = require('./_cors');

const STATE_TTL_MS = 10 * 60 * 1000;
const TICKET_TTL_MS = 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const BCRYPT_COST = 12;

module.exports = async function handler(req, res) {
  applyCors(req, res, 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'POST') return handleExchange(req, res);
  if (req.method === 'GET') return handleGet(req, res);
  return res.status(405).json({ error: 'GET or POST only' });
};

async function handleGet(req, res) {
  const { code, state, error } = req.query || {};
  if (code || error) return handleCallback(req, res, { code, state, error });
  return handleStart(req, res);
}

// STEP 1: redirect browser to Microsoft's login page.
async function handleStart(req, res) {
  const { AZURE_CLIENT_ID, AZURE_TENANT_ID, SESSION_SECRET } = process.env;
  if (!AZURE_CLIENT_ID || !AZURE_TENANT_ID || !SESSION_SECRET) {
    return res.status(500).json({ error: 'Microsoft sign-in is not configured on this server.' });
  }

  // Built only from this app's own known-good origins (never trusted blindly
  // from the Host header — host-header-injection risk otherwise).
  const host = req.headers.host;
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = forwardedProto || (host && host.startsWith('localhost:') ? 'http' : 'https');
  const candidateOrigin = `${protocol}://${host}`;
  if (!ALLOWED_ORIGINS.includes(candidateOrigin)) {
    return res.status(400).json({ error: 'This domain is not configured for Microsoft sign-in.' });
  }
  const redirectUri = `${candidateOrigin}/api/auth-microsoft`;

  const iat = Date.now();
  const state = signToken({ purpose: 'msftAuthState', origin: candidateOrigin, iat, exp: iat + STATE_TTL_MS }, SESSION_SECRET);

  const authUrl = new URL(`https://login.microsoftonline.com/${encodeURIComponent(AZURE_TENANT_ID)}/oauth2/v2.0/authorize`);
  authUrl.searchParams.set('client_id', AZURE_CLIENT_ID);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_mode', 'query');
  authUrl.searchParams.set('scope', 'openid profile email User.Read');
  authUrl.searchParams.set('state', state);

  res.writeHead(302, { Location: authUrl.toString() });
  return res.end();
}

// STEP 2: Microsoft redirects here after sign-in/cancel.
async function handleCallback(req, res, { code, state, error: msftError }) {
  const { AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SESSION_SECRET } = process.env;
  const env = { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY };
  const ip = clientIp(req), userAgent = req.headers['user-agent'];

  async function bounceToLogin(fallbackOrigin, errorCode, auditAction) {
    if (auditAction) {
      try { await logAudit(env, { action: auditAction, entity: 'session', screen: 'login', ip, userAgent }); } catch {}
    }
    const origin = ALLOWED_ORIGINS.includes(fallbackOrigin) ? fallbackOrigin : ALLOWED_ORIGINS[0];
    res.writeHead(302, { Location: `${origin}/?ssoError=${encodeURIComponent(errorCode)}` });
    return res.end();
  }

  if (!AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET || !AZURE_TENANT_ID || !SESSION_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return bounceToLogin(ALLOWED_ORIGINS[0], 'not_configured');
  }
  if (msftError) {
    return bounceToLogin(ALLOWED_ORIGINS[0], 'msft_' + String(msftError).slice(0, 40));
  }

  const statePayload = verifySignature(state, SESSION_SECRET);
  if (!statePayload || statePayload.purpose !== 'msftAuthState' || Date.now() > statePayload.exp) {
    return bounceToLogin(ALLOWED_ORIGINS[0], 'state_invalid');
  }
  const origin = statePayload.origin;
  const redirectUri = `${origin}/api/auth-microsoft`;
  if (!code) return bounceToLogin(origin, 'no_code');

  try {
    const tokenRes = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(AZURE_TENANT_ID)}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: AZURE_CLIENT_ID, client_secret: AZURE_CLIENT_SECRET, code,
        redirect_uri: redirectUri, grant_type: 'authorization_code',
        scope: 'openid profile email User.Read',
      }),
    });
    if (!tokenRes.ok) {
      const body = await tokenRes.text().catch(() => '');
      console.error('auth-microsoft (callback): token exchange failed:', tokenRes.status, body.slice(0, 300));
      return bounceToLogin(origin, 'exchange_failed', 'Login failed: Microsoft token exchange error');
    }
    const tokenData = await tokenRes.json();

    const meRes = await fetch('https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName,displayName,id', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!meRes.ok) {
      console.error('auth-microsoft (callback): Graph /me failed:', meRes.status);
      return bounceToLogin(origin, 'graph_failed', 'Login failed: Microsoft profile lookup error');
    }
    const me = await meRes.json();
    const azureEmail = (me.mail || me.userPrincipalName || '').trim();
    if (!azureEmail) return bounceToLogin(origin, 'no_email', 'Login failed: Microsoft account has no usable email');

    const allowedDomain = (process.env.AZURE_ALLOWED_DOMAIN || 'kognozconsulting.com').trim().toLowerCase();
    const emailParts = azureEmail.toLowerCase().split('@');
    if (emailParts.length !== 2 || emailParts[1] !== allowedDomain) {
      return bounceToLogin(origin, 'not_authorized', `Login failed: Microsoft account (${azureEmail}) is outside the allowed domain`);
    }

    const DEFAULT_ADMINS = [
      'mayank@kognozconsulting.com',
      'yashwanth.krishna@kognozconsulting.com',
    ];
    const isDefaultAdmin = DEFAULT_ADMINS.includes(azureEmail.toLowerCase());

    // Existing users keep their configured role (or upgraded to admin if in default admins).
    const sbHeaders = { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` };
    const userRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users?email=ilike.${encodeURIComponent(azureEmail)}&select=*&limit=1`,
      { headers: sbHeaders }
    );
    if (!userRes.ok) {
      console.error('auth-microsoft (callback): user lookup failed:', userRes.status);
      return bounceToLogin(origin, 'lookup_failed', 'Login failed: user lookup error');
    }
    const rows = await userRes.json();
    let user = rows[0];
    if (!user) {
      const username = `msft_${crypto.createHash('sha256').update(azureEmail.toLowerCase()).digest('hex').slice(0, 24)}`;
      const password_hash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), BCRYPT_COST);
      const role = isDefaultAdmin ? 'admin' : 'member';
      const createRes = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: { ...sbHeaders, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify({
          username,
          password_hash,
          name: me.displayName || azureEmail.split('@')[0],
          email: azureEmail,
          role,
        }),
      });
      if (!createRes.ok) {
        const body = await createRes.text().catch(() => '');
        console.error('auth-microsoft (callback): automatic user creation failed:', createRes.status, body.slice(0, 300));
        return bounceToLogin(origin, 'provision_failed', 'Login failed: could not create Team Pulse user');
      }
      const created = await createRes.json();
      user = created[0];
      await logAudit(env, { actorId: user.id, username: user.username, role: user.role, action: 'User auto-provisioned via Microsoft SSO', entity: 'user', screen: 'login', ip, userAgent });
    } else if (isDefaultAdmin && user.role !== 'admin') {
      user.role = 'admin';
      await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(user.id)}`, {
        method: 'PATCH',
        headers: { ...sbHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      }).catch(() => {});
    }

    const iat = Date.now();
    const realToken = signToken({
      id: user.id, username: user.username, email: user.email, role: user.role,
      tokenVersion: user.token_version || 0, iat, exp: iat + SEVEN_DAYS_MS,
    }, SESSION_SECRET);
    const userOut = { id: user.id, username: user.username, name: user.name, email: user.email || '', role: user.role };

    await logAudit(env, { actorId: user.id, username: user.username, role: user.role, action: 'Login success (Microsoft SSO)', entity: 'session', screen: 'login', ip, userAgent });

    // Short-lived ticket hand-off — the real 7-day token never sits in a
    // URL (browser history / server logs persist far longer than a redirect).
    const ticket = signToken({ purpose: 'ssoTicket', realToken, user: userOut, iat, exp: iat + TICKET_TTL_MS }, SESSION_SECRET);
    res.writeHead(302, { Location: `${origin}/?ssoTicket=${encodeURIComponent(ticket)}` });
    return res.end();
  } catch (err) {
    console.error('auth-microsoft (callback) error:', err && err.stack ? err.stack : err);
    return bounceToLogin(origin, 'unexpected_error');
  }
}

// STEP 3: frontend trades the short-lived ticket for the real session token.
async function handleExchange(req, res) {
  const { SESSION_SECRET } = process.env;
  if (!SESSION_SECRET) return res.status(500).json({ error: 'Server misconfigured' });

  const { ticket } = req.body || {};
  if (!ticket) return res.status(400).json({ error: 'ticket required' });

  const payload = verifySignature(ticket, SESSION_SECRET);
  if (!payload || payload.purpose !== 'ssoTicket' || Date.now() > payload.exp) {
    return res.status(401).json({ error: 'Sign-in link expired or invalid. Please try Microsoft sign-in again.' });
  }
  return res.status(200).json({ token: payload.realToken, user: payload.user });
}
