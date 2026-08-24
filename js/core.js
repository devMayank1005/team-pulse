// js/core.js — global state (S) + API client. No framework, no build step.
// Only the session token lives in localStorage — same convention as Kora
// (never cache task/user data there; always re-fetch on load).

const S = {
  token: localStorage.getItem('tp_token') || null,
  user: null,
  users: [],
  tasks: [],
  filter: { assignee: 'all', status: 'all' },
};

function setSession(token, user) {
  S.token = token; S.user = user;
  localStorage.setItem('tp_token', token);
  localStorage.setItem('tp_user', JSON.stringify(user));
}
function clearSession() {
  S.token = null; S.user = null;
  localStorage.removeItem('tp_token');
  localStorage.removeItem('tp_user');
}

async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (S.token) headers['x-session-token'] = S.token;
  const r = await fetch(path, { ...opts, headers });
  let data = null;
  try { data = await r.json(); } catch {}
  if (!r.ok) {
    const err = new Error((data && data.error) || `Request failed (${r.status})`);
    err.status = r.status;
    err.data = data;
    throw err;
  }
  return data;
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function userName(id) {
  const u = S.users.find(u => u.id === id);
  return u ? u.name : 'Unassigned';
}
