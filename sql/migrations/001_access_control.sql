-- 001_access_control.sql — pin admin rights to Mayank and Yashwanth, and
-- report on anyone who should no longer have access.
--
-- Run in the Supabase SQL Editor. Steps 1 and 2 are safe and idempotent.
-- Step 3 is REPORTING ONLY — read it, then decide per row.
--
-- Context: api/auth-microsoft.js used to auto-create an account for anyone
-- in the kognozconsulting.com tenant who signed in. It no longer does, so
-- the users table is now the allowlist. Rows created by the old behaviour
-- are still there and this migration surfaces them.

-- ---------------------------------------------------------------------------
-- 1. Guarantee the two admins are admins.
-- ---------------------------------------------------------------------------
update users
   set role = 'admin'
 where lower(email) in (
   'mayank@kognozconsulting.com',
   'yashwanth.krishna@kognozconsulting.com'
 );

-- ---------------------------------------------------------------------------
-- 2. Demote any OTHER admin to member.
--    Team Pulse should have exactly two admins. Angrah is a member.
-- ---------------------------------------------------------------------------
update users
   set role = 'member'
 where role = 'admin'
   and lower(email) not in (
     'mayank@kognozconsulting.com',
     'yashwanth.krishna@kognozconsulting.com'
   );

-- ---------------------------------------------------------------------------
-- 3. REPORT ONLY — who is still on the roster but no longer allowed in?
--
--    Includes the seeded 'admin' / admin@yourcompany.com account from
--    schema.sql. These accounts can no longer use Microsoft sign-in, but a
--    row with a known password can still use the password form until you
--    remove it.
--
--    Read the task counts before deleting anything: tasks.assignee_id and
--    tasks.created_by are ON DELETE SET NULL (schema.sql:33-34), so removing
--    a user silently orphans their tasks rather than cascading. Reassign
--    first if the work still matters.
-- ---------------------------------------------------------------------------
select u.id,
       u.username,
       u.email,
       u.role,
       u.created_at,
       (select count(*) from tasks t where t.assignee_id = u.id) as assigned_tasks,
       (select count(*) from tasks t where t.created_by  = u.id) as created_tasks
  from users u
 where lower(u.email) not in (
   'mayank@kognozconsulting.com',
   'yashwanth.krishna@kognozconsulting.com',
   'angrah.raina@kognozconsulting.com'
 )
 order by u.created_at;

-- ---------------------------------------------------------------------------
-- 4. Cleanup — DELIBERATELY COMMENTED OUT. Uncomment per row, after step 3.
--
--    Prefer reassigning the work first:
--      update tasks
--         set assignee_id = (select id from users where lower(email) = 'mayank@kognozconsulting.com')
--       where assignee_id = '<the-user-id>';
--
--    Then remove the account:
--      delete from users where id = '<the-user-id>';
-- ---------------------------------------------------------------------------
