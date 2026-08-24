// js/core.js — Centralized State Architecture & Resilient API Client
// No frameworks, no build step. Clean vanilla JavaScript with reactive listeners.

class Store {
  constructor() {
    let savedUser = null;
    try {
      savedUser = JSON.parse(localStorage.getItem('tp_user') || 'null');
    } catch {
      savedUser = null;
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
        modal: null, // { type: 'task'|'user'|'email'|'login', editing: object|null, error: string|null }
        isInitialLoading: true,
        submitting: {}, // e.g. { task: true, login: true, ... }
        activeMobileCol: 'all', // 'all' | 'open' | 'in_progress' | 'done'
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

    const updated = {
      ...this._state.server.tasks[index],
      ...patch,
      updated_at: new Date().toISOString(),
      completed_at: patch.status === 'done' ? new Date().toISOString() : (patch.status ? null : this._state.server.tasks[index].completed_at),
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
    this._state.ui.modal = { type, editing: editingOrData, error };
    this._notify('ui');
  }

  closeModal() {
    this._state.ui.modal = null;
    this._notify('ui');
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
    return 0;
  });

  return filtered;
}
