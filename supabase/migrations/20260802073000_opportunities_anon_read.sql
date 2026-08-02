-- Public read access to opportunities for anonymous visitors -- same
-- reasoning as 20260720130000_competitions_anon_read.sql and
-- 20260802060000_hero_carousel.sql's webinars/projects policies. Founder
-- feedback on the hero carousel (Telegram, 2026-08-02): drop the static
-- "why eengineer" pitch slides ("dont make it like promotion") in favor of
-- real content -- upcoming webinars and opportunities specifically. opp_select
-- is authenticated-only (app.is_builder() OR app.is_preview()), so this
-- widens read access rather than the carousel silently having nothing to
-- show pre-auth. Nothing in an opportunity listing is sensitive.
create policy opp_select_public on opportunities for select to anon, authenticated using (true);
