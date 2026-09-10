// api/tasks.js — task CRUD, single endpoint dispatched by method.
//   GET    /api/tasks              -> list all tasks (with assignee/creator names joined client-side)
//   POST   /api/tasks              -> create task { title, description, assigneeId, dueDate, priority }
//   PATCH  /api/tasks?id=...       -> update task (any subset of fields, incl. status)
//   DELETE /api/tasks?id=...       -> delete task
// Every write is attributed + audited.
//
// AUTHORIZATION: admins may act on any task. Members may only act on tasks
// they are assigned to or created, may only create tasks for themselves, and
// may never reassign — handing work to someone else is an admin act.
// Reads stay open: the board is shared, and the UI has a My Tasks/Team toggle.

const { validateToken } = require('./_auth');
const { logAudit, clientIp } = require('./_audit');
const { applyCors } = require('./_cors');
const { serverError, safeError } = require('./_errors');
const { SUPPORT_CONTACTS } = require('./_access');

const STATUSES = ['open', 'in_progress', 'done'];
const PRIORITIES = ['low', 'normal', 'high'];

const NOT_YOURS = `You can only change your own tasks. Ask ${SUPPORT_CONTACTS} to change a teammate's task.`;
const CANNOT_ASSIGN = `You can only create tasks for yourself. Ask ${SUPPORT_CONTACTS} to assign work to someone else.`;
const CANNOT_REASSIGN = `Only an admin can reassign a task. Ask ${SUPPORT_CONTACTS}.`;

function ownsTask(actor, task) {
  return task.assignee_id === actor.id || task.created_by === actor.id;
}

