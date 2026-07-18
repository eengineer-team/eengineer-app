-- ============================================================================
-- eengineer — block 18: age-gate, consent, and profile columns that drifted
-- onto the frontend. Applied live to bgdlpdokubhutwicsfyp.
-- Sensitive minor data (DOB, guardian consent) is kept OUT of the public
-- `profiles` row and put in `profile_private` (self-only RLS) so it is never
-- exposed to other builders. Hard COPPA floor (>=13) enforced by trigger.
-- ============================================================================

alter table profiles
  add column allow_dms boolean not null default true,
  add column background_image_url text;

alter table endorsements add column evidence_url text;

create table profile_private (
  id uuid primary key references profiles(id) on delete cascade,
  birthdate date,
  guardian_consent_email text,
  guardian_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table profile_private enable row level security;
create policy pp_select on profile_private for select to authenticated
  using (id = auth.uid() or app.has_role('admin','super-admin'));
create policy pp_write on profile_private for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create or replace function app.enforce_min_age() returns trigger
  language plpgsql security definer set search_path = '' as $$
begin
  if new.birthdate is not null and new.birthdate > (current_date - interval '13 years') then
    raise exception 'under-13 accounts are not permitted';
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger profile_private_age before insert or update on profile_private
  for each row execute function app.enforce_min_age();

create table consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  doc_type text not null check (doc_type in ('terms','privacy')),
  version text not null,
  guardian_email text,
  consented_at timestamptz not null default now()
);
create index on consent_records(user_id);
alter table consent_records enable row level security;
create policy consent_select on consent_records for select to authenticated
  using (user_id = auth.uid() or app.has_role('admin','super-admin'));
create policy consent_insert on consent_records for insert to authenticated
  with check (app.is_builder() and user_id = auth.uid());
-- no update/delete policy ⇒ consent log is immutable

create or replace function app.is_minor(u uuid) returns boolean
  language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select birthdate from public.profile_private where id = u) > (current_date - interval '18 years'),
    false) $$;

create or replace function app.allows_dms(u uuid) returns boolean
  language sql stable security definer set search_path = '' as $$
  select coalesce((select allow_dms from public.profiles where id = u), true) $$;

create or replace function app.can_message(a uuid, b uuid) returns boolean
  language sql stable security definer set search_path = '' as $$
  select a <> b
     and app.profile_verified(a) and app.profile_verified(b)
     and app.are_connected(a, b)
     and not app.is_blocked(a, b)
     and app.allows_dms(a) and app.allows_dms(b) $$;
