-- Video Contest (eengineer x Pizik Lab) is being pulled entirely -- the
-- public /contest page, its internal-panel tab, and the two tables that
-- only ever served it. Does NOT touch `contests` / `contest_submissions` /
-- `contest_votes` -- that's the unrelated, still-live dashboard feature
-- (deadline-based contests with blind peer voting + Elo, see
-- 20260724150000_contests.sql). Drop cascades take the tables' policies,
-- indexes and triggers with them; only the shared rate-limit function needs
-- an explicit drop since it isn't owned by either table.
drop table if exists contest_registrations cascade;
drop table if exists contest_inquiries cascade;
drop function if exists app.check_contest_insert_rate();
