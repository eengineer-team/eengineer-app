# Authorization review — eengineer backend (block 16, step 1)

Source of truth for this doc: `src/lib/permissions.ts`, `src/lib/auth-context.tsx`, and the
data shapes in `src/lib/*-data.ts`. This is the spec the Supabase schema + RLS are built from.
Nothing here is enforced yet — today all gating is client-side (`can()` / `RequireAction`),
which is UX only and trivially bypassed by calling the API directly.

Supabase target project: `eengineer-team's Project` (ref `bgdlpdokubhutwicsfyp`) — currently
INACTIVE; restore before applying migrations.

## Principles

1. **The database is the security boundary.** Every rule below is enforced with RLS on
   `auth.uid()` and JWT claims. `src/lib/permissions.ts` stays as a UX layer only and must
   express the *same* rules, but is never trusted.
2. **Deny by default.** RLS enabled on every table; no permissive `USING (true)` unless the
   row is genuinely public-read (competitions, opportunities).
3. **Identity is never client-supplied.** `sender_id`, `owner_id`, `from_id`, etc. are set to
   `auth.uid()` server-side (DEFAULT or `WITH CHECK`), never taken from the request body.
4. **Least privilege.** Preview (Google) is read-only on a tiny allowlist. Elevated roles add
   capabilities on top of Builder, never remove the Builder baseline.

## Principals & how they map to Supabase

From `auth-context.tsx`: a session is either a **Builder** (`provider: github|linkedin`,
`status: 'builder'`, `role: Role`) or a **Preview** (`provider: google`, `status: 'preview'`).
`Role = 'builder' | 'community-lead' | 'admin' | 'super-admin'`.

| Principal | Supabase representation | Claims used in RLS |
|---|---|---|
| anon | no session | — (deny everything) |
| preview | Google session (anonymous/limited) | `status = 'preview'` |
| builder | GitHub/LinkedIn session | `status = 'builder'`, `role = 'builder'`, `verified = true` |
| community-lead | builder + role | `role = 'community-lead'` |
| admin | builder + role | `role = 'admin'` |
| super-admin | builder + role | `role = 'super-admin'` |

Implementation: `profiles.id = auth.uid()` (1:1 with `auth.users`). `role` lives in a
`user_roles` table; `verified` is a column on `profiles` set true only for GitHub/LinkedIn
signups. Expose `status`, `role`, `verified` as **custom JWT claims** via an auth hook (or a
`SECURITY DEFINER` helper `current_role()/is_verified()/is_preview()`), so policies read them
without recursive RLS on `user_roles`.

## Modeling notes (client shape → tables)

- Nested arrays on `BuilderProfile` (`skills`, `experience`, `projects`, `endorsements`,
  `interests`) become their own tables (except `interests`, a `text[]` column is fine).
- **`myVote`, `connectStatus`, `mutuals` are per-viewer derived values**, not stored columns.
  Server-side they are computed *relative to `auth.uid()`* from `question_votes` / `connections`,
  never written by the client. Client keeps them on the object for convenience only.
- **Two different "project" concepts exist and must be reconciled:** `ProjectEntry`
  (portfolio items nested on a profile, `profile-data.ts`) vs `Project` (the Projects-hub
  entity with `ownerId` + `followerIds`, `projects-data.ts`). Model as `profile_project_entries`
  and `projects` respectively, or merge — flag for the team; do not silently collapse them.
- `Conversation.userId` = the other participant; `DirectMessage.from = 'me'|'them'` is
  viewer-relative → server stores `sender_id`, resolves `me/them` on read.

## Resource → operation → principal matrix

Legend: ✔ allowed with the stated predicate · ✘ denied · rows are `auth.uid()`-scoped unless noted.

### profiles
- SELECT: builder+ ✔ (any builder may browse) · preview ✘ (preview never got `profiles:view`).
- INSERT: only self, on signup (`id = auth.uid()`), via trigger. No manual insert of other rows.
- UPDATE: **owner only** (`id = auth.uid()`). Cannot change `verified`, `role` (not on this table anyway), or `id`.
- DELETE: owner only (account deletion, block 18) or admin.

