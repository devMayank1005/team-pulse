// Task Draft Storage Helpers (persists unsubmitted work even if dialog is closed)
function getTaskDraft(taskId) {
  try {
    const key = taskId ? `tp_draft_task_${taskId}` : 'tp_draft_task_new';
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveTaskDraft(taskId, formData) {
  try {
    const key = taskId ? `tp_draft_task_${taskId}` : 'tp_draft_task_new';
    const hasData = Object.entries(formData || {}).some(([k, v]) => !k.startsWith('_') && v && String(v).trim().length > 0);
    if (hasData) {
      localStorage.setItem(key, JSON.stringify({ ...formData, _savedAt: Date.now() }));
    }
  } catch {}
}

function clearTaskDraft(taskId) {
  try {
    const key = taskId ? `tp_draft_task_${taskId}` : 'tp_draft_task_new';
    localStorage.removeItem(key);
  } catch {}
}

class Store {
  constructor() {
    let savedUser = null;
    try {
      savedUser = JSON.parse(localStorage.getItem('tp_user') || 'null');
    } catch {
      savedUser = null;
    }

    let initialModal = null;
    try {
      const rawDraft = sessionStorage.getItem('tp_modal_draft');
      if (rawDraft) {
        const draft = JSON.parse(rawDraft);
        if (draft && draft.type && (Date.now() - (draft.timestamp || 0) < 86400000)) {
          const fd = draft.formData || {};
          if (draft.type === 'task') {
            const restoredEditing = {
              ...(draft.editing || {}),
              title: fd.title !== undefined ? fd.title : (draft.editing?.title || ''),
              description: fd.description !== undefined ? fd.description : (draft.editing?.description || ''),
              assignee_id: fd.assigneeId !== undefined ? fd.assigneeId : (draft.editing?.assignee_id || ''),
              priority: fd.priority !== undefined ? fd.priority : (draft.editing?.priority || 'normal'),
              due_date: fd.dueDate !== undefined ? fd.dueDate : (draft.editing?.due_date || ''),
              status: fd.status !== undefined ? fd.status : (draft.editing?.status || draft.editing?._initialStatus || 'open'),
            };
            if (draft.editing?.id) restoredEditing.id = draft.editing.id;
            initialModal = { type: 'task', editing: restoredEditing, error: null };
          } else {
            initialModal = { type: draft.type, editing: draft.formData ? { ...(draft.editing || {}), ...draft.formData } : (draft.editing || null), error: null };
          }
        }
      }
    } catch {
      initialModal = null;
    }

    this._state = {
      auth: {
        token: localStorage.getItem('tp_token') || null,
        user: savedUser,
      },
      server: {
        tasks: [],
        users: [],
        lastSync: null,
      },
      filters: {
        search: '',
        assignee: 'all',
        status: 'all',
        priority: 'all',
        dueDate: 'all',
        sort: 'due_date_asc',
      },
      ui: {
        modal: initialModal, // restored on page reload/refresh if user was editing
        isInitialLoading: true,
        submitting: {}, // e.g. { task: true, login: true, ... }
        activeMobileCol: 'all', // 'all' | 'open' | 'in_progress' | 'done'
        activeView: 'board', // 'board' | 'history'
      },
      history: {
        tab: 'tasks', // 'tasks' | 'activity'
        search: '',
        assignee: 'all',
        timeframe: 'all', // 'all' | 'today' | 'week' | 'month'
        activityLogs: [],
        isLoadingLogs: false,
      },
      toasts: [],
    };

    this._listeners = new Set();
  }

  getState() {
    return this._state;
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notify(changedDomain = 'all') {
    for (const listener of this._listeners) {
      try {
        listener(this._state, changedDomain);
      } catch (err) {
        console.error('Store subscriber error:', err);
      }
    }
  }

  // ---------- Auth Actions ----------
  setAuth(token, user) {
    this._state.auth.token = token;
    this._state.auth.user = user;
    if (token) localStorage.setItem('tp_token', token);
    else localStorage.removeItem('tp_token');
    if (user) localStorage.setItem('tp_user', JSON.stringify(user));
    else localStorage.removeItem('tp_user');
    this._notify('auth');
  }

  clearAuth() {
    this._state.auth.token = null;
    this._state.auth.user = null;
    this._state.server.tasks = [];
    this._state.server.users = [];
    localStorage.removeItem('tp_token');
    localStorage.removeItem('tp_user');
    this._notify('auth');
  }

  updateUserSelf(userPatch) {
    if (!this._state.auth.user) return;
    this._state.auth.user = { ...this._state.auth.user, ...userPatch };
    localStorage.setItem('tp_user', JSON.stringify(this._state.auth.user));
    this._notify('auth');
  }

  // ---------- Server Data Actions ----------
  setTasks(tasks) {
    this._state.server.tasks = Array.isArray(tasks) ? tasks : [];
    this._state.server.lastSync = Date.now();
    this._notify('tasks');
  }

  setUsers(users) {
    this._state.server.users = Array.isArray(users) ? users : [];
    this._state.server.lastSync = Date.now();
    this._notify('users');
  }

  addUser(user) {
    if (!user) return;
    const exists = this._state.server.users.some(u => u.id === user.id);
    if (!exists) {
      this._state.server.users = [...this._state.server.users, user].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      this._notify('users');
    }
  }

  removeUser(id) {
    this._state.server.users = this._state.server.users.filter(u => u.id !== id);
    this._notify('users');
  }

  // ---------- Optimistic Task Mutations ----------
  optimisticAddTask(task) {
    const prevTasks = [...this._state.server.tasks];
    this._state.server.tasks = [task, ...this._state.server.tasks];
    this._notify('tasks');
    return () => {
      this._state.server.tasks = prevTasks;
      this._notify('tasks');
    };
  }

  reconcileTask(tempId, savedTask) {
    this._state.server.tasks = this._state.server.tasks.map(t => t.id === tempId ? savedTask : t);
    this._notify('tasks');
  }

  optimisticUpdateTask(id, patch) {
    const prevTasks = [...this._state.server.tasks];
    const index = this._state.server.tasks.findIndex(t => t.id === id);
    if (index === -1) return () => {};

    const currentTask = this._state.server.tasks[index];
    let nextCompletedAt = currentTask.completed_at;
    if (patch.status !== undefined) {
      if (patch.status === 'done') {
        nextCompletedAt = patch.completed_at || (currentTask.status === 'done' && currentTask.completed_at ? currentTask.completed_at : new Date().toISOString());
      } else {
        nextCompletedAt = null;
      }
    } else if (patch.completed_at !== undefined) {
      nextCompletedAt = patch.completed_at;
    }

    const updated = {
      ...currentTask,
      ...patch,
      updated_at: new Date().toISOString(),
      completed_at: nextCompletedAt,
    };

    const newTasks = [...this._state.server.tasks];
    newTasks[index] = updated;
    this._state.server.tasks = newTasks;
    this._notify('tasks');

    return () => {
      this._state.server.tasks = prevTasks;
      this._notify('tasks');
    };
  }

  optimisticDeleteTask(id) {
    const prevTasks = [...this._state.server.tasks];
    this._state.server.tasks = this._state.server.tasks.filter(t => t.id !== id);
    this._notify('tasks');
    return () => {
      this._state.server.tasks = prevTasks;
      this._notify('tasks');
    };
  }

  // ---------- Filter Actions ----------
  setFilter(key, value) {
    if (this._state.filters[key] === value) return;
    this._state.filters = { ...this._state.filters, [key]: value };
    this._notify('filters');
  }

  setFilters(newFilters) {
    this._state.filters = { ...this._state.filters, ...newFilters };
    this._notify('filters');
  }

  resetFilters() {
    this._state.filters = {
      search: '',
      assignee: 'all',
      status: 'all',
      priority: 'all',
      dueDate: 'all',
      sort: 'due_date_asc',
    };
    this._notify('filters');
  }

  // ---------- UI Actions ----------
  openModal(type, editingOrData = null, error = null) {
    let resolvedData = editingOrData;
    if (type === 'task') {
      const isEdit = !!(editingOrData && editingOrData.id);
      const draft = getTaskDraft(isEdit ? editingOrData.id : null);
      if (draft) {
        resolvedData = {
          ...(editingOrData || {}),
          title: draft.title !== undefined ? draft.title : (editingOrData?.title || ''),
          description: draft.description !== undefined ? draft.description : (editingOrData?.description || ''),
          assignee_id: draft.assigneeId !== undefined ? draft.assigneeId : (editingOrData?.assignee_id || ''),
          priority: draft.priority !== undefined ? draft.priority : (editingOrData?.priority || 'normal'),
          due_date: draft.dueDate !== undefined ? draft.dueDate : (editingOrData?.due_date || ''),
          status: draft.status !== undefined ? draft.status : (editingOrData?.status || editingOrData?._initialStatus || 'open'),
        };
        if (isEdit) resolvedData.id = editingOrData.id;
      }
    }

    this._state.ui.modal = { type, editing: resolvedData, error };
    this._notify('ui');
    try {
      sessionStorage.setItem('tp_modal_draft', JSON.stringify({
        type,
        editing: resolvedData,
        formData: {},
        timestamp: Date.now(),
      }));
    } catch {}
  }

  closeModal() {
    const currentModal = this._state.ui.modal;
    if (currentModal) {
      try {
        let formData = {};
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
        sessionStorage.setItem('tp_last_closed_dialog', JSON.stringify({
          type: currentModal.type,
          editing: currentModal.editing,
          formData,
          closedAt: Date.now(),
        }));
      } catch {}
    }

    this._state.ui.modal = null;
    this._notify('ui');
    try {
      sessionStorage.removeItem('tp_modal_draft');
    } catch {}
  }

  setSubmitting(key, isSubmitting) {
    this._state.ui.submitting = { ...this._state.ui.submitting, [key]: !!isSubmitting };
    this._notify('ui');
  }

  setInitialLoading(loading) {
    this._state.ui.isInitialLoading = !!loading;
    this._notify('ui');
  }

  setActiveMobileCol(col) {
    this._state.ui.activeMobileCol = col;
    this._notify('ui');
  }

  // ---------- Navigation & History Actions ----------
  setActiveView(view) {
    if (this._state.ui.activeView === view) return;
    this._state.ui.activeView = view;
    this._notify('ui');
  }

  setHistoryTab(tab) {
    if (this._state.history.tab === tab) return;
    this._state.history.tab = tab;
    this._notify('history');
  }

  setHistoryFilter(key, value) {
    if (this._state.history[key] === value) return;
    this._state.history = { ...this._state.history, [key]: value };
    this._notify('history');
  }

  resetHistoryFilters() {
    this._state.history = {
      ...this._state.history,
      search: '',
      assignee: 'all',
      timeframe: 'all',
    };
    this._notify('history');
  }

  setActivityLogs(logs) {
    this._state.history.activityLogs = Array.isArray(logs) ? logs : [];
    this._state.history.isLoadingLogs = false;
    this._notify('history');
  }

  setLoadingActivityLogs(loading) {
    this._state.history.isLoadingLogs = !!loading;
    this._notify('history');
  }

  // ---------- Toast Notification System ----------
  addToast({ type = 'info', message, title = '', duration = 4000, action = null }) {
    const id = 'toast_' + Math.random().toString(36).slice(2, 9);
    const toastItem = { id, type, title, message, duration, action, createdAt: Date.now() };
    this._state.toasts = [...this._state.toasts, toastItem];
    this._notify('toasts');

    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, duration);
    }
    return id;
  }

  removeToast(id) {
    this._state.toasts = this._state.toasts.filter(t => t.id !== id);
    this._notify('toasts');
  }
}

// Global Singleton Store Instance
const S_STORE = new Store();

// ---------- Resilient API Client ----------
class AppError extends Error {
  constructor(message, status = 500, data = null) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.data = data;
    this.isNetworkError = status === 0;
    this.isAuthError = status === 401;
    this.isForbidden = status === 403;
    this.isNotFound = status === 404;
    this.isRateLimited = status === 429;
  }
}

