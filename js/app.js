// js/app.js — render + event handling. render() fully replaces #app's
// innerHTML every call (no diffing) — same convention as Kora: never call
// it from a timer, only as the direct result of a user action.

let modalState = null; // { type: 'task'|'user', editing: obj|null }

function render() {
  const root = document.getElementById('app');
  if (!S.user) { root.innerHTML = loginHtml(); return; }
  root.innerHTML = shellHtml();
  if (modalState) renderModal();
}

// ---------- Login ----------
function loginHtml(errorMsg) {
  const params = new URLSearchParams(location.search);
  const ssoError = params.get('ssoError');
  const msg = errorMsg || (ssoError ? ssoErrorText(ssoError) : '');
  return `
  <div class="login-wrap">
    <div class="login-card">
      <p class="login-title">Team Pulse</p>
      <p class="login-sub">Daily task tracker for the team.</p>
      ${msg ? `<div class="err-msg">${esc(msg)}</div>` : ''}
      <form id="loginForm">
        <div class="field"><label>Username</label><input name="username" autocomplete="username" required /></div>
        <div class="field"><label>Password</label><input name="password" type="password" autocomplete="current-password" required /></div>
        <button class="btn btn-primary" style="width:100%" type="submit">Sign in</button>
      </form>
      <div class="divider">or</div>
      <a class="btn btn-ms" href="/api/auth-microsoft">Sign in with Microsoft</a>
    </div>
  </div>`;
}

function ssoErrorText(code) {
  if (code === 'not_authorized') return 'Your Microsoft account isn\'t on the Team Pulse user list. Ask an admin to add you.';
  if (code === 'not_configured') return 'Microsoft sign-in isn\'t configured yet.';
  if (code.startsWith('msft_')) return 'Microsoft sign-in was cancelled or blocked.';
  return 'Microsoft sign-in failed. Please try again or use your password.';
}

