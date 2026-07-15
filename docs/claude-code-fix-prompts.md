# Claude Code — fix prompts (from UX/UI audit)

Paste one block at a time into Claude Code, in order. Each block is self-contained.
General rule for every block: after changes run `npm run lint`, `npm run build`, and
sanity-check at 375px width. Keep the repo's "mock but honest" philosophy — no fake
product shots, no message moderation (see the note in `Messages.tsx`), no fabricated
stats. Prefer existing design tokens over new one-off values.

Priority: 1–6 are correctness/trust (do these first). 7–14 are UI/polish.
15 (micro-interactions) is intentionally LAST — it only pays off once #1 is done.

---

## 1. CRITICAL — Persist user-created state (nothing survives refresh today)

```
Problem: profiles, projects, messages, Q&A posts, webinar RSVPs and connections are
all held in in-memory React state seeded from mock data, so a page refresh silently
resets everything the user created — while the login session IS persisted
(auth-context.tsx uses localStorage 'ee_session'). This asymmetry is the worst bug
in the app: a returning user is still logged in but their profile has reverted to seed.

Goal: make all user-created state survive refresh and in-app navigation, client-side
only (no backend yet — keep the mock philosophy, just persist to localStorage).

Do:
- Add a small reusable hook usePersistentState<T>(key, initial) in src/lib that mirrors
  useState but reads/writes JSON to localStorage (guard for SSR/parse errors, like the
  existing readStoredPrefs in Settings.tsx does).
- Use it in: src/lib/profiles-context.tsx (profiles), src/lib/projects-context.tsx
  (projects), src/lib/messages-context.tsx (conversations + activeId), plus the local
  state in pages/dashboard/community/Webinars.tsx, pages/dashboard/community/QAFeed.tsx,
  and the DashboardHome webinar RSVP.
- Namespace keys as 'ee:profiles', 'ee:projects', 'ee:messages', etc.
- On first run (no stored value) fall back to the existing SEED_* as the initial value.
- Clear these keys on signOut (auth-context.tsx) so logging out doesn't leak the
  previous person's data.

Constraints: do not add a backend or a state library. Keep SEED_* files as the
first-run defaults. Don't change the data shapes.

Done when: I can edit my bio / add a project / send a message / register for a webinar,
hit refresh, and everything is still there; and signing out then back in starts clean.
```

---

## 2. CRITICAL trust — Webinar dates show the wrong weekday

```
Problem: every hardcoded webinar date string has the wrong day of week (all off by one).
community-data.ts lines ~117/126/135/144 say "Fri, Jul 18 / Tue, Jul 22 / Thu, Jul 24 /
Mon, Aug 4" but in 2026 those are Sat / Wed / Fri / Tue. The most-seen one is on
DashboardHome.tsx (~line 39). A teenager fact-checks this against their phone instantly.

Goal: make the weekday impossible to get wrong by deriving it from a real date.

Do:
- Change the Webinar type in src/lib/community-data.ts so each webinar stores a real
  starts-at value (ISO string or Date) plus its timezone label, instead of a
  pre-written "Fri, Jul 18 · 5:00 PM EST" string.
- Add a formatWebinarDate(date) helper that produces the display string via
  toLocaleDateString/toLocaleTimeString (weekday derived, never hand-typed).
- Update Webinars.tsx and DashboardHome.tsx to render via the helper.
- Pick sensible near-future 2026 dates and VERIFY each weekday is correct.

Done when: no weekday is hardcoded anywhere; grep for "Fri, Jul" etc. returns nothing;
every rendered webinar weekday matches its date.
```

---

## 3. HIGH — Honest empty-user dashboard (kill the false context)

