-- Round 2 on the internal task board: due dates, categories, screenshots,
-- comments, a tiny team roster. Kept deliberately lean on storage --
-- - due_date/category are plain nullable/text columns, not new enum types
--   (Postgres enums cost catalog rows and ALTER TYPE pain for one column).
-- - screenshot_url stores an object-storage path (few dozen bytes), never
--   the image bytes themselves -- see the internal-task-screenshots bucket
--   below.
-- - No changelog table: "what shipped" is just internal_tasks where
--   status = 'done', ordered by updated_at. Duplicating that into a second
--   table would be pure waste.
-- - internal_team_members uses name as the primary key (no surrogate uuid)
--   -- it's a short human-maintained roster, not a growing fact table.
-- - internal_task_comments has no soft-delete flag, no edited_at -- plain
--   append-only text, mirrors the feedback table's shape.

alter table internal_tasks
  add column due_date date,
  add column category text,
  add column screenshot_url text;

alter table internal_tasks
  add constraint internal_tasks_category check (category is null or category in ('bug', 'content', 'design', 'feature', 'other'));

create table internal_task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references internal_tasks(id) on delete cascade,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint internal_task_comments_body_len check (length(trim(body)) > 0)
);

-- Covers "give me this task's comments in order" -- the only query shape
-- this table ever serves.
create index internal_task_comments_task_id_created_at_idx on internal_task_comments (task_id, created_at);

alter table internal_task_comments enable row level security;

create policy internal_admin_select on internal_task_comments
  for select to authenticated using (app.is_internal_admin());

create policy internal_admin_insert on internal_task_comments
  for insert to authenticated with check (app.is_internal_admin());

-- Small human-maintained roster: name -> role, purely so the "your name"
-- field can be a dropdown instead of free text every time. Anyone on the
-- internal allowlist can add/edit entries -- this is a handful of rows for
-- a handful of people, not worth its own permission tier.
create table internal_team_members (
  name text primary key,
  role text not null,
  created_at timestamptz not null default now()
);

alter table internal_team_members enable row level security;

create policy internal_admin_select on internal_team_members
  for select to authenticated using (app.is_internal_admin());

create policy internal_admin_insert on internal_team_members
  for insert to authenticated with check (app.is_internal_admin());

create policy internal_admin_update on internal_team_members
  for update to authenticated using (app.is_internal_admin()) with check (app.is_internal_admin());

create policy internal_admin_delete on internal_team_members
  for delete to authenticated using (app.is_internal_admin());

-- Screenshots: public bucket (same convention as avatars/project-covers in
-- 20260716120500_storage_buckets.sql) so screenshot_url can be a plain
-- getPublicUrl() string with no signed-URL juggling in the UI. Write access
-- is admin-gated, not owner-folder-gated like avatars -- these aren't
-- per-user resources.
insert into storage.buckets (id, name, public)
values ('internal-task-screenshots', 'internal-task-screenshots', true)
on conflict (id) do nothing;

create policy "internal task screenshots public read" on storage.objects
  for select to public
  using (bucket_id = 'internal-task-screenshots');

create policy "internal task screenshots admin insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'internal-task-screenshots' and app.is_internal_admin());

create policy "internal task screenshots admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'internal-task-screenshots' and app.is_internal_admin());
