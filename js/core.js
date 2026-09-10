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

// ---------- Filter shape ----------
// assignee/status/priority/dueDate are ARRAYS. An empty array means "no
// constraint" — there is no 'all' sentinel. `search` and `sort` stay scalar.
//
// The one trap to respect everywhere: [] is truthy, so a guard written as
// `if (filters.status && ...)` passes for an empty selection and would filter
// every task away. Always test length — that is what these two helpers are for.
function isFilterActive(sel) {
  return Array.isArray(sel) && sel.length > 0;
}

function selectionAllows(sel, value) {
  return !isFilterActive(sel) || sel.includes(value);
}

// Fresh arrays on every call, so a reset can never hand back a reference that
// is shared with the previous state object.
function defaultFilters() {
  return {
    search: '',
    assignee: [],
    status: [],
    priority: [],
    dueDate: [],
    sort: 'due_date_asc',
  };
}

// Timeframe stays a scalar: its buckets are nested ranges (today ⊂ week ⊂
// month), so multi-select would only ever mean "the widest one wins".
function defaultHistoryFilters() {
  return {
    search: '',
    assignee: [],
    timeframe: 'all', // 'all' | 'today' | 'week' | 'month'
  };
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
            // This path rebuilds `editing` directly and so bypasses the
            // new-task defaults in openModal — apply them here too, and
            // likewise leave alone any field the saved form already set.
            if (!restoredEditing.id) {
              if (savedUser && fd.assigneeId === undefined && !restoredEditing.assignee_id) {
                restoredEditing.assignee_id = savedUser.id;
              }
              if (fd.dueDate === undefined && !restoredEditing.due_date) {
                restoredEditing.due_date = todayStr();
              }
            }
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
      filters: defaultFilters(),
      ui: {
        modal: initialModal, // restored on page reload/refresh if user was editing
        isInitialLoading: true,
        submitting: {}, // e.g. { task: true, login: true, ... }
        activeMobileCol: 'all', // 'all' | 'open' | 'in_progress' | 'done'
        activeView: 'board', // 'board' | 'history'
        boardScope: (savedUser && savedUser.role === 'member') ? 'my' : 'team', // 'my' | 'team'
        realtimeStatus: 'connecting', // 'live' | 'connecting' | 'offline'
      },
      history: {
        tab: 'tasks', // 'tasks' | 'activity'
        ...defaultHistoryFilters(),
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
    if (user) {
      this._state.ui.boardScope = (user.role === 'member') ? 'my' : 'team';
    }
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

  // ---------- Realtime Live Updates & Reflection ----------
  setRealtimeStatus(status) {
    if (this._state.ui.realtimeStatus === status) return;
    this._state.ui.realtimeStatus = status;
    this._notify('ui');
  }

  setTasksFromSync(tasks) {
    if (!Array.isArray(tasks)) return;
    const current = this._state.server.tasks;
    if (current.length === tasks.length) {
      let isIdentical = true;
      for (let i = 0; i < tasks.length; i++) {
        const a = current[i];
        const b = tasks[i];
        if (!a || !b || a.id !== b.id || a.status !== b.status || a.updated_at !== b.updated_at || a.title !== b.title || a.assignee_id !== b.assignee_id || a.priority !== b.priority || a.due_date !== b.due_date) {
          isIdentical = false;
          break;
        }
      }
      if (isIdentical) return;
    }
    this._state.server.tasks = tasks;
    this._state.server.lastSync = Date.now();
    this._notify('tasks');
  }

  applyRealtimeTaskChange(type, record, oldRecord) {
    const currentTasks = [...this._state.server.tasks];
    if (type === 'INSERT' && record && record.id) {
      const exists = currentTasks.some(t => t.id === record.id);
      if (!exists) {
        this._state.server.tasks = [record, ...currentTasks];
        this._notify('tasks');
      }
    } else if (type === 'UPDATE' && record && record.id) {
      let found = false;
      const updated = currentTasks.map(t => {
        if (t.id === record.id) {
          found = true;
          return { ...t, ...record };
        }
        return t;
      });
      if (found) {
        this._state.server.tasks = updated;
      } else {
        this._state.server.tasks = [record, ...currentTasks];
      }
      this._notify('tasks');
    } else if (type === 'DELETE') {
      const targetId = oldRecord?.id || record?.id;
      if (targetId) {
        this._state.server.tasks = currentTasks.filter(t => t.id !== targetId);
        this._notify('tasks');
      }
    }
  }

  applyRealtimeUserChange(type, record, oldRecord) {
    const currentUsers = [...this._state.server.users];
    if (type === 'INSERT' && record && record.id) {
      if (!currentUsers.some(u => u.id === record.id)) {
        this._state.server.users = [...currentUsers, record];
        this._notify('users');
      }
    } else if (type === 'UPDATE' && record && record.id) {
      this._state.server.users = currentUsers.map(u => u.id === record.id ? { ...u, ...record } : u);
      this._notify('users');
    } else if (type === 'DELETE') {
      const targetId = oldRecord?.id || record?.id;
      if (targetId) {
        this._state.server.users = currentUsers.filter(u => u.id !== targetId);
        this._notify('users');
      }
    }
  }

  // ---------- Filter Actions ----------
  // `search` and `sort` are scalars; assignee/status/priority/dueDate are
  // arrays where an EMPTY array means "no constraint" (there is no 'all'
  // sentinel). Every write must build a NEW array — the identity guard below
  // would swallow an in-place mutation and the UI would silently not update.
  setFilter(key, value) {
    if (this._state.filters[key] === value) return;
    this._state.filters = { ...this._state.filters, [key]: value };
    this._notify('filters');
  }

  // Single entry point for both the checkbox dropdowns and the member pills.
  toggleFilterValue(key, value) {
    const cur = Array.isArray(this._state.filters[key]) ? this._state.filters[key] : [];
    const next = cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value];
    this._state.filters = { ...this._state.filters, [key]: next };
    this._notify('filters');
  }

  clearFilterKey(key) {
    if (!isFilterActive(this._state.filters[key])) return;
    this._state.filters = { ...this._state.filters, [key]: [] };
    this._notify('filters');
  }

  resetFilters() {
    this._state.filters = defaultFilters();
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

      // Defaults for a NEW task: assign it to whoever is creating it (on
      // every board, not just My Tasks) and make it due today.
      //
      // A field the draft already spoke to is left alone even when it is
      // empty: clearing the date or picking "Unassigned" writes '' to the
      // draft, and re-filling that on reopen would fight the user.
      if (!isEdit) {
        const draftSaid = key => !!(draft && draft[key] !== undefined);

        if (this._state.auth.user && !draftSaid('assigneeId') && !resolvedData?.assignee_id) {
          resolvedData = { ...(resolvedData || {}), assignee_id: this._state.auth.user.id };
        }
        if (!draftSaid('dueDate') && !resolvedData?.due_date) {
          resolvedData = { ...(resolvedData || {}), due_date: todayStr() };
        }
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

  setBoardScope(scope) {
    if (this._state.ui.boardScope === scope && this._state.ui.activeView === 'board') return;
    this._state.ui.boardScope = scope;
    this._state.ui.activeView = 'board';
    // Scope narrows to the current user first and the assignee filter second,
    // so leaving someone else selected would intersect to an empty board.
    if (scope === 'my' && isFilterActive(this._state.filters.assignee)) {
      this._state.filters = { ...this._state.filters, assignee: [] };
    }
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

  toggleHistoryFilterValue(key, value) {
    const cur = Array.isArray(this._state.history[key]) ? this._state.history[key] : [];
    const next = cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value];
    this._state.history = { ...this._state.history, [key]: next };
    this._notify('history');
  }

  clearHistoryFilterKey(key) {
    if (!isFilterActive(this._state.history[key])) return;
    this._state.history = { ...this._state.history, [key]: [] };
    this._notify('history');
  }

  resetHistoryFilters() {
    this._state.history = {
      ...this._state.history,
      ...defaultHistoryFilters(),
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

// Local calendar date, NOT UTC. toISOString() would return yesterday for
// anyone east of UTC early in the morning (in IST, midnight to 05:30), which
// mis-flagged tasks as overdue and made a "Today" pick land on the wrong day.
function toDateStr(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function todayStr() {
  return toDateStr(new Date());
}

// Parse a YYYY-MM-DD string as a LOCAL date. new Date('2026-09-12') parses as
// UTC midnight, which is the previous day in western timezones.
function parseDateStr(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = String(dateStr).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

// Whole days from a to b, both YYYY-MM-DD. Immune to DST because both ends
// are normalized to local noon before subtracting.
function daysBetween(aStr, bStr) {
  const a = parseDateStr(aStr), b = parseDateStr(bStr);
  if (!a || !b) return 0;
  a.setHours(12, 0, 0, 0);
  b.setHours(12, 0, 0, 0);
  return Math.round((b - a) / 86400000);
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

// "Fri, 12 Sep" — or with the year when it isn't the current one.
function formatDateShort(dateStr) {
  const d = parseDateStr(dateStr);
  if (!d) return '';
  const opts = { weekday: 'short', day: 'numeric', month: 'short' };
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
  return d.toLocaleDateString(undefined, opts);
}

function formatDueDate(dateStr) {
  if (!dateStr) return null;
  const today = todayStr();
  if (dateStr === today) return { label: 'Due today', status: 'today' };
  if (dateStr < today) {
    const diffDays = daysBetween(dateStr, today);
    const label = diffDays === 1 ? '1 day overdue' : `${diffDays} days overdue`;
    return { label, status: 'overdue' };
  }
  const diffDays = daysBetween(today, dateStr);
  if (diffDays === 1) return { label: 'Due tomorrow', status: 'upcoming' };
  return { label: `Due ${formatDateShort(dateStr)}`, status: 'future' };
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

// Which due-date bucket a task falls in, or null for none of them.
//
// Mirrors the four branches this replaced, including their asymmetries:
// 'overdue' excludes completed work, 'today' does not, and 'upcoming' is
// strictly after today so "due today" is not upcoming. A task that is past
// due AND done matched none of the old branches and must keep matching none,
// hence the null.
function dueDateBucket(t, today) {
  if (!t.due_date) return 'none';
  if (t.due_date === today) return 'today';
  if (t.due_date > today) return 'upcoming';
  return t.status === 'done' ? null : 'overdue';
}

function filterAndSortTasks(tasks, filters, users = [], scope = 'team', currentUser = null) {
  const query = (filters.search || '').toLowerCase().trim();
  const today = todayStr();

  // If in 'my' scope, filter by current logged-in member
  let scoped = tasks;
  if (scope === 'my' && currentUser && currentUser.id) {
    scoped = tasks.filter(t => t.assignee_id === currentUser.id);
  }

  const userMap = new Map(users.map(u => [u.id, (u.name || '').toLowerCase()]));

  const filtered = scoped.filter(t => {
    // Each selection is an OR within itself and an AND against the others:
    // "(Mayank or Angrah) and (Open or In Progress)". An empty selection
    // imposes nothing — see selectionAllows.
    if (!selectionAllows(filters.assignee, t.assignee_id || 'unassigned')) return false;
    if (!selectionAllows(filters.status, t.status)) return false;
    if (!selectionAllows(filters.priority, t.priority)) return false;
    if (isFilterActive(filters.dueDate) && !filters.dueDate.includes(dueDateBucket(t, today))) return false;

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
  const assigneeFilter = historyFilter.assignee; // array; empty = everyone
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

    // Assignee filter — empty selection means everyone
    if (!selectionAllows(assigneeFilter, t.assignee_id || 'unassigned')) return false;

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

// ============================================================================
// REALTIME WEBSOCKET MANAGER
// ============================================================================

class RealtimeManager {
  constructor(store) {
    this.store = store;
    this.ws = null;
    this.status = 'connecting';
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.pollTimer = null;
    this.refCount = 0;
    this.config = null;
    this.isTabActive = !document.hidden;
    this.reconnectAttempts = 0;

    document.addEventListener('visibilitychange', () => {
      this.isTabActive = !document.hidden;
      if (this.isTabActive) {
        this.performDeltaSync();
        if (this.status !== 'live' && this.store.getState().auth.token) {
          this.connect();
        }
      }
    });
  }

  async init() {
    const token = this.store.getState().auth.token;
    if (!token) {
      this.setStatus('offline');
      return;
    }

    try {
      const res = await api('/api/realtime-config');
      if (res && res.enabled && res.wsUrl) {
        this.config = res;
        this.connect();
      } else {
        this.config = res || {};
        this.startFallbackPolling();
      }
    } catch (err) {
      console.warn('Realtime config fetch fallback to adaptive polling:', err.message);
      this.startFallbackPolling();
    }
  }

  connect() {
    const token = this.store.getState().auth.token;
    if (!token) {
      this.disconnect();
      return;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (!this.config || !this.config.wsUrl || typeof WebSocket === 'undefined') {
      this.startFallbackPolling();
      return;
    }

    clearTimeout(this.reconnectTimer);

    try {
      this.ws = new WebSocket(this.config.wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('live');
        this.joinChannels();
        this.startHeartbeat();
        this.performDeltaSync();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch (e) {
          console.warn('Malformed realtime WS message:', e);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('Realtime WebSocket notice (adaptive sync active):', err);
        this.startFallbackPolling();
      };

      this.ws.onclose = () => {
        this.cleanupSocket();
        this.startFallbackPolling();
        this.scheduleReconnect();
      };
    } catch (err) {
      console.warn('Realtime connection initial error:', err);
      this.startFallbackPolling();
      this.scheduleReconnect();
    }
  }

  joinChannels() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // Join tasks table changes channel (Supabase Phoenix Realtime protocol)
    this.send({
      topic: 'realtime:public:tasks',
      event: 'phx_join',
      payload: {
        config: {
          postgres_changes: [
            { event: '*', schema: 'public', table: 'tasks' }
          ]
        }
      },
      ref: String(++this.refCount)
    });

    // Join users table changes channel
    this.send({
      topic: 'realtime:public:users',
      event: 'phx_join',
      payload: {
        config: {
          postgres_changes: [
            { event: '*', schema: 'public', table: 'users' }
          ]
        }
      },
      ref: String(++this.refCount)
    });
  }

  handleMessage(msg) {
    if (!msg) return;

    // Handle Supabase Realtime Postgres Changes
    if (msg.event === 'postgres_changes' && msg.payload && msg.payload.data) {
      const { type, record, old_record, table } = msg.payload.data;
      if (table === 'tasks') {
        this.store.applyRealtimeTaskChange(type, record, old_record);
      } else if (table === 'users') {
        this.store.applyRealtimeUserChange(type, record, old_record);
      }
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  startHeartbeat() {
    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({
          topic: 'phoenix',
          event: 'heartbeat',
          payload: {},
          ref: 'hb_' + Date.now()
        });
      }
    }, 25000);
  }

  scheduleReconnect() {
    this.startFallbackPolling();
    const delay = Math.min(2000 * Math.pow(1.5, this.reconnectAttempts++), 20000);
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (this.store.getState().auth.token) {
        this.connect();
      }
    }, delay);
  }

  startFallbackPolling() {
    if (this.pollTimer) return;
    const interval = this.config?.pollFallbackMs || 4000;
    this.performDeltaSync();
    this.pollTimer = setInterval(() => {
      if (this.isTabActive && this.store.getState().auth.token) {
        this.performDeltaSync();
      }
    }, interval);
  }

  stopFallbackPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  async performDeltaSync() {
    const token = this.store.getState().auth.token;
    if (!token) return;

    try {
      const res = await api('/api/tasks');
      if (res && res.tasks) {
        this.store.setTasksFromSync(res.tasks);
        if (this.status !== 'live') {
          this.setStatus('live');
        }
      }
    } catch (e) {}
  }

  setStatus(status) {
    this.status = status;
    this.store.setRealtimeStatus(status);
  }

  cleanupSocket() {
    clearInterval(this.heartbeatTimer);
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }
  }

  disconnect() {
    this.cleanupSocket();
    this.stopFallbackPolling();
    clearTimeout(this.reconnectTimer);
    this.setStatus('offline');
  }
}

const REALTIME_MANAGER = new RealtimeManager(S_STORE);
window.REALTIME_MANAGER = REALTIME_MANAGER;
window.S_STORE = S_STORE;
