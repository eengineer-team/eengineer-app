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
