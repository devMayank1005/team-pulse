// api/cron/daily-reminder.js — runs once/day via Vercel Cron (see
// vercel.json). Same shape as Kora's cron/backup.js: CRON_SECRET-gated,
// swallows per-recipient failures so one bad email doesn't kill the run.
//
// For each assignee with open/in_progress tasks: sends them an email with
// their own overdue / due-today / upcoming breakdown.
// Posts one consolidated team-wide summary to a Microsoft Teams channel
// via a Power Automate ("Workflows") webhook trigger — "Post to a channel
// when a webhook request is received" — which expects an Adaptive Card
// wrapped in an attachments array. Per-user Teams DMs need a registered
// bot, out of scope here; a channel post is the direct equivalent of
// Kora's pattern of "one shared source of truth", and everyone sees where
// things stand.
//
// Needs: Microsoft Graph application Mail.Send permission and the Azure
// application credentials for email.
// Needs: TEAMS_WEBHOOK_URL for the Teams post.
// Both are optional independently — if only one is set, only that channel fires.
//
// To probe the webhook without waiting for the schedule (posts a real card,
// but sends no email and writes no audit row):
//   curl -H "Authorization: Bearer $CRON_SECRET" \
//     "$APP_URL/api/cron/daily-reminder?test=teams"

const { logAudit } = require('../_audit');
const { ALLOWED_SENDERS, normalizeSender, sendMicrosoftEmail } = require('../_mail');
const { renderKognozEmailTemplate } = require('../_email_templates');

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

// Shared by the real run and the ?test=teams probe so both see identical
// data — a probe that shaped its own data could pass while the run fails.
function groupPerUser(tasks, byId) {
  const grouped = {};
  for (const t of tasks) {
    const key = t.assignee_id || 'unassigned';
    (grouped[key] = grouped[key] || []).push(t);
  }
  const perUser = [];
  for (const [assigneeId, list] of Object.entries(grouped)) {
    if (assigneeId === 'unassigned') continue;
    const user = byId[assigneeId];
    if (!user) continue;
    perUser.push({ name: user.name, email: user.email, buckets: bucketTasks(list) });
  }
  return perUser;
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
  const kpis = [
    { label: 'Overdue', value: String(buckets.overdue.length), color: buckets.overdue.length > 0 ? '#dc2626' : '#64748b' },
    { label: 'Due Today', value: String(buckets.dueToday.length), color: buckets.dueToday.length > 0 ? '#d97706' : '#64748b' },
    { label: 'Upcoming', value: String(buckets.upcoming.length), color: '#0077b6' },
  ];

  const allActiveTasks = [
    ...buckets.overdue.map(t => ({ title: t.title, status: 'open', priority: t.priority || 'high', dueDate: t.due_date })),
    ...buckets.dueToday.map(t => ({ title: t.title, status: 'in_progress', priority: t.priority || 'high', dueDate: t.due_date })),
    ...buckets.upcoming.map(t => ({ title: t.title, status: 'open', priority: t.priority, dueDate: t.due_date })),
    ...buckets.noDueDate.map(t => ({ title: t.title, status: 'open', priority: t.priority, dueDate: null })),
  ];

  return renderKognozEmailTemplate({
    title: 'Daily Task Digest',
    subtitle: 'Kognoz Consulting • Personal Performance & Deliverables Track',
    recipientName: name,
    contentText: `Here is your current operational task summary. Please review your active milestones and prioritize any pending action items.`,
    kpis,
    tasks: allActiveTasks,
    ctaText: 'Open Team Pulse Board',
    ctaUrl: appUrl,
    senderName: 'Team Pulse Operations',
    senderRole: 'Kognoz Consulting',
  });
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function sendEmail({ sender, to, subject, text, html }) {
  if (!normalizeSender(sender)) return { skipped: true };
  return sendMicrosoftEmail({ sender, to: [to], subject, text, html });
}

function teamTotals(perUser) {
  return perUser.reduce((acc, p) => ({
    overdue: acc.overdue + p.buckets.overdue.length,
    dueToday: acc.dueToday + p.buckets.dueToday.length,
    upcoming: acc.upcoming + p.buckets.upcoming.length,
    noDueDate: acc.noDueDate + p.buckets.noDueDate.length,
  }), { overdue: 0, dueToday: 0, upcoming: 0, noDueDate: 0 });
}

function kpiColumn(label, value, color) {
  return {
    type: 'Column',
    width: 'stretch',
    items: [
      { type: 'TextBlock', text: String(value), size: 'ExtraLarge', weight: 'Bolder', color, horizontalAlignment: 'Center', spacing: 'None' },
      { type: 'TextBlock', text: label, size: 'Small', isSubtle: true, horizontalAlignment: 'Center', spacing: 'None', wrap: true },
    ],
  };
}

// Power Automate's "Post to a channel when a webhook request is received"
// trigger wants an Adaptive Card inside an attachments array — not the
// legacy O365 MessageCard shape (Microsoft retired Connectors). Kept pure
// so the payload can be inspected without posting anything.
function buildTeamsCard(perUser, appUrl) {
  const totals = teamTotals(perUser);
  const totalPending = totals.overdue + totals.dueToday + totals.upcoming + totals.noDueDate;

  // FactSet uses `title`; the old MessageCard used `name`.
  const facts = perUser.map(p => ({
    title: p.name,
    value: `${p.buckets.overdue.length} overdue, ${p.buckets.dueToday.length} due today, ${p.buckets.upcoming.length} upcoming`,
  }));

  const body = [
    { type: 'TextBlock', text: 'Team Pulse — Daily Summary', size: 'Large', weight: 'Bolder', wrap: true },
    {
      type: 'TextBlock',
      text: `${totalPending} pending across ${perUser.length} ${perUser.length === 1 ? 'person' : 'people'}`,
      isSubtle: true, spacing: 'None', wrap: true,
    },
    {
      type: 'ColumnSet',
      spacing: 'Medium',
      columns: [
        kpiColumn('Overdue', totals.overdue, totals.overdue > 0 ? 'Attention' : 'Default'),
        kpiColumn('Due Today', totals.dueToday, totals.dueToday > 0 ? 'Warning' : 'Default'),
        kpiColumn('Upcoming', totals.upcoming, 'Default'),
      ],
    },
  ];

  body.push(facts.length
    ? { type: 'FactSet', spacing: 'Medium', facts }
    : { type: 'TextBlock', text: 'No open tasks assigned — nothing needs attention today.', isSubtle: true, spacing: 'Medium', wrap: true });

  return {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      contentUrl: null,
      content: {
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.4',
        msteams: { width: 'Full' },
        body,
        actions: appUrl ? [{ type: 'Action.OpenUrl', title: 'Open Team Pulse', url: appUrl }] : [],
      },
    }],
  };
}

