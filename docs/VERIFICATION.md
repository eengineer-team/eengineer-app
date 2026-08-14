# Trust verification (GitHub / LinkedIn)

What "verified" means in this app, what enforces it, and the two things that must be
switched on in the Supabase dashboard before it works in production.

## The claim

A member is **verified** when a GitHub or LinkedIn account is linked to their Supabase user.
Google is not a trust signal: it proves an email address exists, which is a different claim,
and the whole point of the badge is to distinguish those two.

**Verification grants nothing.** Since `20260814140000_open_member_access.sql`, a Google
sign-in is a full member with the same write access as anyone else — same profile, same
`builder` role. The badge is a display signal and only that. Anything in the UI that implies
otherwise ("unlock full access") is wrong and should be fixed, not worked around.

Membership and verification are two independent axes:

| | profile + `builder` role | `verified` badge |
|---|---|---|
| GitHub / LinkedIn | ✅ | ✅ |
| Google | ✅ | ✘ |
| email / password (`/internal`) | ✘ | ✘ |

That last row is load-bearing. `/internal` has its own public email+password signup, and its
isolation from the product rests entirely on email signups getting no profile row — see the
comment in `20260723120000_internal_admins.sql`. Membership is therefore an explicit
allowlist (`app.member_provider()`), never "anything that isn't anonymous".

## Where the claim is made

`profiles.verified` + `profiles.oauth_provider`, written **only** by
`app.ensure_member_profile()` in `supabase/migrations/20260814140000_open_member_access.sql`
(`app.apply_verified_identity()` is kept as a thin wrapper so the older name still resolves).
Two triggers call it:

| Trigger | Fires on | Covers |
|---|---|---|
| `on_auth_user_created` | insert on `auth.users` | any signup with a member provider |
| `on_auth_identity_created` | insert on `auth.identities` | linking GitHub/LinkedIn to an account that already exists (Google → verified, in place) |

`app.profiles_guard()` refuses any update that sets `verified = true` unless a matching row
exists in `auth.identities`. That is what makes the column non-forgeable: a client can send
whatever it likes, but the check is against the OAuth ground truth, not against the request.

Provider names are normalised through `app.trust_provider()` / `verifiedProviderFrom()`.
This matters: Supabase's LinkedIn provider reports itself as **`linkedin_oidc`**, and the
original signup trigger only matched `'linkedin'` — so every LinkedIn signup silently landed
in the preview bucket with no profile at all. Never compare a raw provider string by hand.

## Where the claim is shown

`<VerifiedBadge />` (`src/components/profile/VerifiedBadge.tsx`), rendered beside the name in:

- profile page, profiles list, hover/click profile preview
- Q&A questions and replies
- Networking intros, discipline Discussion posts
- Messages (conversation list + thread header)
- Connections (incoming requests + connected list)
- endorsements on a profile — the endorser's own badge
- the dashboard header greeting, and the Settings profile card, for yourself

Feeds carry `verified` / `verifiedVia` on each item rather than looking the author up in the
profiles store. That is deliberate: `profiles_select` is builder-only, so a store lookup would
silently drop every badge for viewers who cannot read `profiles`. A missing/hidden profile
renders as *no badge*, never as an "unverified" marker — absence of evidence is not evidence
of absence.

## Write access

Every write policy that used to call `app.is_verified()` now calls **`app.can_participate()`**
(currently `= app.is_builder()`). One definition, so re-tightening any of it — or all of it —
is a single-line change rather than a hunt through a dozen policies. `app.is_verified()` keeps
its literal meaning and stays available for anything that genuinely needs it.

Policies moved: `endorse_insert`, `pfeedback_insert`, `conn_insert`, `q_insert`, `qc_insert`,
`intro_insert`, `disc_insert`, `activity_insert`, `pjr_insert`, `conv_insert`.

