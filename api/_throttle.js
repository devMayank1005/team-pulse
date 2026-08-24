// api/_throttle.js — IP-based login throttle, independent from the
// per-username lockout in login.js (same two-axis pattern as Kora — a
// per-username-only lockout lets an attacker lock every account just by
// deliberately failing 5 attempts against each username in turn).

const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS_PER_WINDOW = 20;
const LOCK_MINUTES = 15;

function sbHeaders(key) {
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}

// Fails open (not-locked) on any lookup error — throttling is defense in
// depth, never the reason a legitimate login gets blocked by a DB hiccup.
async function checkIpThrottle(env, ip) {
  if (!ip) return { locked: false, row: null };
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/login_ip_throttle?ip=eq.${encodeURIComponent(ip)}&select=*`,
      { headers: sbHeaders(SUPABASE_SERVICE_ROLE_KEY) }
    );
    if (!r.ok) return { locked: false, row: null };
    const rows = await r.json();
    const row = rows[0] || null;
    if (row && row.locked_until && new Date(row.locked_until).getTime() > Date.now()) {
      const remainingMin = Math.ceil((new Date(row.locked_until).getTime() - Date.now()) / 60000);
      return { locked: true, remainingMin, row };
    }
    return { locked: false, row };
  } catch {
    return { locked: false, row: null };
  }
}

async function recordIpFailure(env, ip, row) {
  if (!ip) return;
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
  const now = Date.now();
  const windowMs = WINDOW_MINUTES * 60000;

  let attemptCount = 1;
  let windowStart = new Date(now).toISOString();
  if (row && row.window_start && (now - new Date(row.window_start).getTime()) < windowMs) {
    attemptCount = (row.attempt_count || 0) + 1;
    windowStart = row.window_start;
  }

  const update = { ip, attempt_count: attemptCount, window_start: windowStart, updated_at: new Date(now).toISOString(), locked_until: null };
  if (attemptCount >= MAX_ATTEMPTS_PER_WINDOW) {
    update.locked_until = new Date(now + LOCK_MINUTES * 60000).toISOString();
    update.attempt_count = 0;
    update.window_start = new Date(now).toISOString();
  }

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/login_ip_throttle?on_conflict=ip`, {
      method: 'POST',
      headers: { ...sbHeaders(SUPABASE_SERVICE_ROLE_KEY), Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify([update]),
    });
  } catch {
    // Never let throttle bookkeeping break the real login response.
  }
}

module.exports = { checkIpThrottle, recordIpFailure };