### skills / experiences / profile_project_entries
- SELECT: builder+ ✔ (shown on profiles).
- INSERT/UPDATE/DELETE: **owning profile only** (`profile_id = auth.uid()`).

### endorsements  (`from_id` endorser, `profile_id` target, `reason` mandatory)
- SELECT: builder+ ✔.
- INSERT: **verified builder** ✔ with `from_id = auth.uid()`, `char_length(trim(reason)) > 0`
  (DB CHECK, not just UI), and **no self-endorsement** (`from_id <> profile_id`).
- UPDATE: none (endorsements are immutable; re-issue instead).
- DELETE: the endorser only (`from_id = auth.uid()`); a target can never fabricate or alter one.

### projects (hub)  (`owner_id`)
- SELECT: builder+ ✔.
- INSERT/UPDATE/DELETE: **owner only** (`owner_id = auth.uid()`).

### project_followers  (`project_id`, `follower_id`)
- SELECT: builder+ ✔.
- INSERT/DELETE: **self follow only** (`follower_id = auth.uid()`). No inserting someone else as a follower.

### project_feedback  (`from_id`)
- SELECT: builder+ ✔. INSERT: verified builder, `from_id = auth.uid()`. UPDATE/DELETE: author only.

### connections  (`requester_id`, `addressee_id`, `status: requested|connected|declined`)
- SELECT: **either party only** (`auth.uid() IN (requester_id, addressee_id)`).
- INSERT: `requester_id = auth.uid()`, `status = 'requested'`, `requester_id <> addressee_id`, both verified builders.
- UPDATE: **addressee only** may move `requested → connected|declined`. No other transition; requester cannot self-accept.
- DELETE: either party (unfriend/cancel).

### club_memberships  (`profile_id`, `discipline`)
- SELECT: builder+ ✔. INSERT/DELETE: **self only** (`profile_id = auth.uid()`).

### questions  (`author_id`, `discipline`, `reported`)
- SELECT: builder+ ✔ **and preview ✔** (this is the one thing preview gets inside Community — `community:read-overview`).
- INSERT: **verified builder** (`community:post-question`), `author_id = auth.uid()`.
- UPDATE/DELETE: author only (or admin/community-lead for moderation).

### question_votes  (`question_id`, `user_id`, `vote`)
- SELECT: builder+ ✔. 
- INSERT/UPDATE: builder only, `user_id = auth.uid()`, **UNIQUE(user_id, question_id)**; a user may change only their own vote.
- DELETE: own vote only.

### question_comments  (`author_id`)
- SELECT: builder+ ✔. INSERT: verified builder, `author_id = auth.uid()`. UPDATE/DELETE: author only.

### reports  (`reporter_id`, `target_type`, `target_id`, `reason`)
- INSERT: builder, `reporter_id = auth.uid()`.
- SELECT: **community-lead / admin / super-admin only.** A normal user cannot read the report queue.
- (Metadata-only by default — see block 18: admin reading reported *message content* is a spec-conflict, founder sign-off required.)

### conversations / messages  — SAFETY-CRITICAL (minors)
- SELECT/INSERT a message: only if `auth.uid()` is a participant **AND** both participants are
  **verified builders** **AND** an **accepted `connections` row exists between them** **AND**
  neither has blocked the other.
- Preview: ✘ everywhere. Sender is `auth.uid()` (server-set).
- `blocks` (`blocker_id`, `blocked_id`): a user manages only their own block rows; a block hides
  the pair and disables messaging both directions.
- Age-gate / retention / consent: block 18.

### webinars  (`starts_at`, `discipline`)
- SELECT: builder+ ✔.
- INSERT/UPDATE/DELETE: **community-lead / admin / super-admin only** (`community:webinars:manage`).

### webinar_rsvps  (`webinar_id`, `user_id`)
- SELECT: builder+ ✔. INSERT/DELETE: **self only** (`user_id = auth.uid()`).

### competitions
- SELECT: builder+ ✔. Mutations: **admin only**. (Public read-only reference data.)

