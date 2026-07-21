-- Real competition registration, replacing the fully local (useState,
-- resets on refresh) "Register / Apply" toggle in CompetitionDetail.tsx --
-- that button saved nothing anywhere, it just flipped a component-local
-- boolean.
--
-- organizer_email is nullable and admin-filled (competitions has no write
-- UI yet, same as before) -- registration itself doesn't depend on it being
-- set; the notify-organizer step (a separate Edge Function, invoked
-- client-side after a successful insert) simply no-ops when it's null
-- rather than failing the registration.
alter table competitions add column organizer_email text;

create table competition_registrations (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  email text not null,
  team_school text not null,
  created_at timestamptz not null default now(),
  unique (competition_id, profile_id)
);

create index competition_registrations_profile_id_idx on competition_registrations (profile_id);

alter table competition_registrations enable row level security;

-- Builders can see, create, and remove their own registration. No policy
-- lets you see or touch anyone else's -- there's no "who else is
-- registered" list anywhere in the product, unlike webinar_rsvps'
-- public attending-count.
create policy comp_reg_select_own on competition_registrations
  for select
  to authenticated
  using (app.is_builder() and profile_id = auth.uid());

create policy comp_reg_insert_own on competition_registrations
  for insert
  to authenticated
  with check (
    app.is_builder()
    and profile_id = auth.uid()
    and length(trim(name)) > 0
    and length(trim(team_school)) > 0
    and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );

create policy comp_reg_delete_own on competition_registrations
  for delete
  to authenticated
  using (profile_id = auth.uid());
