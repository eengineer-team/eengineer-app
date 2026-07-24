-- Contests (Future of Eengineer.net doc, item 8, scoped per founder
-- clarification 2026-07-24):
--   - A "Contests" section, one level below Community.
--   - Each contest is a task with a submission deadline (e.g. "design an
--     OpenRocket model for max altitude, aerospace"). Deadline-based, not
--     the live 1-vs-19 elimination bracket originally floated -- that adds
--     real-time scheduling complexity the founder deprioritized in favor
--     of "deadline matters more."
--   - Judging is peer voting, Tinder-style: shown two submissions, vote
--     which is better. No algorithmic/AI judging of the actual engineering
--     artifact for v1 -- that's effectively a per-discipline grading engine
--     (parsing OpenRocket files, CAD files, code...), months of work on its
--     own, not a v1 scope.
--   - Rating = Elo, computed from pairwise votes (see the trigger below).
--   - No create-contest UI yet -- same pattern as webinars/competitions:
--     founder/admin inserts rows by hand via SQL or the /internal panel,
--     until there's real demand for a management UI.

create table contests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  -- The task prompt itself, e.g. "Design an OpenRocket model optimized for
  -- max altitude under a 29mm motor mount constraint."
  description text not null,
  -- Null = open to every discipline. Set = scoped to one (matches the
  -- "OpenRocket for aerospace students" example in the founder's doc).
  discipline app.discipline,
  submission_deadline timestamptz not null,
  -- Null = voting stays open indefinitely once submissions close (no forced
  -- end date for peer judging).
  voting_deadline timestamptz,
  created_at timestamptz not null default now(),
  constraint contests_voting_after_submission check (voting_deadline is null or voting_deadline > submission_deadline)
);

-- Public read (same "All disciplines allowed", browsable pre-auth spirit as
-- competitions' comp_select_public) -- a contest task and its deadline
-- aren't sensitive.
alter table contests enable row level security;
create policy contests_select_public on contests for select to anon, authenticated using (true);

create table contest_submissions (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references contests(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  -- Write-up of the entry -- what was built/designed and why. Not a file
  -- upload pipeline for v1; a link (Drive/GitHub/photos) can go in here.
  content text not null,
  image_url text,
  elo_rating integer not null default 1000,
  wins integer not null default 0,
  losses integer not null default 0,
  created_at timestamptz not null default now(),
  -- One entry per person per contest.
  unique (contest_id, profile_id)
);

create index contest_submissions_contest_id_idx on contest_submissions (contest_id);

alter table contest_submissions enable row level security;

-- You can always see your own entry (to confirm it saved, even before
-- voting opens). Everyone else's entries become visible once the
-- submission window has closed -- that's also when voting starts, so
-- there's no point where a submission is both hidden-from-peers and
-- vote-eligible.
create policy contest_submissions_select_own on contest_submissions
  for select to authenticated
  using (profile_id = auth.uid());

create policy contest_submissions_select_after_deadline on contest_submissions
  for select to authenticated
  using (
    exists (
      select 1 from contests c
      where c.id = contest_submissions.contest_id
        and c.submission_deadline <= now()
    )
  );

-- Builder-only (app.is_builder(), same gate as club_memberships/competition
-- registrations), own profile_id, non-empty content, and only while the
-- contest's submission window is still open.
create policy contest_submissions_insert_own on contest_submissions
  for insert to authenticated
  with check (
    app.is_builder()
    and profile_id = auth.uid()
    and length(trim(content)) > 0
    and exists (
      select 1 from contests c
      where c.id = contest_submissions.contest_id
        and c.submission_deadline > now()
    )
  );

create table contest_votes (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references contests(id) on delete cascade,
  voter_id uuid not null references profiles(id) on delete cascade,
  submission_a_id uuid not null references contest_submissions(id) on delete cascade,
  submission_b_id uuid not null references contest_submissions(id) on delete cascade,
  winner_id uuid not null references contest_submissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint contest_votes_distinct_submissions check (submission_a_id <> submission_b_id),
  constraint contest_votes_winner_is_a_or_b check (winner_id = submission_a_id or winner_id = submission_b_id)
);

create index contest_votes_voter_id_idx on contest_votes (voter_id);

alter table contest_votes enable row level security;

-- Only your own vote history is readable -- used client-side to skip pairs
-- you've already compared. Aggregate results (elo_rating/wins/losses) live
-- on contest_submissions instead, which is what the leaderboard actually
-- reads, so nobody needs to read other people's raw vote rows.
create policy contest_votes_select_own on contest_votes
  for select to authenticated
  using (voter_id = auth.uid());

-- Builder-only, own voter_id, submissions must belong to the same contest,
-- voting only opens once submissions close (mirrors the select policy
-- above -- you can't vote on entries you can't even see yet), and you can't
-- vote on a pair that includes your own entry (self-boosting).
create policy contest_votes_insert_own on contest_votes
  for insert to authenticated
  with check (
    app.is_builder()
    and voter_id = auth.uid()
    and exists (
      select 1 from contests c
      where c.id = contest_votes.contest_id
        and c.submission_deadline <= now()
        and (c.voting_deadline is null or c.voting_deadline > now())
    )
    and exists (
      select 1 from contest_submissions a
      where a.id = contest_votes.submission_a_id and a.contest_id = contest_votes.contest_id
    )
    and exists (
      select 1 from contest_submissions b
      where b.id = contest_votes.submission_b_id and b.contest_id = contest_votes.contest_id
    )
    and not exists (
      select 1 from contest_submissions mine
      where mine.id in (contest_votes.submission_a_id, contest_votes.submission_b_id)
        and mine.profile_id = auth.uid()
    )
  );

-- Standard Elo update (K=32), applied to both submissions after each vote.
-- SECURITY DEFINER because contest_submissions has no client-facing update
-- policy at all -- rating changes only ever happen through a counted vote,
-- never a direct edit.
create or replace function update_contest_elo() returns trigger
  language plpgsql security definer set search_path = public as $$
declare
  rating_a numeric;
  rating_b numeric;
  expected_a numeric;
  expected_b numeric;
  score_a numeric;
  score_b numeric;
begin
  select elo_rating into rating_a from contest_submissions where id = new.submission_a_id;
  select elo_rating into rating_b from contest_submissions where id = new.submission_b_id;

  expected_a := 1.0 / (1.0 + power(10, (rating_b - rating_a) / 400.0));
  expected_b := 1.0 / (1.0 + power(10, (rating_a - rating_b) / 400.0));
  score_a := case when new.winner_id = new.submission_a_id then 1 else 0 end;
  score_b := case when new.winner_id = new.submission_b_id then 1 else 0 end;

  update contest_submissions
  set elo_rating = round(elo_rating + 32 * (score_a - expected_a)),
      wins = wins + (case when new.winner_id = id then 1 else 0 end),
      losses = losses + (case when new.winner_id <> id then 1 else 0 end)
  where id = new.submission_a_id;

  update contest_submissions
  set elo_rating = round(elo_rating + 32 * (score_b - expected_b)),
      wins = wins + (case when new.winner_id = id then 1 else 0 end),
      losses = losses + (case when new.winner_id <> id then 1 else 0 end)
  where id = new.submission_b_id;

  return new;
end;
$$;

create trigger contest_votes_update_elo
  after insert on contest_votes
  for each row execute function update_contest_elo();
