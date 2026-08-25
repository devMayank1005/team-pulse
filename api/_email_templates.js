// api/_email_templates.js — Executive Kognoz Consulting Responsive HTML Email Template Builder
// Built to match official Kognoz Consulting brand assets and colors (#00487c, #0084c7, #7cb342).
// Compatible with Microsoft Outlook, Apple Mail, Gmail, and Microsoft 365.

const fs = require('fs');
const path = require('path');

let cachedLogoBase64 = null;
function getLogoBase64() {
  if (cachedLogoBase64) return cachedLogoBase64;
  try {
    const logoPath = path.join(process.cwd(), 'assets', 'kognoz-email-logo.png');
    if (fs.existsSync(logoPath)) {
      const buf = fs.readFileSync(logoPath);
      cachedLogoBase64 = `data:image/png;base64,${buf.toString('base64')}`;
      return cachedLogoBase64;
    }
  } catch (err) {
    console.warn('Failed to load logo base64:', err.message);
  }
  return null;
}

function esc(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

/**
 * Builds an executive Kognoz Consulting branded HTML email.
 *
 * @param {Object} options
 * @param {string} options.title - Email heading / title
 * @param {string} [options.subtitle] - Subtitle or context line
 * @param {string} [options.recipientName] - Name of recipient (e.g. "Mayank")
 * @param {string} [options.contentHtml] - Main body content formatted in HTML
 * @param {string} [options.contentText] - Plain text fallback for body content
 * @param {Array} [options.kpis] - Array of KPI badges: [{ label: 'Completed', value: '12', color: '#0084c7' }]
 * @param {Array} [options.tasks] - Array of task items: [{ title, status, priority, dueDate }]
 * @param {string} [options.ctaText] - Text for CTA button (e.g. "Open Team Pulse Board")
 * @param {string} [options.ctaUrl] - URL for CTA button
 * @param {string} [options.senderName] - Name of sender (e.g. "Mayank")
 * @param {string} [options.senderRole] - Role of sender (e.g. "Kognoz Consulting")
 * @returns {string} Fully formatted responsive HTML email string
 */
function renderKognozEmailTemplate({
  title = 'Team Pulse Update',
  subtitle = 'Kognoz Consulting • Maximizing Human Potential',
  recipientName = '',
  contentHtml = '',
  contentText = '',
  kpis = [],
  tasks = [],
  ctaText = 'Open Team Pulse',
  ctaUrl = process.env.APP_URL || 'https://team-pulse.kognozconsulting.com',
  senderName = 'Team Pulse Operations',
  senderRole = 'Kognoz Consulting',
}) {
  const appUrl = (process.env.APP_URL || 'https://team-pulse.kognozconsulting.com').replace(/\/$/, '');
  const logoDataUri = getLogoBase64();
  const logoSrc = logoDataUri || `${appUrl}/assets/kognoz-email-logo.png`;

  // Process Body content
  let bodyFormatted = contentHtml;
  if (!bodyFormatted && contentText) {
    bodyFormatted = contentText
      .split('\n\n')
      .map(p => `<p style="margin:0 0 14px;line-height:1.65;color:#334155;font-size:15px">${esc(p).replace(/\n/g, '<br/>')}</p>`)
      .join('');
  }

  // Render KPIs section if present
  let kpisHtml = '';
  if (kpis && kpis.length > 0) {
    kpisHtml = `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:22px 0 26px">
      <tr>
        <td style="padding:0">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              ${kpis.map(k => `
                <td align="center" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 10px;width:${Math.floor(100 / kpis.length)}%">
                  <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;margin-bottom:4px">${esc(k.label)}</div>
                  <div style="font-size:22px;font-weight:800;color:${k.color || '#00487c'};font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif">${esc(k.value)}</div>
                </td>
              `).join('<td width="10" style="width:10px"></td>')}
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
  }

  // Render Tasks list if present
  let tasksHtml = '';
  if (tasks && tasks.length > 0) {
    const statusColors = {
      open: { bg: '#eff6ff', text: '#00487c', label: 'OPEN' },
      in_progress: { bg: '#e0f2fe', text: '#0084c7', label: 'IN PROGRESS' },
      done: { bg: '#f0fdf4', text: '#15803d', label: 'DONE' },
    };

    tasksHtml = `
    <div style="margin:24px 0 16px">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#00487c;margin-bottom:10px">
        Key Deliverables & Action Items (${tasks.length})
      </div>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
        ${tasks.map((t, idx) => {
          const st = statusColors[t.status] || statusColors.open;
          const isHigh = t.priority === 'high';
          const bgRow = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
          return `
          <tr style="background:${bgRow};border-bottom:1px solid #f1f5f9">
            <td style="padding:12px 14px;font-size:14px;color:#0f172a;font-weight:600">
              ${esc(t.title)}
              ${t.dueDate ? `<div style="font-size:12px;color:#64748b;font-weight:400;margin-top:3px">📅 Due: ${esc(t.dueDate)}</div>` : ''}
            </td>
            <td align="right" style="padding:12px 14px;white-space:nowrap">
              ${isHigh ? `<span style="display:inline-block;padding:3px 8px;font-size:10px;font-weight:700;background:#fef2f2;color:#dc2626;border-radius:12px;margin-right:4px">HIGH</span>` : ''}
              <span style="display:inline-block;padding:3px 9px;font-size:11px;font-weight:700;background:${st.bg};color:${st.text};border-radius:12px">${st.label}</span>
            </td>
          </tr>`;
        }).join('')}
      </table>
    </div>`;
  }

  // Render CTA Button
  let ctaHtml = '';
  if (ctaUrl && ctaText) {
    ctaHtml = `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:28px 0 16px">
      <tr>
        <td align="center" style="background:#00487c;border-radius:8px;box-shadow:0 3px 8px rgba(0,72,124,0.22)">
          <a href="${esc(ctaUrl)}" target="_blank" style="display:inline-block;padding:13px 28px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.02em">
            ${esc(ctaText)} &rarr;
          </a>
        </td>
      </tr>
    </table>`;
  }

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${esc(title)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #f4f7fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  </style>
</head>
<body style="margin:0;padding:28px 0;background-color:#f4f7fb;">
  <center style="width:100%;background-color:#f4f7fb;">
    <!-- Main Email Container Table -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,72,124,0.07);border:1px solid #e2e8f0;">
      
      <!-- Brand Header Section with Official Kognoz Logo -->
      <tr>
        <td style="background-color:#ffffff;padding:26px 32px 20px;text-align:left;border-bottom:1px solid #f1f5f9;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td valign="middle">
                <img src="${logoSrc}" alt="KOGNOZ — Maximizing Human Potential" width="190" height="auto" style="display:block;max-width:190px;height:auto;border:0;outline:none;text-decoration:none;" />
              </td>
              <td align="right" valign="middle">
                <span style="display:inline-block;padding:5px 11px;font-size:11px;font-weight:800;color:#00487c;background:#e0f2fe;border:1px solid rgba(0,132,199,0.25);border-radius:12px;text-transform:uppercase;letter-spacing:0.06em;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
                  TEAM PULSE
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Kognoz Brand Gradient Accent Line (#00487c -> #0084c7 -> #7cb342) -->
      <tr>
        <td height="4" style="background:linear-gradient(90deg, #00487c 0%, #0084c7 55%, #7cb342 100%);background-color:#00487c;font-size:0;line-height:0;">&nbsp;</td>
      </tr>

      <!-- Main Content Body -->
      <tr>
        <td style="padding:32px 32px 24px;text-align:left;color:#334155;font-size:15px;line-height:1.6;">
          
          <!-- Heading -->
          <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#00487c;letter-spacing:-0.02em;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
            ${esc(title)}
          </h1>
          
          ${subtitle ? `<div style="font-size:13.5px;color:#64748b;margin-bottom:20px;font-weight:500">${esc(subtitle)}</div>` : '<div style="margin-bottom:18px"></div>'}

          ${recipientName ? `<p style="margin:0 0 16px;font-size:15px;color:#0f172a;font-weight:600">Hi ${esc(recipientName)},</p>` : ''}

          <!-- Body Content -->
          <div style="color:#334155;font-size:15px;line-height:1.65;">
            ${bodyFormatted}
          </div>

          <!-- Optional KPIs -->
          ${kpisHtml}

          <!-- Optional Tasks Breakdown -->
          ${tasksHtml}

          <!-- Optional CTA Button -->
          ${ctaHtml}

          <!-- Sender Sign-off -->
          <div style="margin-top:28px;padding-top:20px;border-top:1px solid #f1f5f9;color:#475569;font-size:14px;line-height:1.5;">
            <div>Best regards,</div>
            <div style="font-weight:700;color:#00487c;font-size:15px;margin-top:3px">${esc(senderName)}</div>
            <div style="color:#0084c7;font-size:13px;font-weight:600">${esc(senderRole)}</div>
          </div>

        </td>
      </tr>

      <!-- Executive Footer Section -->
      <tr>
        <td style="background-color:#f8fafc;padding:24px 32px;text-align:center;border-top:1px solid #e2e8f0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="center" style="font-size:12px;color:#64748b;line-height:1.6;">
                <div style="font-weight:700;color:#00487c;margin-bottom:4px;letter-spacing:0.01em">
                  Kognoz Consulting &bull; Operations & Performance Platform
                </div>
                <div style="font-size:11px;color:#94a3b8;margin-bottom:6px">
                  Authenticated Microsoft Graph Transmission &bull; Confidential & Proprietary
                </div>
                <div style="font-size:11px;color:#94a3b8">
                  &copy; ${new Date().getFullYear()} Kognoz Consulting. All rights reserved.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

    </table>
    <!-- /Main Email Container Table -->
  </center>
</body>
</html>`;
}

module.exports = {
  renderKognozEmailTemplate,
};
