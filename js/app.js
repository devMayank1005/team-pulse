// js/app.js — Component-Level DOM Lifecycle, Optimistic UI & Modern Interaction Layer
// Pure Vanilla JavaScript • No Frameworks • No Build Step

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

// 7. Skeletons for Initial Load
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
    modalBody = renderUserModalForm(state.server.users, state.auth.user, isSubmitting, error, editing);
  } else if (type === 'email') {
    modalBody = renderEmailModalForm(isSubmitting, error, editing);
  } else if (type === 'login') {
    modalBody = renderLoginModalForm(isSubmitting, error, editing);
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
  const isEdit = !!(editing && editing.id);

  const currentTitle = editing?.title || '';
  const currentDesc = editing?.description || '';
  const currentAssignee = editing?.assignee_id || editing?.assigneeId || '';
  const currentPriority = editing?.priority || 'normal';
  const currentDueDate = editing?.due_date || editing?.dueDate || '';
  const currentStatus = editing?.status || editing?._initialStatus || 'open';

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
      <input id="taskTitleInput" name="title" value="${esc(currentTitle)}" placeholder="e.g. Deploy Production Release v1.2" required autofocus />
    </div>

    <div class="field">
      <label for="taskDescInput">Description & Deliverable Context</label>
      <textarea id="taskDescInput" name="description" placeholder="Describe task in detail so after completion a professional summary of your work can be generated with your name and deliverables...">${esc(currentDesc)}</textarea>
      <div class="field-hint">Detail provided here is automatically synthesized in your Kognoz PDF Executive Work Report.</div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="field">
        <label for="taskAssigneeSelect">Assignee</label>
        <select id="taskAssigneeSelect" name="assigneeId">
          <option value="">Unassigned</option>
          ${users.map(u => `<option value="${u.id}" ${currentAssignee === u.id ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}
        </select>
      </div>

      <div class="field">
        <label for="taskPrioritySelect">Priority</label>
        <select id="taskPrioritySelect" name="priority">
          <option value="normal" ${currentPriority === 'normal' ? 'selected' : ''}>Normal</option>
          <option value="high" ${currentPriority === 'high' ? 'selected' : ''}>High</option>
          <option value="low" ${currentPriority === 'low' ? 'selected' : ''}>Low</option>
        </select>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:${isEdit ? '1fr 1fr' : '1fr'};gap:12px">
      <div class="field">
        <label for="taskDueDateInput">Due Date</label>
        <input type="date" id="taskDueDateInput" name="dueDate" value="${currentDueDate}" />
      </div>

      ${isEdit ? `
      <div class="field">
        <label for="taskStatusSelect">Status</label>
        <select id="taskStatusSelect" name="status">
          <option value="open" ${currentStatus === 'open' ? 'selected' : ''}>Open</option>
          <option value="in_progress" ${currentStatus === 'in_progress' ? 'selected' : ''}>In Progress</option>
          <option value="done" ${currentStatus === 'done' ? 'selected' : ''}>Done (Completed)</option>
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

function renderUserModalForm(users, currentUser, isSubmitting, error, editing = null) {
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
        <input name="name" value="${esc(editing?.name || '')}" placeholder="Jane Doe" required />
      </div>
      <div class="field">
        <label>Username *</label>
        <input name="username" value="${esc(editing?.username || '')}" placeholder="janedoe" required autocomplete="username" />
      </div>
    </div>

    <div class="field">
      <label>Email * (also used for Microsoft SSO match)</label>
      <input name="email" type="email" value="${esc(editing?.email || '')}" placeholder="jane.doe@kognozconsulting.com" required autocomplete="email" />
    </div>

    <div style="display:grid;grid-template-columns:1.5fr 1fr;gap:12px">
      <div class="field">
        <label>Temporary Password (min 8 chars) *</label>
        <input name="password" type="password" minlength="8" required placeholder="••••••••" />
      </div>
      <div class="field">
        <label>Role</label>
        <select name="role">
          <option value="member" ${(!editing?.role || editing?.role === 'member') ? 'selected' : ''}>Member</option>
          <option value="admin" ${editing?.role === 'admin' ? 'selected' : ''}>Admin</option>
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

let emailAttachmentsState = [];

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function renderEmailAttachmentListHtml() {
  if (!emailAttachmentsState || emailAttachmentsState.length === 0) {
    return '';
  }
  return `
  <div class="attachment-list" id="emailAttachmentItems">
    ${emailAttachmentsState.map((att, idx) => `
      <div class="attachment-item">
        <div class="attachment-info">
          <span style="display:inline-flex;align-items:center;color:var(--brand-primary);">${Icons.paperclip}</span>
          <span class="attachment-name" title="${esc(att.name)}">${esc(att.name)}</span>
          <span class="attachment-size">${formatFileSize(att.size)}</span>
        </div>
        <button type="button" class="attachment-remove" data-action="remove-email-attachment" data-idx="${idx}" title="Remove attachment">✕</button>
      </div>
    `).join('')}
  </div>`;
}

function updateEmailAttachmentsDom() {
  const container = document.getElementById('emailAttachmentContainer');
  if (container) {
    container.innerHTML = renderEmailAttachmentListHtml();
  }
}

function renderEmailModalForm(isSubmitting, error, editing = null) {
  return `
  <div class="modal-head">
    <div>
      <h2 class="modal-title">Send Email</h2>
      <p class="modal-desc">Send messages and attachments directly via Microsoft Graph</p>
    </div>
    <button type="button" class="modal-close" data-action="close-modal" aria-label="Close">✕</button>
  </div>

  ${error ? `<div class="err-banner">${error}</div>` : ''}

  <form id="emailForm">
    <div class="field">
      <label>Send From</label>
      <select name="sender">
        <option value="mayank@kognozconsulting.com" ${editing?.sender === 'mayank@kognozconsulting.com' ? 'selected' : ''}>Mayank (mayank@kognozconsulting.com)</option>
        <option value="yashwanth.krishna@kognozconsulting.com" ${editing?.sender === 'yashwanth.krishna@kognozconsulting.com' ? 'selected' : ''}>Yashwanth (yashwanth.krishna@kognozconsulting.com)</option>
      </select>
    </div>

    <div class="field">
      <label>Recipient Email *</label>
      <input name="to" type="email" value="${esc(editing?.to || '')}" placeholder="recipient@domain.com" required />
    </div>

    <div class="field">
      <label>Subject *</label>
      <input name="subject" value="${esc(editing?.subject || '')}" placeholder="Team Pulse Task Digest" required />
    </div>

    <div class="field">
      <label>Message Content *</label>
      <textarea name="body" rows="4" placeholder="Write your message here..." required>${esc(editing?.body || '')}</textarea>
    </div>

    <div class="field">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <label style="margin-bottom:0">Attachments</label>
        <label for="emailAttachmentInput" class="btn btn-secondary btn-sm" style="cursor:pointer;font-size:11.5px;padding:3px 9px;display:inline-flex;align-items:center;gap:4px;margin-bottom:0">
          ${Icons.paperclip} <span>Attach Files</span>
        </label>
        <input type="file" id="emailAttachmentInput" multiple style="display:none" />
      </div>
      <div id="emailAttachmentContainer">
        ${renderEmailAttachmentListHtml()}
      </div>
      <div class="field-hint">Attach documents, PDFs, or images (up to 4MB per file).</div>
    </div>

    <div class="modal-actions">
      <button type="button" class="btn btn-secondary" data-action="close-modal">Cancel</button>
      <button type="submit" class="btn btn-primary ${isSubmitting ? 'btn-loading' : ''}" ${isSubmitting ? 'disabled' : ''}>
        ${isSubmitting ? 'Sending...' : 'Send Message'}
      </button>
    </div>
  </form>`;
}

function renderLoginModalForm(isSubmitting, error, editing = null) {
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
      <input name="username" value="${esc(editing?.username || '')}" placeholder="Your username" required autocomplete="username" autofocus />
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

// 8b. Toast Container
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

function saveActiveModalDraft() {
  const modal = S_STORE.getState().ui.modal;
  if (!modal) {
    try { sessionStorage.removeItem('tp_modal_draft'); } catch {}
    return;
  }

  const formData = {};
  const modalBox = document.getElementById('activeModalBox');
  if (modalBox) {
    const form = modalBox.querySelector('form');
    if (form) {
      const data = new FormData(form);
      for (const [k, v] of data.entries()) {
        formData[k] = v;
      }
    }
  }

  try {
    sessionStorage.setItem('tp_modal_draft', JSON.stringify({
      type: modal.type,
      editing: modal.editing,
      formData,
      timestamp: Date.now(),
    }));
  } catch {}

  // If task modal, also persist task draft to localStorage
  if (modal.type === 'task') {
    const taskId = modal.editing?.id || null;
    saveTaskDraft(taskId, formData);
  }
}

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
  if (e.target.closest('#activeModalBox')) {
    saveActiveModalDraft();
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
  if (e.target.id === 'emailAttachmentInput') {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      for (const file of files) {
        if (file.size > 4.5 * 1024 * 1024) {
          S_STORE.addToast({
            type: 'warning',
            title: 'File Too Large',
            message: `"${file.name}" exceeds the 4MB limit.`,
          });
          continue;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          const base64Data = typeof result === 'string' ? result.split(',')[1] : '';
          if (base64Data) {
            emailAttachmentsState.push({
              name: file.name,
              contentType: file.type || 'application/octet-stream',
              size: file.size,
              contentBytes: base64Data,
            });
            updateEmailAttachmentsDom();
          }
        };
        reader.readAsDataURL(file);
      }
      e.target.value = '';
    }
  }
  if (e.target.closest('#activeModalBox')) {
    saveActiveModalDraft();
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
    const isEdit = !!(editing && editing.id);

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

      clearTaskDraft(editing.id);
      try { sessionStorage.removeItem('tp_last_closed_dialog'); } catch {}

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

      clearTaskDraft(null);
      try { sessionStorage.removeItem('tp_last_closed_dialog'); } catch {}

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
      attachments: emailAttachmentsState.map(a => ({
        name: a.name,
        contentType: a.contentType,
        contentBytes: a.contentBytes,
      })),
    };

    S_STORE.setSubmitting('email', true);
    try {
      await api('/api/test-email', { method: 'POST', body: JSON.stringify(body) });
      emailAttachmentsState = [];
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

  if (action === 'remove-email-attachment') {
    const idx = parseInt(btn.dataset.idx, 10);
    if (!isNaN(idx) && idx >= 0 && idx < emailAttachmentsState.length) {
      emailAttachmentsState.splice(idx, 1);
      updateEmailAttachmentsDom();
    }
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
    emailAttachmentsState = [];
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

// Keyboard Shortcuts: Ctrl+Z / Cmd+Z to restore/undo closed dialogs & Escape
document.addEventListener('keydown', (e) => {
  const isZ = e.key === 'z' || e.key === 'Z' || e.keyCode === 90;
  const isCmdOrCtrl = e.metaKey || e.ctrlKey;

  // Escape key closes open modal
  if (e.key === 'Escape') {
    if (S_STORE.getState().ui.modal) {
      S_STORE.closeModal();
    }
    return;
  }

  // Ctrl+Z / Cmd+Z (without Shift) undoes closed dialog if no modal is active
  if (isCmdOrCtrl && isZ && !e.shiftKey) {
    const isModalOpen = !!S_STORE.getState().ui.modal;
    const activeEl = document.activeElement;
    const isInsideInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);

    // If modal is closed and user isn't actively editing a text input on the page, restore last closed dialog
    if (!isModalOpen && !isInsideInput) {
      let lastClosed = null;
      try {
        const raw = sessionStorage.getItem('tp_last_closed_dialog');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Date.now() - (parsed.closedAt || 0) < 900000) { // within 15 minutes
            lastClosed = parsed;
          }
        }
      } catch {}

      if (lastClosed) {
        e.preventDefault();
        try { sessionStorage.removeItem('tp_last_closed_dialog'); } catch {}

        let restoredEditing = lastClosed.editing;
        if (lastClosed.type === 'task' && lastClosed.formData) {
          const fd = lastClosed.formData;
          restoredEditing = {
            ...(lastClosed.editing || {}),
            title: fd.title !== undefined ? fd.title : (lastClosed.editing?.title || ''),
            description: fd.description !== undefined ? fd.description : (lastClosed.editing?.description || ''),
            assignee_id: fd.assigneeId !== undefined ? fd.assigneeId : (lastClosed.editing?.assignee_id || ''),
            priority: fd.priority !== undefined ? fd.priority : (lastClosed.editing?.priority || 'normal'),
            due_date: fd.dueDate !== undefined ? fd.dueDate : (lastClosed.editing?.due_date || ''),
            status: fd.status !== undefined ? fd.status : (lastClosed.editing?.status || lastClosed.editing?._initialStatus || 'open'),
          };
          if (lastClosed.editing?.id) restoredEditing.id = lastClosed.editing.id;
        }

        S_STORE.openModal(lastClosed.type, restoredEditing);
        S_STORE.addToast({
          type: 'info',
          title: 'Dialog Restored',
          message: 'Undid dialog close — your draft is reopened.',
        });
      }
    }
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
