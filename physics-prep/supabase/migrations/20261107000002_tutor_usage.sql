-- Daily usage counters for the AI tutor (supabase/functions/tutor).
-- Only the Edge Function, via the service role, touches these: RLS is on with no client policies,
-- and the functions below are executable by service_role only.
-- Days are UTC calendar days.

create table if not exists public.tutor_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  count integer not null default 0 check (count >= 0),
  primary key (user_id, day)
);

create table if not exists public.tutor_global_usage (
  day date primary key,
  count integer not null default 0 check (count >= 0)
);

comment on table public.tutor_usage is 'AI tutor questions per user per UTC day.';
comment on table public.tutor_global_usage is 'AI tutor questions across all users per UTC day (API budget guard).';

alter table public.tutor_usage enable row level security;
alter table public.tutor_global_usage enable row level security;

revoke all on table public.tutor_usage from anon, authenticated;
revoke all on table public.tutor_global_usage from anon, authenticated;

-- Counts one tutor question for p_user today.
-- Returns the questions left today (the smaller of the user's and the global allowance),
-- or -1 when either limit is already reached. A rejected request is not counted.
--
-- Atomic: each upsert locks its row until the transaction commits, and the conditional
-- "do update ... where" only increments while under the limit, so concurrent calls can't
-- push a counter past its limit.
create or replace function public.tutor_consume(p_user uuid, p_user_limit integer, p_global_limit integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_day date := (now() at time zone 'utc')::date;
  v_user_count integer;
  v_global_count integer;
begin
  if p_user is null or coalesce(p_user_limit, 0) < 1 or coalesce(p_global_limit, 0) < 1 then
    return -1;
  end if;

  -- Per-user counter first, so one user hammering the endpoint never touches the global row.
  insert into public.tutor_usage as u (user_id, day, count)
  values (p_user, v_day, 1)
  on conflict (user_id, day) do update
    set count = u.count + 1
    where u.count < p_user_limit
  returning u.count into v_user_count;

  if v_user_count is null then
    return -1;
  end if;

  insert into public.tutor_global_usage as g (day, count)
  values (v_day, 1)
  on conflict (day) do update
    set count = g.count + 1
    where g.count < p_global_limit
  returning g.count into v_global_count;

  if v_global_count is null then
    -- Global cap reached: take back the per-user increment made above (same transaction).
    update public.tutor_usage
      set count = count - 1
      where user_id = p_user and day = v_day and count > 0;
    return -1;
  end if;

  return least(p_user_limit - v_user_count, p_global_limit - v_global_count);
end;
$$;

-- Gives back one question for p_user today. Used when the upstream AI call fails
-- (network or API error) so students don't lose a question to an outage.
create or replace function public.tutor_release(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_day date := (now() at time zone 'utc')::date;
  v_released integer;
begin
  update public.tutor_usage
    set count = count - 1
    where user_id = p_user and day = v_day and count > 0
  returning 1 into v_released;

  if v_released is not null then
    update public.tutor_global_usage
      set count = count - 1
      where day = v_day and count > 0;
  end if;
end;
$$;

-- Functions are executable by PUBLIC by default, and Supabase also grants anon/authenticated
-- explicitly. Lock both down to the service role.
revoke all on function public.tutor_consume(uuid, integer, integer) from public, anon, authenticated;
revoke all on function public.tutor_release(uuid) from public, anon, authenticated;
grant execute on function public.tutor_consume(uuid, integer, integer) to service_role;
grant execute on function public.tutor_release(uuid) to service_role;
