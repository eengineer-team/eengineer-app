-- Founder ask (Telegram, 2026-08-02): the addressee of a connection request
-- currently has no idea one exists -- RLS already lets them SELECT/UPDATE
-- their incoming rows (conn_select/conn_update, see 20260716120200_rls.sql),
-- the client just never surfaced it. Two triggers close the loop, same
-- fan-out-on-write shape as notify_new_webinar
-- (20260721170000_notifications.sql): SECURITY DEFINER because these
-- legitimately write a notification row for someone other than the caller,
-- which notifications_select/update_own correctly forbids from the client.

create function notify_connection_request() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_name text;
begin
  select display_name into requester_name from profiles where id = new.requester_id;
  insert into notifications (user_id, kind, title, body, link)
  values (
    new.addressee_id,
    'connection_request',
    'New connection request',
    coalesce(requester_name, 'Someone') || ' wants to connect.',
    '/dashboard/connections'
  );
  return new;
end;
$$;

create trigger connections_notify_request
  after insert on connections
  for each row
  when (new.status = 'requested')
  execute function notify_connection_request();

-- Fires when an addressee accepts (status flips to 'connected') -- not on
-- decline, matching how every mainstream network handles this (a decline is
-- silent, not a rejection notice).
create function notify_connection_accepted() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  addressee_name text;
begin
  select display_name into addressee_name from profiles where id = new.addressee_id;
  insert into notifications (user_id, kind, title, body, link)
  values (
    new.requester_id,
    'connection_accepted',
    'Connection accepted',
    coalesce(addressee_name, 'Someone') || ' accepted your connection request.',
    '/dashboard/profiles/' || new.addressee_id
  );
  return new;
end;
$$;

create trigger connections_notify_accepted
  after update on connections
  for each row
  when (new.status = 'connected' and old.status is distinct from 'connected')
  execute function notify_connection_accepted();
