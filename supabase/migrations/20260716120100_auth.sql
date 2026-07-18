-- ============================================================================
-- eengineer — auth: claims, helpers, signup trigger (block 16, step 2/3)
-- Builders = GitHub/LinkedIn (get a profile + role + verified=true).
-- Preview   = any session without a profile row (Google/anonymous) → read-only.
-- ============================================================================

-- ── Custom access-token hook: inject user_status / user_role / user_verified ─
-- Enable in Supabase: Auth → Hooks → Custom Access Token → public.custom_access_token_hook.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  claims     jsonb := event -> 'claims';
  uid        uuid  := (event ->> 'user_id')::uuid;
  v_role     text;
  v_verified boolean;
begin
  select role::text into v_role   from public.user_roles where user_id = uid;
  select verified  into v_verified from public.profiles  where id = uid;

  if v_role is not null then
    claims := jsonb_set(claims, '{user_status}',   to_jsonb('builder'::text));
    claims := jsonb_set(claims, '{user_role}',     to_jsonb(v_role));
    claims := jsonb_set(claims, '{user_verified}', to_jsonb(coalesce(v_verified, false)));
  else
    -- no profile/role ⇒ preview principal (Google/anon): read-only allowlist
    claims := jsonb_set(claims, '{user_status}',   to_jsonb('preview'::text));
    claims := jsonb_set(claims, '{user_role}',     'null'::jsonb);
    claims := jsonb_set(claims, '{user_verified}', to_jsonb(false));
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

-- ── Signup trigger: create the profile + role for real (GitHub/LinkedIn) users ─
-- Google/anonymous sessions get NO profile row on purpose, so they resolve to
-- preview in the hook above.
create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare prov text := new.raw_app_meta_data ->> 'provider';
begin
  if prov in ('github', 'linkedin') then
    insert into public.profiles (id, display_name, oauth_provider, verified)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'name',
               new.raw_user_meta_data ->> 'full_name',
               new.raw_user_meta_data ->> 'user_name', ''),
      prov,
      true
    )
    on conflict (id) do nothing;

    insert into public.user_roles (user_id, role)
    values (new.id, 'builder')
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();

-- ── Claim readers (cheap, read JWT — safe to call from policies) ─────────────
create or replace function app.status() returns text
  language sql stable as $$ select coalesce(auth.jwt() ->> 'user_status', '') $$;
create or replace function app.role() returns text
  language sql stable as $$ select auth.jwt() ->> 'user_role' $$;
create or replace function app.is_verified() returns boolean
  language sql stable as $$ select coalesce((auth.jwt() ->> 'user_verified')::boolean, false) $$;
create or replace function app.is_builder() returns boolean
  language sql stable as $$ select app.status() = 'builder' $$;
create or replace function app.is_preview() returns boolean
  language sql stable as $$ select app.status() = 'preview' $$;
create or replace function app.has_role(variadic roles text[]) returns boolean
  language sql stable as $$ select app.role() = any(roles) $$;

-- ── Relationship readers (SECURITY DEFINER: read tables past their own RLS) ──
create or replace function app.profile_verified(u uuid) returns boolean
  language sql stable security definer set search_path = '' as $$
  select coalesce((select verified from public.profiles where id = u), false) $$;

create or replace function app.are_connected(a uuid, b uuid) returns boolean
  language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.connections
    where status = 'connected'
      and ((requester_id = a and addressee_id = b)
        or (requester_id = b and addressee_id = a))) $$;

create or replace function app.is_blocked(a uuid, b uuid) returns boolean
  language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)) $$;

create or replace function app.is_participant(conv uuid, u uuid) returns boolean
  language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.conversations
    where id = conv and (participant_a = u or participant_b = u)) $$;

create or replace function app.other_participant(conv uuid, u uuid) returns uuid
  language sql stable security definer set search_path = '' as $$
  select case when participant_a = u then participant_b else participant_a end
  from public.conversations where id = conv $$;

-- The messaging gate in one place: both verified, connected, not blocked.
create or replace function app.can_message(a uuid, b uuid) returns boolean
  language sql stable security definer set search_path = '' as $$
  select a <> b
     and app.profile_verified(a) and app.profile_verified(b)
     and app.are_connected(a, b)
     and not app.is_blocked(a, b) $$;

grant usage on schema app to authenticated, anon;
grant execute on all functions in schema app to authenticated, anon;
