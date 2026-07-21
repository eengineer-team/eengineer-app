-- Minimal in-app notifications, scoped to the one thing actually requested:
-- when a new webinar is added, every Builder in that discipline gets
-- notified. Not a general-purpose notification framework -- deliberately
-- small (one `kind`) rather than speculatively building out types nobody
-- asked for yet.
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null default 'webinar_new',
  title text not null,
  body text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_created_at_idx on notifications (user_id, created_at desc);

alter table notifications enable row level security;

-- Read-only from the client's perspective except for marking your own
-- notifications read -- nobody creates their own notifications, and nobody
-- reads anyone else's.
create policy notifications_select on notifications
  for select
  to authenticated
  using (user_id = auth.uid());

create policy notifications_update_own on notifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Fan-out on webinar creation: notify every Builder profile in that
-- discipline. SECURITY DEFINER because this legitimately writes rows for
-- other users -- something notifications_select/update_own correctly
-- forbids from the client, and that's exactly why this has to be a
-- server-side trigger rather than app code (there's no "create webinar" UI
-- to hook into anyway; webinars are added directly).
create function notify_new_webinar() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into notifications (user_id, kind, title, body, link)
  select
    p.id,
    'webinar_new',
    'New ' || new.discipline || ' webinar',
    new.title || ' — ' || to_char(new.starts_at, 'Dy, Mon FMDD, HH12:MI AM'),
    '/dashboard/community/' || new.discipline
  from profiles p
  where p.discipline = new.discipline;
  return new;
end;
$$;

create trigger webinars_notify_new
  after insert on webinars
  for each row
  execute function notify_new_webinar();
