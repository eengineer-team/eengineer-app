-- Public waitlist, shown as an interstitial before the marketing landing at
-- "/". Anyone (signed out, no session at all) can submit — this table is
-- read by nobody through the app; the founder reviews it directly via SQL /
-- the Supabase dashboard, same as the existing content_snapshot pattern in
-- moderation_actions being an append-only record nobody edits through UI.
create table waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  organization text not null,
  created_at timestamptz not null default now()
);

-- One signup per email — resubmitting the same address (e.g. double-click,
-- retry after a flaky network) shouldn't create duplicate rows for the
-- founder to dedupe by hand later.
create unique index waitlist_signups_email_key on waitlist_signups (lower(email));

alter table waitlist_signups enable row level security;

-- Insert-only, open to anyone (anon has no session at this point in the
-- flow — this is the very first screen, before auth). No select/update/
-- delete policy at all: the only way to read this table is the SQL editor
-- or a service-role key, which is deliberate for a v1 waitlist with no
-- admin UI yet.
create policy waitlist_insert on waitlist_signups
  for insert
  to anon, authenticated
  with check (
    length(trim(name)) > 0
    and length(trim(organization)) > 0
    and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );
