-- Internal task tracker: team members log site fixes/change requests here,
-- whoever's handling dev work (the "техник") reviews the board and works
-- through it. Lives in the same hidden /unique_key/admin_panel (formerly
-- /internal) panel as waitlist/feedback/etc, gated by the same
-- app.is_internal_admin() allowlist (see 20260723120000_internal_admins.sql).
--
-- No FK to profiles/auth.users for author/claimant -- email+password
-- internal-panel accounts never get a profiles row (see app.handle_new_user),
-- and this panel has no concept of "internal team member profile" yet. So
-- author_name/claimed_by are plain free-text, filled in by whoever's typing.
-- Good enough for a small team; revisit with a real internal_members table
-- if the allowlist grows past a handful of people.
create table internal_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  page_url text,
  priority text not null default 'medium',
  status text not null default 'open',
  author_name text not null,
  claimed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint internal_tasks_title_len check (length(trim(title)) > 0),
  constraint internal_tasks_priority check (priority in ('low', 'medium', 'high')),
  constraint internal_tasks_status check (status in ('open', 'in_progress', 'done'))
);

create index internal_tasks_status_created_at_idx on internal_tasks (status, created_at desc);

alter table internal_tasks enable row level security;

-- Same allowlist as the rest of the panel, but full CRUD (not read-only like
-- waitlist/feedback/competition_registrations) -- this table only exists to
-- be written to and updated by the internal team, there's no other source
-- of truth for it.
create policy internal_admin_select on internal_tasks
  for select to authenticated using (app.is_internal_admin());

create policy internal_admin_insert on internal_tasks
  for insert to authenticated with check (app.is_internal_admin());

create policy internal_admin_update on internal_tasks
  for update to authenticated using (app.is_internal_admin()) with check (app.is_internal_admin());

create policy internal_admin_delete on internal_tasks
  for delete to authenticated using (app.is_internal_admin());

-- Keep updated_at honest on every edit (status change, claim, etc.) without
-- relying on the client to set it.
create or replace function app.internal_tasks_set_updated_at() returns trigger
  language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger internal_tasks_set_updated_at
  before update on internal_tasks
  for each row execute function app.internal_tasks_set_updated_at();
