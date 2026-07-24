-- One-line teaser/hook shown on the DashboardHome "Next webinar" card,
-- restyled as a news blurb instead of a bare title+date+Register block
-- (founder feedback: create some intrigue). Nullable -- older rows and any
-- webinar inserted without one just fall back to a generic line client-side.
alter table webinars add column description text;
