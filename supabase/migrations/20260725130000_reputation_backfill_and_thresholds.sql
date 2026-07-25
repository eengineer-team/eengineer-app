-- Two corrections found while verifying the reputation feature live.

-- 1. The initial backfill covered questions/answers/endorsements/intros/
--    projects/contest entries but missed question approvals -- that event is
--    keyed by (question_id, voter) rather than a surrogate row id, so it
--    didn't fit the same "one row per source id" pattern as the others.
--    Five real approvals existed and had awarded nobody anything.
insert into reputation_events (profile_id, kind, points, source_table, source_id, source_actor)
select q.author_id,
       'question_approved',
       app.reputation_points('question_approved'),
       'question_votes',
       v.question_id,
       v.user_id
from question_votes v
join questions q on q.id = v.question_id
where v.vote = 'approve'
  and q.author_id <> v.user_id
  and not exists (
    select 1 from reputation_events r
    where r.source_table = 'question_votes'
      and r.source_id = v.question_id
      and r.source_actor = v.user_id
  );

-- 2. Tier thresholds were picked before looking at real activity. The most
--    active member had 18 points, so 25/100/300 put every single profile on
--    the floor tier -- a badge that says the same thing about everyone is
--    worse than no badge. Rescaled against the actual distribution.
create or replace view profile_reputation
with (security_invoker = true) as
select
  p.id as profile_id,
  coalesce(sum(e.points), 0)::integer as points,
  case
    when coalesce(sum(e.points), 0) >= 120 then 'Core'
    when coalesce(sum(e.points), 0) >= 40  then 'Mentor'
    when coalesce(sum(e.points), 0) >= 12  then 'Contributor'
    else 'Builder'
  end as tier
from profiles p
left join reputation_events e on e.profile_id = p.id
group by p.id;
