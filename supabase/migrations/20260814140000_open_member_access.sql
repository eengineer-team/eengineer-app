-- ============================================================================
-- eengineer — open full access to Google sign-ins
--
-- Until now a Google session was a "preview" principal: no profile row, no
-- role, read-only on a three-item allowlist. This migration makes Google a
-- first-class member — same profile, same `builder` role, same write access as
-- a GitHub signup. Verification does not disappear; it stops being an access
-- gate and becomes purely what it says on the tin: a badge saying a real
-- GitHub/LinkedIn account stands behind this person.
--
-- Two things this deliberately does NOT do:
--
--  1. It does not hand a profile to every provider. /internal (the hidden admin
--     panel) has its own public email+password signup, and its isolation rests
--     entirely on the fact that email signups get no profiles row — see the
--     comment in 20260723120000_internal_admins.sql. A blanket "everyone gets a
--     profile" rule would turn that panel's signup form into a back door into
--     the product. Membership is therefore an explicit allowlist of three
--     providers, not "anything that isn't anonymous".
--
--  2. It does not remove the connection requirement from messaging.
--     app.can_message still demands an accepted connection, no block on either
--     side, and DMs enabled on both — so nobody can message a stranger
--     unsolicited. Only the "both parties verified" clause is lifted.
-- ============================================================================