```
Problem: a brand-new user lands on a dashboard that implies a life they don't have —
3 clubs already "joined" with unread badges (clubs-data.ts JOINED_CLUBS), a peer-activity
feed full of other people's projects, two pre-filled skills they never entered
(profile-data.ts ME profile: CAD/SolidWorks, Python), and seeded "Connected" relationships.
There's also no "what do I do next" cue. Also: signing up with GitHub hardcodes the name
"Alex Rivera" / LinkedIn "Jordan Lee" (auth-context.tsx ~line 32) and onboarding never
asks for a name.

Goal: a new account starts genuinely empty and the dashboard tells them what to do first.

Do:
- Make a fresh Builder start with: no joined clubs, no skills, no connections. Keep the
  OTHER seed profiles (Alex, Marcus, etc.) as the browsable directory — just don't
  pre-connect "me" to them and don't pre-join clubs for me.
- Add a name field to Onboarding.tsx (top of the form) that writes the real name; use a
  neutral placeholder like "Your name" instead of the canned "Alex Rivera"/"Jordan Lee".
- Add a dismissible "Start here" panel at the top of DashboardHome for users with an
  empty profile: 3 concrete first steps (add a project, join a discipline club, browse
  Builders), each linking to the right route. Hide it once the profile has any content.
- Confirm the existing honest empty states (PeerActivity "nothing posted yet",
  ProjectsHub "be the first") actually show for an empty user now.

Done when: a new signup sees an empty-but-guided dashboard, not someone else's data, and
is greeted by the name they entered.
```

---

## 4. HIGH trust — Terms/Privacy say "Coming soon" while you must agree to them

```
Problem: sign-in.tsx makes signup say "By continuing you agree to our Terms of Service
and Privacy Policy," but both links go to LegalPlaceholder.tsx which renders
"Coming soon. Final copy is being drafted before public release." Agreeing to documents
that don't exist reads as untrustworthy.

Goal: either the documents exist, or we don't claim the user agreed to them.

Do (pick the honest option, default to A):
A) Replace LegalPlaceholder usage for Terms.tsx and Privacy.tsx with real, plain-language
   draft copy appropriate for a student platform (identity via GitHub/LinkedIn, no data
   selling, messaging is unmoderated by design, contact email). Mark clearly as a draft
   with a "last updated" date if needed — but real, readable content.
B) If real copy isn't ready, change the signup line to not assert agreement (e.g.
   "Terms and Privacy Policy coming before public launch") and remove the "you agree"
   wording until they exist.

Done when: no flow asks the user to agree to a page that says "coming soon."
```

---

## 5. HIGH — Replace stock photos and generic glyph "discipline markers"

```
Problem: the discipline identity is template filler. discipline-bg.ts is 9 literal
Unsplash stock photos (Saturn V, gear train, test tubes, power lines, "code on a
monitor"…) blurred and tinted as community-card banners. discipline-icons.ts maps each
discipline to a stock lucide glyph (Rocket/Cog/Zap/Code2/FlaskConical/Sparkles) shown as
a 340px watermark on CommunityGroup.tsx (~line 52) and as markers on
OpportunityCard/CompetitionDetail. It also creates an Unsplash CDN dependency that breaks
offline.

Goal: discipline identity that is brand-specific and doesn't depend on stock assets.

Do:
- Replace the stock-photo banners with a token-driven treatment: use the existing
  per-discipline colors (discipline-colors.ts) as a solid/gradient banner, optionally
  with a subtle geometric/technical-drawing motif consistent with the "engineer's
  notebook" brand — no photos, no CDN.
- Drop the large faded lucide-glyph watermark on CommunityGroup, or replace it with the
  same brand motif. Keep small inline discipline color dots/labels for wayfinding.
- Remove the now-unused discipline-bg.ts (and its imports) if nothing else needs it.

Constraints: no third-party image CDNs; everything must render offline. Don't reintroduce
a "product shot" the app doesn't really have.

Done when: no Unsplash URLs remain, no generic rocket/gear/lightning glyph is used as a
decorative discipline marker, and community cards look intentional with the network off.
```

---

## 6. HIGH — Message composer shares one draft across all conversations

