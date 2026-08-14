-- ============================================================================
-- eengineer — OAuth trust verification (GitHub / LinkedIn)
--
-- What this fixes / adds, in order:
--   1. `linkedin_oidc` was never matched. Supabase's LinkedIn provider reports
--      itself as `linkedin_oidc` (the old `linkedin` provider is deprecated),
--      so app.handle_new_user()'s `prov in ('github','linkedin')` check silently
--      dropped every LinkedIn signup into the preview bucket — no profile, no
--      role, no verified flag. Provider matching is now normalised in one place.
--   2. Verification on *identity linking*, not just signup. A Google-preview
--      session that later links GitHub (supabase.auth.linkIdentity) inserts a
--      row into auth.identities but never into auth.users, so the signup
--      trigger never fired and the user stayed preview forever. A second
--      trigger on auth.identities now upgrades them in place, keeping their
--      existing user id (and therefore everything attached to it).
--   3. Profile links (github_url) are filled from the OAuth identity payload
--      instead of being left for the user to type in by hand — a self-typed
--      URL proves nothing, the linked identity does.
--   4. app.profiles_guard() is relaxed from "verified/oauth_provider can never
--      change" to "they can only change to something auth.identities actually
--      backs". The old rule made (2) impossible; the new rule is still not
--      user-forgeable, because the check is against the OAuth ground truth in
--      auth.identities rather than against anything the client can send.
--   5. `user_provider` is added to the access-token claims so the client can
--      render "verified via GitHub" for the current session without a round
--      trip to the profiles table.
--   6. Existing rows are backfilled, so accounts created before this migration
--      get the same treatment as new ones.
-- ============================================================================

