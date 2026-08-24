// js/app.js — render + event handling. render() fully replaces #app's
// innerHTML every call (no diffing) — same convention as Kora: never call
// it from a timer, only as the direct result of a user action.

let modalState = null; // { type: 'task'|'user', editing: obj|null }

function render() {
  const root = document.getElementById('app');
  if (!S.user) { root.innerHTML = landingPageHtml(); }
  else { root.innerHTML = shellHtml(); }
  if (modalState) renderModal();
}

// ---------- Microsoft Logo SVG Helper ----------
function msLogoSvg(size = 18) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
    <path fill="#f25022" d="M0 0h10v10H0z"/>
    <path fill="#7fba00" d="M11 0h10v10H11z"/>
    <path fill="#00a4ef" d="M0 11h10v10H0z"/>
    <path fill="#ffb900" d="M11 11h10v10H11z"/>
  </svg>`;
}

// ---------- Pulse Logo SVG Helper ----------
function pulseLogoSvg(size = 20) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>`;
}

// ---------- Landing Page (Unauthenticated State) ----------
function landingPageHtml() {
  return `
  <div class="landing-wrap">
    <!-- Navbar -->
    <header class="landing-nav">
      <a href="/" class="brand-link">
        <div class="brand-icon-wrap">${pulseLogoSvg(20)}</div>
        <span>Team Pulse</span>
      </a>
      <nav class="landing-nav-links">
        <a href="#features">Features</a>
        <a href="#reminders">Daily Reminders</a>
        <a href="#workflow">How It Works</a>
        <a href="#security">Security</a>
      </nav>
      <div class="landing-nav-actions">
        <a class="btn-ms-inline" href="/api/auth-microsoft">
          ${msLogoSvg(16)}
          <span>Sign in with Microsoft</span>
        </a>
        <button class="btn btn-secondary" data-action="open-login">Sign in</button>
      </div>
    </header>

    <!-- Hero Section -->
    <main>
      <section class="landing-hero">
        <div class="hero-glow"></div>
        <div class="hero-content">
          <div class="hero-badge">✨ Intelligent Team Alignment & End-of-Day Reminders</div>
          <h1 class="hero-title">Keep Your Team in Sync, <span class="hero-title-accent">Every Single Day</span></h1>
          <p class="hero-subtitle">
            Daily task tracking with assignees, due dates, and automated end-of-day reminders delivered straight to your inbox via Microsoft Graph and posted directly to Microsoft Teams.
          </p>
          <div class="hero-ctas">
            <a class="btn-ms-inline" href="/api/auth-microsoft">
              ${msLogoSvg(18)}
              <span>Sign in with Microsoft</span>
            </a>
            <button class="btn btn-primary" data-action="open-login">Sign in with Password</button>
          </div>
        </div>

        <!-- Dashboard UI Showcase Preview -->
        <div class="preview-container">
          <div class="preview-browser-header">
            <div class="preview-dots">
              <div class="preview-dot" style="background:#ef4444"></div>
              <div class="preview-dot" style="background:#f59e0b"></div>
              <div class="preview-dot" style="background:#10b981"></div>
            </div>
            <div class="preview-address">https://team-pulse-ruddy.vercel.app</div>
            <div style="font-size:12px;font-weight:600;color:var(--blue)">Live Board</div>
          </div>
          <div class="preview-board">
            <!-- Open Col -->
            <div class="preview-col">
              <div class="preview-col-head">
                <span>Open</span>
                <span class="count-pill">2</span>
              </div>
              <div class="task-card">
                <div class="task-title">Deploy v1.2 Production Release</div>
                <div class="task-meta">
                  <span>Mayank</span>
                  <span>· Today</span>
                  <span class="badge badge-high">High</span>
                  <span class="badge badge-today">Due today</span>
                </div>
              </div>
              <div class="task-card">
                <div class="task-title">Review Client Presentation Deck</div>
                <div class="task-meta">
                  <span>Yashwanth</span>
                  <span>· Tomorrow</span>
                </div>
              </div>
            </div>
            <!-- In Progress Col -->
            <div class="preview-col">
              <div class="preview-col-head">
                <span>In Progress</span>
                <span class="count-pill">1</span>
              </div>
              <div class="task-card">
                <div class="task-title">Supabase Database Optimization</div>
                <div class="task-meta">
                  <span>Mayank</span>
                  <span class="badge badge-high">High</span>
                </div>
              </div>
            </div>
            <!-- Done Col -->
            <div class="preview-col">
              <div class="preview-col-head">
                <span>Done</span>
                <span class="count-pill">2</span>
              </div>
              <div class="task-card" style="opacity:0.85">
                <div class="task-title" style="text-decoration:line-through;color:var(--mute)">Microsoft Entra SSO Integration</div>
                <div class="task-meta">
                  <span>Yashwanth</span>
                  <span>· Completed</span>
                </div>
              </div>
              <div class="task-card" style="opacity:0.85">
                <div class="task-title" style="text-decoration:line-through;color:var(--mute)">Configure Daily Cron Reminders</div>
                <div class="task-meta">
                  <span>Mayank</span>
                  <span>· Completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Feature Grid Section -->
      <section id="features" class="landing-section landing-section-alt">
        <div class="section-header">
          <div class="section-tag">Enterprise Power</div>
          <h2 class="section-title">Built for Modern High-Performing Teams</h2>
          <p class="section-desc">Zero clutter, instant visibility, and automated end-of-day alignment so no deliverable falls through the cracks.</p>
        </div>
        <div class="features-grid">
          <div class="feature-card" id="reminders">
            <div class="feature-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <h3 class="feature-title">Automated Daily Reminders</h3>
            <p class="feature-text">Team members receive personalized email digests via Microsoft Graph summarizing overdue, due today, and upcoming priorities.</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <h3 class="feature-title">Microsoft Teams Summaries</h3>
            <p class="feature-text">Post consolidated daily status cards into your Microsoft Teams channel so the entire squad has full visibility at the close of every day.</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            </div>
            <h3 class="feature-title">Frictionless Microsoft SSO</h3>
            <p class="feature-text">Sign in securely with your Microsoft Entra corporate account. Domain restrictions ensure seamless access exclusively for verified members.</p>
          </div>

          <div class="feature-card" id="security">
            <div class="feature-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h3 class="feature-title">Enterprise Security</h3>
            <p class="feature-text">Equipped with bcrypt password hashing, IP and username brute-force lockout safeguards, and complete audit logging.</p>
          </div>
        </div>
      </section>

      <!-- Workflow Section -->
      <section id="workflow" class="landing-section">
        <div class="section-header">
          <div class="section-tag">Simple 3-Step Workflow</div>
          <h2 class="section-title">How Team Pulse Works</h2>
          <p class="section-desc">A frictionless rhythm designed to save hours of daily status meetings.</p>
        </div>
        <div class="workflow-grid">
          <div class="workflow-step">
            <div class="step-num">1</div>
            <h3 class="step-title">Assign & Prioritize</h3>
            <p class="step-text">Add tasks with due dates, assignees, and priority tags on a fast, responsive Kanban board.</p>
          </div>
          <div class="workflow-step">
            <div class="step-num">2</div>
            <h3 class="step-title">Automatic Reminders</h3>
            <p class="step-text">Scheduled daily jobs automatically evaluate pending tasks and dispatch personalized email digests.</p>
          </div>
          <div class="workflow-step">
            <div class="step-num">3</div>
            <h3 class="step-title">Daily Wrap-Up</h3>
            <p class="step-text">A unified summary card arrives in Microsoft Teams, keeping stakeholders aligned and unblocked.</p>
          </div>
        </div>
      </section>

      <!-- Security Banner -->
      <section class="landing-section landing-section-alt" style="padding-top:40px;padding-bottom:60px">
        <div class="security-banner">
          <div>
            <h3 class="security-title">Ready to keep your team aligned?</h3>
            <p class="security-desc">Sign in with your corporate Microsoft account to view your active board, or authenticate with team credentials.</p>
          </div>
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <a class="btn-ms-inline" href="/api/auth-microsoft" style="background:#ffffff">
              ${msLogoSvg(18)}
              <span>Sign in with Microsoft</span>
            </a>
            <button class="btn btn-primary" data-action="open-login">Sign in with Password</button>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="landing-footer">
      <div class="footer-inner">
        <div style="display:flex;align-items:center;gap:8px;font-weight:700;color:var(--ink-2)">
          <div class="brand-icon-wrap" style="width:26px;height:26px">${pulseLogoSvg(15)}</div>
          <span>Team Pulse</span>
        </div>
        <div class="footer-links">
          <a href="#features">Features</a>
          <a href="#workflow">Workflow</a>
          <a href="#security">Security</a>
          <a href="https://kognozconsulting.com" target="_blank" rel="noopener">Kognoz Consulting</a>
        </div>
        <div>© 2026 Team Pulse. All rights reserved.</div>
      </div>
    </footer>
  </div>`;
}