```
Problem: messages-context.tsx holds a single `draft` string and Messages.tsx binds every
thread's input to it. Typing to person A, switching to B without sending, leaves A's text
in B's input — and sending delivers it to the wrong person.

Goal: drafts are per-conversation.

Do:
- Change the context draft to a map keyed by conversation id (e.g. drafts:
  Record<string, string>), or store the draft on each conversation object.
- Update Messages.tsx to read/write the draft for the active conversation only.
- Clear that conversation's draft on send.

Done when: typing in one thread, switching threads, and back preserves each thread's own
draft independently, and a message can never be sent to the wrong recipient this way.
```

---

## 7. HIGH (mobile) — Bring all tap targets up to ≥40×40px

```
Problem: many interactive elements are well under 40px on phones (the target audience).
Known offenders:
- Competition-calendar month arrows: p-1 + 14px icon ≈ 22px (CompetitionCalendar.tsx ~89-102)
- Calendar day links: w-5 h-5 = 20px
- Header message/bell/menu icons and Settings gear: w-8 h-8 = 32px
  (DashboardHeader.tsx ~23/53, SettingsMenu.tsx ~24)
- Sidebar collapse/close: w-8 h-8 (Sidebar.tsx ~89/98)
- Message send/attach/back: w-9/w-8 (Messages.tsx ~179/267/282)
- Settings toggles: w-9 h-5 (Settings.tsx ~38)
- Remove-interest ✕: bare 11px icon (Onboarding.tsx ~163, ProfileDetail.tsx ~309)
- Team social links: w-[30px] h-[30px] (TeamAbout.tsx ~155/166)
- Dashboard "Register →": ~16px text button (DashboardHome.tsx ~56)
- Button size="sm": py-2 + text-sm ≈ 36px (button.tsx ~25)

Goal: every clickable element has ≥40×40px effective hit area, without visually
enlarging every icon.

Do:
- Keep icon glyph sizes as-is but expand the hit area: give icon buttons min-w-[40px]
  min-h-[40px] (or p-2.5) and center the icon. For tiny inline buttons (remove-✕,
  Register text) wrap the hit area to 40px even if the visual stays small.
- Bump button.tsx size="sm" to at least min-h-[40px].
- Space adjacent targets so 40px areas don't overlap (calendar arrows especially).

Done when: at 375px, every icon button, calendar arrow, day cell, toggle, and small link
is at least 40×40px to tap; visual density stays roughly the same.
```

---

## 8. MEDIUM trust — Dead founder social links (href="#")

```
Problem: TeamAbout.tsx sets github:'#' (Jalen), github:'#' and linkedin:'#' (Jakhongir),
so those GitHub/LinkedIn buttons on the landing go nowhere. Especially bad next to the
"every profile is tied to a real GitHub/LinkedIn" promise.

Do:
- In TeamAbout.tsx, only render a social button when a real URL exists (treat '#' and
  null the same — no button). The existing `member.github && (...)` guard should also
  reject '#'.
- If real founder URLs exist, put them in; otherwise render no button rather than a dead one.

Done when: no social link on the team section points to "#".
```

---

## 9. MEDIUM — Settings toggle that does nothing + duplicate webinar RSVP state

```
Problem 1: the Settings "Light/System" appearance toggle flips next-themes, but the
dashboard is hardcoded dark, so on-screen it appears to do nothing (Settings.tsx ~60;
there's an honest caption, but it's still a control that looks dead).
Problem 2: the same webinar has two independent RSVP states — DashboardHome.tsx (base 23,
its own `registered`) and Webinars.tsx (SEED_WEBINARS) — so registering in one doesn't
reflect in the other.

Do:
- For appearance: either (a) implement a real light theme for the dashboard shell so the
  toggle visibly works, or (b) if that's out of scope now, disable the Light/System
  options with a clear "Dark only for now" state instead of an active-looking control.
  Pick one; don't leave it looking interactive but inert.
- For webinars: make DashboardHome read the same webinar source/state as Webinars.tsx
  (lift into a small shared context or the persisted store from block 1) so RSVP and the
  attendee count stay in sync across both screens.

Done when: the appearance control is honestly either working or clearly unavailable; and
registering for a webinar on the dashboard is reflected on the Webinars page and vice versa.
```

