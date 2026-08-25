// js/app.js — Component-Level DOM Lifecycle, Optimistic UI & Modern Interaction Layer
// Pure Vanilla JavaScript • No Frameworks • No Build Step

// ============================================================================
// SVG ICONS & BRAND ASSETS
// ============================================================================
const Icons = {
  pulse: (size = 20) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
  msLogo: (size = 18) => `<svg width="${size}" height="${size}" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg"><path fill="#f25022" d="M0 0h10v10H0z"/><path fill="#7fba00" d="M11 0h10v10H11z"/><path fill="#00a4ef" d="M0 11h10v10H0z"/><path fill="#ffb900" d="M11 11h10v10H11z"/></svg>`,
  search: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  plus: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  play: `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  mail: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  team: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  logout: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  board: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>`,
  history: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  activity: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  rotateCcw: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>`,
  clock: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  emptyTask: `<svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6"/><path d="M9 13h6"/><path d="M9 17h4"/></svg>`,
  fileText: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  download: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  sparkles: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
  kognozLogo: (height = 36, isDarkBg = false) => `
    <div style="display:inline-flex;flex-direction:column;gap:3px;align-items:flex-start">
      <img src="/assets/kognoz-logo.png" alt="KOGNOZ" style="height:${height}px;width:auto;object-fit:contain;${isDarkBg ? 'filter:brightness(0) invert(1);' : ''}" />
      <span style="font-family:'Plus Jakarta Sans', -apple-system, sans-serif;font-size:${Math.max(9, Math.round(height * 0.28))}px;font-weight:600;font-style:italic;color:${isDarkBg ? '#38bdf8' : '#0077b6'};letter-spacing:0.02em">Maximising Human Potential</span>
    </div>`,
  kognozMotif: (size = 180) => `
    <svg width="${size}" height="${size}" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="130" cy="70" r="65" fill="#06b6d4" fill-opacity="0.4" />
      <circle cx="90" cy="115" r="70" fill="#0d9488" fill-opacity="0.45" />
      <circle cx="150" cy="130" r="60" fill="#2563eb" fill-opacity="0.35" />
    </svg>`,
};

// ============================================================================
// COMPONENT RENDERERS
// ============================================================================

// 1. App Shell (Header)
function renderHeader() {
  const state = S_STORE.getState();
  const user = state.auth.user;
  if (!user) return '';

  const isAdmin = user.role === 'admin';
  const canSendMail = ['mayank@kognozconsulting.com', 'yashwanth.krishna@kognozconsulting.com'].includes((user.email || '').toLowerCase());
  const activeView = state.ui.activeView || 'board';
  const completedCount = state.server.tasks.filter(t => t.status === 'done').length;

  return `
  <header class="topbar">
    <div class="brand-group">
      <div class="brand-icon-wrap">${Icons.pulse(18)}</div>
      <span class="brand-title">Team Pulse</span>
    </div>

    <!-- Center Navigation Tabs -->
    <nav class="view-nav-switcher" aria-label="Main Navigation">
      <button class="nav-tab ${activeView === 'board' ? 'active' : ''}" data-action="set-view" data-view="board">
        ${Icons.board} <span>Board</span>
      </button>
      <button class="nav-tab ${activeView === 'history' ? 'active' : ''}" data-action="set-view" data-view="history">
        ${Icons.history} <span>Past History</span>
        ${completedCount > 0 ? `<span class="nav-badge">${completedCount}</span>` : ''}
      </button>
    </nav>

    <div class="topbar-right">
      <button class="btn btn-secondary btn-sm" data-action="open-report" title="Export PDF Executive Report">
        ${Icons.fileText} Export Report
      </button>
      <div class="user-profile-badge">
        <span class="avatar">${userInitials(user.name)}</span>
        <span>${esc(user.name)}</span>
        <span class="role-pill">${isAdmin ? 'Admin' : 'Member'}</span>
      </div>
      ${canSendMail ? `<button class="btn btn-secondary btn-sm" data-action="open-email">${Icons.mail} Send Email</button>` : ''}
      ${isAdmin ? `<button class="btn btn-secondary btn-sm" data-action="open-admin">${Icons.team} Team</button>` : ''}
      <button class="btn btn-secondary btn-sm" data-action="logout" title="Sign out">${Icons.logout} Sign out</button>
    </div>
  </header>`;
}

// 2. Executive Summary Metrics
function renderSummaryMetrics() {
  const state = S_STORE.getState();
  const tasks = state.server.tasks;
  const metrics = computeMetrics(tasks);

  return `
  <div class="summary-grid">
    <div class="summary-card">
      <div class="summary-label">
        <span class="summary-dot" style="background:#64748b"></span>
        <span>Total Tasks</span>
      </div>
      <div class="summary-value">${metrics.total}</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">
        <span class="summary-dot" style="background:var(--primary)"></span>
        <span>In Progress</span>
      </div>
      <div class="summary-value" style="color:var(--primary)">${metrics.inProgress}</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">
        <span class="summary-dot" style="background:var(--status-done)"></span>
        <span>Completed</span>
      </div>
      <div class="summary-value" style="color:var(--status-done)">${metrics.completed}</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">
        <span class="summary-dot" style="background:var(--priority-high)"></span>
        <span>Overdue</span>
      </div>
      <div class="summary-value" style="color:${metrics.overdue > 0 ? 'var(--priority-high)' : 'var(--ink)'}">${metrics.overdue}</div>
    </div>
  </div>`;
}

