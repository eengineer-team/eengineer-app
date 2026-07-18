-- ============================================================================
-- eengineer — community domain 3 follow-up (block 19, DOMAIN 3).
-- AUTHORIZATION.md flagged "Networking / Discussion" row shapes as an open
-- decision (block 16) — this fills them in: one introduction per profile
-- (Networking tab) and a chronological per-discipline post feed (Discussion
-- tab). Same builder-post / builder-read pattern as the rest of Community;
-- neither is preview-readable (community:networking:view / :discussion:view
-- are BUILDER_ACTIONS only in permissions.ts, not PREVIEW_ACTIONS).
-- Also flips on Realtime for the Q&A feed + vote counts.
-- ============================================================================

create table introductions (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references profiles(id) on delete cascade,
  discipline      app.discipline not null,
  text            text not null default '',
  attachment_kind text check (attachment_kind in ('image', 'video', 'file')),
  attachment_url  text,
  attachment_name text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (profile_id),                            -- one introduction per Builder
  check (char_length(btrim(text)) > 0 or attachment_url is not null)
);

create table discussion_posts (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references profiles(id) on delete cascade,
  discipline      app.discipline not null,
  text            text not null default '',
  attachment_kind text check (attachment_kind in ('image', 'video', 'file')),
  attachment_url  text,
  attachment_name text,
  created_at      timestamptz not null default now(),
  check (char_length(btrim(text)) > 0 or attachment_url is not null)
);
create index on discussion_posts(discipline, created_at);

alter table introductions    enable row level security;
alter table discussion_posts enable row level security;

-- ── networking (one editable intro per Builder) ───────────────────────────────
create policy intro_select on introductions for select to authenticated using (app.is_builder());
create policy intro_insert on introductions for insert to authenticated
  with check (app.is_verified() and profile_id = auth.uid());
create policy intro_update on introductions for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
create policy intro_delete on introductions for delete to authenticated
  using (profile_id = auth.uid());

-- ── discussion (chronological feed, no edit UI — post/read only) ─────────────
create policy disc_select on discussion_posts for select to authenticated using (app.is_builder());
create policy disc_insert on discussion_posts for insert to authenticated
  with check (app.is_verified() and profile_id = auth.uid());
create policy disc_delete on discussion_posts for delete to authenticated
  using (profile_id = auth.uid());

-- ── Realtime: Q&A feed + vote counts ──────────────────────────────────────────
alter publication supabase_realtime add table questions;
alter publication supabase_realtime add table question_votes;
alter publication supabase_realtime add table question_comments;