// Power Automate answers 202 Accepted rather than 200, so trust r.ok
// rather than checking for a specific status.
async function postTeamsCard(webhookUrl, perUser, appUrl) {
  const r = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildTeamsCard(perUser, appUrl)),
  });
  const detail = (await r.text().catch(() => '')).slice(0, 200);
  return { ok: r.ok, status: r.status, detail };
}

async function postTeamsSummary(perUser, appUrl) {
  const { TEAMS_WEBHOOK_URL } = process.env;
  if (!TEAMS_WEBHOOK_URL) return { skipped: true };

  const { ok, status, detail } = await postTeamsCard(TEAMS_WEBHOOK_URL, perUser, appUrl);
  if (!ok) throw new Error(`Teams webhook ${status}: ${detail}`);
  return { skipped: false, ok: true, status };
}

module.exports = async function handler(req, res) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET, APP_URL } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ error: 'Server misconfigured' });

  if (CRON_SECRET) {
    const authHeader = req.headers['authorization'] || '';
    if (authHeader !== `Bearer ${CRON_SECRET}`) return res.status(401).json({ error: 'Unauthorized' });
  }

  // On-demand webhook probe: real data, real POST, real status code — but
  // no emails and no audit row. Sits below the CRON_SECRET check above so
  // it isn't a free way for anyone to post into the channel.
  if (req.query?.test === 'teams') {
    const { TEAMS_WEBHOOK_URL } = process.env;
    if (!TEAMS_WEBHOOK_URL) return res.status(400).json({ ok: false, test: 'teams', error: 'TEAMS_WEBHOOK_URL is not set' });
    try {
      const { tasks, byId } = await fetchPendingWithNames(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const perUser = groupPerUser(tasks, byId);
      const { ok, status, detail } = await postTeamsCard(TEAMS_WEBHOOK_URL, perUser, APP_URL);
      if (!ok) console.error(`daily-reminder: Teams probe failed ${status}: ${detail}`);
      return res.status(ok ? 200 : 502).json({ ok, test: 'teams', status, recipients: perUser.length, detail });
    } catch (err) {
      console.error('daily-reminder: Teams probe failed:', err.message);
      return res.status(502).json({ ok: false, test: 'teams', error: err.message });
    }
  }

  try {
    const sender = normalizeSender(req.query?.sender) || normalizeSender(process.env.AZURE_DEFAULT_MAIL_SENDER) || ALLOWED_SENDERS[0];
    const { tasks, byId } = await fetchPendingWithNames(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const perUser = groupPerUser(tasks, byId);

    const emailResults = [];
    for (const p of perUser) {
      try {
        const result = await sendEmail({
          sender,
          to: p.email,
          subject: `Team Pulse — ${p.buckets.overdue.length + p.buckets.dueToday.length} tasks need attention today`,
          text: renderPersonalSummaryText(p.name, p.buckets),
          html: renderPersonalSummaryHtml(p.name, p.buckets, APP_URL),
        });
        emailResults.push({ user: p.email, ...result });
      } catch (err) {
        console.error('daily-reminder: email failed for', p.email, err.message);
        emailResults.push({ user: p.email, error: err.message });
      }
    }

    // A dead webhook must never block the email run, but it also must not
    // masquerade as a healthy cron — hence ok:false in the response below.
    let teamsResult = { skipped: true };
    try {
      teamsResult = await postTeamsSummary(perUser, APP_URL);
    } catch (err) {
      console.error('daily-reminder: Teams post failed:', err.message);
      teamsResult = { skipped: false, ok: false, error: err.message };
    }

    await logAudit({ SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY }, {
      action: `Daily reminder sent: ${perUser.length} recipients, ${tasks.length} pending tasks`,
      entity: 'cron', screen: 'daily-reminder',
    });

    return res.status(200).json({ ok: !teamsResult.error, recipients: perUser.length, pendingTasks: tasks.length, emailResults, teamsResult });
  } catch (err) {
    console.error('daily-reminder error:', err.message);
    return res.status(500).json({ error: 'Reminder run failed', detail: err.message });
  }
};

// Exported for local inspection/testing. module.exports stays the handler
// function itself, which is what Vercel invokes.
module.exports.buildTeamsCard = buildTeamsCard;
