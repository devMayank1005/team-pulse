-- Team Pulse — Supabase schema
-- Same conventions as Kora: PostgREST direct via service-role key, RLS
-- enabled with zero policies (backend is the only caller), explicit GRANTs
-- on every table (Supabase requires these for tables created after
-- Oct 30 2026 — cheap insurance to add now regardless of date).

-- Users — password + optional Microsoft Entra SSO (same gate as Kora:
-- signing in with Microsoft only proves identity, access still requires a
-- matching row here). Passwords are bcrypt hashes, never plaintext.
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  name text not null,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  token_version int not null default 0,
  failed_attempts int not null default 0,
  lockout_level int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists users_email_idx on users (lower(email));

alter table users enable row level security;
grant select, insert, update, delete on table users to anon, authenticated, service_role;

-- Tasks — the actual tracker content.
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assignee_id uuid references users(id) on delete set null,
  created_by uuid references users(id) on delete set null,
  due_date date,
  status text not null default 'open' check (status in ('open', 'in_progress', 'done')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists tasks_assignee_idx on tasks (assignee_id);
create index if not exists tasks_status_idx on tasks (status);
create index if not exists tasks_due_date_idx on tasks (due_date);

alter table tasks enable row level security;
grant select, insert, update, delete on table tasks to anon, authenticated, service_role;

-- IP-based login throttle — identical pattern to Kora's api/_throttle.js.
create table if not exists login_ip_throttle (
  ip text primary key,
  attempt_count int not null default 0,
  window_start timestamptz not null default now(),
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table login_ip_throttle enable row level security;
grant select, insert, update, delete on table login_ip_throttle to anon, authenticated, service_role;

-- Audit log — who did what, when. Same shape as Kora's audit_log.
create table if not exists audit_log (
  id bigserial primary key,
  actor_id uuid,
  username text,
  role text,
  action text not null,
  entity text,
  screen text,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_created_idx on audit_log (created_at desc);

alter table audit_log enable row level security;
grant select, insert, update, delete on table audit_log to anon, authenticated, service_role;

-- Seed the first admin — run `node scripts/hash-password.js <your-password>`
-- locally first, paste the printed hash below, THEN run this file. No
-- fabricated hash shipped here on purpose — a hash you didn't generate
-- yourself isn't one you can log in with.
insert into users (username, password_hash, name, email, role)
values ('admin', '<PASTE_BCRYPT_HASH_HERE>', 'Admin', 'admin@yourcompany.com', 'admin')
on conflict (username) do nothing;

-- Realtime WebSocket Broadcasts — enables instant live updates across team browsers
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table users;
