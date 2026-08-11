-- ============================================================================
-- eengineer — narrow app.discipline to Aerospace, Mechanical, Software,
-- Environmental only (founder decision, 2026-08-11).
--
-- Existing rows using a removed discipline (Electrical, Civil, Chemical,
-- Biomedical, Materials, Other):
--   - club_memberships / questions / opportunities / contests: row deleted
--     (founder call — these are discipline-scoped content, not identity).
--   - profiles: NOT deleted (would cascade-delete that Builder's projects,
--     messages, connections, everything — out of scope). discipline is
--     reset to 'Software' instead, matching the fallback already used
--     client-side (src/lib/api/profiles.ts, Discussion.tsx, QAFeed.tsx,
--     Networking.tsx) for an unset/invalid discipline.
--   - introductions / discussion_posts / activity_updates / webinars: no
--     rows currently use a removed discipline (verified live, 2026-08-11) —
--     included for completeness/future-proofing only.
--
-- community_group_stats view depends on app.discipline (enum_range) so it
-- must be dropped and recreated around the type swap.
-- ============================================================================

delete from club_memberships where discipline not in ('Aerospace','Mechanical','Software','Environmental');
delete from questions where discipline not in ('Aerospace','Mechanical','Software','Environmental');
delete from opportunities where discipline is not null and discipline not in ('Aerospace','Mechanical','Software','Environmental');
delete from introductions where discipline not in ('Aerospace','Mechanical','Software','Environmental');
delete from discussion_posts where discipline not in ('Aerospace','Mechanical','Software','Environmental');
delete from activity_updates where discipline not in ('Aerospace','Mechanical','Software','Environmental');
delete from webinars where discipline not in ('Aerospace','Mechanical','Software','Environmental');
delete from contests where discipline is not null and discipline not in ('Aerospace','Mechanical','Software','Environmental');

update profiles set discipline = 'Software'
where discipline not in ('Aerospace','Mechanical','Software','Environmental');

drop view community_group_stats;

alter table profiles alter column discipline drop default;

create type app.discipline_new as enum ('Aerospace','Mechanical','Software','Environmental');

alter table profiles alter column discipline type app.discipline_new using discipline::text::app.discipline_new;
alter table club_memberships alter column discipline type app.discipline_new using discipline::text::app.discipline_new;
alter table questions alter column discipline type app.discipline_new using discipline::text::app.discipline_new;
alter table webinars alter column discipline type app.discipline_new using discipline::text::app.discipline_new;
alter table introductions alter column discipline type app.discipline_new using discipline::text::app.discipline_new;
alter table discussion_posts alter column discipline type app.discipline_new using discipline::text::app.discipline_new;
alter table activity_updates alter column discipline type app.discipline_new using discipline::text::app.discipline_new;
alter table opportunities alter column discipline type app.discipline_new using discipline::text::app.discipline_new;
alter table contests alter column discipline type app.discipline_new using discipline::text::app.discipline_new;

drop type app.discipline;
alter type app.discipline_new rename to discipline;

alter table profiles alter column discipline set default 'Software';

create view community_group_stats
with (security_invoker = true)
as
select
  d.discipline,
  coalesce(m.member_count, 0)::int as member_count,
  coalesce(a.recent_activity_count, 0)::int as recent_activity_count
from (select unnest(enum_range(null::app.discipline)) as discipline) d
left join (
  select discipline, count(*) as member_count
  from club_memberships
  group by discipline
) m on m.discipline = d.discipline
left join (
  select discipline, count(*) as recent_activity_count
  from (
    select discipline, created_at from questions
    union all
    select discipline, created_at from discussion_posts
    union all
    select discipline, created_at from introductions
    union all
    select discipline, created_at from activity_updates
  ) recent
  where created_at >= now() - interval '7 days'
  group by discipline
) a on a.discipline = d.discipline;

grant select on community_group_stats to authenticated;
