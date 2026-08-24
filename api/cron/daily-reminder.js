// api/cron/daily-reminder.js — runs once/day via Vercel Cron (see
// vercel.json). Same shape as Kora's cron/backup.js: CRON_SECRET-gated,
// swallows per-recipient failures so one bad email doesn't kill the run.
//
// For each assignee with open/in_progress tasks: sends them an email with
// their own overdue / due-today / upcoming breakdown.
// Posts one consolidated team-wide summary to a Microsoft Teams channel
// via Incoming Webhook (per-user Teams DMs need a registered bot, out of
// scope here — a channel post is the direct equivalent of Kora's pattern
// of "one shared source of truth", and everyone sees where things stand).
//
// Needs: Microsoft Graph application Mail.Send permission and the Azure
// application credentials for email.
// Needs: TEAMS_WEBHOOK_URL for the Teams post.
// Both are optional independently — if only one is set, only that channel fires.

const { logAudit } = require('../_audit');
const { ALLOWED_SENDERS, normalizeSender, sendMicrosoftEmail } = require('../_mail');

function sbHeaders(key) {
  return { apikey: key, Authorization: `Bearer ${key}` };
}

async function fetchPendingWithNames(supabaseUrl, serviceKey) {
  const [tasksRes, usersRes] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/tasks?status=neq.done&select=*`, { headers: sbHeaders(serviceKey) }),
    fetch(`${supabaseUrl}/rest/v1/users?select=id,name,email`, { headers: sbHeaders(serviceKey) }),
  ]);
  if (!tasksRes.ok || !usersRes.ok) throw new Error('Failed reading tasks/users');
  const tasks = await tasksRes.json();
  const users = await usersRes.json();
  const byId = Object.fromEntries(users.map(u => [u.id, u]));
  return { tasks, users, byId };
}

function bucketTasks(tasks) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const overdue = [], dueToday = [], upcoming = [], noDueDate = [];
  for (const t of tasks) {
    if (!t.due_date) { noDueDate.push(t); continue; }
    if (t.due_date < todayStr) overdue.push(t);
    else if (t.due_date === todayStr) dueToday.push(t);
    else upcoming.push(t);
  }
  return { overdue, dueToday, upcoming, noDueDate };
}

function taskLine(t) {
  const due = t.due_date ? ` (due ${t.due_date})` : '';
  const pr = t.priority === 'high' ? ' [HIGH]' : '';
  return `${t.title}${due}${pr}`;
}

function renderPersonalSummaryText(name, buckets) {
  const lines = [`Hi ${name}, here's your Team Pulse summary for today:`, ''];
  if (buckets.overdue.length) { lines.push(`OVERDUE (${buckets.overdue.length}):`); buckets.overdue.forEach(t => lines.push(`  - ${taskLine(t)}`)); lines.push(''); }
  if (buckets.dueToday.length) { lines.push(`DUE TODAY (${buckets.dueToday.length}):`); buckets.dueToday.forEach(t => lines.push(`  - ${taskLine(t)}`)); lines.push(''); }
  if (buckets.upcoming.length) { lines.push(`UPCOMING (${buckets.upcoming.length}):`); buckets.upcoming.forEach(t => lines.push(`  - ${taskLine(t)}`)); lines.push(''); }
  if (buckets.noDueDate.length) { lines.push(`NO DUE DATE (${buckets.noDueDate.length}):`); buckets.noDueDate.forEach(t => lines.push(`  - ${taskLine(t)}`)); lines.push(''); }
  return lines.join('\n');
}

