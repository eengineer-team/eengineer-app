-- ============================================================================
-- eengineer -- "Current Projects" activity feed (ProjectsHub.tsx), the last
-- surface still on mock data. Unlike introductions (one row per Builder),
-- this is explicitly append-only -- a Builder can post as many status
-- updates as they want -- so it follows discussion_posts's shape, not
-- introductions's: no unique(profile_id), no UPDATE policy.
--
-- Also registers the new table with moderation (staff delete policy +
-- covered by /dashboard/admin/content in api/admin.ts) rather than shipping
-- another public posting surface nobody but the author can remove -- that
-- was exactly the gap block 21 (20260720120000_moderation.sql) closed for
-- introductions/discussion_posts, and a new content table should not reopen
-- it by omission.
-- ============================================================================

create table activity_updates (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid not null references profiles(id) on delete cascade,
  discipline      app.discipline not null,
  text            text not null default '',
  attachment_kind text check (attachment_kind in ('image', 'video', 'file')),
  attachment_url  text,
  attachment_name text,
  created_at      timestamptz not null default now(),
  check (char_length(btrim(text)) > 0 or attachment_url is not null)
);
create index on activity_updates(created_at desc);

alter table activity_updates enable row level security;

create policy activity_select on activity_updates for select to authenticated using (app.is_builder());
create policy activity_insert on activity_updates for insert to authenticated
  with check (app.is_verified() and author_id = auth.uid());
create policy activity_delete on activity_updates for delete to authenticated
  using (author_id = auth.uid());
create policy activity_staff_delete on activity_updates for delete to authenticated
  using (app.has_role('community-lead', 'admin', 'super-admin'));
