# Team Pulse

**Daily task tracker for the team — assignees, due dates, and end-of-day reminders.**

Same architecture/security conventions as [Kora](https://github.com/yashwanthkrishna51-netizen/kora): vanilla JS SPA, Vercel serverless functions, Supabase Postgres, Microsoft Entra SSO.

## Architecture

```
Client Browser (Vanilla JS SPA, no framework, no build step)
        │ HTTPS / REST
Vercel Serverless Functions — /api/login, /api/auth-microsoft,
        /api/tasks, /api/users, /api/cron/daily-reminder
        │ PostgREST
Supabase Postgres — users · tasks · login_ip_throttle · audit_log
```

- **Auth:** username/password (bcrypt cost 12, per-username + per-IP lockout) OR Microsoft Entra SSO. SSO only grants access if the Microsoft account's email matches an existing row in `users` — no account is ever auto-created.
- **Reminders:** a Vercel Cron job runs once a day, emails each assignee their own overdue/due-today/upcoming breakdown (via Resend), and posts one team-wide summary to a Microsoft Teams channel (via Incoming Webhook).
- **Audit log:** every login, task change, and user change is recorded.

## Setup

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com) (free tier is enough for a small team).
2. SQL Editor → run `sql/schema.sql`. Before running the last `insert into users…` line: locally run `node scripts/hash-password.js <your-chosen-password>` (needs `npm install` first) and paste the printed hash in place of `<PASTE_BCRYPT_HASH_HERE>`. That's your first admin login.

### 2. Deploy
```bash
git clone <this-repo>
cd team-pulse
npm install
vercel        # link the project
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add SESSION_SECRET       # any random 32+ char string
vercel env add CRON_SECRET          # any random string
vercel --prod
```
After first deploy, open `api/_cors.js` and replace the placeholder origin with your real `https://<your-project>.vercel.app` domain, then redeploy.

### 3. Microsoft Entra SSO (optional)
1. Azure Portal → **Entra ID → App registrations → New registration**.
2. Redirect URI (Web): `https://<your-domain>/api/auth-microsoft`.
3. **Certificates & secrets** → new client secret.
4. Set env vars: `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID` (Directory/tenant ID from the Overview page).
5. Each team member's `email` column in Supabase must exactly match their Microsoft account's email/UPN, or their Microsoft sign-in will be rejected (by design — this is the access gate).

### 4. Email reminders (optional)
1. Sign up at [resend.com](https://resend.com), verify a sending domain (or use their test domain while trying it out).
2. Set `RESEND_API_KEY` and `REMINDER_FROM_EMAIL`.

### 5. Teams reminders (optional)
1. In the target Teams channel: **⋯ → Connectors → Incoming Webhook** → name it, copy the URL.
   (If your tenant has retired Connectors in favor of Workflows: **⋯ → Workflows → "Post to a channel when a webhook request is received"** — copy that URL instead, same env var.)
2. Set `TEAMS_WEBHOOK_URL`.

### 6. Reminder time
Default cron: `30 12 * * *` (12:30 UTC = 18:00 IST) in `vercel.json`. Vercel Hobby cron runs once/day — edit the cron expression to your team's end-of-day, then redeploy.

## Adding team members
Sign in as admin → **Team** button (top right) → add name/username/email/temp password. They can change their password themselves later, or you can PATCH `/api/users?id=` with a new `password`.

## Local dev
```bash
vercel dev
```
Open `http://localhost:3000`. Add `http://localhost:3000` to `ALLOWED_ORIGINS` in `api/_cors.js` (already included).

## Known limitations, by design (matches Kora's documented trade-offs)
- Any signed-in user can edit/complete any task — fine for a small trusted team; add per-user ownership checks in `api/tasks.js` if you outgrow that.
- Teams reminders post to one channel, not per-user DMs (a DM would need a registered Teams bot — more setup than an Incoming Webhook).
- No offline/PWA support (Kora has this; skipped here to keep the build lean — straightforward to add later with a `manifest.json` + service worker).