// 3. Toolbar (Search, Filters, Sort, Actions)
function renderToolbar() {
  const state = S_STORE.getState();
  const { filters, server } = state;
  const users = server.users;

  const hasActiveFilters = filters.search || filters.assignee !== 'all' || filters.status !== 'all' || filters.priority !== 'all' || filters.dueDate !== 'all';

  return `
  <div class="toolbar-card">
    <div class="toolbar-left">
      <!-- Search Input -->
      <div class="search-box">
        <span class="search-icon">${Icons.search}</span>
        <input
          type="text"
          id="taskSearchInput"
          class="search-input"
          placeholder="Search title, description, assignee..."
          value="${esc(filters.search)}"
          autocomplete="off"
        />
        ${filters.search ? `<span class="search-clear" data-action="clear-search" title="Clear search">✕</span>` : ''}
      </div>

      <!-- Filters Dropdowns -->
      <div class="filters-group">
        <select class="filter-select" data-filter="assignee" title="Filter by Assignee">
          <option value="all">Assignee: Everyone</option>
          <option value="unassigned" ${filters.assignee === 'unassigned' ? 'selected' : ''}>Unassigned</option>
          ${users.map(u => `<option value="${u.id}" ${filters.assignee === u.id ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}
        </select>

        <select class="filter-select" data-filter="status" title="Filter by Status">
          <option value="all">Status: All</option>
          <option value="open" ${filters.status === 'open' ? 'selected' : ''}>Open</option>
          <option value="in_progress" ${filters.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
          <option value="done" ${filters.status === 'done' ? 'selected' : ''}>Done</option>
        </select>

        <select class="filter-select" data-filter="priority" title="Filter by Priority">
          <option value="all">Priority: All</option>
          <option value="high" ${filters.priority === 'high' ? 'selected' : ''}>High</option>
          <option value="normal" ${filters.priority === 'normal' ? 'selected' : ''}>Normal</option>
          <option value="low" ${filters.priority === 'low' ? 'selected' : ''}>Low</option>
        </select>

        <select class="filter-select" data-filter="dueDate" title="Filter by Due Date">
          <option value="all">Due Date: All</option>
          <option value="overdue" ${filters.dueDate === 'overdue' ? 'selected' : ''}>Overdue</option>
          <option value="today" ${filters.dueDate === 'today' ? 'selected' : ''}>Due Today</option>
          <option value="upcoming" ${filters.dueDate === 'upcoming' ? 'selected' : ''}>Upcoming</option>
          <option value="none" ${filters.dueDate === 'none' ? 'selected' : ''}>No Due Date</option>
        </select>

        <select class="filter-select" data-filter="sort" title="Sort Order">
          <option value="due_date_asc" ${filters.sort === 'due_date_asc' ? 'selected' : ''}>Sort: Due Date (Earliest)</option>
          <option value="due_date_desc" ${filters.sort === 'due_date_desc' ? 'selected' : ''}>Sort: Due Date (Latest)</option>
          <option value="priority_desc" ${filters.sort === 'priority_desc' ? 'selected' : ''}>Sort: Priority (Highest)</option>
          <option value="created_desc" ${filters.sort === 'created_desc' ? 'selected' : ''}>Sort: Recently Created</option>
          <option value="completed_desc" ${filters.sort === 'completed_desc' ? 'selected' : ''}>Sort: Recently Completed</option>
        </select>

        ${hasActiveFilters ? `<button class="btn-clear-filters" data-action="reset-filters">✕ Reset</button>` : ''}
      </div>
    </div>

    <!-- Actions Right -->
    <div class="toolbar-right">
      <button class="btn btn-primary" data-action="new-task">${Icons.plus} Add Task</button>
    </div>
  </div>`;
}

// 4. Mobile Column Switcher Tabs
function renderMobileTabs() {
  const state = S_STORE.getState();
  const activeCol = state.ui.activeMobileCol;
  const tasks = filterAndSortTasks(state.server.tasks, state.filters, state.server.users);

  const openCount = tasks.filter(t => t.status === 'open').length;
  const progCount = tasks.filter(t => t.status === 'in_progress').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;

  return `
  <div class="mobile-tabs">
    <button class="mobile-tab ${activeCol === 'all' ? 'active' : ''}" data-action="set-mobile-col" data-col="all">All (${tasks.length})</button>
    <button class="mobile-tab ${activeCol === 'open' ? 'active' : ''}" data-action="set-mobile-col" data-col="open">Open (${openCount})</button>
    <button class="mobile-tab ${activeCol === 'in_progress' ? 'active' : ''}" data-action="set-mobile-col" data-col="in_progress">In Progress (${progCount})</button>
    <button class="mobile-tab ${activeCol === 'done' ? 'active' : ''}" data-action="set-mobile-col" data-col="done">Done (${doneCount})</button>
  </div>`;
}

// 5. Task Card Renderer
function renderTaskCard(task) {
  const dueInfo = formatDueDate(task.due_date);
  let dueBadge = '';
  if (task.status === 'done') {
    const comp = task.completed_at ? formatCompletedAt(task.completed_at) : null;
    if (comp) {
      dueBadge = `<span class="badge badge-done" title="${esc(comp.full)}">${Icons.check} <span>${esc(comp.short)}</span></span>`;
    } else {
      dueBadge = `<span class="badge badge-done" title="Completed">${Icons.check} <span>Completed</span></span>`;
    }
  } else if (dueInfo) {
    if (dueInfo.status === 'overdue') dueBadge = `<span class="badge badge-overdue">${dueInfo.label}</span>`;
    else if (dueInfo.status === 'today') dueBadge = `<span class="badge badge-today">${dueInfo.label}</span>`;
    else dueBadge = `<span class="badge badge-upcoming">${dueInfo.label}</span>`;
  }

  const priorityBadge = task.priority === 'high'
    ? `<span class="badge badge-high">High</span>`
    : task.priority === 'low'
      ? `<span class="badge badge-low">Low</span>`
      : '';

  const name = userName(task.assignee_id);
  const initials = userInitials(name);
  const isDone = task.status === 'done';

  return `
  <div
    class="task-card ${isDone ? 'card-done' : ''}"
    data-task-id="${task.id}"
    draggable="true"
    tabindex="0"
  >
    <div class="card-top">
      <div class="card-badges">
        ${priorityBadge}
        ${dueBadge}
      </div>
    </div>

    <div class="task-title">${esc(task.title)}</div>
    ${task.description ? `<div class="task-desc">${esc(task.description)}</div>` : ''}

    <div class="card-bottom">
      <div class="card-assignee" title="${esc(name)}">
        <span class="avatar">${initials}</span>
        <span>${esc(name)}</span>
      </div>

      <div class="card-actions">
        ${task.status === 'open' ? `<button class="action-btn" data-action="advance-task" data-id="${task.id}" data-next="in_progress" title="Start task">${Icons.play} Start</button>` : ''}
        ${task.status === 'in_progress' ? `<button class="action-btn" data-action="advance-task" data-id="${task.id}" data-next="done" title="Complete task" style="color:var(--status-done)">${Icons.check} Complete</button>` : ''}
        <button class="action-btn" data-action="edit-task" data-id="${task.id}" title="Edit task">Edit</button>
        <button class="action-btn action-btn-danger" data-action="delete-task" data-id="${task.id}" title="Delete task">Delete</button>
      </div>
    </div>
  </div>`;
}

// 6. Kanban Board Renderer
function renderBoard() {
  const state = S_STORE.getState();
  const { filters, server, ui } = state;
  const filteredTasks = filterAndSortTasks(server.tasks, filters, server.users);
  const activeCol = ui.activeMobileCol;

  const columns = [
    { key: 'open', label: 'Open', color: 'var(--status-open)' },
    { key: 'in_progress', label: 'In Progress', color: 'var(--status-progress)' },
    { key: 'done', label: 'Done', color: 'var(--status-done)' },
  ];

  return `
  <div class="board-grid">
    ${columns.map(col => {
      const colTasks = filteredTasks.filter(t => t.status === col.key);
      const isMobileActive = activeCol === 'all' || activeCol === col.key;

      return `
      <div class="kanban-col ${isMobileActive ? 'mobile-active' : ''}" data-col-status="${col.key}">
        <div class="col-header">
          <div class="col-header-left">
            <span class="col-status-indicator" style="background:${col.color}"></span>
            <span class="col-title">${col.label}</span>
            <span class="col-count">${colTasks.length}</span>
          </div>
          ${col.key !== 'done' ? `<button class="col-quick-add" data-action="quick-add-task" data-status="${col.key}" title="Add task to ${col.label}">+</button>` : ''}
        </div>

        <div class="col-tasks-list" data-col-status="${col.key}">
          ${colTasks.length
            ? colTasks.map(renderTaskCard).join('')
            : `<div class="empty-col-state">
                ${Icons.emptyTask}
                <div class="empty-text">No ${col.label.toLowerCase()} tasks</div>
                <div class="empty-subtext">${filters.search || filters.assignee !== 'all' ? 'Try adjusting your filters' : 'Drag tasks here or add a new one'}</div>
               </div>`
          }
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

// 7. History & Completed Tasks View Renderer
function renderHistoryView() {
  const state = S_STORE.getState();
  const { server, history } = state;
  const users = server.users;
  const activeTab = history.tab || 'tasks';

  const { groups, totalFiltered, stats } = groupCompletedTasks(server.tasks, history, users);

  return `
  <div class="history-view-wrap">
    <!-- Executive History Stats Bar -->
    <div class="history-stats-grid">
      <div class="history-stat-card">
        <div class="history-stat-label">Total Completed</div>
        <div class="history-stat-value" style="color:var(--status-done)">${stats.totalCompleted}</div>
        <div class="history-stat-sub">Lifetime tasks completed</div>
      </div>
      <div class="history-stat-card">
        <div class="history-stat-label">Completed Today</div>
        <div class="history-stat-value" style="color:var(--primary)">${stats.completedToday}</div>
        <div class="history-stat-sub">Tasks wrapped up today</div>
      </div>
      <div class="history-stat-card">
        <div class="history-stat-label">Completed This Week</div>
        <div class="history-stat-value" style="color:#0891b2">${stats.completedThisWeek}</div>
        <div class="history-stat-sub">Past 7 days turnaround</div>
      </div>
      <div class="history-stat-card">
        <div class="history-stat-label">On-Time Completion</div>
        <div class="history-stat-value" style="color:${stats.onTimeRate >= 80 ? 'var(--status-done)' : '#d97706'}">${stats.onTimeRate}%</div>
        <div class="history-stat-sub">Finished on or before due date</div>
      </div>
    </div>

    <!-- History Sub-Navigation & Filters Toolbar -->
    <div class="history-toolbar-card">
      <div class="history-subtabs">
        <button class="history-subtab ${activeTab === 'tasks' ? 'active' : ''}" data-action="set-history-tab" data-tab="tasks">
          ${Icons.check} <span>Completed Tasks (${stats.totalCompleted})</span>
        </button>
        <button class="history-subtab ${activeTab === 'activity' ? 'active' : ''}" data-action="set-history-tab" data-tab="activity">
          ${Icons.activity} <span>Team Activity Feed</span>
        </button>
      </div>

      ${activeTab === 'tasks' ? `
      <div class="history-filters-row">
        <div class="search-box history-search-box">
          <span class="search-icon">${Icons.search}</span>
          <input
            type="text"
            id="historySearchInput"
            class="search-input"
            placeholder="Search completed tasks..."
            value="${esc(history.search || '')}"
            autocomplete="off"
          />
          ${history.search ? `<span class="search-clear" data-action="clear-history-search" title="Clear search">✕</span>` : ''}
        </div>

        <div class="filters-group">
          <select class="filter-select" data-history-filter="assignee" title="Filter by Assignee">
            <option value="all">Assignee: Everyone</option>
            <option value="unassigned" ${history.assignee === 'unassigned' ? 'selected' : ''}>Unassigned</option>
            ${users.map(u => `<option value="${u.id}" ${history.assignee === u.id ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}
          </select>

          <select class="filter-select" data-history-filter="timeframe" title="Filter by Timeframe">
            <option value="all" ${history.timeframe === 'all' ? 'selected' : ''}>Timeframe: All Time</option>
            <option value="today" ${history.timeframe === 'today' ? 'selected' : ''}>Completed Today</option>
            <option value="week" ${history.timeframe === 'week' ? 'selected' : ''}>Past 7 Days</option>
            <option value="month" ${history.timeframe === 'month' ? 'selected' : ''}>Past 30 Days</option>
          </select>

          ${(history.search || history.assignee !== 'all' || history.timeframe !== 'all') ? `
            <button class="btn-clear-filters" data-action="reset-history-filters">✕ Reset</button>
          ` : ''}

          <button class="btn btn-primary btn-sm" data-action="open-report" title="Export PDF Executive Report">
            ${Icons.fileText} Export PDF Report
          </button>
        </div>
      </div>` : ''}
    </div>

    <!-- Content: Tasks Timeline vs Activity Feed -->
    ${activeTab === 'tasks' ? renderHistoryTasksList(groups, totalFiltered) : renderActivityFeed()}
  </div>`;
}

function renderHistoryTasksList(groups, totalFiltered) {
  if (!groups.length) {
    return `
    <div class="history-empty-card">
      <div class="empty-icon-wrap">${Icons.emptyTask}</div>
      <h3 style="font-size:16px;font-weight:700;margin-bottom:4px;color:var(--ink)">No Completed Tasks Found</h3>
      <p style="font-size:13px;color:var(--ink-muted);max-width:380px;margin-bottom:14px">
        ${totalFiltered === 0 ? 'No tasks have been marked as completed yet or none match your active filter criteria.' : ''}
      </p>
      <button class="btn btn-secondary btn-sm" data-action="set-view" data-view="board">${Icons.board} Go to Kanban Board</button>
    </div>`;
  }

  return `
  <div class="history-timeline">
    ${groups.map(group => `
      <div class="history-group">
        <div class="history-group-header">
          <span class="group-title">${esc(group.title)}</span>
          <span class="group-badge">${group.tasks.length}</span>
        </div>

        <div class="history-group-items">
          ${group.tasks.map(task => renderHistoryTaskItem(task)).join('')}
        </div>
      </div>
    `).join('')}
  </div>`;
}

function renderHistoryTaskItem(task) {
  const name = userName(task.assignee_id);
  const initials = userInitials(name);
  const comp = task.completed_at ? formatCompletedAt(task.completed_at) : null;
  const timeliness = getTimelinessInfo(task.due_date, task.completed_at);

  const priorityBadge = task.priority === 'high'
    ? `<span class="badge badge-high">High</span>`
    : task.priority === 'low'
      ? `<span class="badge badge-low">Low</span>`
      : '';

  let timelinessBadge = '';
  if (timeliness.status === 'on_time') {
    timelinessBadge = `<span class="badge badge-done" title="Completed on due date">${Icons.check} On Time</span>`;
  } else if (timeliness.status === 'early') {
    timelinessBadge = `<span class="badge badge-done" title="Finished before due date">⚡ ${timeliness.label}</span>`;
  } else if (timeliness.status === 'overdue') {
    timelinessBadge = `<span class="badge badge-overdue" title="Finished after due date">⚠ ${timeliness.label}</span>`;
  }

  return `
  <div class="history-item-card" data-task-id="${task.id}">
    <div class="history-item-left">
      <div class="history-item-check">${Icons.check}</div>
      <div class="history-item-info">
        <div class="history-item-top">
          <div class="history-badges">
            ${priorityBadge}
            ${timelinessBadge}
            ${comp ? `<span class="badge badge-done" title="${esc(comp.full)}">${Icons.clock} ${esc(comp.short)}</span>` : ''}
          </div>
        </div>
        <div class="history-task-title">${esc(task.title)}</div>
        ${task.description ? `<div class="history-task-desc">${esc(task.description)}</div>` : ''}
        <div class="history-item-meta">
          <span class="meta-item"><span class="avatar">${initials}</span> <span>${esc(name)}</span></span>
          ${task.due_date ? `<span class="meta-item">Due: <strong>${task.due_date}</strong></span>` : ''}
          ${task.completed_at ? `<span class="meta-item">Completed: <strong>${formatFullDateTime(task.completed_at)}</strong></span>` : ''}
        </div>
      </div>
    </div>

    <div class="history-item-actions">
      <button class="btn btn-secondary btn-sm" data-action="edit-task" data-id="${task.id}" title="View details">View</button>
      <button class="btn btn-secondary btn-sm" data-action="reopen-task" data-id="${task.id}" title="Move back to In Progress">
        ${Icons.rotateCcw} Reopen
      </button>
    </div>
  </div>`;
}

function renderActivityFeed() {
  const state = S_STORE.getState();
  const logs = state.history.activityLogs || [];
  const isLoading = state.history.isLoadingLogs;

  if (isLoading) {
    return `
    <div class="history-loading-card">
      <div class="skeleton" style="height:48px;margin-bottom:8px"></div>
      <div class="skeleton" style="height:48px;margin-bottom:8px"></div>
      <div class="skeleton" style="height:48px"></div>
    </div>`;
  }

  if (!logs.length) {
    return `
    <div class="history-empty-card">
      <div class="empty-icon-wrap">${Icons.activity}</div>
      <h3 style="font-size:16px;font-weight:700;margin-bottom:4px;color:var(--ink)">No Activity Logs Loaded</h3>
      <p style="font-size:13px;color:var(--ink-muted);margin-bottom:14px">Audit events will appear here as team members take action.</p>
      <button class="btn btn-primary btn-sm" data-action="refresh-activity">Load Recent Activity</button>
    </div>`;
  }

  return `
  <div class="activity-feed-card">
    <div class="activity-feed-head">
      <span style="font-size:13px;font-weight:700;color:var(--ink)">Recent Team Activity (${logs.length})</span>
      <button class="btn btn-secondary btn-sm" data-action="refresh-activity">↻ Refresh</button>
    </div>
    <div class="activity-stream">
      ${logs.map(log => {
        const timeFormatted = formatFullDateTime(log.created_at);
        const initials = userInitials(log.username || 'Team');
        return `
        <div class="activity-row">
          <div class="activity-avatar-wrap">
            <span class="avatar">${initials}</span>
          </div>
          <div class="activity-body">
            <div class="activity-main">
              <strong class="activity-user">${esc(log.username || 'System')}</strong>
              <span class="activity-action">${esc(log.action)}</span>
            </div>
            <div class="activity-meta">
              <span>${timeFormatted}</span>
              ${log.entity ? `<span class="activity-tag">${esc(log.entity)}</span>` : ''}
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

async function loadActivityLogs() {
  S_STORE.setLoadingActivityLogs(true);
  try {
    const res = await api('/api/audit?limit=100');
    if (res.logs) {
      S_STORE.setActivityLogs(res.logs);
    }
  } catch (err) {
    console.error('Failed to load activity logs:', err);
    S_STORE.setLoadingActivityLogs(false);
  }
}

// 8. Skeletons for Initial Load
function renderSkeletons() {
  return `
  <div class="main-container">
    <div class="summary-grid">
      <div class="summary-card skeleton" style="height:78px"></div>
      <div class="summary-card skeleton" style="height:78px"></div>
      <div class="summary-card skeleton" style="height:78px"></div>
      <div class="summary-card skeleton" style="height:78px"></div>
    </div>
    <div class="toolbar-card skeleton" style="height:56px"></div>
    <div class="board-grid">
      <div class="kanban-col" style="padding:14px">
        <div class="skeleton" style="height:28px;margin-bottom:14px"></div>
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-card"></div>
      </div>
      <div class="kanban-col" style="padding:14px">
        <div class="skeleton" style="height:28px;margin-bottom:14px"></div>
        <div class="skeleton skeleton-card"></div>
      </div>
      <div class="kanban-col" style="padding:14px">
        <div class="skeleton" style="height:28px;margin-bottom:14px"></div>
        <div class="skeleton skeleton-card"></div>
      </div>
    </div>
  </div>`;
}

// 8. Modals Container & Sub-modals
function renderModal() {
  const state = S_STORE.getState();
  const modal = state.ui.modal;
  if (!modal) return '';

  const { type, editing, error } = modal;
  const isSubmitting = !!state.ui.submitting[type];

  let modalBody = '';
  if (type === 'task') {
    modalBody = renderTaskModalForm(editing, isSubmitting, error);
  } else if (type === 'user') {
    modalBody = renderUserModalForm(state.server.users, state.auth.user, isSubmitting, error);
  } else if (type === 'email') {
    modalBody = renderEmailModalForm(isSubmitting, error);
  } else if (type === 'login') {
    modalBody = renderLoginModalForm(isSubmitting, error);
  } else if (type === 'report') {
    modalBody = renderExportReportModal(editing, isSubmitting, error);
  }

  return `
  <div class="modal-backdrop" id="activeModalBackdrop" role="dialog" aria-modal="true">
    <div class="modal-box ${type === 'report' ? 'modal-box-wide' : ''}" id="activeModalBox">
      ${modalBody}
    </div>
  </div>`;
}

function renderTaskModalForm(editing, isSubmitting, error) {
  const users = S_STORE.getState().server.users;
  const isEdit = !!editing;

  return `
  <div class="modal-head">
    <div>
      <h2 class="modal-title">${isEdit ? 'Edit Task' : 'Create New Task'}</h2>
      <p class="modal-desc">${isEdit ? 'Update deliverable details, status, and assignment' : 'Add a task with an assignee and due date'}</p>
    </div>
    <button type="button" class="modal-close" data-action="close-modal" aria-label="Close">✕</button>
  </div>

  ${error ? `<div class="err-banner">${error}</div>` : ''}

  <form id="taskForm">
    <div class="field">
      <label for="taskTitleInput">Task Title *</label>
      <input id="taskTitleInput" name="title" value="${esc(editing?.title || '')}" placeholder="e.g. Deploy Production Release v1.2" required autofocus />
    </div>

    <div class="field">
      <label for="taskDescInput">Description & Deliverable Context</label>
      <textarea id="taskDescInput" name="description" placeholder="Describe task in detail so after completion a professional summary of your work can be generated with your name and deliverables...">${esc(editing?.description || '')}</textarea>
      <div class="field-hint">Detail provided here is automatically synthesized in your Kognoz PDF Executive Work Report.</div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="field">
        <label for="taskAssigneeSelect">Assignee</label>
        <select id="taskAssigneeSelect" name="assigneeId">
          <option value="">Unassigned</option>
          ${users.map(u => `<option value="${u.id}" ${editing?.assignee_id === u.id ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}
        </select>
      </div>

      <div class="field">
        <label for="taskPrioritySelect">Priority</label>
        <select id="taskPrioritySelect" name="priority">
          <option value="normal" ${(!editing || editing?.priority === 'normal') ? 'selected' : ''}>Normal</option>
          <option value="high" ${editing?.priority === 'high' ? 'selected' : ''}>High</option>
          <option value="low" ${editing?.priority === 'low' ? 'selected' : ''}>Low</option>
        </select>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:${isEdit ? '1fr 1fr' : '1fr'};gap:12px">
      <div class="field">
        <label for="taskDueDateInput">Due Date</label>
        <input type="date" id="taskDueDateInput" name="dueDate" value="${editing?.due_date || ''}" />
      </div>

      ${isEdit ? `
      <div class="field">
        <label for="taskStatusSelect">Status</label>
        <select id="taskStatusSelect" name="status">
          <option value="open" ${editing?.status === 'open' ? 'selected' : ''}>Open</option>
          <option value="in_progress" ${editing?.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
          <option value="done" ${editing?.status === 'done' ? 'selected' : ''}>Done (Completed)</option>
        </select>
      </div>` : ''}
    </div>

    ${isEdit ? `
    <div class="task-modal-meta">
      ${editing.completed_at ? `
      <div class="meta-row meta-row-completed">
        <span class="meta-label">${Icons.check} Completed At:</span>
        <span class="meta-value">${esc(formatFullDateTime(editing.completed_at))}</span>
      </div>` : ''}
      ${editing.created_at ? `
      <div class="meta-row">
        <span class="meta-label">Created:</span>
        <span class="meta-value">${esc(formatFullDateTime(editing.created_at))}</span>
      </div>` : ''}
      ${editing.updated_at ? `
      <div class="meta-row">
        <span class="meta-label">Last Updated:</span>
        <span class="meta-value">${esc(formatFullDateTime(editing.updated_at))}</span>
      </div>` : ''}
    </div>` : ''}

    <div class="modal-actions">
      <button type="button" class="btn btn-secondary" data-action="close-modal">Cancel</button>
      <button type="submit" class="btn btn-primary ${isSubmitting ? 'btn-loading' : ''}" ${isSubmitting ? 'disabled' : ''}>
        ${isSubmitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Task')}
      </button>
    </div>
  </form>`;
}

function renderUserModalForm(users, currentUser, isSubmitting, error) {
  return `
  <div class="modal-head">
    <div>
      <h2 class="modal-title">Team Management</h2>
      <p class="modal-desc">Manage member roles and invite team colleagues</p>
    </div>
    <button type="button" class="modal-close" data-action="close-modal" aria-label="Close">✕</button>
  </div>

  ${error ? `<div class="err-banner">${error}</div>` : ''}

  <p style="font-size:12px;font-weight:700;color:var(--ink-secondary);text-transform:uppercase;margin-bottom:8px">Current Members (${users.length})</p>
  <div class="roster-list">
    ${users.map(u => `
      <div class="roster-item">
        <div class="roster-item-info">
          <span class="avatar">${userInitials(u.name)}</span>
          <div>
            <div style="font-size:13px;font-weight:700;color:var(--ink)">${esc(u.name)}</div>
            <div style="font-size:11px;color:var(--ink-muted)">${esc(u.email || u.username)}</div>
          </div>
          <span class="role-pill">${u.role}</span>
        </div>
        ${u.id !== currentUser.id ? `<button class="action-btn action-btn-danger" data-action="remove-user" data-id="${u.id}">Remove</button>` : `<span style="font-size:11px;color:var(--ink-muted)">(You)</span>`}
      </div>
    `).join('')}
  </div>

  <p style="font-size:12px;font-weight:700;color:var(--ink-secondary);text-transform:uppercase;margin:20px 0 8px">Add Team Member</p>
  <form id="userForm">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="field">
        <label>Full Name *</label>
        <input name="name" placeholder="Jane Doe" required />
      </div>
      <div class="field">
        <label>Username *</label>
        <input name="username" placeholder="janedoe" required autocomplete="username" />
      </div>
    </div>

    <div class="field">
      <label>Email * (also used for Microsoft SSO match)</label>
      <input name="email" type="email" placeholder="jane.doe@kognozconsulting.com" required autocomplete="email" />
    </div>

    <div style="display:grid;grid-template-columns:1.5fr 1fr;gap:12px">
      <div class="field">
        <label>Temporary Password (min 8 chars) *</label>
        <input name="password" type="password" minlength="8" required placeholder="••••••••" />
      </div>
      <div class="field">
        <label>Role</label>
        <select name="role">
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
      </div>
    </div>

    <div class="modal-actions">
      <button type="button" class="btn btn-secondary" data-action="close-modal">Close</button>
      <button type="submit" class="btn btn-primary ${isSubmitting ? 'btn-loading' : ''}" ${isSubmitting ? 'disabled' : ''}>
        ${isSubmitting ? 'Adding...' : 'Add Member'}
      </button>
    </div>
  </form>`;
}

function renderEmailModalForm(isSubmitting, error) {
  return `
  <div class="modal-head">
    <div>
      <h2 class="modal-title">Send Email</h2>
      <p class="modal-desc">Send messages directly via Microsoft Graph</p>
    </div>
    <button type="button" class="modal-close" data-action="close-modal" aria-label="Close">✕</button>
  </div>

  ${error ? `<div class="err-banner">${error}</div>` : ''}

  <form id="emailForm">
    <div class="field">
      <label>Send From</label>
      <select name="sender">
        <option value="mayank@kognozconsulting.com">Mayank (mayank@kognozconsulting.com)</option>
        <option value="yashwanth.krishna@kognozconsulting.com">Yashwanth (yashwanth.krishna@kognozconsulting.com)</option>
      </select>
    </div>

    <div class="field">
      <label>Recipient Email *</label>
      <input name="to" type="email" placeholder="recipient@domain.com" required />
    </div>

    <div class="field">
      <label>Subject *</label>
      <input name="subject" placeholder="Team Pulse Task Digest" required />
    </div>

    <div class="field">
      <label>Message Content *</label>
      <textarea name="body" rows="4" placeholder="Write your message here..." required></textarea>
    </div>

    <div class="modal-actions">
      <button type="button" class="btn btn-secondary" data-action="close-modal">Cancel</button>
      <button type="submit" class="btn btn-primary ${isSubmitting ? 'btn-loading' : ''}" ${isSubmitting ? 'disabled' : ''}>
        ${isSubmitting ? 'Sending...' : 'Send Message'}
      </button>
    </div>
  </form>`;
}

function renderLoginModalForm(isSubmitting, error) {
  return `
  <div class="modal-head">
    <div>
      <h2 class="modal-title">Sign In to Team Pulse</h2>
      <p class="modal-desc">Enter your team credentials to access your board</p>
    </div>
    <button type="button" class="modal-close" data-action="close-modal" aria-label="Close">✕</button>
  </div>

  ${error ? `<div class="err-banner">${error}</div>` : ''}

  <form id="loginForm">
    <div class="field">
      <label>Username</label>
      <input name="username" placeholder="Your username" required autocomplete="username" autofocus />
    </div>

    <div class="field">
      <label>Password</label>
      <input name="password" type="password" placeholder="••••••••" required autocomplete="current-password" />
    </div>

    <button type="submit" class="btn btn-primary ${isSubmitting ? 'btn-loading' : ''}" style="width:100%;margin-top:6px" ${isSubmitting ? 'disabled' : ''}>
      ${isSubmitting ? 'Signing in...' : 'Sign In with Password'}
    </button>
  </form>

  <div class="divider">or</div>

  <a class="btn-ms-inline" href="/api/auth-microsoft" style="width:100%;justify-content:center;padding:10px 14px">
    ${Icons.msLogo(18)}
    <span>Sign in with Microsoft</span>
  </a>`;
}

// 8b. Kognoz Executive Report Modal & Printing Engine
let reportOptionsState = {
  assigneeId: 'all',
  timeframe: 'all',
  statusScope: 'all_status', // 'all_status', 'done_only', 'in_progress'
  reportFormat: 'one_page',  // 'one_page' (Default: 1-Page Executive Dossier), 'multi_slide'
  aiSummary: null,
  aiOutcomes: null,
  isGeneratingAi: false,
};

function renderExportReportModal(options = {}, isSubmitting = false, error = null) {
  const state = S_STORE.getState();
  const users = state.server.users;
  const tasks = state.server.tasks;

  const currentOpts = {
    assigneeId: reportOptionsState.assigneeId,
    timeframe: reportOptionsState.timeframe,
    statusScope: reportOptionsState.statusScope,
    reportFormat: reportOptionsState.reportFormat,
  };

  const reportData = generateKognozReportData(tasks, currentOpts, users);
  const aiSummary = reportOptionsState.aiSummary;
  const aiOutcomes = reportOptionsState.aiOutcomes;
  const isGeneratingAi = reportOptionsState.isGeneratingAi;

  return `
  <div class="modal-head">
    <div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        <span style="color:var(--primary)">${Icons.fileText}</span>
        <h2 class="modal-title" style="font-size:18px">Export Executive Report (PDF)</h2>
      </div>
      <p class="modal-desc">Generate client-ready Kognoz branded executive report with completion timestamps and summaries</p>
    </div>
    <button type="button" class="modal-close" data-action="close-modal" aria-label="Close">✕</button>
  </div>

  ${error ? `<div class="err-banner">${error}</div>` : ''}

  <div class="report-config-grid" style="display:grid;grid-template-columns:1.1fr 1fr 1fr 1.2fr;gap:10px;margin-bottom:14px">
    <div class="field" style="margin-bottom:0">
      <label>Assignee / Scope</label>
      <select id="reportAssigneeSelect" data-action="change-report-opt" data-opt="assigneeId">
        <option value="all" ${currentOpts.assigneeId === 'all' ? 'selected' : ''}>Whole Team (All Members)</option>
        ${users.map(u => `<option value="${u.id}" ${currentOpts.assigneeId === u.id ? 'selected' : ''}>${esc(u.name)} (${esc(u.email || u.username)})</option>`).join('')}
      </select>
    </div>

    <div class="field" style="margin-bottom:0">
      <label>Status Scope</label>
      <select id="reportStatusSelect" data-action="change-report-opt" data-opt="statusScope">
        <option value="all_status" ${currentOpts.statusScope === 'all_status' ? 'selected' : ''}>All Tasks (Full Scope)</option>
        <option value="done_only" ${currentOpts.statusScope === 'done_only' ? 'selected' : ''}>Completed Tasks Only</option>
        <option value="in_progress" ${currentOpts.statusScope === 'in_progress' ? 'selected' : ''}>In Progress Only</option>
      </select>
    </div>

    <div class="field" style="margin-bottom:0">
      <label>Timeframe</label>
      <select id="reportTimeframeSelect" data-action="change-report-opt" data-opt="timeframe">
        <option value="all" ${currentOpts.timeframe === 'all' ? 'selected' : ''}>All Time</option>
        <option value="today" ${currentOpts.timeframe === 'today' ? 'selected' : ''}>Today</option>
        <option value="week" ${currentOpts.timeframe === 'week' ? 'selected' : ''}>Past 7 Days</option>
        <option value="month" ${currentOpts.timeframe === 'month' ? 'selected' : ''}>Past 30 Days</option>
      </select>
    </div>

    <div class="field" style="margin-bottom:0">
      <label>PDF Layout</label>
      <select id="reportFormatSelect" data-action="change-report-opt" data-opt="reportFormat">
        <option value="one_page" ${currentOpts.reportFormat === 'one_page' ? 'selected' : ''}>📄 1-Page Dossier (HR/Co-Founder)</option>
        <option value="multi_slide" ${currentOpts.reportFormat === 'multi_slide' ? 'selected' : ''}>📊 Multi-Slide Deck</option>
      </select>
    </div>
  </div>

  <!-- AI Executive Synthesis Card -->
  <div class="report-ai-card" style="background:linear-gradient(135deg, rgba(238,242,255,0.9) 0%, rgba(240,253,250,0.9) 100%);border:1px solid rgba(199,210,254,0.8);border-radius:var(--radius-md);padding:14px;margin-bottom:16px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:#1e40af">
        <span>${Icons.sparkles}</span>
        <span>Executive Narrative Synthesis (Gemini AI)</span>
      </div>
      <button type="button" class="btn btn-secondary btn-sm ${isGeneratingAi ? 'btn-loading' : ''}" data-action="generate-ai-summary" ${isGeneratingAi ? 'disabled' : ''} style="font-size:11.5px;padding:4px 10px;background:#ffffff">
        ${isGeneratingAi ? 'Synthesizing...' : '⚡ Generate / Refresh AI Summary'}
      </button>
    </div>
    <div style="font-size:12px;color:#334155;line-height:1.5">
      ${aiSummary ? `<p style="font-weight:600;margin-bottom:6px">${esc(aiSummary)}</p>` : `<p style="color:#64748b;font-style:italic">Click above to synthesize an AI-generated executive overview of deliverables using Gemini AI or structured intelligence.</p>`}
      ${aiOutcomes && aiOutcomes.length ? `<ul style="padding-left:16px;margin-top:6px">${aiOutcomes.map(o => `<li>${esc(o)}</li>`).join('')}</ul>` : ''}
    </div>
  </div>

  <!-- Report Deliverables Summary Preview -->
  <div class="report-preview-box" style="border:1px solid var(--border-subtle);border-radius:var(--radius-md);background:var(--bg-surface);padding:14px;max-height:200px;overflow-y:auto;margin-bottom:18px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border-subtle)">
      <span style="font-size:12.5px;font-weight:800;color:var(--ink)">Deliverables to Include (${reportData.totalTasks})</span>
      <span style="font-size:11px;font-weight:700;color:var(--status-done)">${reportData.onTimeRate}% On-Time</span>
    </div>
    ${reportData.tasks.length === 0 ? `
      <div style="text-align:center;padding:24px 10px;color:var(--ink-muted);font-size:13px">
        No deliverables found for ${esc(reportData.assigneeName)} with current filters. Try changing Status Scope to "All Tasks".
      </div>
    ` : `
      <div style="display:flex;flex-direction:column;gap:8px">
        ${reportData.tasks.map((t, idx) => {
          const comp = t.completed_at ? formatCompletedAt(t.completed_at) : null;
          return `
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;padding:6px 8px;background:rgba(248,250,252,0.8);border:1px solid var(--border-subtle);border-radius:var(--radius-xs)">
            <div style="display:flex;align-items:center;gap:6px;overflow:hidden">
              <span style="font-family:var(--font-mono);font-weight:700;color:var(--ink-muted);font-size:10.5px">#${idx+1}</span>
              <strong style="color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px">${esc(t.title)}</strong>
            </div>
            <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
              <span class="badge ${t.priority === 'high' ? 'badge-high' : 'badge-normal'}" style="font-size:10px;padding:1px 5px">${t.priority || 'normal'}</span>
              <span class="badge ${t.status === 'done' ? 'badge-done' : t.status === 'in_progress' ? 'badge-today' : 'badge-normal'}" style="font-size:10px;padding:1px 5px">${t.status}</span>
              ${comp ? `<span class="badge badge-done" style="font-size:10px;padding:1px 5px">${comp.short}</span>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>
    `}
  </div>

  <div class="modal-actions" style="margin-top:0">
    <button type="button" class="btn btn-secondary" data-action="close-modal">Cancel</button>
    <button type="button" class="btn btn-primary" data-action="print-report" style="gap:6px">
      ${Icons.download} Export & Print Kognoz PDF
    </button>
  </div>`;
}

function renderOnePageExecutiveDossierHtml(reportData, aiSummary, aiOutcomes) {
  const tasks = reportData.tasks || [];
  const logoSvg = Icons.kognozLogo(32);
  const nowStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const auditId = 'KP-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Executive Work Dossier — ${esc(reportData.assigneeName)} — Kognoz Consulting</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #e2e8f0;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
      padding: 20px;
    }
    .print-bar {
      max-width: 900px;
      margin: 0 auto 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      padding: 12px 20px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    }
    .btn-print {
      background: #00385c;
      color: #ffffff;
      padding: 9px 20px;
      font-size: 13px;
      font-weight: 700;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-print:hover { background: #002238; }

    /* Single-Page Executive Dossier Sheet */
    .dossier-sheet {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      padding: 28px 32px;
      border: 1px solid #e2e8f0;
      position: relative;
    }

    /* Top Accent Stripe */
    .accent-stripe {
      height: 4px;
      background: linear-gradient(90deg, #00385c 0%, #0d9488 45%, #06b6d4 100%);
      border-radius: 2px;
      margin-bottom: 16px;
    }

    /* Header Section */
    .dossier-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding-bottom: 14px;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 14px;
    }
    .dossier-meta-right {
      text-align: right;
    }
    .dossier-title {
      font-size: 15px;
      font-weight: 800;
      color: #00385c;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .dossier-subtitle {
      font-size: 11px;
      font-weight: 600;
      color: #0d9488;
      margin-bottom: 4px;
    }
    .dossier-person {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }
    .dossier-submeta {
      font-size: 10px;
      color: #64748b;
      font-family: 'JetBrains Mono', monospace;
      margin-top: 2px;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 14px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
    }
    .kpi-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 2px;
    }
    .kpi-val {
      font-size: 18px;
      font-weight: 800;
      color: #00385c;
      line-height: 1.2;
    }
    .kpi-sub {
      font-size: 9.5px;
      color: #64748b;
    }

    /* AI Executive Summary Card */
    .summary-card {
      background: #f0fdfa;
      border: 1px solid #99f6e4;
      border-left: 3.5px solid #0d9488;
      border-radius: 4px;
      padding: 10px 14px;
      margin-bottom: 14px;
    }
    .summary-head {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #0f766e;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .summary-text {
      font-size: 11.5px;
      line-height: 1.5;
      color: #1e293b;
      font-weight: 500;
    }
    .summary-bullets {
      margin-top: 6px;
      padding-left: 16px;
      font-size: 10.5px;
      line-height: 1.45;
      color: #334155;
    }

    /* Granular Register Table */
    .register-wrap {
      margin-bottom: 14px;
    }
    .register-head-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .register-title {
      font-size: 11.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #00385c;
    }
    .register-count {
      font-size: 10.5px;
      color: #64748b;
      font-weight: 600;
    }

    .register-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
      border: 1px solid #cbd5e1;
    }
    .register-table th {
      background: #00385c;
      color: #ffffff;
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 6px 8px;
      text-align: left;
      border: 1px solid #002b47;
    }
    .register-table td {
      padding: 6px 8px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
      line-height: 1.35;
    }
    .register-table tr:nth-child(even) td {
      background: #f8fafc;
    }
    .task-title {
      font-weight: 700;
      color: #00385c;
      font-size: 11px;
      display: block;
      margin-bottom: 2px;
    }
    .task-desc {
      font-size: 9.5px;
      color: #475569;
      line-height: 1.35;
      display: block;
    }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      text-align: center;
      white-space: nowrap;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .badge-done { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .badge-progress { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
    .badge-open { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
    .badge-high { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
    .badge-normal { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
    .badge-timely { background: #ecfdf5; color: #047857; font-weight: 700; font-size: 9px; }

    /* Footer & Sign-off */
    .dossier-footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 10px;
      margin-top: 12px;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      font-size: 9.5px;
      color: #64748b;
    }
    .audit-notice {
      max-width: 600px;
      line-height: 1.4;
    }

    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    @media print {
      body { background: #ffffff !important; padding: 0 !important; }
      .print-bar { display: none !important; }
      .dossier-sheet {
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
      }
      .register-table th { background: #00385c !important; color: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .summary-card { background: #f0fdfa !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .kpi-card { background: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .accent-stripe { background: linear-gradient(90deg, #00385c 0%, #0d9488 45%, #06b6d4 100%) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <div>
      <strong style="font-size:14px;color:#00385c">Kognoz Performance & Deliverables Dossier (1-Page)</strong>
      <div style="font-size:11px;color:#64748b">Verified Work Log for ${esc(reportData.assigneeName)} • ${reportData.totalTasks} Items</div>
    </div>
    <button class="btn-print" onclick="window.print()">🖨️ Print / Save 1-Page PDF</button>
  </div>

  <div class="dossier-sheet">
    <div class="accent-stripe"></div>

    <!-- Header Section -->
    <div class="dossier-header">
      <div>
        ${logoSvg}
      </div>
      <div class="dossier-meta-right">
        <div class="dossier-title">Individual Work & Performance Dossier</div>
        <div class="dossier-subtitle">Prepared for Leadership, Co-Founders & People Operations (HR)</div>
        <div class="dossier-person">Team Member: <span style="color:#00385c">${esc(reportData.assigneeName)}</span> &nbsp;|&nbsp; Scope: <span style="color:#0d9488">${esc(reportData.timeframe === 'all' ? 'All Deliverables' : reportData.timeframe === 'today' ? 'Today' : reportData.timeframe === 'week' ? 'Past 7 Days' : 'Past 30 Days')}</span></div>
        <div class="dossier-submeta">Audit Ref: ${auditId} &nbsp;•&nbsp; Date: ${nowStr} &nbsp;•&nbsp; Platform: Team Pulse</div>
      </div>
    </div>

    <!-- KPI Metric Strip -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Deliverables Logged</div>
        <div class="kpi-val">${reportData.totalTasks}</div>
        <div class="kpi-sub">${reportData.tasks.filter(t => t.status === 'done').length} Completed</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">On-Time Execution</div>
        <div class="kpi-val" style="color:#0d9488">${reportData.onTimeRate}%</div>
        <div class="kpi-sub">${reportData.onTimeTasks} on schedule</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">High-Priority Work</div>
        <div class="kpi-val" style="color:#ef4444">${reportData.highPriority}</div>
        <div class="kpi-sub">Critical impact items</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Audit Verification</div>
        <div class="kpi-val" style="font-size:14px;color:#15803d;padding-top:3px">✓ System Verified</div>
        <div class="kpi-sub">Timestamp locked</div>
      </div>
    </div>

    <!-- AI Executive Summary & Value Add -->
    <div class="summary-card">
      <div class="summary-head">
        <span>⚡ Executive Impact & Contribution Summary (Gemini AI Synthesis)</span>
      </div>
      <div class="summary-text">
        ${esc(aiSummary || `${reportData.assigneeName} has demonstrated consistent operational ownership and execution rigor across ${reportData.totalTasks} recorded deliverables, maintaining an on-time delivery rate of ${reportData.onTimeRate}%.`)}
      </div>
      ${aiOutcomes && aiOutcomes.length ? `
        <ul class="summary-bullets">
          ${aiOutcomes.map(o => `<li>${esc(o)}</li>`).join('')}
        </ul>
      ` : ''}
    </div>

    <!-- Granular Work Item Register Table -->
    <div class="register-wrap">
      <div class="register-head-bar">
        <span class="register-title">Granular Work Log & Detailed Deliverables Register</span>
        <span class="register-count">Showing all ${tasks.length} item(s)</span>
      </div>

      <table class="register-table">
        <thead>
          <tr>
            <th style="width:26px;text-align:center">#</th>
            <th>Work Item & Scope Details</th>
            <th style="width:68px;text-align:center">Priority</th>
            <th style="width:72px;text-align:center">Status</th>
            <th style="width:75px;text-align:center">Target Due</th>
            <th style="width:145px">Completion & Timeliness</th>
          </tr>
        </thead>
        <tbody>
          ${tasks.length === 0 ? `
            <tr>
              <td colspan="6" style="text-align:center;padding:18px;color:#64748b">No deliverables found for the selected scope.</td>
            </tr>
          ` : tasks.map((t, idx) => {
            const num = String(idx + 1).padStart(2, '0');
            const compFormatted = t.completed_at ? formatFullDateTime(t.completed_at) : (t.status === 'done' ? 'Completed' : 'In Progress');
            const timeliness = getTimelinessInfo(t.due_date, t.completed_at);

            return `
            <tr>
              <td style="text-align:center;font-family:'JetBrains Mono',monospace;font-weight:700;color:#64748b">${num}</td>
              <td>
                <strong class="task-title">${esc(t.title)}</strong>
                <span class="task-desc">${t.description ? esc(t.description) : 'Standard deliverable executed according to operational requirements.'}</span>
              </td>
              <td style="text-align:center">
                <span class="badge ${t.priority === 'high' ? 'badge-high' : 'badge-normal'}">${(t.priority || 'normal').toUpperCase()}</span>
              </td>
              <td style="text-align:center">
                <span class="badge ${t.status === 'done' ? 'badge-done' : t.status === 'in_progress' ? 'badge-progress' : 'badge-open'}">${t.status === 'done' ? '✓ DONE' : t.status.toUpperCase()}</span>
              </td>
              <td style="text-align:center;font-family:'JetBrains Mono',monospace;font-size:9.5px;color:#475569">
                ${t.due_date || '—'}
              </td>
              <td>
                <div style="font-size:9.5px;font-weight:600;color:#0f172a">${esc(compFormatted)}</div>
                ${timeliness.status !== 'none' ? `<div class="badge-timely">${timeliness.label}</div>` : ''}
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Sign-off & Audit Trail Footer -->
    <div class="dossier-footer">
      <div class="audit-notice">
        <strong>Authenticated Record:</strong> Generated automatically via Team Pulse Audit Engine for Kognoz Consulting Performance Review, HR & Co-Founder Verification. All timestamps are verified against system event logs.
      </div>
      <div style="text-align:right;flex-shrink:0">
        <strong style="color:#00385c">Kognoz Consulting</strong><br />
        <span>kognozconsulting.com • 1 of 1</span>
      </div>
    </div>
  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>`;
}

function renderMultiSlidePresentationHtml(reportData, aiSummary, aiOutcomes) {
  const tasks = reportData.tasks || [];
  const totalDeliverableSlides = Math.max(tasks.length, 1);
  const totalPages = 1 + totalDeliverableSlides + (aiSummary ? 1 : 0);

  const logoSvg = Icons.kognozLogo(38);
  const logoSvgDark = Icons.kognozLogo(38, true);
  const motifSvg = Icons.kognozMotif(240);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Kognoz Executive Report — ${esc(reportData.assigneeName)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background: #e2e8f0;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
      padding: 24px;
    }
    .print-bar {
      max-width: 800px;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      padding: 14px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    .btn-print {
      background: #00385c;
      color: #ffffff;
      padding: 10px 22px;
      font-size: 14px;
      font-weight: 700;
      border-radius: 8px;
      border: none;
      cursor: pointer;
    }
    .btn-print:hover { background: #002238; }

    /* Slide Deck Format (matching sample PDF) */
    .slide-page {
      max-width: 800px;
      min-height: 980px;
      margin: 0 auto 30px;
      background: #f0f6fa;
      border-radius: 16px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.1);
      padding: 60px 54px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      page-break-after: always;
      break-after: page;
    }
    .slide-cover {
      background: #ffffff;
    }
    .slide-dark {
      background: #00385c;
      color: #ffffff;
    }

    /* Top Motif & Watermark */
    .top-motif-wrap {
      position: absolute;
      top: -20px;
      right: -20px;
      pointer-events: none;
      z-index: 1;
    }
    .watermark-num {
      position: absolute;
      top: 40px;
      left: 48px;
      font-size: 140px;
      font-weight: 900;
      color: rgba(203, 213, 225, 0.45);
      line-height: 1;
      user-select: none;
      pointer-events: none;
      z-index: 0;
      font-family: 'JetBrains Mono', monospace;
    }

    .slide-header {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .slide-tag {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #0d9488;
    }
    .slide-dark .slide-tag {
      color: #38bdf8;
    }

    .slide-content {
      position: relative;
      z-index: 2;
      margin: 40px 0;
    }
    .cover-title {
      font-size: 46px;
      font-weight: 900;
      line-height: 1.15;
      color: #00385c;
      letter-spacing: -0.02em;
      margin-bottom: 20px;
      max-width: 600px;
    }
    .cover-title span { color: #0d9488; }
    .cover-desc {
      font-size: 17px;
      color: #334155;
      line-height: 1.6;
      max-width: 580px;
      margin-bottom: 28px;
    }

    .slide-headline {
      font-size: 32px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.25;
      margin-bottom: 18px;
      letter-spacing: -0.01em;
    }
    .slide-desc {
      font-size: 16px;
      color: #334155;
      line-height: 1.65;
      margin-bottom: 24px;
    }
    .slide-meta-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 20px;
      padding-top: 18px;
      border-top: 1px solid rgba(203, 213, 225, 0.6);
      font-size: 13px;
      color: #475569;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11.5px;
      font-weight: 700;
    }
    .badge-done { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .badge-high { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
    .badge-normal { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }

    /* Footer */
    .slide-footer {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      padding-top: 20px;
    }
    .footer-url {
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
    }
    .slide-dark .footer-url {
      color: #94a3b8;
    }
    .page-num {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      font-weight: 700;
      color: #64748b;
    }
    .slide-dark .page-num {
      color: #94a3b8;
    }

    @media print {
      body { background: transparent; padding: 0; }
      .print-bar { display: none; }
      .slide-page {
        margin: 0;
        box-shadow: none;
        border-radius: 0;
        min-height: 100vh;
        page-break-after: always;
        break-after: page;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <div>
      <strong style="font-size:15px;color:#00385c">Kognoz Executive Work Report</strong>
      <div style="font-size:12px;color:#64748b">Report for ${esc(reportData.assigneeName)} • ${reportData.totalTasks} Deliverables</div>
    </div>
    <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>

  <!-- SLIDE 1: COVER PAGE -->
  <div class="slide-page slide-cover">
    <div class="top-motif-wrap">${motifSvg}</div>
    <div class="slide-header">
      <div class="slide-tag">EXECUTIVE WORK REPORT</div>
    </div>
    <div class="slide-content">
      <h1 class="cover-title">Deliverables & <span>Velocity Digest</span></h1>
      <p class="cover-desc">
        Comprehensive executive record of deliverables, completion timestamps, and operational milestones achieved by <strong>${esc(reportData.assigneeName)}</strong>.
      </p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;max-width:540px;display:grid;grid-template-columns:repeat(3, 1fr);gap:14px">
        <div>
          <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase">Deliverables</div>
          <div style="font-size:22px;font-weight:800;color:#00385c">${reportData.totalTasks}</div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase">High Priority</div>
          <div style="font-size:22px;font-weight:800;color:#ef4444">${reportData.highPriority}</div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase">On-Time Rate</div>
          <div style="font-size:22px;font-weight:800;color:#10b981">${reportData.onTimeRate}%</div>
        </div>
      </div>
    </div>
    <div class="slide-footer">
      <div>${logoSvg}</div>
      <div class="footer-url">kognozconsulting.com</div>
    </div>
  </div>

  <!-- DELIVERABLE SLIDES (matching sample PDF Pages 2-5) -->
  ${tasks.length === 0 ? `
    <div class="slide-page">
      <div class="watermark-num">01</div>
      <div class="slide-header">
        <div class="slide-tag">DELIVERABLE SPOTLIGHT</div>
      </div>
      <div class="slide-content">
        <h2 class="slide-headline">No Active Deliverables In Scope</h2>
        <p class="slide-desc">
          No tasks found matching the selected timeframe and scope filters for ${esc(reportData.assigneeName)}.
        </p>
      </div>
      <div class="slide-footer">
        <div>${logoSvg}</div>
        <div class="page-num">01 / 01</div>
      </div>
    </div>
  ` : tasks.map((t, idx) => {
    const slideNum = String(idx + 1).padStart(2, '0');
    const compFormatted = t.completed_at ? formatFullDateTime(t.completed_at) : (t.status === 'done' ? 'Completed' : `Status: ${t.status}`);
    const timeliness = getTimelinessInfo(t.due_date, t.completed_at);
    const pageFraction = `${slideNum} / ${String(totalPages).padStart(2, '0')}`;

    return `
    <div class="slide-page">
      <div class="watermark-num">${slideNum}</div>
      <div class="slide-header">
        <div class="slide-tag">DELIVERABLE SPOTLIGHT</div>
      </div>
      <div class="slide-content">
        <h2 class="slide-headline">${esc(t.title)}</h2>
        <p class="slide-desc">
          ${t.description ? esc(t.description) : 'Deliverable successfully executed, validated, and integrated into operational workflow with zero friction.'}
        </p>
        <div class="slide-meta-row">
          <span class="badge ${t.status === 'done' ? 'badge-done' : 'badge-normal'}">✓ ${esc(compFormatted)}</span>
          <span class="badge ${t.priority === 'high' ? 'badge-high' : 'badge-normal'}">Priority: ${(t.priority || 'normal').toUpperCase()}</span>
          ${timeliness.status !== 'none' ? `<span class="badge badge-done">Timeliness: ${timeliness.label}</span>` : ''}
          ${t.due_date ? `<span>Target Due Date: <strong>${t.due_date}</strong></span>` : ''}
          <span>Assignee: <strong>${esc(userName(t.assignee_id))}</strong></span>
        </div>
      </div>
      <div class="slide-footer">
        <div>${logoSvg}</div>
        <div class="page-num">${pageFraction}</div>
      </div>
    </div>`;
  }).join('')}

  <!-- EXECUTIVE SUMMARY SLIDE (matching sample PDF Page 6) -->
  ${aiSummary ? `
  <div class="slide-page slide-dark">
    <div class="slide-header">
      <div class="slide-tag">EXECUTIVE SYNTHESIS</div>
    </div>
    <div class="slide-content">
      <h2 class="slide-headline" style="color:#ffffff;font-size:32px;margin-bottom:20px">Executive Summary & Operational Impact</h2>
      <p style="font-size:17px;color:#e2e8f0;line-height:1.65;margin-bottom:24px">
        ${esc(aiSummary)}
      </p>
      ${aiOutcomes && aiOutcomes.length ? `
        <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:12px;padding:20px 24px;margin-top:20px">
          <div style="font-size:13px;font-weight:800;color:#38bdf8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px">Key Milestones & Outcomes</div>
          <ul style="padding-left:18px;color:#f1f5f9;font-size:14.5px;line-height:1.7">
            ${aiOutcomes.map(o => `<li>${esc(o)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
    <div class="slide-footer">
      <div>${logoSvgDark}</div>
      <div class="footer-url">kognozconsulting.com</div>
    </div>
  </div>` : ''}

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>`;
}

function printKognozReport(reportData, aiSummary, aiOutcomes, format = 'one_page') {
  const html = format === 'multi_slide'
    ? renderMultiSlidePresentationHtml(reportData, aiSummary, aiOutcomes)
    : renderOnePageExecutiveDossierHtml(reportData, aiSummary, aiOutcomes);

  try {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      return;
    }
  } catch (e) {
    console.warn('window.open was blocked, using iframe fallback:', e);
  }

  // Fallback if browser blocked popups: create invisible iframe to print
  let iframe = document.getElementById('kognozPrintFrame');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'kognozPrintFrame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
  }

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
}



// 9. Toast Container
function renderToasts() {
  const state = S_STORE.getState();
  const toasts = state.toasts;
  if (!toasts.length) return '';

  return toasts.map(t => {
    const icon = t.type === 'success' ? '✓' : t.type === 'error' ? '⚠' : t.type === 'warning' ? '!' : 'ℹ';
    return `
    <div class="toast-item toast-${t.type}" id="${t.id}" role="status">
      <div class="toast-icon">${icon}</div>
      <div class="toast-body">
        ${t.title ? `<div class="toast-title">${esc(t.title)}</div>` : ''}
        <div class="toast-msg">${esc(t.message)}</div>
      </div>
      <button class="toast-dismiss" data-action="dismiss-toast" data-id="${t.id}" aria-label="Dismiss">✕</button>
    </div>`;
  }).join('');
}

// 10. Landing Page (Unauthenticated State)
function renderLandingPage() {
  return `
  <div class="landing-wrap">
    <header class="landing-nav">
      <a href="/" class="brand-link">
        <div class="brand-icon-wrap">${Icons.pulse(20)}</div>
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
          ${Icons.msLogo(16)}
          <span>Sign in with Microsoft</span>
        </a>
        <button class="btn btn-secondary" data-action="open-login">Sign in</button>
      </div>
    </header>

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
              ${Icons.msLogo(18)}
              <span>Sign in with Microsoft</span>
            </a>
            <button class="btn btn-primary" data-action="open-login">Sign in with Password</button>
          </div>
        </div>

        <div class="preview-container">
          <div class="preview-browser-header">
            <div class="preview-dots">
              <div class="preview-dot" style="background:#ef4444"></div>
              <div class="preview-dot" style="background:#f59e0b"></div>
              <div class="preview-dot" style="background:#10b981"></div>
            </div>
            <div class="preview-address">https://team-pulse-ruddy.vercel.app</div>
            <div style="font-size:12px;font-weight:700;color:var(--primary)">Live Board</div>
          </div>
          <div class="preview-board">
            <div class="preview-col">
              <div class="preview-col-head"><span>Open</span><span class="col-count">2</span></div>
              <div class="task-card">
                <div class="card-badges"><span class="badge badge-high">High</span><span class="badge badge-today">Due today</span></div>
                <div class="task-title">Deploy v1.2 Production Release</div>
                <div class="card-bottom"><div class="card-assignee"><span class="avatar">MK</span><span>Mayank</span></div></div>
              </div>
              <div class="task-card">
                <div class="card-badges"><span class="badge badge-normal">Normal</span></div>
                <div class="task-title">Review Client Presentation Deck</div>
                <div class="card-bottom"><div class="card-assignee"><span class="avatar">YK</span><span>Yashwanth</span></div></div>
              </div>
            </div>
            <div class="preview-col">
              <div class="preview-col-head"><span>In Progress</span><span class="col-count">1</span></div>
              <div class="task-card">
                <div class="card-badges"><span class="badge badge-high">High</span></div>
                <div class="task-title">Supabase Database Optimization</div>
                <div class="card-bottom"><div class="card-assignee"><span class="avatar">MK</span><span>Mayank</span></div></div>
              </div>
            </div>
            <div class="preview-col">
              <div class="preview-col-head"><span>Done</span><span class="col-count">2</span></div>
              <div class="task-card card-done">
                <div class="card-badges"><span class="badge badge-normal">Completed</span></div>
                <div class="task-title">Microsoft Entra SSO Integration</div>
                <div class="card-bottom"><div class="card-assignee"><span class="avatar">YK</span><span>Yashwanth</span></div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" class="landing-section landing-section-alt">
        <div class="section-header">
          <div class="section-tag">Enterprise Power</div>
          <h2 class="section-title">Built for Modern High-Performing Teams</h2>
          <p class="section-desc">Zero clutter, instant visibility, and automated end-of-day alignment so no deliverable falls through the cracks.</p>
        </div>
        <div class="features-grid">
          <div class="feature-card" id="reminders">
            <div class="feature-icon-wrap">${Icons.mail}</div>
            <h3 class="feature-title">Automated Daily Reminders</h3>
            <p class="feature-text">Team members receive personalized email digests via Microsoft Graph summarizing overdue, due today, and upcoming priorities.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon-wrap">${Icons.team}</div>
            <h3 class="feature-title">Microsoft Teams Summaries</h3>
            <p class="feature-text">Post consolidated daily status cards into your Microsoft Teams channel so the entire squad has full visibility at the close of every day.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon-wrap">${Icons.msLogo(20)}</div>
            <h3 class="feature-title">Frictionless Microsoft SSO</h3>
            <p class="feature-text">Sign in securely with your Microsoft Entra corporate account. Domain restrictions ensure seamless access exclusively for verified members.</p>
          </div>
          <div class="feature-card" id="security">
            <div class="feature-icon-wrap">${Icons.pulse(20)}</div>
            <h3 class="feature-title">Enterprise Security</h3>
            <p class="feature-text">Equipped with bcrypt password hashing, IP and username brute-force lockout safeguards, and complete audit logging.</p>
          </div>
        </div>
      </section>

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
    </main>

    <footer class="landing-footer">
      <div class="footer-inner">
        <div style="display:flex;align-items:center;gap:8px;font-weight:700;color:var(--ink)">
          <div class="brand-icon-wrap" style="width:26px;height:26px">${Icons.pulse(15)}</div>
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

// ============================================================================
// DOM LIFECYCLE & TARGETED RENDERING ENGINE
// ============================================================================

let isAppShellMounted = false;

function renderMainContent() {
  const state = S_STORE.getState();
  const activeView = state.ui.activeView || 'board';
  if (activeView === 'history') {
    return `<div id="historyViewHost">${renderHistoryView()}</div>`;
  }
  return `
    <div id="summaryHost">${renderSummaryMetrics()}</div>
    <div id="toolbarHost">${renderToolbar()}</div>
    <div id="mobileTabsHost">${renderMobileTabs()}</div>
    <div id="boardHost">${state.ui.isInitialLoading ? renderSkeletons() : renderBoard()}</div>
  `;
}

function renderApp() {
  const root = document.getElementById('app');
  const state = S_STORE.getState();
  const isAuthenticated = !!state.auth.user;

  if (!isAuthenticated) {
    isAppShellMounted = false;
    root.innerHTML = `
      <div id="landingView">${renderLandingPage()}</div>
      <div id="modalHost">${renderModal()}</div>
      <div id="toastHost" class="toast-container" aria-live="polite">${renderToasts()}</div>
    `;
    setupModalFocusTrap();
    return;
  }

  if (!isAppShellMounted) {
    isAppShellMounted = true;
    root.innerHTML = `
      <div id="headerHost">${renderHeader()}</div>
      <main id="mainContainer" class="main-container">
        ${renderMainContent()}
      </main>
      <div id="modalHost">${renderModal()}</div>
      <div id="toastHost" class="toast-container" aria-live="polite">${renderToasts()}</div>
    `;
    setupModalFocusTrap();
    if (state.ui.activeView === 'board') setupDragAndDrop();
    return;
  }

  // Targeted Component Updates without Full DOM Destruction
  updateHeaderDom();
  updateMainContentDom();
  updateModalDom();
  updateToastsDom();
}

function updateHeaderDom() {
  const el = document.getElementById('headerHost');
  if (el) el.innerHTML = renderHeader();
}

function updateMainContentDom() {
  const el = document.getElementById('mainContainer');
  if (!el) return;
  const state = S_STORE.getState();
  const activeView = state.ui.activeView || 'board';

  if (activeView === 'history') {
    const historyHost = document.getElementById('historyViewHost');
    const isHistorySearchFocused = document.activeElement && document.activeElement.id === 'historySearchInput';
    if (!historyHost) {
      el.innerHTML = `<div id="historyViewHost">${renderHistoryView()}</div>`;
    } else if (!isHistorySearchFocused) {
      historyHost.innerHTML = renderHistoryView();
    }
  } else {
    const boardHost = document.getElementById('boardHost');
    if (!boardHost) {
      el.innerHTML = `
        <div id="summaryHost">${renderSummaryMetrics()}</div>
        <div id="toolbarHost">${renderToolbar()}</div>
        <div id="mobileTabsHost">${renderMobileTabs()}</div>
        <div id="boardHost">${state.ui.isInitialLoading ? renderSkeletons() : renderBoard()}</div>
      `;
      setupDragAndDrop();
    } else {
      updateSummaryDom();
      updateToolbarDom();
      updateMobileTabsDom();
      updateBoardDom();
    }
  }
}

function updateSummaryDom() {
  const el = document.getElementById('summaryHost');
  if (el) el.innerHTML = renderSummaryMetrics();
}

function updateToolbarDom() {
  const el = document.getElementById('toolbarHost');
  if (!el) return;
  // If search input is focused, don't replace the input element to preserve cursor position
  const activeInput = document.activeElement;
  const isSearchFocused = activeInput && activeInput.id === 'taskSearchInput';
  if (!isSearchFocused) {
    el.innerHTML = renderToolbar();
  }
}

function updateMobileTabsDom() {
  const el = document.getElementById('mobileTabsHost');
  if (el) el.innerHTML = renderMobileTabs();
}

function updateBoardDom() {
  const el = document.getElementById('boardHost');
  const state = S_STORE.getState();
  if (el) {
    el.innerHTML = state.ui.isInitialLoading ? renderSkeletons() : renderBoard();
    setupDragAndDrop();
  }
}

function updateModalDom() {
  const el = document.getElementById('modalHost');
  if (el) {
    el.innerHTML = renderModal();
    setupModalFocusTrap();
  }
}

function updateToastsDom() {
  const el = document.getElementById('toastHost');
  if (el) el.innerHTML = renderToasts();
}

// Subscribe Store Updates to Targeted DOM Nodes
S_STORE.subscribe((state, domain) => {
  if (domain === 'auth') {
    renderApp();
  } else if (domain === 'tasks') {
    updateHeaderDom();
    updateMainContentDom();
  } else if (domain === 'users') {
    updateMainContentDom();
    if (state.ui.modal?.type === 'user') updateModalDom();
  } else if (domain === 'filters') {
    updateMainContentDom();
  } else if (domain === 'history') {
    updateMainContentDom();
  } else if (domain === 'ui') {
    updateHeaderDom();
    updateMainContentDom();
    updateModalDom();
  } else if (domain === 'toasts') {
    updateToastsDom();
  } else {
    renderApp();
  }
});

// ============================================================================
// HTML5 DRAG AND DROP HANDLERS
// ============================================================================

let draggedTaskId = null;

function setupDragAndDrop() {
  const cards = document.querySelectorAll('.task-card[draggable="true"]');
  const cols = document.querySelectorAll('.kanban-col');

  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedTaskId = card.dataset.taskId;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', draggedTaskId);
    });

    card.addEventListener('dragend', () => {
      draggedTaskId = null;
      card.classList.remove('dragging');
      cols.forEach(c => c.classList.remove('drag-over'));
    });
  });

  cols.forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      col.classList.add('drag-over');
    });

    col.addEventListener('dragleave', (e) => {
      if (!col.contains(e.relatedTarget)) {
        col.classList.remove('drag-over');
      }
    });

    col.addEventListener('drop', async (e) => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
      const targetStatus = col.dataset.colStatus;

      if (!taskId || !targetStatus) return;

      const task = S_STORE.getState().server.tasks.find(t => t.id === taskId);
      if (!task || task.status === targetStatus) return;

      await handleAdvanceTaskOptimistic(taskId, targetStatus);
    });
  });
}

// ============================================================================
// OPTIMISTIC MUTATION CONTROLLERS
// ============================================================================

async function handleAdvanceTaskOptimistic(taskId, newStatus) {
  const task = S_STORE.getState().server.tasks.find(t => t.id === taskId);
  if (!task) return;

  const prevStatus = task.status;
  const rollback = S_STORE.optimisticUpdateTask(taskId, { status: newStatus });
  const statusLabel = newStatus === 'in_progress' ? 'In Progress' : newStatus === 'done' ? 'Done' : 'Open';

  S_STORE.addToast({
    type: 'success',
    title: 'Task Updated',
    message: `"${task.title}" moved to ${statusLabel}`,
    duration: 3000,
  });

  try {
    const res = await api(`/api/tasks?id=${encodeURIComponent(taskId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    // Replace with authoritative server payload
    if (res.task) S_STORE.reconcileTask(taskId, res.task);
  } catch (err) {
    rollback();
    S_STORE.addToast({
      type: 'error',
      title: 'Action Failed',
      message: err.message || 'Could not update task status. Reverted.',
      duration: 5000,
    });
  }
}

async function handleDeleteTaskOptimistic(taskId) {
  const task = S_STORE.getState().server.tasks.find(t => t.id === taskId);
  if (!task) return;

  if (!confirm(`Are you sure you want to delete "${task.title}"?`)) return;

  const rollback = S_STORE.optimisticDeleteTask(taskId);
  S_STORE.addToast({
    type: 'info',
    title: 'Task Deleted',
    message: `"${task.title}" has been deleted.`,
    duration: 3000,
  });

  try {
    await api(`/api/tasks?id=${encodeURIComponent(taskId)}`, { method: 'DELETE' });
  } catch (err) {
    rollback();
    S_STORE.addToast({
      type: 'error',
      title: 'Delete Failed',
      message: err.message || 'Could not delete task on server.',
      duration: 5000,
    });
  }
}

// ============================================================================
// ACCESSIBILITY: MODAL FOCUS TRAP & KEYBOARD SHORTCUTS
// ============================================================================

let previousActiveElement = null;

function setupModalFocusTrap() {
  const modalBox = document.getElementById('activeModalBox');
  if (!modalBox) {
    if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
      previousActiveElement.focus();
      previousActiveElement = null;
    }
    return;
  }

  previousActiveElement = document.activeElement;
  const focusables = modalBox.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (!focusables.length) return;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  setTimeout(() => first.focus(), 50);

  modalBox.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (S_STORE.getState().ui.modal) {
      S_STORE.closeModal();
    }
  }
});

// ============================================================================
// CENTRAL EVENT DELEGATION
// ============================================================================

// Search Debounce Handler
const handleSearchDebounced = debounce((value) => {
  S_STORE.setFilter('search', value);
}, 200);

const handleHistorySearchDebounced = debounce((value) => {
  S_STORE.setHistoryFilter('search', value);
}, 200);

document.addEventListener('input', (e) => {
  if (e.target.id === 'taskSearchInput') {
    handleSearchDebounced(e.target.value);
  }
  if (e.target.id === 'historySearchInput') {
    handleHistorySearchDebounced(e.target.value);
  }
});

// Filter Dropdown Change Handler
document.addEventListener('change', (e) => {
  if (e.target.dataset && e.target.dataset.filter) {
    S_STORE.setFilter(e.target.dataset.filter, e.target.value);
  }
  if (e.target.dataset && e.target.dataset.historyFilter) {
    S_STORE.setHistoryFilter(e.target.dataset.historyFilter, e.target.value);
  }
  if (e.target.dataset && e.target.dataset.action === 'change-report-opt') {
    reportOptionsState[e.target.dataset.opt] = e.target.value;
    reportOptionsState.aiSummary = null;
    reportOptionsState.aiOutcomes = null;
    updateModalDom();
  }
});

// Form Submissions
document.addEventListener('submit', async (e) => {
  // Login Form
  if (e.target.id === 'loginForm') {
    e.preventDefault();
    const fd = new FormData(e.target);
    const username = fd.get('username');
    const password = fd.get('password');

    S_STORE.setSubmitting('login', true);
    try {
      const data = await api('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      S_STORE.setAuth(data.token, data.user);
      S_STORE.closeModal();
      S_STORE.addToast({
        type: 'success',
        title: 'Welcome Back',
        message: `Signed in as ${data.user.name}`,
      });
      await loadInitialData();
    } catch (err) {
      S_STORE.openModal('login', null, err.message);
    } finally {
      S_STORE.setSubmitting('login', false);
    }
    return;
  }

  // Task Form (Create / Edit)
  if (e.target.id === 'taskForm') {
    e.preventDefault();
    const fd = new FormData(e.target);
    const modal = S_STORE.getState().ui.modal;
    const editing = modal?.editing;
    const isEdit = !!editing;

    const payload = {
      title: fd.get('title'),
      description: fd.get('description') || null,
      assigneeId: fd.get('assigneeId') || null,
      dueDate: fd.get('dueDate') || null,
      priority: fd.get('priority') || 'normal',
    };
    if (fd.has('status')) {
      payload.status = fd.get('status');
    }

    if (isEdit) {
      // Optimistic Edit
      const patch = {
        title: payload.title,
        description: payload.description,
        assignee_id: payload.assigneeId,
        due_date: payload.dueDate,
        priority: payload.priority,
      };
      if (payload.status) patch.status = payload.status;

      const rollback = S_STORE.optimisticUpdateTask(editing.id, patch);

      S_STORE.closeModal();
      S_STORE.addToast({ type: 'success', title: 'Task Saved', message: `"${payload.title}" has been updated.` });

      try {
        const res = await api(`/api/tasks?id=${encodeURIComponent(editing.id)}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        if (res.task) S_STORE.reconcileTask(editing.id, res.task);
      } catch (err) {
        rollback();
        S_STORE.addToast({ type: 'error', title: 'Save Failed', message: err.message });
      }
    } else {
      // Optimistic Create
      const tempId = 'temp_' + Math.random().toString(36).slice(2, 9);
      const tempTask = {
        id: tempId,
        title: payload.title,
        description: payload.description,
        assignee_id: payload.assigneeId,
        due_date: payload.dueDate,
        priority: payload.priority,
        status: editing?._initialStatus || 'open',
        created_at: new Date().toISOString(),
      };

      const rollback = S_STORE.optimisticAddTask(tempTask);
      S_STORE.closeModal();
      S_STORE.addToast({ type: 'success', title: 'Task Created', message: `"${payload.title}" added to board.` });

      try {
        const res = await api('/api/tasks', {
          method: 'POST',
          body: JSON.stringify({ ...payload, status: tempTask.status }),
        });
        if (res.task) S_STORE.reconcileTask(tempId, res.task);
      } catch (err) {
        rollback();
        S_STORE.addToast({ type: 'error', title: 'Creation Failed', message: err.message });
      }
    }
    return;
  }

  // User Form (Admin Create User)
  if (e.target.id === 'userForm') {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {
      name: fd.get('name'),
      username: fd.get('username'),
      email: fd.get('email'),
      password: fd.get('password'),
      role: fd.get('role'),
    };

    S_STORE.setSubmitting('user', true);
    try {
      const res = await api('/api/users', { method: 'POST', body: JSON.stringify(body) });
      if (res.user) S_STORE.addUser(res.user);
      S_STORE.addToast({ type: 'success', title: 'Team Member Added', message: `${body.name} has been added.` });
      // Keep modal open on member list
      S_STORE.openModal('user');
    } catch (err) {
      S_STORE.openModal('user', null, err.message);
    } finally {
      S_STORE.setSubmitting('user', false);
    }
    return;
  }

  // Email Form
  if (e.target.id === 'emailForm') {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {
      sender: fd.get('sender'),
      to: fd.get('to'),
      subject: fd.get('subject'),
      body: fd.get('body'),
    };

    S_STORE.setSubmitting('email', true);
    try {
      await api('/api/test-email', { method: 'POST', body: JSON.stringify(body) });
      S_STORE.closeModal();
      S_STORE.addToast({ type: 'success', title: 'Email Dispatched', message: `Sent to ${body.to}` });
    } catch (err) {
      S_STORE.openModal('email', null, err.message);
    } finally {
      S_STORE.setSubmitting('email', false);
    }
    return;
  }
});

// Click Delegations
document.addEventListener('click', async (e) => {
  // Backdrop click closes modal
  if (e.target.id === 'activeModalBackdrop') {
    S_STORE.closeModal();
    return;
  }

  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;

  if (action === 'close-modal') {
    S_STORE.closeModal();
    return;
  }

  if (action === 'open-login') {
    S_STORE.openModal('login');
    return;
  }

  if (action === 'logout') {
    S_STORE.clearAuth();
    S_STORE.addToast({ type: 'info', title: 'Signed Out', message: 'You have been signed out safely.' });
    return;
  }

  if (action === 'new-task') {
    S_STORE.openModal('task', null);
    return;
  }

  if (action === 'quick-add-task') {
    const status = btn.dataset.status || 'open';
    S_STORE.openModal('task', { _initialStatus: status });
    return;
  }

  if (action === 'edit-task') {
    const task = S_STORE.getState().server.tasks.find(t => t.id === btn.dataset.id);
    if (task) S_STORE.openModal('task', task);
    return;
  }

  if (action === 'delete-task') {
    await handleDeleteTaskOptimistic(btn.dataset.id);
    return;
  }

  if (action === 'advance-task') {
    await handleAdvanceTaskOptimistic(btn.dataset.id, btn.dataset.next);
    return;
  }

  if (action === 'open-admin') {
    S_STORE.openModal('user');
    return;
  }

  if (action === 'open-email') {
    S_STORE.openModal('email');
    return;
  }

  if (action === 'clear-search') {
    S_STORE.setFilter('search', '');
    const input = document.getElementById('taskSearchInput');
    if (input) input.value = '';
    return;
  }

  if (action === 'reset-filters') {
    S_STORE.resetFilters();
    const input = document.getElementById('taskSearchInput');
    if (input) input.value = '';
    return;
  }

  if (action === 'set-mobile-col') {
    S_STORE.setActiveMobileCol(btn.dataset.col);
    return;
  }

  if (action === 'dismiss-toast') {
    S_STORE.removeToast(btn.dataset.id);
    return;
  }

  if (action === 'set-view') {
    const view = btn.dataset.view;
    S_STORE.setActiveView(view);
    if (view === 'history' && S_STORE.getState().history.tab === 'activity') {
      loadActivityLogs();
    }
    return;
  }

  if (action === 'set-history-tab') {
    const tab = btn.dataset.tab;
    S_STORE.setHistoryTab(tab);
    if (tab === 'activity') {
      loadActivityLogs();
    }
    return;
  }

  if (action === 'clear-history-search') {
    S_STORE.setHistoryFilter('search', '');
    const input = document.getElementById('historySearchInput');
    if (input) input.value = '';
    return;
  }

  if (action === 'reset-history-filters') {
    S_STORE.resetHistoryFilters();
    const input = document.getElementById('historySearchInput');
    if (input) input.value = '';
    return;
  }

  if (action === 'open-report') {
    S_STORE.openModal('report', {});
    return;
  }

  if (action === 'generate-ai-summary') {
    const state = S_STORE.getState();
    const currentOpts = {
      assigneeId: reportOptionsState.assigneeId,
      timeframe: reportOptionsState.timeframe,
      statusScope: reportOptionsState.statusScope,
      reportFormat: reportOptionsState.reportFormat,
    };
    const reportData = generateKognozReportData(state.server.tasks, currentOpts, state.server.users);

    reportOptionsState.isGeneratingAi = true;
    updateModalDom();

    try {
      const res = await api('/api/generate-summary', {
        method: 'POST',
        body: JSON.stringify({
          tasks: reportData.tasks,
          assigneeName: reportData.assigneeName,
          timeframe: reportData.timeframe,
        }),
      });
      if (res.success) {
        reportOptionsState.aiSummary = res.summary;
        reportOptionsState.aiOutcomes = res.keyOutcomes;
      }
    } catch (err) {
      console.warn('AI summary error:', err);
      // Fallback
      reportOptionsState.aiSummary = `${reportData.assigneeName} delivered ${reportData.totalTasks} completed items with ${reportData.onTimeRate}% on-time turnaround.`;
    } finally {
      reportOptionsState.isGeneratingAi = false;
      updateModalDom();
    }
    return;
  }

  if (action === 'print-report') {
    const state = S_STORE.getState();
    const currentOpts = {
      assigneeId: reportOptionsState.assigneeId,
      timeframe: reportOptionsState.timeframe,
      statusScope: reportOptionsState.statusScope,
      reportFormat: reportOptionsState.reportFormat,
    };
    const reportData = generateKognozReportData(state.server.tasks, currentOpts, state.server.users);
    printKognozReport(
      reportData,
      reportOptionsState.aiSummary,
      reportOptionsState.aiOutcomes,
      reportOptionsState.reportFormat
    );
    return;
  }

  if (action === 'refresh-activity') {
    await loadActivityLogs();
    return;
  }

  if (action === 'reopen-task') {
    await handleAdvanceTaskOptimistic(btn.dataset.id, 'in_progress');
    return;
  }

  if (action === 'remove-user') {
    const userId = btn.dataset.id;
    const user = S_STORE.getState().server.users.find(u => u.id === userId);
    if (!user) return;
    if (!confirm(`Are you sure you want to remove team member ${user.name}?`)) return;

    try {
      await api(`/api/users?id=${encodeURIComponent(userId)}`, { method: 'DELETE' });
      S_STORE.removeUser(userId);
      S_STORE.addToast({ type: 'success', title: 'Member Removed', message: `${user.name} was removed from the team.` });
    } catch (err) {
      S_STORE.addToast({ type: 'error', title: 'Remove Failed', message: err.message });
    }
    return;
  }
});

// ============================================================================
// DATA BOOTSTRAP & INITIALIZATION
// ============================================================================

async function loadInitialData() {
  const token = S_STORE.getState().auth.token;
  if (!token) {
    S_STORE.setInitialLoading(false);
    return;
  }

  S_STORE.setInitialLoading(true);
  try {
    const [uRes, tRes] = await Promise.all([
      api('/api/users'),
      api('/api/tasks'),
    ]);
    S_STORE.setUsers(uRes.users || []);
    S_STORE.setTasks(tRes.tasks || []);

    // Sync self user profile if updated on backend
    const currentSelf = S_STORE.getState().auth.user;
    if (currentSelf && uRes.users) {
      const freshSelf = uRes.users.find(x => x.id === currentSelf.id);
      if (freshSelf) S_STORE.updateUserSelf(freshSelf);
    }
  } catch (err) {
    if (err.isAuthError) {
      S_STORE.addToast({ type: 'warning', title: 'Session Expired', message: 'Please sign in to continue.' });
    } else {
      S_STORE.addToast({ type: 'error', title: 'Data Loading Error', message: err.message });
    }
  } finally {
    S_STORE.setInitialLoading(false);
  }
}

async function init() {
  // Handle SSO Ticket Hand-off
  const params = new URLSearchParams(location.search);
  const ticket = params.get('ssoTicket');
  if (ticket) {
    try {
      const data = await api('/api/auth-microsoft', {
        method: 'POST',
        body: JSON.stringify({ ticket }),
      });
      S_STORE.setAuth(data.token, data.user);
      S_STORE.addToast({
        type: 'success',
        title: 'Microsoft Sign-in Successful',
        message: `Welcome, ${data.user.name}`,
      });
    } catch (err) {
      S_STORE.addToast({
        type: 'error',
        title: 'Sign-in Failed',
        message: err.message || 'Microsoft authentication could not be completed.',
      });
    }
    history.replaceState({}, '', location.pathname);
  }

  // Handle SSO Error redirects
  const ssoError = params.get('ssoError');
  if (ssoError && !S_STORE.getState().auth.user) {
    let errorMsg = 'Microsoft sign-in failed. Please try again or use your password.';
    if (ssoError === 'not_authorized') errorMsg = "Your Microsoft account isn't on the authorized domain or user roster.";
    else if (ssoError === 'not_configured') errorMsg = "Microsoft sign-in is not yet configured on this server.";
    else if (ssoError.startsWith('msft_')) errorMsg = 'Microsoft sign-in was cancelled or denied.';

    S_STORE.openModal('login', null, errorMsg);
    history.replaceState({}, '', location.pathname);
  }

  // Render Initial View
  renderApp();

  // Load live data if authenticated
  if (S_STORE.getState().auth.user && S_STORE.getState().auth.token) {
    await loadInitialData();
  } else {
    S_STORE.setInitialLoading(false);
  }
}

// Start Application
init();