---

## 10. MEDIUM UI — Visual hierarchy: make the primary action actually primary

```
Problem 1: on Auth (sign-in.tsx), GitHub and LinkedIn (the required full-access path the
landing insists on) look identical to the de-emphasized Google "Limited preview" — three
equal outline buttons separated only by a small badge.
Problem 2: on DashboardHome the webinar "Register →" is weak 11px text, while the same
action on the Webinars page is a solid accent button.

Do:
- In sign-in.tsx, give GitHub/LinkedIn clear visual priority (solid/filled, larger, first),
  and render Google as a visibly secondary option below a divider ("or preview with Google").
- In DashboardHome, replace the text "Register →" with the shared Button accent/done
  variant used on the Webinars page for visual consistency.

Done when: the recommended sign-in path is unmistakably the primary CTA, and Register looks
the same everywhere.
```

---

## 11. MEDIUM — Hero headline overflows on phones narrower than 375px

```
Problem: tailwind.config.js (~line 85) floors the `display` size at 3.25rem, and because
the 7.2vw term only exceeds 52px above ~722px viewport, every phone renders "Engineer" at
the same 52px. The config comment admits it clears 375px by only ~9px, so common 360px and
320px phones push the word off-screen.

Do:
- Make the hero safe down to 320px: lower the clamp floor and/or the vw term in the
  `display` token so "Engineer" fits with margin at 320px, OR allow the headline to wrap/
  shrink gracefully. Keep the desktop cap.
- Verify by rendering Welcome at 320, 360, and 375px — no horizontal overflow, no clipped
  letters.

Done when: the hero fits with visible side padding at 320/360/375px.
```

---

## 12. LOW — One real dark-theme contrast fail

```
Problem: "Quiet this week" uses text-white/30 = 2.70:1 on card background, below WCAG AA
(DisciplineGroupCard.tsx ~line 56). (The white/30 em-dash bullet markers and breadcrumb
chevron are decorative and exempt, but this is readable text.)

Do:
- Change "Quiet this week" to text-dark-muted (≈7:1) or at least white/55+ so it passes AA.
- Quick pass: make sure no other readable (non-decorative) text uses text-white/30 or /40.

Done when: "Quiet this week" is ≥4.5:1; decorative-only uses of white/30 can stay.
```

---

## 13. LOW — Consolidate the caps-label and remove dead type tokens

```
Problem: the same "SECTION LABEL" element is inlined three different ways — text-[10px]
tracking-[0.18em] (×10), text-[10px] tracking-[0.22em] (×3), text-[11px] tracking-[0.16em]
(×7) — and the shared LabelCaps component (label-caps.tsx) itself hardcodes text-[11px]/
0.16em instead of the design-system `label` fontSize token (0.75rem/0.08em), which is used
zero times. The `display-sm` token is also defined and never used. Overall there are ~113
hardcoded text-[9/10/11/12px] sizes.

Do:
- Decide the canonical caps-label spec and encode it in the `label` token; make LabelCaps
  use `text-label` (or the chosen token) instead of a hardcoded px size.
- Replace the inline caps-label instances across the app (Welcome, JoinedClubs,
  DashboardHome, CompetitionCalendar, Onboarding, footer, TeamAbout, LandingFeatures, etc.)
  with the <LabelCaps> component so tracking/size no longer drift file to file.
- Remove `display-sm` from tailwind.config.js if it stays unused, or apply it where a
  secondary display size is actually wanted. Don't leave defined-but-unused tokens.

Done when: caps-labels come from one component/token, and every fontSize token in the
config is actually used (or removed).
```

---

## 14. LOW — Remove leftover template assets

```
Problem: src/assets/hero.png, src/assets/react.svg, src/assets/vite.svg are unreferenced
(Vite starter leftovers). Also verify SettingsMenu's gear labeled "Settings" makes sense
given it only contains Help + Sign out.

Do:
- grep the repo for each asset; delete any with zero references.
- If the top-right gear only ever shows Help/Sign out on a given screen, relabel its
  aria-label to "Menu" (or add the real settings entry) so the icon matches its contents.

Done when: no unused assets remain and the menu icon's label matches what it opens.
```