async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  const token = S_STORE.getState().auth.token;
  if (token) headers['x-session-token'] = token;

  let res;
  try {
    res = await fetch(path, { ...opts, headers });
  } catch (netErr) {
    throw new AppError('Unable to connect to server. Please check your internet connection.', 0);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    let msg = (data && data.error) || `Request failed with status ${res.status}`;
    if (res.status === 401) {
      msg = (data && data.error) || 'Your session has expired. Please sign in again.';
      // Clean auth if expired
      S_STORE.clearAuth();
    } else if (res.status === 403) {
      msg = (data && data.error) || 'You do not have permission to perform this action.';
    } else if (res.status === 404) {
      msg = (data && data.error) || 'The requested resource was not found.';
    } else if (res.status === 429) {
      msg = (data && data.error) || 'Too many requests. Please try again shortly.';
    } else if (res.status >= 500) {
      msg = (data && data.error) || 'Internal server error. Please try again.';
      if (data && data.ref) msg += ` (Ref: ${data.ref})`;
    }

    throw new AppError(msg, res.status, data);
  }

  return data;
}

// ---------- Helper Utilities ----------
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function userName(id) {
  const users = S_STORE.getState().server.users;
  const u = users.find(u => u.id === id);
  return u ? u.name : 'Unassigned';
}

