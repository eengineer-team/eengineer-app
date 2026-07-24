-- "Live events" (Future of Eengineer.net doc, item 5, scoped down per
-- founder clarification: not an in-browser video host -- a timer +
-- notification + external Zoom/Meet link). Webinars are still inserted by
-- hand via SQL (no create-webinar UI exists), same as before; this just
-- gives each row somewhere to carry the join link and how long it runs,
-- plus a live-start notification fan-out to whoever RSVP'd.
alter table webinars
  add column meeting_url text,
  add column duration_minutes integer not null default 60,
  add column notified_live boolean not null default false;

-- Fans out a "webinar_live" notification to everyone who RSVP'd (same
-- notifications table/shape as notify_new_webinar in
-- 20260721170000_notifications.sql), the moment a webinar's start time has
-- passed. notified_live is a one-shot guard so the cron tick below doesn't
-- re-notify every run.
create or replace function notify_webinar_live() returns void
  language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (user_id, kind, title, body, link)
  select r.user_id, 'webinar_live', w.title || ' is live now',
    coalesce(w.speaker || ' — ', '') || 'join now',
    '/dashboard/community/webinars'
  from webinars w
  join webinar_rsvps r on r.webinar_id = w.id
  where w.starts_at <= now()
    and w.starts_at > now() - interval '10 minutes'
    and not w.notified_live;

  update webinars
  set notified_live = true
  where starts_at <= now()
    and starts_at > now() - interval '10 minutes'
    and not notified_live;
end;
$$;

create extension if not exists pg_cron;

select cron.schedule(
  'webinar-live-notify',
  '* * * * *',
  $$select notify_webinar_live()$$
);