// ---------- Login Modal ----------
function loginModalHtml(errorMsg) {
  const params = new URLSearchParams(location.search);
  const ssoError = params.get('ssoError');
  const msg = errorMsg || (ssoError ? ssoErrorText(ssoError) : '');
  return `
  <div class="modal-backdrop">
    <div class="modal" style="width:400px">
      <div class="modal-head">
        <div>
          <p class="modal-title" style="margin:0 0 4px">Sign in to Team Pulse</p>
          <p style="font-size:13px;color:var(--mute);margin:0">Enter your credentials to access your board.</p>
        </div>
        <button type="button" class="modal-close" data-action="close-modal" aria-label="Close">✕</button>
      </div>
      ${msg ? `<div class="err-msg" style="margin-top:14px">${esc(msg)}</div>` : ''}
      <form id="loginForm" style="margin-top:16px">
        <div class="field"><label>Username</label><input name="username" autocomplete="username" required autofocus /></div>
        <div class="field"><label>Password</label><input name="password" type="password" autocomplete="current-password" required /></div>
        <button class="btn btn-primary" style="width:100%;margin-top:6px" type="submit">Sign in</button>
      </form>
      <div class="divider">or</div>
      <a class="btn-ms-inline" href="/api/auth-microsoft" style="width:100%;justify-content:center;padding:10px 14px">
        ${msLogoSvg(18)}
        <span>Sign in with Microsoft</span>
      </a>
    </div>
  </div>`;
}

