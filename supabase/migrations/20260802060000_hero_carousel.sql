-- Hero carousel (founder request, Telegram 2026-08-01): a rotating panel
-- next to the hero headline showing upcoming webinars, site features, real
-- student projects, and competition deadlines -- everything worth a
-- first-time visitor's attention, before they've made an account.
--
-- Three things needed for that to work with live data instead of static
-- copy:
--   1. Webinars need a face -- speaker_photo_url/speaker_bio didn't exist
--      (only a bare `speaker` name string).
--   2. webinars/projects were both `authenticated`-only SELECT
--      (web_select/projects_select, both app.is_builder()) -- neither has
--      ever been readable pre-auth. competitions already got this treatment
--      in 20260720130000_competitions_anon_read.sql; same reasoning here.
--   3. Nothing lets anyone create/edit a webinar at all -- every row so far
--      was meant to be inserted by hand over SQL. That doesn't scale once
--      the panel actually needs a speaker photo uploaded, so internal
--      admins get real write access + a storage bucket.

alter table webinars
  add column speaker_photo_url text,
  add column speaker_bio text;

-- Public info, nothing sensitive in either table -- same shape as
-- comp_select_public. Additive (OR'd with web_select / projects_select),
-- existing authenticated-only policies are untouched.
create policy web_select_public on webinars for select to anon, authenticated using (true);
create policy projects_select_public on projects for select to anon, authenticated using (true);

-- Internal admins aren't Builders (no profiles row, see
-- 20260723120000_internal_admins.sql) so web_write's app.is_builder() check
-- never lets them through -- this is a separate, admin-only write path.
create policy internal_admin_write on webinars
  for all to authenticated
  using (app.is_internal_admin())
  with check (app.is_internal_admin());

-- Speaker photos: public bucket (same convention as avatars/project-covers
-- and internal-task-screenshots), admin-only write.
insert into storage.buckets (id, name, public)
values ('webinar-speakers', 'webinar-speakers', true)
on conflict (id) do nothing;

create policy "webinar speakers public read" on storage.objects
  for select to public
  using (bucket_id = 'webinar-speakers');

create policy "webinar speakers admin insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'webinar-speakers' and app.is_internal_admin());

create policy "webinar speakers admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'webinar-speakers' and app.is_internal_admin());