-- ── Provider normalisation ──────────────────────────────────────────────────
-- One definition of "which providers count as a trust signal", used by both
-- triggers, the guard, and the backfill below. Google is deliberately absent:
-- it proves the person has an email, which is not the same claim.
create or replace function app.trust_provider(raw text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when raw = 'github'                            then 'github'
    when raw in ('linkedin', 'linkedin_oidc')      then 'linkedin'
    else null
  end;
$$;

create or replace function app.is_trust_provider(raw text)
returns boolean
language sql
immutable
set search_path = ''
as $$ select app.trust_provider(raw) is not null $$;

-- ── Guard: verified/oauth_provider must match a real linked identity ────────
-- Replaces the flat "never editable" rule. A client can still send these
-- columns, but the write only survives if auth.identities agrees — so the
-- worst a forged request can do is assert something already true.
create or replace function app.profiles_guard() returns trigger
  language plpgsql security definer set search_path = '' as $$
begin
  if new.id is distinct from old.id then
    raise exception 'id is not user-editable';
  end if;

  if new.verified is distinct from old.verified
     or new.oauth_provider is distinct from old.oauth_provider then
    -- Un-verifying is always allowed (an unlinked identity should be able to
    -- drop the badge); claiming verification requires a matching identity row.
    if new.verified then
      if not exists (
        select 1 from auth.identities i
        where i.user_id = new.id
          and app.trust_provider(i.provider) = new.oauth_provider
      ) then
        raise exception 'verified requires a linked % identity', coalesce(new.oauth_provider, '(none)');
      end if;
    end if;
  end if;

  new.updated_at := now();
  return new;
end; $$;

-- ── Shared upgrade path ─────────────────────────────────────────────────────
-- Called from both triggers below. Idempotent on purpose: signup fires the
-- users trigger AND the identities trigger, and re-linking an already-linked
-- provider fires it again.
create or replace function app.apply_verified_identity(
  p_user_id  uuid,
  p_provider text,
  p_data     jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_provider text := app.trust_provider(p_provider);
  v_name     text;
  v_github   text;
begin
  if v_provider is null then
    return;                                   -- google/email/etc: stays preview
  end if;

  v_name := nullif(trim(coalesce(
    p_data ->> 'name',
    p_data ->> 'full_name',
    p_data ->> 'user_name',
    p_data ->> 'preferred_username',
    ''
  )), '');

  -- GitHub hands us the profile URL directly; fall back to composing it from
  -- the login. LinkedIn's OIDC payload carries no public profile URL at all,
  -- so linkedin_url stays whatever the member set themselves.
  if v_provider = 'github' then
    v_github := coalesce(
      p_data ->> 'html_url',
      case when p_data ->> 'user_name' is not null
           then 'https://github.com/' || (p_data ->> 'user_name') end
    );
  end if;

  insert into public.profiles as p (id, display_name, oauth_provider, verified, github_url)
  values (p_user_id, coalesce(v_name, ''), v_provider, true, v_github)
  on conflict (id) do update set
    -- Whichever trust provider got there first keeps the badge, so linking a
    -- second one later doesn't silently relabel an existing profile.
    oauth_provider = coalesce(app.trust_provider(p.oauth_provider), v_provider),
    verified       = true,
    -- Never clobber something the member has already filled in themselves.
    display_name   = case when coalesce(trim(p.display_name), '') = ''
                          then coalesce(v_name, '') else p.display_name end,
    github_url     = coalesce(p.github_url, v_github);

  insert into public.user_roles (user_id, role)
  values (p_user_id, 'builder')
  on conflict (user_id) do nothing;
end;
$$;

-- ── Signup trigger (rewritten) ──────────────────────────────────────────────
create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform app.apply_verified_identity(
    new.id,
    new.raw_app_meta_data ->> 'provider',
    coalesce(new.raw_user_meta_data, '{}'::jsonb)
  );
  return new;
end;
$$;

-- ── Identity-link trigger (new) ─────────────────────────────────────────────
-- The half that was missing: this is what turns an existing Google-preview
-- account into a verified Builder when they press "Link GitHub" in Settings,
-- without creating a second account.
create or replace function app.handle_identity_linked()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform app.apply_verified_identity(
    new.user_id,
    new.provider,
    coalesce(new.identity_data, '{}'::jsonb)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_identity_created on auth.identities;
create trigger on_auth_identity_created
  after insert on auth.identities
  for each row execute function app.handle_identity_linked();

-- ── Claims: expose which provider verified this session ─────────────────────
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
  v_provider text;
begin
  select role::text into v_role from public.user_roles where user_id = uid;
  select verified, oauth_provider into v_verified, v_provider
    from public.profiles where id = uid;

  if v_role is not null then
    claims := jsonb_set(claims, '{user_status}',   to_jsonb('builder'::text));
    claims := jsonb_set(claims, '{user_role}',     to_jsonb(v_role));
    claims := jsonb_set(claims, '{user_verified}', to_jsonb(coalesce(v_verified, false)));
    claims := jsonb_set(claims, '{user_provider}',
                        coalesce(to_jsonb(v_provider), 'null'::jsonb));
  else
    claims := jsonb_set(claims, '{user_status}',   to_jsonb('preview'::text));
    claims := jsonb_set(claims, '{user_role}',     'null'::jsonb);
    claims := jsonb_set(claims, '{user_verified}', to_jsonb(false));
    claims := jsonb_set(claims, '{user_provider}', 'null'::jsonb);
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- usage on the schema as well as execute on the function: without the schema
-- grant the hook is unreachable and Auth falls back to unmodified claims, which
-- looks exactly like "the hook is enabled but does nothing".
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

-- ── Claim reader for the new claim ──────────────────────────────────────────
create or replace function app.provider() returns text
  language sql stable as $$ select auth.jwt() ->> 'user_provider' $$;

-- ── Backfill ────────────────────────────────────────────────────────────────
-- Anyone who signed in with LinkedIn before this migration currently has no
-- profile row at all (bug 1 above); anyone who linked GitHub to a Google
-- account has a profile but verified = false (bug 2). One pass fixes both.
do $$
declare r record;
begin
  for r in
    select distinct on (i.user_id) i.user_id, i.provider, i.identity_data
    from auth.identities i
    where app.is_trust_provider(i.provider)
    -- github wins over linkedin when both are linked, purely so the badge is
    -- deterministic rather than dependent on link order.
    order by i.user_id, (i.provider = 'github') desc, i.created_at asc
  loop
    perform app.apply_verified_identity(r.user_id, r.provider, coalesce(r.identity_data, '{}'::jsonb));
  end loop;
end $$;

-- Google-only accounts that somehow carry verified = true (e.g. hand-edited
-- during development) are reset — the badge must never outlive its evidence.
update public.profiles p
set verified = false
where p.verified
  and not exists (
    select 1 from auth.identities i
    where i.user_id = p.id and app.is_trust_provider(i.provider)
  );

grant execute on all functions in schema app to authenticated, anon;
