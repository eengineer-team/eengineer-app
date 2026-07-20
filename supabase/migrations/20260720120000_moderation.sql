-- ============================================================================
-- eengineer — moderation (admin area foundation). Today nobody, not even
-- super-admin, can remove another person's content or close a report: the
-- reports table has no status column and only INSERT/SELECT policies, and
-- introductions/discussion_posts DELETE is `profile_id = auth.uid()` only.
-- This closes both holes and adds an append-only audit log, so the
-- /dashboard/admin UI has real RLS-backed actions to call, not just reads.
-- ============================================================================

-- ── reports: close the loop (status + resolver + UPDATE policy) ─────────────
alter table reports
  add column status text not null default 'open'
    check (status in ('open', 'actioned', 'dismissed')),
  add column resolved_by uuid references profiles(id) on delete set null,
  add column resolved_at timestamptz;

create index on reports(status, created_at);

-- Reports are the record of what was reported — they get resolved, not
-- erased, so intentionally no DELETE policy here.
create policy reports_update on reports for update to authenticated
  using (app.has_role('community-lead', 'admin', 'super-admin'))
  with check (app.has_role('community-lead', 'admin', 'super-admin'));

-- ── staff removal of community content questions/question_comments already
-- allow author-or-staff delete; introductions/discussion_posts only allowed
-- the author. These are additive policies (OR'd with the existing
-- author-only ones), so self-service delete-your-own-intro keeps working.
create policy intro_staff_delete on introductions for delete to authenticated
  using (app.has_role('community-lead', 'admin', 'super-admin'));
create policy disc_staff_delete on discussion_posts for delete to authenticated
  using (app.has_role('community-lead', 'admin', 'super-admin'));

-- ── moderation_actions: append-only audit log ────────────────────────────────
-- Content deletion is hard (rows are gone, not soft-deleted), so once removed
-- a report's target_id no longer resolves to anything. The snapshot is what
-- makes the log useful in a dispute after that point.
create table moderation_actions (
  id                uuid primary key default gen_random_uuid(),
  moderator_id      uuid not null references profiles(id),
  action            text not null check (action in
    ('content_removed', 'report_dismissed', 'role_assigned', 'role_revoked')),
  target_type       text not null,          -- 'question' | 'question_comment' | 'introduction' | 'discussion_post' | 'profile'
  target_id         uuid,                   -- may dangle after hard delete, that's expected
  target_author_id  uuid references profiles(id) on delete set null,
  content_snapshot  text,                   -- the removed text, captured BEFORE deletion
  reason            text not null,
  created_at        timestamptz not null default now()
);
create index on moderation_actions(created_at desc);

alter table moderation_actions enable row level security;

create policy moderation_actions_select on moderation_actions for select to authenticated
  using (app.has_role('community-lead', 'admin', 'super-admin'));
create policy moderation_actions_insert on moderation_actions for insert to authenticated
  with check (app.has_role('community-lead', 'admin', 'super-admin') and moderator_id = auth.uid());
-- No update/delete policy — append-only by design.
