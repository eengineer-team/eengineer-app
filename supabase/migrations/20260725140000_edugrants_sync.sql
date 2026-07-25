-- Edugrants -> opportunities sync (Future of Eengineer.net doc, item 6).
-- The scraper itself lives in supabase/functions/sync-edugrants/index.ts.

-- ---------------------------------------------------------------- dedup key
-- The Edugrants slug is stable and unique per grant (it's their URL path), so
-- it's the natural upsert target. Matching on title would collide the moment
-- two years of the same programme are listed, or when a title is edited
-- upstream.
alter table opportunities add column if not exists source_key text;

-- Plain, NOT partial. The first version was partial (WHERE source_key is not
-- null) and could not be used for ON CONFLICT inference -- Postgres only
-- matches a partial index when the statement carries the same predicate,
-- which PostgREST's upsert cannot express, so every single import failed with
-- "no unique or exclusion constraint matching the ON CONFLICT specification".
-- A plain index behaves the same for our purposes: Postgres treats NULLs as
-- distinct, so hand-entered rows (source_key null) never collide.
create unique index if not exists opportunities_source_key_uniq
  on opportunities (source, source_key);

-- When the sync last examined this row upstream. Drives the batch pointer:
-- never-seen slugs first, then least-recently-synced.
alter table opportunities add column if not exists synced_at timestamptz;

-- ------------------------------------------------------------ shared secret
-- The pg_cron job (inside Postgres) and the edge function (outside it) both
-- need the same token, and Postgres cannot read the function's environment.
-- One row both sides read; rotating is a single UPDATE.
create table if not exists sync_tokens (
  name text primary key,
  token text not null,
  created_at timestamptz not null default now()
);

alter table sync_tokens enable row level security;
-- No policies at all: unreachable from any client key. Only the service role
-- (which bypasses RLS) can read it.
revoke all on sync_tokens from anon, authenticated;

insert into sync_tokens (name, token)
values ('edugrants', encode(gen_random_bytes(32), 'hex'))
on conflict (name) do nothing;

-- ------------------------------------------------------------- schema grant
-- The app schema granted USAGE to authenticated and anon but never to
-- service_role. The product worked because the browser client uses
-- authenticated/anon -- but any SERVER-side write touching a column typed
-- with an app enum (opportunities.discipline is app.discipline) failed with
-- "permission denied for schema app". Found when the first sync run had every
-- upsert fail with exactly that. USAGE only; no CREATE.
grant usage on schema app to service_role;

-- ----------------------------------------------------------------- schedule
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Every 6 hours rather than daily: each run only has budget for ~40 detail
-- pages out of ~256 listings, so a daily cadence would take a week to cover
-- the catalogue once. At 4 runs a day the whole set refreshes in about a day
-- and a half and new grants appear the same day they're posted.
select cron.unschedule('edugrants-sync')
where exists (select 1 from cron.job where jobname = 'edugrants-sync');

select cron.schedule(
  'edugrants-sync',
  '17 */6 * * *',
  $$
  select net.http_post(
    url := 'https://bgdlpdokubhutwicsfyp.supabase.co/functions/v1/sync-edugrants',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-sync-token', (select token from sync_tokens where name = 'edugrants')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 150000
  );
  $$
);
