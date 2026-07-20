-- ============================================================================
-- eengineer — public read access to competitions for anonymous visitors.
-- comp_select only grants the `authenticated` role (using app.is_builder()),
-- so LandingCalendar on the public, pre-auth Welcome page would render empty
-- for every logged-out visitor once it moves off static seed data. Contest
-- deadlines are public information — nothing here is sensitive — so this
-- widens read access rather than leaving the homepage calendar empty.
-- Additive policy (OR'd with comp_select); comp_write (admin/super-admin
-- only) is untouched.
-- ============================================================================

create policy comp_select_public on competitions for select to anon, authenticated
  using (true);