module.exports = async function handler(req, res) {
  applyCors(req, res, 'GET, POST, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SESSION_SECRET } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SESSION_SECRET) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const token = req.headers['x-session-token'];
  const check = await validateToken(token, SESSION_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  if (!check.valid) return res.status(401).json({ error: 'Not authenticated', reason: check.reason });
  const actor = check.payload;

  const env = { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY };
  const sbHeaders = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };
  const ip = clientIp(req), userAgent = req.headers['user-agent'];
  const isAdmin = actor.role === 'admin';

  // Denials are audited like any other privileged event — login.js already
  // logs failed attempts, so there is precedent for recording what did NOT
  // happen as well as what did.
  async function deny(message, action) {
    await logAudit(env, {
      actorId: actor.id, username: actor.username, role: actor.role,
      action, entity: 'task', screen: 'tasks', ip, userAgent,
    });
    return safeError(res, 403, message);
  }

  try {
    if (req.method === 'GET') {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/tasks?select=*&order=due_date.asc.nullslast,created_at.desc`, { headers: sbHeaders });
      if (!r.ok) return res.status(500).json({ error: 'Database error' });
      return res.status(200).json({ tasks: await r.json() });
    }

    if (req.method === 'POST') {
      const { title, description, assigneeId, dueDate, priority } = req.body || {};
      if (!title || !title.trim()) return safeError(res, 400, 'title required');
      if (priority && !PRIORITIES.includes(priority)) return safeError(res, 400, 'invalid priority');

      if (!isAdmin && assigneeId && assigneeId !== actor.id) {
        return deny(CANNOT_ASSIGN, `Denied: create task assigned to ${assigneeId}`);
      }

      const row = {
        title: title.trim(),
        description: description || null,
        // Unassigned work has no owner and no reminder recipient, so a new
        // task belongs to whoever created it unless stated otherwise.
        assignee_id: assigneeId || actor.id,
        due_date: dueDate || null,
        priority: priority || 'normal',
        status: 'open',
        created_by: actor.id,
      };
      const r = await fetch(`${SUPABASE_URL}/rest/v1/tasks`, {
        method: 'POST', headers: { ...sbHeaders, Prefer: 'return=representation' }, body: JSON.stringify(row),
      });
      if (!r.ok) return res.status(500).json({ error: 'Database error' });
      const [created] = await r.json();
      await logAudit(env, { actorId: actor.id, username: actor.username, role: actor.role, action: `Created task "${row.title}"`, entity: 'task', screen: 'tasks', ip, userAgent });
      return res.status(201).json({ task: created });
    }

    const id = (req.query || {}).id;
    if (!id) return safeError(res, 400, 'id required');

    // Both PATCH and DELETE need the existing row before touching it: there
    // is no other way to know who owns a task. This also means "not found"
    // is now decided before the write rather than inferred from an empty
    // result afterwards.
    const existingRes = await fetch(
      `${SUPABASE_URL}/rest/v1/tasks?id=eq.${encodeURIComponent(id)}&select=id,title,assignee_id,created_by&limit=1`,
      { headers: sbHeaders }
    );
    if (!existingRes.ok) return res.status(500).json({ error: 'Database error' });
    const existingRows = await existingRes.json();
    if (!existingRows.length) return safeError(res, 404, 'Task not found');
    const existing = existingRows[0];

    if (!isAdmin && !ownsTask(actor, existing)) {
      return deny(NOT_YOURS, `Denied: ${req.method} task "${existing.title || id}" (not owner)`);
    }

    if (req.method === 'PATCH') {
      const body = req.body || {};

      if (!isAdmin && body.assigneeId !== undefined && body.assigneeId !== existing.assignee_id) {
        return deny(CANNOT_REASSIGN, `Denied: reassign task "${existing.title || id}"`);
      }

      const update = { updated_at: new Date().toISOString() };
      if (body.title !== undefined) update.title = String(body.title).trim();
      if (body.description !== undefined) update.description = body.description;
      if (body.assigneeId !== undefined) update.assignee_id = body.assigneeId;
      if (body.dueDate !== undefined) update.due_date = body.dueDate;
      if (body.priority !== undefined) {
        if (!PRIORITIES.includes(body.priority)) return safeError(res, 400, 'invalid priority');
        update.priority = body.priority;
      }
      if (body.status !== undefined) {
        if (!STATUSES.includes(body.status)) return safeError(res, 400, 'invalid status');
        update.status = body.status;
        if (body.status === 'done') {
          // If status is transitioning to 'done', set completed_at unless already provided
          update.completed_at = body.completedAt ? new Date(body.completedAt).toISOString() : new Date().toISOString();
        } else {
          // Moving back to open or in_progress clears completed_at
          update.completed_at = null;
        }
      } else if (body.completedAt !== undefined) {
        update.completed_at = body.completedAt ? new Date(body.completedAt).toISOString() : null;
      }

      const r = await fetch(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH', headers: { ...sbHeaders, Prefer: 'return=representation' }, body: JSON.stringify(update),
      });
      if (!r.ok) return res.status(500).json({ error: 'Database error' });
      const rows = await r.json();
      if (!rows.length) return safeError(res, 404, 'Task not found');
      const updatedTask = rows[0];

      let actionDesc = `Updated task "${updatedTask.title || id}"`;
      if (body.status === 'done') {
        actionDesc = `Completed task "${updatedTask.title || id}"`;
      } else if (body.status && body.status !== 'done') {
        actionDesc = `Reopened task "${updatedTask.title || id}" -> ${body.status}`;
      }

      await logAudit(env, { actorId: actor.id, username: actor.username, role: actor.role, action: actionDesc, entity: 'task', screen: 'tasks', ip, userAgent });
      return res.status(200).json({ task: updatedTask });
    }

    if (req.method === 'DELETE') {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE', headers: { ...sbHeaders, Prefer: 'return=representation' },
      });
      if (!r.ok) return res.status(500).json({ error: 'Database error' });
      const rows = await r.json();
      if (!rows.length) return safeError(res, 404, 'Task not found');
      await logAudit(env, { actorId: actor.id, username: actor.username, role: actor.role, action: `Deleted task ${id}`, entity: 'task', screen: 'tasks', ip, userAgent });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'GET, POST, PATCH, or DELETE only' });
  } catch (err) {
    return serverError(res, err, 'tasks.js');
  }
};