---

## 15. LAST — Functional micro-interactions (only after block 1 ships)

```
Prerequisite: block 1 (persistence) is done. Do NOT animate actions that don't persist.

Goal: make the few things a user CAN do feel like they landed — confirmation feedback,
not decorative motion. On-brand for the "engineer's notebook / technical drawing" theme.

Do (cap it at these ~5 spots, no motion system, no new library):
- Webinar Register: animate the attendee count ticking up (e.g. 23 → 24) and a checkmark
  that strokes in (reuse the `draw` keyframe already defined in tailwind.config.js).
- Connect: morph the button state (none → requested → connected) with a short
  transform/opacity transition, not an instant swap.
- Send message: new bubble slides/fades in from the composer.
- Skill / endorsement: the SkillBar fills to its value on mount.
- Optional brand touch: wire the unused `draw` keyframe to the hero "fig. 0" dimension
  line so it draws itself once on load.

Constraints:
- transform/opacity only (GPU); do NOT animate width/height (janks on low-end Android —
  the target hardware). Note the accordion currently animates grid-template-rows; leave it
  unless it's easy to make transform-based.
- Respect prefers-reduced-motion (disable/greatly reduce these when set).
- Keep durations short (≤250ms). No ambient float/parallax, no decorative entrance
  staggers on the dashboard.

Done when: Register/Connect/Send/skill-fill give a brief, on-brand confirmation; nothing
animates layout size; reduced-motion users get a calm, instant UI.
```

---

## 16. BACKEND — review authorization, then rewrite it server-side (Supabase)

