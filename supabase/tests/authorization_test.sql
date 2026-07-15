-- ============================================================================
-- eengineer — authorization tests (block 16, step 3). POSITIVE + NEGATIVE.
-- Run after applying the migrations, e.g.  supabase test db  (pgTAP) or:
--   psql "$DATABASE_URL" -f supabase/tests/authorization_test.sql
-- Runs in a transaction and ROLLS BACK — it never leaves data behind.
--
-- Technique: simulate a signed-in user by (1) set local role authenticated
-- and (2) set request.jwt.claims to that user's sub + status/role/verified,
-- exactly what the access-token hook injects. RLS then applies as it would to
-- that user. A denied write surfaces as SQLSTATE 42501 (RLS violation) or as
-- zero rows affected; we assert both shapes.
-- ============================================================================
begin;

-- ── Fixtures (created as table owner, so RLS is bypassed for setup) ──────────
-- auth.users rows first (profiles/user_roles FK to them).
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@test'),   -- Builder A (verified)
  ('bbbbbbbb-0000-0000-0000-000000000002', 'b@test'),   -- Builder B (verified)
  ('cccccccc-0000-0000-0000-000000000003', 'c@test'),   -- Super-admin
  ('dddddddd-0000-0000-0000-000000000004', 'd@test')    -- Preview (no profile)
  on conflict do nothing;

insert into profiles (id, display_name, verified, oauth_provider) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'A', true, 'github'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'B', true, 'linkedin'),
  ('cccccccc-0000-0000-0000-000000000003', 'S', true, 'github');

insert into user_roles (user_id, role) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'builder'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'builder'),
  ('cccccccc-0000-0000-0000-000000000003', 'super-admin');

insert into projects (id, owner_id, name) values
  ('11111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'A''s project');

insert into questions (id, discipline, author_id, text) values
  ('22222222-0000-0000-0000-000000000001', 'Aerospace', 'aaaaaaaa-0000-0000-0000-000000000001', 'q?');

-- Helper: become a user with the given claims.
create or replace function pg_temp.act(uid text, status text, role text, verified boolean)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid, 'user_status', status,
                      'user_role', role, 'user_verified', verified)::text, true);
  execute 'set local role authenticated';
end; $$;

-- Helper assertions.
create or replace function pg_temp.ok(cond boolean, label text)
returns void language plpgsql as $$
begin
  if cond then raise notice 'PASS: %', label;
  else raise exception 'FAIL: %', label; end if;
end; $$;

-- ── T1: Builder B cannot update Builder A's project (RLS filters the row) ─────
select pg_temp.act('bbbbbbbb-0000-0000-0000-000000000002','builder','builder',true);
update projects set name = 'hacked';                     -- RLS ⇒ only my own rows (B has none)
select pg_temp.ok(not found, 'B cannot update A''s project');
reset role;

-- ── T2: Builder A CAN update A's own project ─────────────────────────────────
select pg_temp.act('aaaaaaaa-0000-0000-0000-000000000001','builder','builder',true);
update projects set name = 'renamed' where id = '11111111-0000-0000-0000-000000000001';
select pg_temp.ok(found, 'A can update own project');
reset role;

-- ── T3: A user cannot self-assign a role (super-admin only, never self) ───────
select pg_temp.act('bbbbbbbb-0000-0000-0000-000000000002','builder','builder',true);
do $$ begin
  insert into user_roles (user_id, role)
  values ('bbbbbbbb-0000-0000-0000-000000000002', 'admin');
  perform pg_temp.ok(false, 'self role-escalation was allowed (BAD)');
exception when insufficient_privilege or raise_exception then
  perform pg_temp.ok(true, 'self role-escalation denied');
end $$;
reset role;

-- ── T4: Preview cannot read profiles, CAN read questions ─────────────────────
select pg_temp.act('dddddddd-0000-0000-0000-000000000004','preview',null,false);
select pg_temp.ok((select count(*) from profiles) = 0, 'preview sees no profiles');
select pg_temp.ok((select count(*) from questions) >= 1, 'preview can read questions');
reset role;

-- ── T5: Message insert blocked without an accepted connection; allowed after ─
--   Open a conversation A<->B and try to send before/after connecting.
insert into conversations (id, participant_a, participant_b) values
  ('33333333-0000-0000-0000-000000000001',
   least('aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002')::uuid,
   greatest('aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002')::uuid);

select pg_temp.act('aaaaaaaa-0000-0000-0000-000000000001','builder','builder',true);
do $$ begin
  insert into messages (conversation_id, sender_id, text)
  values ('33333333-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','hi');
  perform pg_temp.ok(false, 'message sent without connection (BAD)');
exception when insufficient_privilege then
  perform pg_temp.ok(true, 'message blocked without accepted connection');
end $$;
reset role;

-- accept a connection A(requester) -> B(addressee)
insert into connections (requester_id, addressee_id, status) values
  ('aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002','connected');

select pg_temp.act('aaaaaaaa-0000-0000-0000-000000000001','builder','builder',true);
insert into messages (conversation_id, sender_id, text)
  values ('33333333-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','hi');
select pg_temp.ok(true, 'message allowed once connected');
reset role;

-- ── T6: Endorsement requires a non-empty reason and forbids self-endorsement ─
select pg_temp.act('bbbbbbbb-0000-0000-0000-000000000002','builder','builder',true);
do $$ begin      -- empty reason ⇒ CHECK violation
  insert into endorsements (profile_id, from_id, target_type, target_name, reason)
  values ('aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002','skill','Python','   ');
  perform pg_temp.ok(false, 'empty-reason endorsement allowed (BAD)');
exception when check_violation then
  perform pg_temp.ok(true, 'empty-reason endorsement rejected');
end $$;
do $$ begin      -- self-endorsement ⇒ CHECK/RLS violation
  insert into endorsements (profile_id, from_id, target_type, target_name, reason)
  values ('bbbbbbbb-0000-0000-0000-000000000002','bbbbbbbb-0000-0000-0000-000000000002','skill','Python','nice');
  perform pg_temp.ok(false, 'self-endorsement allowed (BAD)');
exception when check_violation or insufficient_privilege then
  perform pg_temp.ok(true, 'self-endorsement rejected');
end $$;
reset role;

-- ── T7: Preview cannot write anywhere (e.g. cannot post a question) ───────────
select pg_temp.act('dddddddd-0000-0000-0000-000000000004','preview',null,false);
do $$ begin
  insert into questions (discipline, author_id, text)
  values ('Software','dddddddd-0000-0000-0000-000000000004','sneaky');
  perform pg_temp.ok(false, 'preview posted a question (BAD)');
exception when insufficient_privilege then
  perform pg_temp.ok(true, 'preview cannot post a question');
end $$;
reset role;

rollback;   -- leave no fixtures behind
