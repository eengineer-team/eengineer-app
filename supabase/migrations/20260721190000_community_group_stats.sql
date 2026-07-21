-- DisciplineGroupCard (Community hub) and JoinedClubs (sidebar/Home widget)
-- both showed hardcoded per-discipline numbers from community-groups.ts
-- (e.g. "412 members", "6 new this week") -- literal fake seed data, not
-- computed from anything real. This view replaces both with real counts:
--   member_count: rows in club_memberships for that discipline.
--   recent_activity_count: posts across the discipline's actual posting
--     surfaces (questions, discussion_posts, introductions, activity_updates)
--     created in the last 7 days -- the same four content types the
--     Community group's own tabs (Q&A, Discussion, Networking, Current
--     Projects) show, so "new this week" means what the group's own pages
--     would show as new.
--
-- security_invoker = true so this view is subject to the underlying tables'
-- RLS for whoever queries it, rather than running as the view owner and
-- silently becoming a privilege-escalation path -- same "RLS is the only
-- authorization boundary" rule as every other read in this app. In practice
-- all four source tables already allow any builder/preview to select, so
-- this mostly matters as a matter of principle rather than changing any
-- visible behavior today.
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
