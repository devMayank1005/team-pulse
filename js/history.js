// js/history.js — Past History, Grouped Deliverables Timeline & Activity Audit Feed
// Pure Vanilla JavaScript • No Frameworks • No Build Step

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