// ---------- Shell + board ----------
function shellHtml() {
  const isAdmin = S.user.role === 'admin';
  const canSendEmail = ['mayank@kognozconsulting.com', 'yashwanth.krishna@kognozconsulting.com'].includes((S.user.email || '').toLowerCase());
  return `
  <div class="topbar">
    <div class="brand">Team Pulse</div>
    <div style="display:flex;align-items:center;gap:12px">
      <span style="font-size:13px;color:var(--ink-3)">${esc(S.user.name)}</span>
      ${isAdmin ? `<button class="btn btn-secondary" data-action="open-admin">Team</button>` : ''}
      <button class="btn btn-secondary" data-action="logout">Sign out</button>
    </div>
  </div>
  <div class="main">
    <div class="toolbar">
      <div class="filters">
        <select data-filter="assignee">
          <option value="all">Everyone</option>
          ${S.users.map(u => `<option value="${u.id}" ${S.filter.assignee === u.id ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}
        </select>
        <select data-filter="status">
          <option value="all">All statuses</option>
          <option value="open" ${S.filter.status === 'open' ? 'selected' : ''}>Open</option>
          <option value="in_progress" ${S.filter.status === 'in_progress' ? 'selected' : ''}>In progress</option>
          <option value="done" ${S.filter.status === 'done' ? 'selected' : ''}>Done</option>
        </select>
      </div>
      ${canSendEmail ? '<button class="btn btn-secondary" data-action="open-email">Send email</button>' : ''}
      <button class="btn btn-primary" data-action="new-task">+ Add task</button>
    </div>
    ${boardHtml()}
  </div>`;
}

function filteredTasks() {
  return S.tasks.filter(t => {
    if (S.filter.assignee !== 'all' && t.assignee_id !== S.filter.assignee) return false;
    if (S.filter.status !== 'all' && t.status !== S.filter.status) return false;
    return true;
  });
}

function boardHtml() {
  const tasks = filteredTasks();
  const cols = [
    ['open', 'Open'],
    ['in_progress', 'In Progress'],
    ['done', 'Done'],
  ];
  return `<div class="board">
    ${cols.map(([key, label]) => {
      const list = tasks.filter(t => t.status === key);
      return `<div class="col">
        <div class="col-head"><span>${label}</span><span class="count-pill">${list.length}</span></div>
        ${list.length ? list.map(taskCardHtml).join('') : `<div class="empty-hint">Nothing here</div>`}
      </div>`;
    }).join('')}
  </div>`;
}

function taskCardHtml(t) {
  const today = todayStr();
  let dueBadge = '';
  if (t.due_date && t.status !== 'done') {
    if (t.due_date < today) dueBadge = `<span class="badge badge-overdue">Overdue</span>`;
    else if (t.due_date === today) dueBadge = `<span class="badge badge-today">Due today</span>`;
  }
  return `<div class="task-card" data-task-id="${t.id}">
    <div class="task-title">${esc(t.title)}</div>
    <div class="task-meta">
      <span>${esc(userName(t.assignee_id))}</span>
      ${t.due_date ? `<span>· ${esc(t.due_date)}</span>` : ''}
      ${t.priority === 'high' ? `<span class="badge badge-high">High</span>` : ''}
      ${dueBadge}
    </div>
    <div class="task-actions">
      ${t.status !== 'done' ? `<button class="icon-btn" data-action="advance-task" data-id="${t.id}" data-next="${t.status === 'open' ? 'in_progress' : 'done'}">${t.status === 'open' ? 'Start' : 'Complete'}</button>` : ''}
      <button class="icon-btn" data-action="edit-task" data-id="${t.id}">Edit</button>
      <button class="icon-btn btn-danger" data-action="delete-task" data-id="${t.id}">Delete</button>
    </div>
  </div>`;
}

// ---------- Task modal ----------
function taskModalHtml(editing) {
  return `<div class="modal-backdrop" data-action="close-modal">
    <div class="modal" onclick="event.stopPropagation()">
      <p class="modal-title">${editing ? 'Edit task' : 'New task'}</p>
      <form id="taskForm">
        <div class="field"><label>Title</label><input name="title" value="${esc(editing?.title || '')}" required /></div>
        <div class="field"><label>Description</label><textarea name="description" rows="3">${esc(editing?.description || '')}</textarea></div>
        <div class="field"><label>Assignee</label>
          <select name="assigneeId">
            <option value="">Unassigned</option>
            ${S.users.map(u => `<option value="${u.id}" ${editing?.assignee_id === u.id ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Due date</label><input type="date" name="dueDate" value="${editing?.due_date || ''}" /></div>
        <div class="field"><label>Priority</label>
          <select name="priority">
            <option value="low" ${editing?.priority === 'low' ? 'selected' : ''}>Low</option>
            <option value="normal" ${(!editing || editing?.priority === 'normal') ? 'selected' : ''}>Normal</option>
            <option value="high" ${editing?.priority === 'high' ? 'selected' : ''}>High</option>
          </select>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" data-action="close-modal">Cancel</button>
          <button type="submit" class="btn btn-primary">${editing ? 'Save' : 'Create'}</button>
        </div>
      </form>
    </div>
  </div>`;
}

function emailModalHtml() {
  return `<div class="modal-backdrop" data-action="close-modal">
    <div class="modal" onclick="event.stopPropagation()">
      <p class="modal-title">Send email</p>
      <form id="emailForm">
        <div class="field"><label>Send from</label><select name="sender">
          <option value="mayank@kognozconsulting.com">Mayank</option>
          <option value="yashwanth.krishna@kognozconsulting.com">Yashwanth</option>
        </select></div>
        <div class="field"><label>To</label><input name="to" type="email" required /></div>
        <div class="field"><label>Subject</label><input name="subject" required /></div>
        <div class="field"><label>Message</label><textarea name="body" rows="5" required></textarea></div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" data-action="close-modal">Cancel</button>
          <button type="submit" class="btn btn-primary">Send</button>
        </div>
      </form>
    </div>
  </div>`;
}

// ---------- Admin / roster modal ----------
function adminModalHtml() {
  return `<div class="modal-backdrop" data-action="close-modal">
    <div class="modal" style="width:520px" onclick="event.stopPropagation()">
      <p class="modal-title">Team</p>
      <div id="rosterList">
        ${S.users.map(u => `<div class="roster-row">
          <div><strong style="font-size:14px">${esc(u.name)}</strong> <span class="role-pill">${u.role}</span><br/><span style="font-size:12px;color:var(--mute)">${esc(u.email)}</span></div>
          <button class="icon-btn btn-danger" data-action="remove-user" data-id="${u.id}" ${u.id === S.user.id ? 'disabled' : ''}>Remove</button>
        </div>`).join('')}
      </div>
      <p class="modal-title" style="font-size:14px;margin-top:20px">Add team member</p>
      <form id="userForm">
        <div class="field"><label>Full name</label><input name="name" required /></div>
        <div class="field"><label>Username</label><input name="username" required /></div>
        <div class="field"><label>Email (also used for Microsoft SSO match)</label><input name="email" type="email" required /></div>
        <div class="field"><label>Temporary password (min 8 chars)</label><input name="password" type="password" minlength="8" required /></div>
        <div class="field"><label>Role</label>
          <select name="role"><option value="member">Member</option><option value="admin">Admin</option></select>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" data-action="close-modal">Close</button>
          <button type="submit" class="btn btn-primary">Add member</button>
        </div>
      </form>
    </div>
  </div>`;
}

function renderModal() {
  const el = document.createElement('div');
  el.id = 'modalRoot';
  el.innerHTML = modalState.type === 'task' ? taskModalHtml(modalState.editing) : modalState.type === 'email' ? emailModalHtml() : adminModalHtml();
  document.body.appendChild(el);
}
function closeModal() {
  modalState = null;
  const el = document.getElementById('modalRoot');
  if (el) el.remove();
}

// ---------- Data loading ----------
async function loadData() {
  const [u, t] = await Promise.all([api('/api/users'), api('/api/tasks')]);
  S.users = u.users; S.tasks = t.tasks;
}

// ---------- Init ----------
async function init() {
  // SSO ticket hand-off: exchange the short-lived ticket for a real session
  // token, then strip it from the URL so it never lingers in browser history.
  const params = new URLSearchParams(location.search);
  const ticket = params.get('ssoTicket');
  if (ticket) {
    try {
      const data = await api('/api/auth-microsoft', { method: 'POST', body: JSON.stringify({ ticket }) });
      setSession(data.token, data.user);
    } catch (err) {
      toast(err.message);
    }
    history.replaceState({}, '', location.pathname);
  }

  if (S.token && !S.user) {
    S.user = JSON.parse(localStorage.getItem('tp_user') || 'null');
  }
  if (S.token && S.user) {
    try {
      await loadData();
    } catch {
      clearSession();
    }
  }
  render();
}

// ---------- Event delegation ----------
document.addEventListener('submit', async (e) => {
  if (e.target.id === 'loginForm') {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const data = await api('/api/login', { method: 'POST', body: JSON.stringify({ username: fd.get('username'), password: fd.get('password') }) });
      setSession(data.token, data.user);
      await loadData();
      render();
    } catch (err) {
      document.getElementById('app').innerHTML = loginHtml(err.message);
    }
    return;
  }

  if (e.target.id === 'taskForm') {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {
      title: fd.get('title'),
      description: fd.get('description') || null,
      assigneeId: fd.get('assigneeId') || null,
      dueDate: fd.get('dueDate') || null,
      priority: fd.get('priority'),
    };
    try {
      if (modalState.editing) {
        await api(`/api/tasks?id=${modalState.editing.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      } else {
        await api('/api/tasks', { method: 'POST', body: JSON.stringify(body) });
      }
      await loadData();
      closeModal();
      render();
      toast('Saved');
    } catch (err) { toast(err.message); }
    return;
  }

  if (e.target.id === 'userForm') {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api('/api/users', { method: 'POST', body: JSON.stringify({
        name: fd.get('name'), username: fd.get('username'), email: fd.get('email'),
        password: fd.get('password'), role: fd.get('role'),
      }) });
      await loadData();
      closeModal();
      modalState = { type: 'user' };
      renderModal();
      toast('Team member added');
    } catch (err) { toast(err.message); }
    return;
  }

  if (e.target.id === 'emailForm') {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api('/api/test-email', { method: 'POST', body: JSON.stringify({
        sender: fd.get('sender'), to: fd.get('to'), subject: fd.get('subject'), body: fd.get('body'),
      }) });
      closeModal();
      toast('Email sent');
    } catch (err) { toast(err.message); }
    return;
  }
});

document.addEventListener('change', (e) => {
  if (e.target.dataset && e.target.dataset.filter) {
    S.filter[e.target.dataset.filter] = e.target.value;
    render();
  }
});

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;

  if (action === 'logout') { clearSession(); render(); return; }
  if (action === 'new-task') { modalState = { type: 'task', editing: null }; renderModal(); return; }
  if (action === 'open-admin') { modalState = { type: 'user' }; renderModal(); return; }
  if (action === 'open-email') { modalState = { type: 'email' }; renderModal(); return; }
  if (action === 'close-modal') { closeModal(); return; }

  if (action === 'edit-task') {
    const task = S.tasks.find(t => t.id === btn.dataset.id);
    modalState = { type: 'task', editing: task };
    renderModal();
    return;
  }

  if (action === 'advance-task') {
    try {
      await api(`/api/tasks?id=${btn.dataset.id}`, { method: 'PATCH', body: JSON.stringify({ status: btn.dataset.next }) });
      await loadData();
      render();
    } catch (err) { toast(err.message); }
    return;
  }

  if (action === 'delete-task') {
    if (!confirm('Delete this task?')) return;
    try {
      await api(`/api/tasks?id=${btn.dataset.id}`, { method: 'DELETE' });
      await loadData();
      render();
    } catch (err) { toast(err.message); }
    return;
  }

  if (action === 'remove-user') {
    if (!confirm('Remove this team member?')) return;
    try {
      await api(`/api/users?id=${btn.dataset.id}`, { method: 'DELETE' });
      await loadData();
      renderModal_replace();
    } catch (err) { toast(err.message); }
    return;
  }
});

function renderModal_replace() {
  const el = document.getElementById('modalRoot');
  if (el) el.remove();
  renderModal();
}

init();
