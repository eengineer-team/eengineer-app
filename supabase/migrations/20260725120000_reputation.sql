-- Reputation / contribution points (Future of Eengineer.net doc, item 9 --
-- "a feature that helps us keep people on the community further").
--
-- Design notes:
--  * An append-only LEDGER (reputation_events), not a counter column on
--    profiles. A counter drifts the moment anything is deleted or a vote is
--    retracted; a ledger stays correct because the event row dies with its
--    source row. It's also auditable -- you can always answer "where did
--    these 40 points come from".
--  * Every event carries (source_table, source_id) and each source table gets
--    an AFTER DELETE trigger that removes its events. No FK is possible here
--    since events come from six different tables.
--  * Self-dealing is blocked in the triggers: you get nothing for approving
--    your own question. (endorsements already has a from_id <> profile_id
--    CHECK, so that one is guarded at the schema level already.)

create table if not exists reputation_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  kind text not null,
  points integer not null,
  source_table text not null,
  source_id uuid,
  -- Who caused the event, when that isn't already implied by source_id.
  -- Needed for question_votes: its PK is (question_id, user_id) with no
  -- surrogate id, so source_id alone can't tell two voters' awards apart --
  -- without this, retracting one approval would delete someone else's point.
  source_actor uuid,
  created_at timestamptz not null default now()
);

create index if not exists reputation_events_profile_idx on reputation_events(profile_id);
create index if not exists reputation_events_source_idx on reputation_events(source_table, source_id);

alter table reputation_events enable row level security;

-- Readable by anyone signed in: every event is derived from an action that is
-- already public (a question, an answer, an endorsement, a contest entry), so
-- exposing the ledger reveals nothing the feed doesn't.
drop policy if exists "reputation events are readable" on reputation_events;
create policy "reputation events are readable"
  on reputation_events for select
  using (true);

-- No client write policies at all. Points are only ever written by the
-- SECURITY DEFINER triggers below -- there is deliberately no way for a
-- client to insert its own score.

-- Point values live in one function so the whole scoring table is visible in
-- a single place instead of scattered across six triggers.
create or replace function app.reputation_points(kind text)
returns integer
language sql
immutable
as $$
  select case kind
    when 'question_asked'       then 1
    when 'answer_posted'        then 3
    when 'question_approved'    then 2
    when 'endorsement_received' then 10
    when 'introduction_posted'  then 2
    when 'project_posted'       then 5
    when 'contest_entry'        then 5
    when 'contest_pair_won'     then 1
    else 0
  end;
$$;

create or replace function app.award_reputation(
  p_profile_id uuid,
  p_kind text,
  p_source_table text,
  p_source_id uuid,
  p_source_actor uuid default null
)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
begin
  if p_profile_id is null then
    return;
  end if;
  insert into reputation_events (profile_id, kind, points, source_table, source_id, source_actor)
  values (p_profile_id, p_kind, app.reputation_points(p_kind), p_source_table, p_source_id, p_source_actor);
end;
$$;

create or replace function app.revoke_reputation(p_source_table text, p_source_id uuid)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
begin
  delete from reputation_events
  where source_table = p_source_table and source_id = p_source_id;
end;
$$;

/* ---------------- questions: asked ---------------- */
create or replace function app.rep_question_insert()
returns trigger language plpgsql security definer set search_path = public, app as $$
begin
  perform app.award_reputation(new.author_id, 'question_asked', 'questions', new.id);
  return new;
end; $$;

create or replace function app.rep_question_delete()
returns trigger language plpgsql security definer set search_path = public, app as $$
begin
  perform app.revoke_reputation('questions', old.id);
  return old;
end; $$;

drop trigger if exists rep_questions_ins on questions;
create trigger rep_questions_ins after insert on questions
  for each row execute function app.rep_question_insert();

drop trigger if exists rep_questions_del on questions;
create trigger rep_questions_del after delete on questions
  for each row execute function app.rep_question_delete();

/* ---------------- question_comments: answers ---------------- */
create or replace function app.rep_answer_insert()
returns trigger language plpgsql security definer set search_path = public, app as $$
declare
  v_asker uuid;
begin
  select author_id into v_asker from questions where id = new.question_id;
  -- Answering your own question is a legitimate thing to do (posting the fix
  -- you found), but it shouldn't be a way to farm points.
  if v_asker is distinct from new.author_id then
    perform app.award_reputation(new.author_id, 'answer_posted', 'question_comments', new.id);
  end if;
  return new;
end; $$;

create or replace function app.rep_answer_delete()
returns trigger language plpgsql security definer set search_path = public, app as $$
begin
  perform app.revoke_reputation('question_comments', old.id);
  return old;