function userInitials(name) {
  if (!name || !name.trim()) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDueDate(dateStr) {
  if (!dateStr) return null;
  const today = todayStr();
  if (dateStr === today) return { label: 'Due today', status: 'today' };
  if (dateStr < today) {
    const diffDays = Math.round((new Date(today) - new Date(dateStr)) / (1000 * 60 * 60 * 24));
    const label = diffDays === 1 ? '1 day overdue' : `${diffDays} days overdue`;
    return { label, status: 'overdue' };
  }
  const diffDays = Math.round((new Date(dateStr) - new Date(today)) / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return { label: 'Due tomorrow', status: 'upcoming' };
  return { label: `Due ${dateStr}`, status: 'future' };
}

function formatFullDateTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatCompletedAt(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return null;

  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const timeStr = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const fullDateStr = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  const fullTimeStr = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' });

  let shortLabel = '';
  if (isToday) {
    shortLabel = `Done today, ${timeStr}`;
  } else if (isYesterday) {
    shortLabel = `Done yesterday, ${timeStr}`;
  } else {
    shortLabel = `Done ${fullDateStr}, ${timeStr}`;
  }

  return {
    short: shortLabel,
    full: `Completed on ${fullDateStr} at ${fullTimeStr}`,
    iso: isoString,
    dateStr: fullDateStr,
    timeStr: timeStr,
  };
}

function debounce(fn, delay = 250) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function computeMetrics(tasks) {
  const today = todayStr();
  let total = tasks.length;
  let inProgress = 0;
  let completed = 0;
  let overdue = 0;
  let dueToday = 0;

  for (const t of tasks) {
    if (t.status === 'done') {
      completed++;
    } else {
      if (t.status === 'in_progress') inProgress++;
      if (t.due_date) {
        if (t.due_date < today) overdue++;
        else if (t.due_date === today) dueToday++;
      }
    }
  }

  return { total, inProgress, completed, overdue, dueToday };
}

function filterAndSortTasks(tasks, filters, users = []) {
  const query = (filters.search || '').toLowerCase().trim();
  const today = todayStr();

  const userMap = new Map(users.map(u => [u.id, (u.name || '').toLowerCase()]));

  const filtered = tasks.filter(t => {
    // Assignee filter
    if (filters.assignee && filters.assignee !== 'all') {
      if (filters.assignee === 'unassigned') {
        if (t.assignee_id) return false;
      } else if (t.assignee_id !== filters.assignee) {
        return false;
      }
    }

    // Status filter
    if (filters.status && filters.status !== 'all' && t.status !== filters.status) {
      return false;
    }

    // Priority filter
    if (filters.priority && filters.priority !== 'all' && t.priority !== filters.priority) {
      return false;
    }

    // Due date filter
    if (filters.dueDate && filters.dueDate !== 'all') {
      if (filters.dueDate === 'overdue') {
        if (!t.due_date || t.due_date >= today || t.status === 'done') return false;
      } else if (filters.dueDate === 'today') {
        if (t.due_date !== today) return false;
      } else if (filters.dueDate === 'upcoming') {
        if (!t.due_date || t.due_date <= today) return false;
      } else if (filters.dueDate === 'none') {
        if (t.due_date) return false;
      }
    }

    // Search query across title, description, and assignee name
    if (query) {
      const matchTitle = (t.title || '').toLowerCase().includes(query);
      const matchDesc = (t.description || '').toLowerCase().includes(query);
      const assigneeName = t.assignee_id ? (userMap.get(t.assignee_id) || '') : 'unassigned';
      const matchAssignee = assigneeName.includes(query);
      if (!matchTitle && !matchDesc && !matchAssignee) return false;
    }

    return true;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (filters.sort === 'due_date_asc') {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    }
    if (filters.sort === 'due_date_desc') {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return b.due_date.localeCompare(a.due_date);
    }
    if (filters.sort === 'priority_desc') {
      const pMap = { high: 3, normal: 2, low: 1 };
      return (pMap[b.priority] || 2) - (pMap[a.priority] || 2);
    }
    if (filters.sort === 'created_desc') {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }
    if (filters.sort === 'completed_desc') {
      const aTime = a.completed_at ? new Date(a.completed_at).getTime() : 0;
      const bTime = b.completed_at ? new Date(b.completed_at).getTime() : 0;
      if (bTime !== aTime) return bTime - aTime;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }
    return 0;
  });

  return filtered;
}

function getTimelinessInfo(dueDateStr, completedAtStr) {
  if (!dueDateStr) return { status: 'none', label: '' };
  if (!completedAtStr) return { status: 'none', label: '' };

  const compDateStr = new Date(completedAtStr).toISOString().slice(0, 10);
  if (compDateStr === dueDateStr) {
    return { status: 'on_time', label: 'On Time' };
  }
  if (compDateStr < dueDateStr) {
    const diffDays = Math.round((new Date(dueDateStr) - new Date(compDateStr)) / (1000 * 60 * 60 * 24));
    return { status: 'early', label: diffDays === 1 ? '1 day early' : `${diffDays} days early` };
  }
  const diffDays = Math.round((new Date(compDateStr) - new Date(dueDateStr)) / (1000 * 60 * 60 * 24));
  return { status: 'overdue', label: diffDays === 1 ? '1 day late' : `${diffDays} days late` };
}

function groupCompletedTasks(tasks, historyFilter = {}, users = []) {
  const query = (historyFilter.search || '').toLowerCase().trim();
  const assigneeFilter = historyFilter.assignee || 'all';
  const timeframeFilter = historyFilter.timeframe || 'all';
  const userMap = new Map(users.map(u => [u.id, (u.name || '').toLowerCase()]));

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 1. Filter completed tasks only
  const completedTasks = tasks.filter(t => {
    if (t.status !== 'done') return false;

    // Assignee filter
    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'unassigned' && t.assignee_id) return false;
      if (assigneeFilter !== 'unassigned' && t.assignee_id !== assigneeFilter) return false;
    }

    // Timeframe filter
    const compTime = t.completed_at ? new Date(t.completed_at) : new Date(t.updated_at || 0);
    const compDateStr = compTime.toISOString().slice(0, 10);

    if (timeframeFilter === 'today' && compDateStr !== todayStr) return false;
    if (timeframeFilter === 'week' && compTime < sevenDaysAgo) return false;
    if (timeframeFilter === 'month' && compTime < thirtyDaysAgo) return false;

    // Search query
    if (query) {
      const matchTitle = (t.title || '').toLowerCase().includes(query);
      const matchDesc = (t.description || '').toLowerCase().includes(query);
      const assigneeName = t.assignee_id ? (userMap.get(t.assignee_id) || '') : 'unassigned';
      const matchAssignee = assigneeName.includes(query);
      if (!matchTitle && !matchDesc && !matchAssignee) return false;
    }

    return true;
  });

  // Sort by completed_at desc
  completedTasks.sort((a, b) => {
    const aTime = a.completed_at ? new Date(a.completed_at).getTime() : new Date(a.updated_at || 0).getTime();
    const bTime = b.completed_at ? new Date(b.completed_at).getTime() : new Date(b.updated_at || 0).getTime();
    return bTime - aTime;
  });

  // Buckets
  const groups = [
    { key: 'today', title: 'Completed Today', tasks: [] },
    { key: 'yesterday', title: 'Completed Yesterday', tasks: [] },
    { key: 'week', title: 'Completed This Week', tasks: [] },
    { key: 'month', title: 'Earlier This Month', tasks: [] },
    { key: 'older', title: 'Older History', tasks: [] },
  ];

  for (const t of completedTasks) {
    const compDate = t.completed_at ? new Date(t.completed_at) : new Date(t.updated_at || 0);
    const compDateStr = compDate.toISOString().slice(0, 10);

    if (compDateStr === todayStr) {
      groups[0].tasks.push(t);
    } else if (compDateStr === yesterdayStr) {
      groups[1].tasks.push(t);
    } else if (compDate >= sevenDaysAgo) {
      groups[2].tasks.push(t);
    } else if (compDate >= thirtyDaysAgo) {
      groups[3].tasks.push(t);
    } else {
      groups[4].tasks.push(t);
    }
  }

  // Filter out empty groups
  const activeGroups = groups.filter(g => g.tasks.length > 0);

  // Compute stats across all completed tasks in system
  const allDone = tasks.filter(t => t.status === 'done');
  let completedTodayCount = 0;
  let completedWeekCount = 0;
  let onTimeCount = 0;
  let totalWithDueDate = 0;

  for (const t of allDone) {
    const compDate = t.completed_at ? new Date(t.completed_at) : new Date(t.updated_at || 0);
    const compDateStr = compDate.toISOString().slice(0, 10);

    if (compDateStr === todayStr) completedTodayCount++;
    if (compDate >= sevenDaysAgo) completedWeekCount++;

    if (t.due_date) {
      totalWithDueDate++;
      if (compDateStr <= t.due_date) onTimeCount++;
    }
  }

  const onTimeRate = totalWithDueDate > 0 ? Math.round((onTimeCount / totalWithDueDate) * 100) : 100;

  return {
    groups: activeGroups,
    totalFiltered: completedTasks.length,
    stats: {
      totalCompleted: allDone.length,
      completedToday: completedTodayCount,
      completedThisWeek: completedWeekCount,
      onTimeRate: onTimeRate,
    }
  };
}