-- ── Who counts as a member ──────────────────────────────────────────────────
-- Returns the normalised provider for anyone entitled to a profile, or null.
-- email / anonymous / anything future deliberately fall through to null.
create or replace function app.member_provider(raw text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when raw = 'github'                       then 'github'
    when raw in ('linkedin', 'linkedin_oidc') then 'linkedin'
    when raw = 'google'                       then 'google'
    else null
  end;
$$;

create or replace function app.is_member_provider(raw text) returns boolean
  language sql immutable set search_path = ''
  as $$ select app.member_provider(raw) is not null $$;

-- ── Profile provisioning for every member provider ──────────────────────────
-- Supersedes app.apply_verified_identity. Same idempotency guarantees: signup
-- fires both the users and identities triggers, and re-linking an existing
-- provider fires it again.
create or replace function app.ensure_member_profile(
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
  v_provider text := app.member_provider(p_provider);
  v_trusted  boolean := app.trust_provider(p_provider) is not null;
  v_name     text;
  v_avatar   text;
  v_github   text;
begin
  if v_provider is null then
    return;                       -- email/anonymous: no profile, by design
  end if;

  v_name := nullif(trim(coalesce(
    p_data ->> 'name',
    p_data ->> 'full_name',
    p_data ->> 'user_name',
    p_data ->> 'preferred_username',
    ''
  )), '');

  -- Google calls it `picture`, GitHub `avatar_url`.
  v_avatar := nullif(trim(coalesce(
    p_data ->> 'avatar_url',
    p_data ->> 'picture',
    ''
  )), '');

  if v_provider = 'github' then
    v_github := coalesce(
      p_data ->> 'html_url',
      case when p_data ->> 'user_name' is not null
           then 'https://github.com/' || (p_data ->> 'user_name') end
    );
  end if;

  insert into public.profiles as p (id, display_name, oauth_provider, verified, github_url, avatar_url)
  values (p_user_id, coalesce(v_name, ''), v_provider, v_trusted, v_github, v_avatar)
  on conflict (id) do update set
    -- A trust provider always wins over google, and between two trust
    -- providers the first one keeps the badge. So linking GitHub to a Google
    -- account upgrades it, and linking LinkedIn afterwards changes nothing.
    oauth_provider = case
      when v_trusted then coalesce(app.trust_provider(p.oauth_provider), v_provider)
      else coalesce(p.oauth_provider, v_provider)
    end,
    verified = p.verified or v_trusted,
    -- Never clobber anything the member filled in themselves.
    display_name = case when coalesce(trim(p.display_name), '') = ''
                        then coalesce(v_name, '') else p.display_name end,
    avatar_url   = coalesce(p.avatar_url, v_avatar),
    github_url   = coalesce(p.github_url, v_github);

  insert into public.user_roles (user_id, role)
  values (p_user_id, 'builder')
  on conflict (user_id) do nothing;
end;
$$;

-- Kept as a thin wrapper so nothing that still calls the old name breaks.
create or replace function app.apply_verified_identity(
  p_user_id uuid, p_provider text, p_data jsonb
) returns void
language sql security definer set search_path = ''
as $$ select app.ensure_member_profile(p_user_id, p_provider, p_data) $$;

create or replace function app.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform app.ensure_member_profile(
    new.id,
    new.raw_app_meta_data ->> 'provider',
    coalesce(new.raw_user_meta_data, '{}'::jsonb));
  return new;
end; $$;

create or replace function app.handle_identity_linked()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform app.ensure_member_profile(
    new.user_id, new.provider, coalesce(new.identity_data, '{}'::jsonb));
  return new;
end; $$;

-- ── The participation gate ──────────────────────────────────────────────────
-- Every write policy that used to require app.is_verified() now calls this
-- instead. One definition, so re-tightening any of it later (or all of it) is
-- a single-line change here rather than a hunt through a dozen policies.
-- app.is_verified() keeps its literal meaning and stays available.
create or replace function app.can_participate() returns boolean
  language sql stable set search_path = ''
  as $$ select app.is_builder() $$;

-- ── Messaging: connection still required, verification no longer ────────────
create or replace function app.can_message(a uuid, b uuid) returns boolean
  language sql stable security definer set search_path = '' as $$
  select a <> b
     and app.are_connected(a, b)
     and not app.is_blocked(a, b)
     and app.allows_dms(a) and app.allows_dms(b) $$;

-- ── Re-point every verified-gated write policy ──────────────────────────────
drop policy if exists endorse_insert on endorsements;
create policy endorse_insert on endorsements for insert to authenticated
  with check (app.can_participate() and from_id = auth.uid() and from_id <> profile_id);

drop policy if exists pfeedback_insert on project_feedback;
create policy pfeedback_insert on project_feedback for insert to authenticated
  with check (app.can_participate() and from_id = auth.uid());

-- The addressee check goes too: requiring a verified *target* would have made
-- every Google member unreachable, i.e. invisible to the whole network.
drop policy if exists conn_insert on connections;
create policy conn_insert on connections for insert to authenticated
  with check (app.can_participate()
              and requester_id = auth.uid()
              and requester_id <> addressee_id
              and status = 'requested');

drop policy if exists q_insert on questions;
create policy q_insert on questions for insert to authenticated
  with check (app.can_participate() and author_id = auth.uid());

drop policy if exists qc_insert on question_comments;
create policy qc_insert on question_comments for insert to authenticated
  with check (app.can_participate() and author_id = auth.uid());

drop policy if exists intro_insert on introductions;
create policy intro_insert on introductions for insert to authenticated
  with check (app.can_participate() and profile_id = auth.uid());

drop policy if exists disc_insert on discussion_posts;
create policy disc_insert on discussion_posts for insert to authenticated
  with check (app.can_participate() and profile_id = auth.uid());

drop policy if exists activity_insert on activity_updates;
create policy activity_insert on activity_updates for insert to authenticated
  with check (app.can_participate() and author_id = auth.uid());

drop policy if exists pjr_insert on project_join_requests;
create policy pjr_insert on project_join_requests for insert to authenticated
  with check (app.can_participate() and requester_id = auth.uid()
              and not exists (select 1 from projects p
                              where p.id = project_id and p.owner_id = auth.uid()));

drop policy if exists conv_insert on conversations;
create policy conv_insert on conversations for insert to authenticated
  with check (app.can_participate()
              and auth.uid() in (participant_a, participant_b)
              and app.can_message(participant_a, participant_b));

-- ── Backfill existing Google accounts ───────────────────────────────────────
-- Everyone who signed in with Google before today has an auth.users row and no
-- profile. One pass gives them the same standing as a new signup.
do $$
declare r record;
begin
  for r in
    select distinct on (i.user_id) i.user_id, i.provider, i.identity_data
    from auth.identities i
    where app.is_member_provider(i.provider)
    -- github first, then linkedin, google last: whoever has a trust provider
    -- linked gets seeded from it, so the badge is granted where it is due.
    order by i.user_id,
             (i.provider = 'github') desc,
             (i.provider in ('linkedin', 'linkedin_oidc')) desc,
             i.created_at asc
  loop
    perform app.ensure_member_profile(r.user_id, r.provider,
                                      coalesce(r.identity_data, '{}'::jsonb));
  end loop;
end $$;

grant execute on all functions in schema app to authenticated, anon;
