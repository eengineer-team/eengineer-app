-- Product feedback, submitted from a permanently-visible sidebar entry in
-- the dashboard (post sign-in/sign-up only — there's no session to attach
-- this to before that). Same "insert-only, founder reviews via SQL" shape
-- as waitlist_signups: no select policy, no admin UI yet, nobody in the app
-- reads this table back.
create table feedback (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  rating smallint not null,
  message text not null,
  created_at timestamptz not null default now(),
  constraint feedback_rating_range check (rating between 1 and 5)
);

create index feedback_profile_id_created_at_idx on feedback (profile_id, created_at desc);

alter table feedback enable row level security;

-- Insert-only, own profile_id, non-empty message. No select/update/delete
-- policy — mirrors waitlist_signups: reviewed directly via SQL/dashboard,
-- not through the app.
create policy feedback_insert_own on feedback
  for insert
  to authenticated
  with check (
    profile_id = auth.uid()
    and length(trim(message)) > 0
  );
