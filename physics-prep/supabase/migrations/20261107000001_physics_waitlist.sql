-- Waitlist for eengineer Physics Pro. Written to by src/lib/api/waitlist.ts.
-- Clients may only insert; nobody but the service role (dashboard, server code) can read the list.

create table if not exists public.physics_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null,
  created_at timestamptz not null default now(),
  constraint physics_waitlist_email_check check (
    char_length(email) between 3 and 254
    and email = lower(email)
    and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  constraint physics_waitlist_source_check check (source in ('landing', 'pro-intent', 'practice'))
);

comment on table public.physics_waitlist is 'eengineer Physics Pro waitlist. Insert-only for clients.';

alter table public.physics_waitlist enable row level security;

-- Supabase grants every privilege on new public tables to anon/authenticated by default.
-- Replace that with a column-limited insert so clients can't set id or created_at.
revoke all on table public.physics_waitlist from anon, authenticated;
grant insert (email, source) on table public.physics_waitlist to anon, authenticated;

drop policy if exists "physics_waitlist_insert" on public.physics_waitlist;
create policy "physics_waitlist_insert"
  on public.physics_waitlist
  for insert
  to anon, authenticated
  with check (
    char_length(email) between 3 and 254
    and source in ('landing', 'pro-intent', 'practice')
  );

-- No select, update or delete policies: with RLS on, those are denied for anon and authenticated.