function renderPersonalSummaryHtml(name, buckets, appUrl) {
  const section = (title, items, color) => !items.length ? '' : `
    <h3 style="margin:16px 0 6px;font:600 14px Roboto,Arial,sans-serif;color:${color}">${title} (${items.length})</h3>
    <ul style="margin:0;padding-left:18px;font:400 14px Roboto,Arial,sans-serif;color:#1e293b">
      ${items.map(t => `<li>${esc(t.title)}${t.due_date ? ` — due ${t.due_date}` : ''}${t.priority === 'high' ? ' <strong style="color:#dc2626">HIGH</strong>' : ''}</li>`).join('')}
    </ul>`;
  return `
  <div style="font-family:Roboto,Arial,sans-serif;max-width:520px;margin:0 auto">
    <h2 style="color:#2563eb;margin:0 0 4px">Team Pulse — Daily Summary</h2>
    <p style="color:#475569;margin:0 0 12px">Hi ${esc(name)}, here's where your tasks stand.</p>
    ${section('Overdue', buckets.overdue, '#dc2626')}
    ${section('Due Today', buckets.dueToday, '#a16207')}
    ${section('Upcoming', buckets.upcoming, '#0e7490')}
    ${section('No Due Date', buckets.noDueDate, '#64748b')}
    ${appUrl ? `<p style="margin-top:20px"><a href="${appUrl}" style="color:#2563eb">Open Team Pulse</a></p>` : ''}
  </div>`;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function sendEmail({ sender, to, subject, text, html }) {
  if (!normalizeSender(sender)) return { skipped: true };
  return sendMicrosoftEmail({ sender, to: [to], subject, text, html });
}

async function postTeamsSummary(perUser, appUrl) {
  const { TEAMS_WEBHOOK_URL } = process.env;
  if (!TEAMS_WEBHOOK_URL) return { skipped: true };

  const facts = perUser.map(p => ({
    name: p.name,
    value: `${p.buckets.overdue.length} overdue, ${p.buckets.dueToday.length} due today, ${p.buckets.upcoming.length} upcoming`,
  }));
  const totalPending = perUser.reduce((n, p) => n + p.buckets.overdue.length + p.buckets.dueToday.length + p.buckets.upcoming.length + p.buckets.noDueDate.length, 0);

  const card = {
    '@type': 'MessageCard', '@context': 'http://schema.org/extensions',
    themeColor: '2563EB', summary: 'Team Pulse daily summary',
    title: `Team Pulse — Daily Summary (${totalPending} pending)`,
    sections: [{ facts, markdown: true }],
    potentialAction: appUrl ? [{ '@type': 'OpenUri', name: 'Open Team Pulse', targets: [{ os: 'default', uri: appUrl }] }] : [],
  };

  const r = await fetch(TEAMS_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(card) });
  if (!r.ok) throw new Error(`Teams webhook ${r.status}: ${(await r.text().catch(() => '')).slice(0, 200)}`);
  return { skipped: false };
}

module.exports = async function handler(req, res) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET, APP_URL } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ error: 'Server misconfigured' });

  if (CRON_SECRET) {
    const authHeader = req.headers['authorization'] || '';
    if (authHeader !== `Bearer ${CRON_SECRET}`) return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const sender = normalizeSender(req.query?.sender) || normalizeSender(process.env.AZURE_DEFAULT_MAIL_SENDER) || ALLOWED_SENDERS[0];
    const { tasks, byId } = await fetchPendingWithNames(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const grouped = {};
    for (const t of tasks) {
      const key = t.assignee_id || 'unassigned';
      (grouped[key] = grouped[key] || []).push(t);
    }

    const perUser = [];
    const emailResults = [];
    for (const [assigneeId, list] of Object.entries(grouped)) {
      if (assigneeId === 'unassigned') continue;
      const user = byId[assigneeId];
      if (!user) continue;
      const buckets = bucketTasks(list);
      perUser.push({ name: user.name, buckets });
      try {
        const result = await sendEmail({
          sender,
          to: user.email,
          subject: `Team Pulse — ${buckets.overdue.length + buckets.dueToday.length} tasks need attention today`,
          text: renderPersonalSummaryText(user.name, buckets),
          html: renderPersonalSummaryHtml(user.name, buckets, APP_URL),
        });
        emailResults.push({ user: user.email, ...result });
      } catch (err) {
        console.error('daily-reminder: email failed for', user.email, err.message);
        emailResults.push({ user: user.email, error: err.message });
      }
    }

    let teamsResult = { skipped: true };
    try {
      teamsResult = await postTeamsSummary(perUser, APP_URL);
    } catch (err) {
      console.error('daily-reminder: Teams post failed:', err.message);
      teamsResult = { error: err.message };
    }

    await logAudit({ SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY }, {
      action: `Daily reminder sent: ${perUser.length} recipients, ${tasks.length} pending tasks`,
      entity: 'cron', screen: 'daily-reminder',
    });

    return res.status(200).json({ ok: true, recipients: perUser.length, pendingTasks: tasks.length, emailResults, teamsResult });
  } catch (err) {
    console.error('daily-reminder error:', err.message);
    return res.status(500).json({ error: 'Reminder run failed', detail: err.message });
  }
};
