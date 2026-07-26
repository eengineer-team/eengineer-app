-- Video Contest (eengineer x Pizik Lab) -- founder-clarified 2026-07-26.
--
-- The 3 seeded contest rows (ages 14-16/17-19/20+) came from an earlier
-- pitch deck and contradict the doc's actual brackets (Junior 12-15, Senior
-- 16-18) and its stated purpose (a contest for children, not adults).
-- Verified 0 submissions/0 votes on all 3 -- safe to remove outright rather
-- than edit around. No replacement rows go in yet: there's no confirmed
-- submission deadline (depends on funding), and a live countdown built on
-- an invented date is worse than no countdown -- a participant's 2-minute
-- video against a date that later moves is a child's wasted work, not just
-- a branding problem. Real contest rows get inserted later once the
-- founder has a date; /dashboard/contests and contests.ts need no changes
-- for that, they already work off whatever rows exist.
delete from contests;

-- Registration is deliberately decoupled from `contests` entirely (and from
-- eengineer accounts) so it isn't blocked on either. The platform's account
-- floor (13, see MINIMUM_AGE in src/pages/Onboarding.tsx) and the contest's
-- floor (12) are independent limits that neither bend to fit the other --
-- a 12-year-old must be able to register without ever creating an account.
create table contest_registrations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text not null,
  -- Junior 12-15 / Senior 16-18, per the doc. Two brackets, not three.
  age_group text not null check (age_group in ('junior', 'senior')),
  -- The participant's own handle, both brackets. Required: this is the
  -- guaranteed contact channel -- announcements already go out over
  -- Telegram/Instagram for this audience, and a 12-year-old having a
  -- checked email is not a safe assumption.
  contact_telegram text not null,
  -- Junior only, required. A Junior's video gets shown to strangers during
  -- peer voting; an adult should know that before the entry is submitted,
  -- not after the child wins something -- so this is collected at
  -- registration, not held back until shortlist time. Guardian TELEGRAM
  -- HANDLE ONLY: no guardian name, phone, ID, or relationship field --
  -- minors' data, collect the minimum the contest actually needs.
  guardian_telegram text,
  -- Optional secondary contact, either bracket.
  contact_email text,
  -- Forwarded client IP at insert time, for the rate-limit trigger below.
  -- Internal-admin-readable only, same as every other column here -- never
  -- exposed to anon. Populated by the trigger itself, not client input.
  client_ip text,
  created_at timestamptz not null default now(),
  constraint contest_registrations_name_not_blank check (length(trim(name)) > 0),
  constraint contest_registrations_region_not_blank check (length(trim(region)) > 0),
  -- Format-only validation (5-32 chars, a-z0-9_ -- Telegram's own handle
  -- rules). This cannot confirm the handle exists or is reachable; every
  -- handle is unconfirmed until the person actually replies.
  constraint contest_registrations_telegram_format
    check (contact_telegram ~ '^[a-z0-9_]{5,32}$'),
  constraint contest_registrations_guardian_required_for_junior
    check (
      age_group <> 'junior'
      or (guardian_telegram is not null and guardian_telegram ~ '^[a-z0-9_]{5,32}$')
    ),
  constraint contest_registrations_email_format
    check (contact_email is null or contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

-- Blocks exact duplicate-handle spam (the same handle re-registering the
-- same bracket over and over) without blocking a guardian who legitimately
-- registers more than one child in different brackets.
create unique index contest_registrations_telegram_bracket_key
  on contest_registrations (lower(contact_telegram), age_group);

alter table contest_registrations enable row level security;

-- Anonymous insert only. Registrations contain minors' names and contact
-- details -- anon (and authenticated, for consistency) can create a row but
-- can never read one back. Format/enum checks live in the table
-- constraints above so they hold regardless of how the row arrives; this
-- policy only re-asserts the two free-text fields that constraints alone
-- can't fully cover (trimmed non-empty).
create policy contest_registrations_insert_anon on contest_registrations
  for insert to anon, authenticated
  with check (length(trim(name)) > 0 and length(trim(region)) > 0);

-- Internal panel only -- same pattern as the existing internal_admin_select
-- policies in 20260723120000_internal_admins.sql. No anon select policy at
-- all (default deny), no update/delete policy (immutable, matches
-- contest_submissions).
create policy contest_registrations_internal_select on contest_registrations
  for select to authenticated using (app.is_internal_admin());

-- Complaint/inquiry channel for families and individuals (doc requirement).
-- Unlike `feedback` (profile_id = auth.uid(), signed-in only -- see
-- FeedbackMenu.tsx's mailto fallback for signed-out users), this doesn't
-- need an account at all, so an anon-insertable table is the safe, honest
-- answer rather than a fake mailto for a form that looks like it saved.
create table contest_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text,
  -- Free text: whichever contact channel they actually have (email or
  -- Telegram), not forced into one shape.
  contact text not null,
  message text not null,
  client_ip text,
  created_at timestamptz not null default now(),
  constraint contest_inquiries_contact_not_blank check (length(trim(contact)) > 0),
  constraint contest_inquiries_message_not_blank check (length(trim(message)) > 0)
);

alter table contest_inquiries enable row level security;

create policy contest_inquiries_insert_anon on contest_inquiries
  for insert to anon, authenticated
  with check (length(trim(contact)) > 0 and length(trim(message)) > 0);

create policy contest_inquiries_internal_select on contest_inquiries
  for select to authenticated using (app.is_internal_admin());

-- Anti-spam: a deterrent, not a guarantee (the forwarded-IP header is
-- spoofable), but it stops naive scripted flooding without needing infra
-- outside Postgres. Caps each forwarded IP at 5 inserts per hour per table.
-- Discussed here rather than silently skipped, per the doc's ask.
--
-- Stamps NEW.client_ip from the request header, then counts PRIOR rows in
-- the same table with that same stored IP -- comparing against the header
-- setting directly (rather than a stored column) would just re-read
-- *this* request's header for every historical row and count everything,
-- not per-IP, which is why the IP is captured as a real column above.
create or replace function app.check_contest_insert_rate() returns trigger
  language plpgsql security definer set search_path = public as $$
declare
  hdr_ip text;
  recent_count integer;
begin
  hdr_ip := current_setting('request.headers', true)::json ->> 'x-forwarded-for';
  new.client_ip := hdr_ip;

  if hdr_ip is null or hdr_ip = '' then
    return new;
  end if;

  execute format(
    'select count(*) from %I where created_at > now() - interval ''1 hour'' and client_ip = $1',
    tg_table_name
  ) into recent_count using hdr_ip;

  if recent_count >= 5 then
    raise exception 'Too many submissions from this connection recently. Please try again later.';
  end if;

  return new;
end;
$$;

create trigger contest_registrations_rate_limit
  before insert on contest_registrations
  for each row execute function app.check_contest_insert_rate();

create trigger contest_inquiries_rate_limit
  before insert on contest_inquiries
  for each row execute function app.check_contest_insert_rate();
