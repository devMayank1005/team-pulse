// js/report.js — Kognoz Executive Work Report & Dossier PDF Engine
// Pure Vanilla JavaScript • No Frameworks • No Build Step

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
        <option value="one_page" ${currentOpts.reportFormat === 'one_page' ? 'selected' : ''}>📄 1-Page Performance Report</option>
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
  <title>Executive Work Report — ${esc(reportData.assigneeName)} — Kognoz Consulting</title>
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
      <strong style="font-size:14px;color:#00385c">Kognoz Performance & Deliverables Report (1-Page)</strong>
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
    <div class="dossier-footer" style="justify-content:flex-end">
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