### opportunities
- SELECT: builder+ ✔ **and preview ✔** (`opportunities:view` is in `PREVIEW_ACTIONS`). Mutations: admin only.

### user_roles  (`user_id`, `role`)
- SELECT: self ✔ (to read own role) + admin/super-admin.
- INSERT/UPDATE/DELETE: **super-admin only** (`roles:assign`) **and never self** (`user_id <> auth.uid()`).
  Back this with a trigger guard so a compromised policy still can't self-escalate.

## Client Action → enforcing RLS

| `Action` (permissions.ts) | Enforced by |
|---|---|
| `dashboard:home:view` | app route; no data rule (derived from being a builder) |
| `community:read-overview` | `questions` SELECT (builder + preview) |
| `community:post-question` | `questions` INSERT (verified builder) |
| `community:vote` | `question_votes` INSERT/UPDATE (unique per user) |
| `community:comment` | `question_comments` INSERT |
| `community:report` | `reports` INSERT |
| `community:webinars:view` | `webinars` SELECT |
| `community:webinars:manage` | `webinars` INSERT/UPDATE (lead/admin/super-admin) |
| `community:network:view` / `network:connect` | `connections` SELECT / INSERT+UPDATE |
| `community:networking:view` / `:post` | networking feed SELECT / INSERT (verified builder) |
| `community:discussion:view` / `:post` | discussion SELECT / INSERT (verified builder) |
| `opportunities:view` | `opportunities` SELECT (builder + preview) |
| `projects:view` | `projects` SELECT |
| `profiles:view` | `profiles` SELECT (builder only) |
| `calendar:view` | `competitions` SELECT |
| `messages:view` | `conversations`/`messages` SELECT (participant + verified + connected + not blocked) |
| `roles:assign` | `user_roles` INSERT/UPDATE (super-admin, never self) |

## Gaps in client-only gating (what `can()` does NOT express — RLS must)

`can()` is **feature-level** ("may this user see the Messages tab?"). It says nothing about
**which rows**. Every item below is invisible to `can()` and is a real hole today:

1. **Row ownership** — edit only your own profile/project/skill/experience/entry.
2. **Connection + verified gate on messaging** — the whole safety model for minors.
3. **One-vote-per-user** and change-only-your-own-vote.
4. **No self-endorsement** and **mandatory endorsement reason**.
5. **Connection state transitions** — only the addressee accepts; requester can't self-accept.
6. **Follow only yourself** onto a project; join clubs only for yourself.
7. **Report queue visibility** — reports readable by leads/admins only.
8. **Block enforcement** — blocked pairs can't message or see each other.
9. **No self role-escalation** — `roles:assign` is super-admin only and never on your own row.
10. **Preview is read-only** — no writes to any table, ever (only reads questions + opportunities).
11. **`myVote` / `connectStatus` / `mutuals` are per-viewer** — must be derived server-side per
    `auth.uid()`, not stored/trusted from the client.
12. **Age gate** — not modeled at all yet (block 18).

## Open decisions before schema

- **Preview identity:** Supabase anonymous auth with a `status=preview` claim, or true
  unauthenticated + a public read policy? (Anonymous auth is cleaner for "prove you're a person".)
- **ProjectEntry vs Project:** keep both tables or merge portfolio into the hub entity?
- **`verified` source:** provider = github/linkedin ⇒ verified; is LinkedIn-only enough, or must
  the GitHub/LinkedIn account meet a minimum (age/history) to count as "real"?
- **Networking / Discussion / current-activity feeds:** confirm their row shapes (not fully read
  here) before writing their policies — same builder-post / builder+preview-read pattern assumed.
- **Moderation reach:** metadata-only reports vs admin content review (founder sign-off, block 18).

## Next steps (block 16 continues)

1. Restore the Supabase project, then write the schema migration from the tables above (RLS
   enabled on every one).
2. Auth hook / claims for `status` + `role` + `verified`; signup trigger creating the profile row.
3. RLS policies per the matrix, each with a **negative** test (e.g. "builder B cannot update
   builder A's project", "preview cannot insert a message", "user cannot self-assign admin").
4. Reconcile `permissions.ts` comments to point at the policy that enforces each Action.