// ============================================================================
// KOGNOZ EXECUTIVE WORK REPORT & EXPORT GENERATOR
// ============================================================================

function generateKognozReportData(tasks = [], options = {}, users = []) {
  const {
    assigneeId = 'all',
    timeframe = 'all', // 'today', 'week', 'month', 'all'
    statusScope = 'all_status', // 'done_only', 'all_status', 'in_progress'
  } = options;

  const userMap = new Map(users.map(u => [u.id, u.name]));
  const assigneeName = assigneeId === 'all'
    ? 'Whole Team'
    : (userMap.get(assigneeId) || 'Team Member');

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    // Status check
    if (statusScope === 'done_only' && t.status !== 'done') return false;
    if (statusScope === 'in_progress' && t.status !== 'in_progress') return false;

    // Assignee check
    if (assigneeId !== 'all') {
      if (assigneeId === 'unassigned' && t.assignee_id) return false;
      if (assigneeId !== 'unassigned' && t.assignee_id !== assigneeId) return false;
    }

    // Timeframe check
    const taskDate = t.completed_at
      ? new Date(t.completed_at)
      : new Date(t.updated_at || t.created_at || Date.now());
    const taskDateStr = taskDate.toISOString().slice(0, 10);

    if (timeframe === 'today') {
      if (taskDateStr !== todayStr) return false;
    } else if (timeframe === 'week') {
      if (taskDate < sevenDaysAgo) return false;
    } else if (timeframe === 'month') {
      if (taskDate < thirtyDaysAgo) return false;
    }

    return true;
  });

  // Sort by completion date descending
  filteredTasks.sort((a, b) => {
    const aTime = a.completed_at ? new Date(a.completed_at).getTime() : 0;
    const bTime = b.completed_at ? new Date(b.completed_at).getTime() : 0;
    return bTime - aTime;
  });

  // Compute metrics
  const totalTasks = filteredTasks.length;
  const highPriority = filteredTasks.filter(t => t.priority === 'high').length;
  let onTimeCount = 0;
  let withDueDate = 0;

  filteredTasks.forEach(t => {
    if (t.due_date && t.completed_at) {
      withDueDate++;
      const compDateStr = new Date(t.completed_at).toISOString().slice(0, 10);
      if (compDateStr <= t.due_date) onTimeCount++;
    }
  });

  const onTimeRate = withDueDate > 0 ? Math.round((onTimeCount / withDueDate) * 100) : 100;

  // Format generated date and time
  const generatedAt = formatFullDateTime(now.toISOString());
  const generatedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return {
    assigneeName,
    assigneeId,
    timeframe,
    generatedAt,
    generatedDate,
    totalTasks,
    highPriority,
    onTimeRate,
    tasks: filteredTasks,
  };
}