```
GOAL: stand up the backend for eengineer on Supabase, and — as the core of this task —
REVIEW the current authorization model and REWRITE it in detail as server-enforced rules
(RLS). The client permission layer today is UX-only and must NOT be trusted.

STACK: React 19 + Vite + TS frontend, Supabase (Postgres + Auth + RLS + Realtime + Storage).
Everything server-side must key off auth.uid() / JWT claims, never client-supplied identity.

── STEP 1 — AUTHORIZATION REVIEW (write this BEFORE any SQL) ──
Read and understand the real permission surface:
  - src/lib/permissions.ts  (Action union, BUILDER_ACTIONS, ROLE_ACTIONS, PREVIEW_ACTIONS, can())
  - src/lib/auth-context.tsx (AuthUser, Role = builder|community-lead|admin|super-admin,
    status = builder|preview; Google = stateless preview)
  - src/components/dashboard/RequireAction.tsx and every can(user, …) call site
  - ME_ID ownership in src/lib/profile-data.ts and the *-context.tsx files
  - the data shapes in src/lib/*-data.ts (these ARE the schema)
Produce docs/AUTHORIZATION.md containing:
  a) A resource × operation × principal matrix (principals: anon, preview, builder,
     community-lead, admin, super-admin) for EVERY resource: profiles, skills, experience,
     project_entries, projects, project_followers, endorsements, connections, clubs/
     memberships, questions, question_votes, question_comments, reports, conversations,
     messages, message_attachments, webinars, webinar_rsvps, competitions, opportunities,
     user_roles.
  b) An explicit map from each client Action → the server rule(s) that enforce it.
  c) A "gaps in client-only gating" section: list every rule that can() does NOT express and
     that only RLS can enforce — at minimum: row ownership (edit only your own profile/project),
     connection-gated + verified-only messaging, one-vote-per-user, no self-endorsement,
     mandatory endorsement reason, and role escalation (no one may set/raise their own role).
Do not write schema or policies until this doc exists and is internally consistent.

── STEP 2 — SCHEMA (derive from the TS interfaces; normalize nested arrays into tables) ──
Model tables from the existing interfaces. Nested arrays (skills, experience, projects,
endorsements, messages, comments, votes, followers, rsvps) become their own tables with FKs.
Identity: a profiles row is 1:1 with auth.users (profiles.id = auth.uid()). Add a user_roles
table (default 'builder'), a verified flag + oauth provider on the profile, a connections table
(requester_id, addressee_id, status none|requested|connected), reports and blocks tables.
Deliver as Supabase migrations (SQL). Enable RLS on EVERY table (no table left open).

── STEP 3 — AUTH ──
Supabase Auth: GitHub + LinkedIn providers → a verified 'builder' with a profile row created
by a trigger on signup, role defaulted to 'builder'. Google → a 'preview' principal (anonymous/
limited session or a status='preview' claim) that is READ-ONLY everywhere. Role and verified
status are set server-side only; never writable by the user. The landing promise ("tied to a
real GitHub or LinkedIn account, no bots") must actually hold — preview cannot create content.

── STEP 4 — RLS: THE DETAILED REWRITE (the heart of this task) ──
For every table write explicit policies PER operation (select/insert/update/delete) with exact
USING / WITH CHECK expressions on auth.uid() and the user's role/status claim. Enforce at least:
  • preview (Google): SELECT only on questions (community read-overview) and opportunities;
    zero INSERT/UPDATE/DELETE on any table.
  • profiles: SELECT by any builder; UPDATE/DELETE only where id = auth.uid(); a user may never
    change their own role or verified flag via the profile.
  • skills / experience / project_entries: mutate only by the owning profile (auth.uid()).
  • projects: SELECT by builders; INSERT/UPDATE/DELETE only by owner (owner_id = auth.uid()).
    project_followers: a user inserts/deletes only their own follow row.
  • endorsements: INSERT by any verified builder; from_id = auth.uid(); reason NOT NULL and
    length(trim(reason)) > 0 (DB CHECK, not just UI); no self-endorsement (from_id <> target owner);
    an endorser may delete only their own; targets can never fabricate one.
  • connections: requester inserts (status 'requested'); only the addressee may update to
    'connected'/declined; both parties may SELECT; no other transitions allowed.
  • conversations/messages (SAFETY-CRITICAL — minors, ages 13–18): a user may SELECT/INSERT a
    message only if they are a participant AND both participants are verified builders AND an
    accepted connection exists. Preview: none. Add report + block tables and allow a user to
    report/block a conversation partner. Leave a clear TODO for age-gate, retention, and any
    moderation/consent obligations (COPPA/GDPR-K) — do not silently ship unmoderated minor DMs.
  • questions: SELECT by builder + preview; INSERT (post) by verified builder only.
    question_votes: builder only, UNIQUE(user_id, question_id), user may change only their own vote.
    question_comments: verified builder. reports: INSERT by builder, readable only by
    community-lead/admin/super-admin.
  • webinars: SELECT by builder; INSERT/UPDATE only by community-lead/admin/super-admin
    (maps to community:webinars:manage). webinar_rsvps: builder, own row only.
  • competitions / opportunities: SELECT (opportunities also by preview); mutations admin-only.
  • user_roles: INSERT/UPDATE only by super-admin (roles:assign); a user can NEVER set or raise
    their own role; enforce with a policy that excludes self-updates and a trigger guard.
Include role/status in the JWT via a custom claims hook (or a security-definer helper that reads
user_roles) so policies can check them without recursive RLS.

── STEP 5 — RECONCILE CLIENT & SERVER ──
Keep src/lib/permissions.ts as the UX layer only, but make it the SAME rule set: update can()/
Action if the review found drift, and add a short comment on each Action pointing to the RLS
policy that actually enforces it. The client must never be the security boundary.

── DELIVERABLES ──
1. docs/AUTHORIZATION.md (the review + matrix + Action→RLS map + gaps list).
2. Supabase migrations: schema + RLS for every table + auth trigger + claims hook.
3. A pgTAP or SQL test file proving policies with POSITIVE and NEGATIVE cases (e.g. "builder B
   cannot update builder A's project", "preview cannot insert a message", "user cannot self-assign
   admin", "message blocked without an accepted connection").
4. A short migration guide: how each *-context.tsx swaps its seed/localStorage source for Supabase
   queries, one domain at a time, without changing the UI.

CONSTRAINTS: RLS on every table; deny-by-default; never trust client identity; enforce ownership
and connection/verification at the DB, not just in edge functions; every policy must have a
negative test. If the Supabase CLI/MCP is available, apply migrations to a dev branch first;
otherwise output the SQL files. Do not weaken any rule to make a test pass — fix the test.
```