function ssoErrorText(code) {
  if (code === 'not_authorized') return 'Your Microsoft account isn\'t on the Team Pulse user list. Ask an admin to add you.';
  if (code === 'not_configured') return 'Microsoft sign-in isn\'t configured yet on this server.';
  if (code.startsWith('msft_')) return 'Microsoft sign-in was cancelled or blocked.';
  return 'Microsoft sign-in failed. Please try again or use your password.';
}

// ---------- Shell + board ----------
function shellHtml() {
  const isAdmin = S.user.role === 'admin';
  const canSendEmail = ['mayank@kognozconsulting.com', 'yashwanth.krishna@kognozconsulting.com'].includes((S.user.email || '').toLowerCase());
  return `
  <div class="topbar">
    <div style="display:flex;align-items:center;gap:10px">
      <div class="brand-icon-wrap" style="width:30px;height:30px">${pulseLogoSvg(18)}</div>
      <div class="brand">Team Pulse</div>
    </div>
    <div style="display:flex;align-items:center;gap:12px">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:13px;font-weight:500;color:var(--ink-2)">${esc(S.user.name)}</span>
        <span class="role-pill" style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:var(--pill);background:${isAdmin ? 'var(--blue-hi)' : 'var(--line-2)'};color:${isAdmin ? 'var(--blue)' : 'var(--mute)'}">${isAdmin ? 'Admin' : 'Member'}</span>
      </div>
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
  return `<div class="modal-backdrop">
    <div class="modal">
      <div class="modal-head">
        <p class="modal-title">${editing ? 'Edit task' : 'New task'}</p>
        <button type="button" class="modal-close" data-action="close-modal" aria-label="Close">✕</button>
      </div>
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
          <button type="button" class="btn btn-secondary modal-cancel" data-action="close-modal">Cancel</button>
          <button type="submit" class="btn btn-primary">${editing ? 'Save' : 'Create'}</button>
        </div>
      </form>
    </div>
  </div>`;
}

function emailModalHtml() {
  return `<div class="modal-backdrop">
    <div class="modal">
      <div class="modal-head">
        <p class="modal-title">Send email</p>
        <button type="button" class="modal-close" data-action="close-modal" aria-label="Close">✕</button>
      </div>
      <form id="emailForm">
        <div class="field"><label>Send from</label><select name="sender">
          <option value="mayank@kognozconsulting.com">Mayank</option>
          <option value="yashwanth.krishna@kognozconsulting.com">Yashwanth</option>
        </select></div>
        <div class="field"><label>To</label><input name="to" type="email" required /></div>
        <div class="field"><label>Subject</label><input name="subject" required /></div>
        <div class="field"><label>Message</label><textarea name="body" rows="5" required></textarea></div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary modal-cancel" data-action="close-modal">Cancel</button>
          <button type="submit" class="btn btn-primary">Send</button>
        </div>
      </form>
    </div>
  </div>`;
}

// ---------- Admin / roster modal ----------
function adminModalHtml() {
  return `<div class="modal-backdrop">
    <div class="modal" style="width:520px">
      <div class="modal-head">
        <p class="modal-title">Team Management</p>
        <button type="button" class="modal-close" data-action="close-modal" aria-label="Close">✕</button>
      </div>
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
          <button type="button" class="btn btn-secondary modal-cancel" data-action="close-modal">Close</button>
          <button type="submit" class="btn btn-primary">Add member</button>
        </div>
      </form>
    </div>
  </div>`;
}

function renderModal() {
  const el = document.createElement('div');
  el.id = 'modalRoot';
  if (modalState.type === 'login') {
    el.innerHTML = loginModalHtml(modalState.error);
  } else if (modalState.type === 'task') {
    el.innerHTML = taskModalHtml(modalState.editing);
  } else if (modalState.type === 'email') {
    el.innerHTML = emailModalHtml();
  } else {
    el.innerHTML = adminModalHtml();
  }
  document.body.appendChild(el);
  el.querySelectorAll('[data-action="close-modal"]').forEach(button => {
    button.addEventListener('click', closeModal);
  });
  el.querySelector('.modal-backdrop').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeModal();
  });
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
  if (S.user) {
    const updatedSelf = u.users.find(x => x.id === S.user.id);
    if (updatedSelf) {
      S.user = { ...S.user, ...updatedSelf };
      localStorage.setItem('tp_user', JSON.stringify(S.user));
    }
  }
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

  const ssoError = params.get('ssoError');
  if (ssoError && !S.user) {
    modalState = { type: 'login', error: ssoErrorText(ssoError) };
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
      closeModal();
      await loadData();
      render();
    } catch (err) {
      modalState = { type: 'login', error: err.message };
      renderModal_replace();
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
  if (action === 'open-login') { modalState = { type: 'login' }; renderModal(); return; }
  if (action === 'new-task') { modalState = { type: 'task', editing: null }; renderModal(); return; }
  if (action === 'open-admin') { modalState = { type: 'user' }; renderModal(); return; }
  if (action === 'open-email') { modalState = { type: 'email' }; renderModal(); return; }
  if (action === 'close-modal' && (
    btn.classList.contains('modal-backdrop') ||
    btn.classList.contains('modal-close') ||
    btn.classList.contains('modal-cancel')
  )) { closeModal(); return; }

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