`app.can_message()` lost its two `profile_verified` clauses. It still requires **an accepted
connection**, no block on either side, and DMs enabled on both — so nobody can message a
stranger unsolicited. `conn_insert` also dropped `profile_verified(addressee_id)`: requiring a
verified *target* would have made every Google member unreachable, i.e. invisible to the
network.

## Age gate

Under-13 signups are refused outright and 13–17 need a guardian's email. That gate lives in
`Onboarding.tsx` and applies to **every** provider — Google included, which is why Google
signups route through `/onboarding` rather than straight to the dashboard. For them the page
renders a `compact` branch: date of birth and nothing else, since name and photo already came
across from Google.

Known gap, pre-dating this work: the gate only sits on the *signup* path. Someone who clicks
"Log in" rather than "Sign up" on their first visit never sees it. Closing that properly means
bouncing any session with no `birthdate` to `/onboarding` — worth doing, and it would also
catch the existing members who signed up before the gate existed.

## Upgrading a Google account

`Settings → Verification` (`src/components/profile/VerificationCard.tsx`) calls
`supabase.auth.linkIdentity()`. This keeps the existing user id, so the member's profile,
projects and connections all survive — unlike signing out and back in with GitHub, which
creates a second, unrelated account.

Linking upgrades in place: `oauth_provider` flips google → github and `verified` becomes true
(`app.ensure_member_profile`'s `verified = p.verified or v_trusted` — the flag only ever goes
up, and only when `auth.identities` backs it).

After the redirect back, the access token still carries the old claims (they are baked in at
mint time), so the card calls `refreshVerification()` → `supabase.auth.refreshSession()` and
then re-fetches profiles. Without that the round trip looks like it failed until the token
happens to expire.

## Required Supabase dashboard configuration

1. **Authentication → Providers → GitHub** — enable, and set the OAuth app's callback to
   `https://<project-ref>.supabase.co/auth/v1/callback`.
2. **Authentication → Providers → Manual linking** — must be **enabled**, otherwise
   `linkIdentity()` returns `422 manual_linking_disabled` and only the sign-out/sign-in path
   works.
3. **Authentication → Hooks → Custom Access Token** — must point at
   `public.custom_access_token_hook`. Without it every session falls back to the provider
   string in `app_metadata`, which is wrong for an account that linked GitHub *after* signing
   up with Google (it still says `google` there).
4. Add the site URL and `/dashboard/settings` to **Authentication → URL Configuration →
   Redirect URLs**.

LinkedIn is intentionally left as "coming soon" in both the sign-in form and this card. The
database side already handles it (including `linkedin_oidc`); enabling it is a one-line change
in `PRIMARY_PROVIDERS` (`src/components/ui/sign-in.tsx`) and `LINK_PROVIDERS`
(`VerificationCard.tsx`) once the provider is configured in the dashboard.

## Verified behaviour

The migration was exercised against a real PostgreSQL 16 instance with a stubbed `auth`
schema. Confirmed:

- GitHub signup → profile + `builder` role + `verified` + `github_url` derived from the
  identity payload
- `linkedin_oidc` signup → profile with `oauth_provider = 'linkedin'` (previously: nothing)
- **Google signup → profile + `builder` role, `verified = false`, avatar taken from `picture`**
- **email/password signup → still no profile and no role** (`/internal` stays isolated)
- Google account linking GitHub → upgraded in place, same user id, avatar preserved
- linking a second provider → does not relabel the first
- `update profiles set verified = true` without a matching identity → **rejected**
- **`can_message` between two unverified members → false before connecting, true after,
  false again once either side blocks**
- **a Google session passes `can_participate()` and fails `is_verified()`** — exactly the
  intended split
- backfill over pre-existing accounts → repaired, GitHub wins the tiebreak
- claims hook → `user_status: builder` + `user_verified: false` + `user_provider: google`
  for a Google member

The full migration chain (36 files) was also replayed end to end on that instance to confirm
nothing earlier breaks; the only failures were the stub's missing `pg_cron`.
