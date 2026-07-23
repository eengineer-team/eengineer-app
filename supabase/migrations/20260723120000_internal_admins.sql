-- Separate, hidden internal admin panel (/internal), gated by its own
-- email+password login -- decoupled from the GitHub/LinkedIn "builder"
-- auth flow and from the moderation super-admin role. Email/password
-- signups never get a profiles row (see app.handle_new_user -- only
-- github/linkedin providers do), so this can't leak into the rest of the
-- product; access is purely an allowlist of specific auth.users ids.
create table internal_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- No select/insert/update policy at all -- nobody queries this table
-- directly from the client. It's only ever read from inside
-- app.is_internal_admin() below (SECURITY DEFINER, bypasses RLS on this
-- table specifically), and populated by us via SQL after someone signs up.
alter table internal_admins enable row level security;

create or replace function app.is_internal_admin() returns boolean
  language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.internal_admins where user_id = auth.uid())
$$;

-- Safe public wrapper: any authenticated user can ask "am I an internal
-- admin", which only reveals a boolean about themselves, not the
-- allowlist contents.
create or replace function public.am_i_internal_admin() returns boolean
  language sql stable security invoker set search_path = '' as $$
  select app.is_internal_admin()
$$;
grant execute on function public.am_i_internal_admin() to authenticated;
revoke execute on function public.am_i_internal_admin() from anon;

-- Read access for the three "founder reviews via SQL" tables that
-- prompted this panel.
create policy internal_admin_select on waitlist_signups
  for select to authenticated using (app.is_internal_admin());

create policy internal_admin_select on feedback
  for select to authenticated using (app.is_internal_admin());

create policy internal_admin_select on competition_registrations
  for select to authenticated using (app.is_internal_admin());

-- Competitions already has public/builder select policies; this adds
-- update so internal admins can fill in organizer_email (the field the
-- notify-competition-registration edge function needs and currently has
-- no UI for at all).
create policy internal_admin_update on competitions
  for update to authenticated using (app.is_internal_admin()) with check (app.is_internal_admin());