---

## 17. BACKEND — migrate the contexts to Supabase queries, one domain at a time

```
Prerequisite: block 16 is done (schema + Auth + RLS live on a Supabase project).

GOAL: replace the mock/localStorage data source inside each React context with real Supabase
queries, WITHOUT changing any component's props or JSX. The contexts are the seam — swap their
internals, keep their public hook API identical, so the UI migrates for free. Ship ONE domain
per PR, in this order: auth → profiles → projects → community → messages → the rest.

SETUP (once):
- Add @supabase/supabase-js. Create src/lib/supabase.ts: a single typed client from
  import.meta.env VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Generate DB types from Supabase
  and use them everywhere (no hand-written row types that can drift from the schema).
- Create src/lib/api/<domain>.ts modules with small typed functions (list/get/insert/update/
  delete/subscribe). Contexts call these; components never touch supabase directly.

PER-DOMAIN RECIPE (repeat for each): keep the existing context's exported hook signature and
value shape byte-for-byte; only change where the data comes from. Replace usePersistentState/
useState(SEED_*) with: initial fetch on mount, loading + error + empty states surfaced through
the context (the UI already has empty states — wire them), optimistic update then reconcile,
and Realtime subscription where the data is live. Handle RLS-denied errors as a normal outcome
(e.g. show "not allowed / sign in as a Builder"), not a crash. Remove the localStorage
persistence for that domain once Supabase is the source of truth. Keep localStorage ONLY for
pure UI prefs (sidebar collapse, notification prefs, theme).

ORDER & SPECIFICS:
1. AUTH (src/lib/auth-context.tsx): replace mock signInWithProvider with
   supabase.auth.signInWithOAuth (github/linkedin → builder; google → preview/anonymous).
   Derive AuthUser + role/status from the session + custom claims; subscribe to
   onAuthStateChange; drop the hardcoded "Alex Rivera"/"Jordan Lee" names — use the real
   OAuth profile. signOut → supabase.auth.signOut(). Onboarding writes to the real profiles row.
2. PROFILES (profiles-context.tsx): fetch profiles + nested skills/experience/project_entries/
   endorsements/connections via joins; move avatar/cover uploads to Supabase Storage (replace the
   data-URL FileReader path). Connect/endorse/edit go through api/profiles.ts; rely on RLS.
3. PROJECTS (projects-context.tsx): projects + followers + openToRecruitment; owner-gated writes.
4. COMMUNITY: questions/votes/comments (QAFeed), clubs/memberships, networking/discussion,
   webinars + RSVP (fold in the existing webinars-context). Subscribe to Realtime for the Q&A
   feed and vote counts.
5. MESSAGES (messages-context.tsx): conversations + messages over Supabase Realtime; keep the
   per-conversation draft map in local state (drafts are ephemeral, not server data). Enforce
   the connection/verified gate via RLS — the client just reflects what it's allowed to read.
   Wire report/block from block 16.
6. THE REST: opportunities, competitions/calendar (read-only public tables), current-activity.

CONSTRAINTS:
- No component prop or JSX changes — if a component needs editing to migrate, the context API
  drifted; fix the context instead.
- Every mutation path assumes RLS is the real guard; never re-implement authorization in JS.
- Optimistic UI for snappy feel, but always reconcile with the server response.
- Each domain is independently shippable and revertable; do not migrate two domains in one PR.
- Delete SEED_* usage per domain as it goes live (keep the interfaces — they match the DB types).

DELIVERABLES: src/lib/supabase.ts, generated DB types, src/lib/api/*.ts per domain, the updated
contexts, loading/error/empty states wired through existing UI, and one PR per domain with a note
on what to smoke-test (sign in, create, edit-your-own, fail-to-edit-someone-else's, refresh).
```