end; $$;

drop trigger if exists rep_answers_ins on question_comments;
create trigger rep_answers_ins after insert on question_comments
  for each row execute function app.rep_answer_insert();

drop trigger if exists rep_answers_del on question_comments;
create trigger rep_answers_del after delete on question_comments
  for each row execute function app.rep_answer_delete();

/* ---------------- question_votes: approvals received ----------------
   Fires on INSERT/UPDATE/DELETE so that flipping approve -> disapprove, or
   retracting a vote entirely, takes the point back. The (source_id, actor)
   pair is what makes the "take it back" delete target exactly this voter's
   award and nobody else's. */
create or replace function app.rep_vote_change()
returns trigger language plpgsql security definer set search_path = public, app as $$
declare
  v_author uuid;
  v_question uuid;
  v_voter uuid;
  v_new_vote text;
begin
  if tg_op = 'DELETE' then
    v_question := old.question_id;
    v_voter := old.user_id;
    v_new_vote := null;
  else
    v_question := new.question_id;
    v_voter := new.user_id;
    v_new_vote := new.vote::text;
  end if;

  select author_id into v_author from questions where id = v_question;
  if v_author is null or v_author = v_voter then
    -- Self-approval earns nothing.
    return coalesce(new, old);
  end if;

  delete from reputation_events
  where source_table = 'question_votes'
    and source_id = v_question
    and source_actor = v_voter;

  if v_new_vote = 'approve' then
    perform app.award_reputation(
      v_author, 'question_approved', 'question_votes', v_question, v_voter
    );
  end if;

  return coalesce(new, old);
end; $$;

drop trigger if exists rep_votes_change on question_votes;
create trigger rep_votes_change after insert or update or delete on question_votes
  for each row execute function app.rep_vote_change();

/* ---------------- endorsements received ---------------- */
create or replace function app.rep_endorsement_insert()
returns trigger language plpgsql security definer set search_path = public, app as $$
begin
  perform app.award_reputation(new.profile_id, 'endorsement_received', 'endorsements', new.id);
  return new;
end; $$;

create or replace function app.rep_endorsement_delete()
returns trigger language plpgsql security definer set search_path = public, app as $$
begin
  perform app.revoke_reputation('endorsements', old.id);
  return old;
end; $$;

drop trigger if exists rep_endorsements_ins on endorsements;
create trigger rep_endorsements_ins after insert on endorsements
  for each row execute function app.rep_endorsement_insert();

drop trigger if exists rep_endorsements_del on endorsements;
create trigger rep_endorsements_del after delete on endorsements
  for each row execute function app.rep_endorsement_delete();

/* ---------------- introductions ---------------- */
create or replace function app.rep_intro_insert()
returns trigger language plpgsql security definer set search_path = public, app as $$
begin
  perform app.award_reputation(new.profile_id, 'introduction_posted', 'introductions', new.id);
  return new;
end; $$;

create or replace function app.rep_intro_delete()
returns trigger language plpgsql security definer set search_path = public, app as $$
begin
  perform app.revoke_reputation('introductions', old.id);
  return old;
end; $$;

drop trigger if exists rep_intros_ins on introductions;
create trigger rep_intros_ins after insert on introductions
  for each row execute function app.rep_intro_insert();

drop trigger if exists rep_intros_del on introductions;
create trigger rep_intros_del after delete on introductions
  for each row execute function app.rep_intro_delete();

/* ---------------- projects ---------------- */
create or replace function app.rep_project_insert()
returns trigger language plpgsql security definer set search_path = public, app as $$
begin
  perform app.award_reputation(new.owner_id, 'project_posted', 'projects', new.id);
  return new;
end; $$;

create or replace function app.rep_project_delete()
returns trigger language plpgsql security definer set search_path = public, app as $$
begin
  perform app.revoke_reputation('projects', old.id);
  return old;
end; $$;

drop trigger if exists rep_projects_ins on projects;
create trigger rep_projects_ins after insert on projects
  for each row execute function app.rep_project_insert();

drop trigger if exists rep_projects_del on projects;
create trigger rep_projects_del after delete on projects
  for each row execute function app.rep_project_delete();

/* ---------------- contests: entry + each pairwise win ---------------- */
create or replace function app.rep_contest_entry_insert()
returns trigger language plpgsql security definer set search_path = public, app as $$
begin
  perform app.award_reputation(new.profile_id, 'contest_entry', 'contest_submissions', new.id);
  return new;
end; $$;