---

## 18. BACKEND — messaging safety & compliance for minors (13–18)

```
Context: the audience is 13–18. Real user-to-user messaging + real PII storage triggers
child-safety and data-protection obligations. The codebase states a "no message moderation"
principle (Messages.tsx). This block adds the SAFETY BASELINE that does NOT violate that
principle, and explicitly flags the parts that would — do not override the no-moderation
principle silently; where a step touches it, STOP and get founder sign-off.

NOTE: this is not legal advice. Requirements vary by country (US COPPA for under-13; GDPR-K
"child" consent age 13–16 depending on member state; UK Age-Appropriate Design Code; local
Uzbekistan law). Draft to match what the product actually does; require a lawyer's review
before public launch.

── 1. AGE GATE ──
- Collect date of birth (or age band) at signup, before messaging/profile is usable.
- Hard-block under-13 (COPPA): no account created. For 13–15/16 (jurisdiction-dependent),
  require the applicable consent path (see §2). Store age_band + birth_year on the profile;
  never expose either to other users (RLS: self/admin only).
- Gate features by age where required — messaging is the highest-risk surface.

── 2. CONSENT ──
- Where a jurisdiction requires parental/guardian consent for a minor, add a consent flow
  (guardian email verification + recorded consent) before messaging is enabled.
- Store consent as an immutable, versioned log (who, when, which Terms/Privacy version) in a
  consent_records table. Re-prompt on material policy changes.

── 3. REPORT & BLOCK (user-initiated safety baseline — NOT proactive scanning) ──
- reports + blocks tables (align with block 16 RLS). A user can report a message/conversation/
  profile with a reason, and block another user (block hides them and stops messaging both ways).
- Reporter/blocker act only on their own rows (RLS). A report queue is readable ONLY by
  community-lead/admin/super-admin.
- IMPORTANT: an admin READING reported message content is content monitoring, which the
  Messages.tsx principle forbids. Do NOT implement admin-reads-messages without explicit founder
  sign-off. Default to metadata-only reports (who/when/reason). Flag this decision in the PR.

── 4. RETENTION & DELETION ──
- Account deletion (right to erasure): user can delete their account; cascade or anonymize their
  profile, projects, messages, endorsements. Provide self data export too.
- Define retention periods (messages, reports, logs) and add a scheduled purge job (Supabase
  cron / edge function). Deleting one side of a conversation must not leave messages that
  re-identify the deleted user.

── 5. TERMS & PRIVACY — rewrite to match the REAL product ──
- Update src/pages/legal/Terms.tsx and Privacy.tsx (currently mock-stage drafts) to reflect what
  the backend actually does: data collected (OAuth identity, profile, projects, messages, age),
  where it's stored/processed (Supabase + its sub-processors), retention periods, the reporting/
  blocking mechanism, minors' and guardians' rights, how to request export/deletion, and a real
  contact address. Terms: conduct rules, reporting, enforcement, account termination.
- Version both docs (effective date + changelog); the consent log references the version.
- These are legal documents — mark clearly and require human/legal review before launch. Claude
  Code drafts them to match the product; it does not replace a lawyer.

── DELIVERABLES ──
1. Age-gate signup step + hidden profile fields (age_band, birth_year).
2. consent_records table + flow (where required), versioned + immutable.
3. reports + blocks tables with RLS (extends block 16); lead/admin report queue (metadata-only by
   default; content review only with founder sign-off).
4. Account deletion + self data export; retention purge job.
5. Rewritten Terms.tsx + Privacy.tsx matching real data practices, versioned, flagged for legal review.

CONSTRAINTS: safety features are user-initiated by default; do NOT add proactive message
scanning/monitoring (spec conflict — confirm with founder first). Enforce every row access via
RLS, not JS. Store the minimum PII needed; never expose age/DOB to other users. Not legal advice.
```