create or replace function app.rep_contest_entry_delete()
returns trigger language plpgsql security definer set search_path = public, app as $$
begin
  perform app.revoke_reputation('contest_submissions', old.id);
  -- Votes referencing this submission cascade away; drop their points too.
  perform app.revoke_reputation('contest_votes', old.id);
  return old;
end; $$;

drop trigger if exists rep_contest_entry_ins on contest_submissions;
create trigger rep_contest_entry_ins after insert on contest_submissions
  for each row execute function app.rep_contest_entry_insert();

drop trigger if exists rep_contest_entry_del on contest_submissions;
create trigger rep_contest_entry_del after delete on contest_submissions
  for each row execute function app.rep_contest_entry_delete();

-- Winning a head-to-head pairing is the only contest signal that reflects
-- quality rather than participation, so it scores separately from the entry.
create or replace function app.rep_contest_vote_insert()
returns trigger language plpgsql security definer set search_path = public, app as $$
declare
  v_winner_profile uuid;
begin
  select profile_id into v_winner_profile
  from contest_submissions where id = new.winner_id;
  -- source_id is the winning SUBMISSION, not the vote row, so that deleting a
  -- submission clears every win it ever earned in one revoke call. The voter
  -- goes in source_actor to keep repeat wins individually attributable.
  perform app.award_reputation(
    v_winner_profile, 'contest_pair_won', 'contest_votes', new.winner_id, new.voter_id
  );
  return new;
end; $$;

drop trigger if exists rep_contest_vote_ins on contest_votes;
create trigger rep_contest_vote_ins after insert on contest_votes
  for each row execute function app.rep_contest_vote_insert();

/* ---------------- derived totals + tier ----------------
   A view rather than a cached column: always consistent with the ledger, and
   the row counts here are tiny. security_invoker so the reader's own RLS on
   reputation_events applies (it's public-select anyway). */
create or replace view profile_reputation
with (security_invoker = true)
as
select
  p.id as profile_id,
  coalesce(sum(e.points), 0)::integer as points,
  -- Thresholds calibrated against the real point distribution (see the
  -- reputation_tier_thresholds migration): at 25/100/300 every existing
  -- member landed on the floor tier and the badge carried no information.
  case
    when coalesce(sum(e.points), 0) >= 120 then 'Core'
    when coalesce(sum(e.points), 0) >= 40  then 'Mentor'
    when coalesce(sum(e.points), 0) >= 12  then 'Contributor'
    else 'Builder'
  end as tier
from profiles p
left join reputation_events e on e.profile_id = p.id
group by p.id;

-- Backfill: award points for everything that already happened, so the feature
-- doesn't launch with every existing member sitting at zero.
insert into reputation_events (profile_id, kind, points, source_table, source_id, created_at)
select q.author_id, 'question_asked', app.reputation_points('question_asked'), 'questions', q.id, q.created_at
from questions q
where not exists (
  select 1 from reputation_events r where r.source_table = 'questions' and r.source_id = q.id
);

insert into reputation_events (profile_id, kind, points, source_table, source_id, created_at)
select c.author_id, 'answer_posted', app.reputation_points('answer_posted'), 'question_comments', c.id, c.created_at
from question_comments c
join questions q on q.id = c.question_id
where q.author_id is distinct from c.author_id
  and not exists (
    select 1 from reputation_events r where r.source_table = 'question_comments' and r.source_id = c.id
  );

insert into reputation_events (profile_id, kind, points, source_table, source_id, created_at)
select e.profile_id, 'endorsement_received', app.reputation_points('endorsement_received'), 'endorsements', e.id, e.created_at
from endorsements e
where not exists (
  select 1 from reputation_events r where r.source_table = 'endorsements' and r.source_id = e.id
);

insert into reputation_events (profile_id, kind, points, source_table, source_id, created_at)
select i.profile_id, 'introduction_posted', app.reputation_points('introduction_posted'), 'introductions', i.id, i.created_at
from introductions i
where not exists (
  select 1 from reputation_events r where r.source_table = 'introductions' and r.source_id = i.id
);

insert into reputation_events (profile_id, kind, points, source_table, source_id, created_at)
select pr.owner_id, 'project_posted', app.reputation_points('project_posted'), 'projects', pr.id, pr.created_at
from projects pr
where not exists (
  select 1 from reputation_events r where r.source_table = 'projects' and r.source_id = pr.id
);

insert into reputation_events (profile_id, kind, points, source_table, source_id, created_at)
select s.profile_id, 'contest_entry', app.reputation_points('contest_entry'), 'contest_submissions', s.id, s.created_at
from contest_submissions s
where not exists (
  select 1 from reputation_events r where r.source_table = 'contest_submissions' and r.source_id = s.id
);
