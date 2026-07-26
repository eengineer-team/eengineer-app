# Claude Code prompt — Video Contest (eengineer × Pizik Lab)

Paste everything below the line into Claude Code, from the repo root.

---

## Context

This is the eengineer.net repo (React + Vite + TypeScript + Tailwind, Supabase
backend with RLS, deployed on Vercel). Read `CLAUDE.md` and `docs/` first if
present.

We are building a **science video contest for Uzbek youth** — an Uzbek version
of the Breakthrough Junior Challenge — co-hosted by eengineer.net and **Pizik
Lab** (a physics-experiment outreach project, already listed as a sponsor in
`src/components/SponsorMarquee.tsx`).

Goal, in the founder's words: *"every child deserves to taste science"* — make
applied physics/chemistry/biology accessible and fun regardless of where the
child lives.

Work on branch `landing-contest` (already exists, branched from `main`). Do not
commit to `main`.

## What already exists — read before writing anything

| Thing | Where | State |
|---|---|---|
| Public contest page | `src/pages/Contest.tsx`, route `/contest` | Built, ungated, cornsilk landing style |
| "Contest" CTA in hero | `src/pages/Welcome.tsx` | Built, next to Sign up / Log in |
| Contests schema | `supabase/migrations/20260724150000_contests.sql` | `contests`, `contest_submissions`, `contest_votes`, Elo trigger |
| Contest API | `src/lib/api/contests.ts` | incl. `fetchPublicContests()` for signed-out reads |
| Gated contest UI | `src/pages/dashboard/contests/` | Submit / blind pairwise vote / leaderboard |
| Seeded contests | live DB | **3 rows, wrong age groups — see conflict #1** |

The existing contest mechanic is: submit before a deadline → after the deadline
entries are shown to the community two at a time with no names → each head-to-head
result moves an Elo rating → top 3. That mechanic stays; it already matches the
"peer-to-peer judging" the doc calls for.

## Conflicts you MUST resolve with the founder before coding

Do not guess these. Ask, then implement.

**1. Age groups don't match.** The doc says **Junior 12–15** and **Senior 16–18**
(two groups). The live DB currently has three contests seeded as *ages 14–16 /
17–19 / 20+*. These are incompatible. The DB rows need replacing, not editing
around.

**2. Age 12 vs the platform's own hard floor of 13.** `src/pages/Onboarding.tsx`
sets `MINIMUM_AGE = 13` with the comment *"eengineer is stated as a 13–18
platform, and under-13 sign-ups are refused rather than routed through parental
consent."* The contest wants 12-year-olds. A 12-year-old therefore **cannot hold
an eengineer account**. This is the single most important design constraint on
this work — see task 2.

> **INVARIANT — the two age limits are independent and neither may be bent to
> fit the other.** Founder instruction, stated explicitly.
>
> - The **account** floor stays **13**. Do **not** lower `MINIMUM_AGE`, do not
>   add an exception, do not route under-13s through guardian consent. That
>   threshold governs the whole platform's handling of minors' data; it is not
>   negotiable for the sake of one contest page.
> - The **contest** floor stays **12**, per the doc. Do **not** raise it to 13
>   to make the two line up, and do not quietly exclude the Junior bracket.
>
> The only correct resolution is to keep contest registration entirely separate
> from accounts (task 2). If you find yourself editing `Onboarding.tsx`,
> `MINIMUM_AGE`, or the age gate while working on the contest, stop — you are
> solving it the wrong way.

**3. Registration is much lighter than an account.** The doc says registration is
*"Fill-in name, region, and nothing else"*. The current `/contest` page sends
people to `/auth?mode=signup`, i.e. a full OAuth account. Those are different
products. Follow the doc.

**4. Prize amount is not confirmed.** The $1,500 is being *requested* from
Yoshlar Ishlari Agentligi; it is not money in hand. Do **not** put a figure on
the site until the founder confirms it. (Fabricated webinars were already
removed from this codebase for exactly this reason — don't reintroduce that
class of problem.)

## Tasks

### 1. Rebuild the contest page to the doc's structure

`/contest` must be **simple enough for a non-technical Uzbek family to use**.
This is an explicit, repeated requirement — favour plain language and large,
obvious controls over cleverness.

Page sections, in this order (the doc's wireframe shows these as nav items):

- **About** — what the contest is, the specific goal, the eengineer × Pizik Lab
  collaboration.
- **Judging** — the full criteria, in detail, *on the same page as registration*.
  This is a transparency requirement, not a nice-to-have: the doc's stated aim is
  that no participant can accuse the organisers of being unfair. Explain the
  head-to-head peer comparison and how topic difficulty is weighted (below).
- **Register** — see task 2.
- **FAQ**.
- **Sponsors** — listed at the bottom of this same page. Reuse the real logos in
  `public/` (`edugrants-mark-black-transparent.png`, `pizik-mark-transparent.png`).
  Do not invent sponsor names.

Sticky in-page nav for those sections. Keep the cornsilk landing palette and the
`Syne` display font already used on `/`.

### 2. Contest registration, decoupled from eengineer accounts

Because of conflict #2, contest registration **must not require an eengineer
account**. Build a separate, minimal path:

- New table, e.g. `contest_registrations`: name, region, age group, contact
  (ask the founder which — Telegram handle or email), timestamps.
- Fields on the form: **name + region only**, plus age-group selection. Nothing
  else. No password, no OAuth.
- Anonymous INSERT via RLS, with a `with check` constraint (non-empty trimmed
  name, valid region, valid age group). Anonymous users must **not** be able to
  read the table back — registrations contain minors' names.
- Rate-limit or otherwise make bulk spam inserts unattractive; discuss the
  approach in the PR rather than silently skipping it.
- Registrations must be readable in the internal panel — follow the existing
  pattern in `src/pages/internal/` + `app.is_internal_admin()`.

**Minors' data:** participants are 12–18. Collect the minimum the contest
actually needs and nothing more. Do not add analytics or third-party trackers to
this page.

### 3. Uzbek / Russian / English

The wireframe annotates *"Lang ( rus, uzbek, english"*. The app currently has no
i18n at all. Propose an approach **before** implementing (a small typed
dictionary is probably right here — do not pull in a heavy i18n framework for
one page). Uzbek should be the default for this page: it is the primary audience.

Ask the founder who will supply the Uzbek and Russian copy. **Do not machine-
translate the legal/judging text and present it as final** — get it reviewed.

### 4. Judging criteria, written out

Breakthrough-Junior-Challenge-style. The one rule the doc is specific about:
**topic difficulty is scored relative to the participant's age group** — the same
topic (its example: nuclear fusion) scores higher difficulty for a Junior than for
a Senior, and the gap is small enough to be offset by creativity and the other
criteria. Get the full criteria list from the founder; publish exactly what will
actually be used.

Video rules from the doc: **exactly 2 minutes**; submission deadline **no more
than a month** from launch (exact dates depend on funding — ask, don't invent).

### 5. Inquiry / complaint channel

The doc asks for a way for *families and individuals* to submit complaints about
the contest. Simplest honest version: a form writing to a table the internal
panel can read.

Note there is a precedent to follow in `src/components/FeedbackMenu.tsx`: the
signed-out feedback affordance opens a `mailto:` rather than faking a submission,
because the `feedback` table's insert policy is `profile_id = auth.uid()`. For
this contest form, an anon-insertable table is the better answer — but if you
can't make it safe, use `mailto:` rather than pretending a message was stored.

### 6. Register button animation

The wireframe notes *"there should be some animation the attend button"*. Use the
existing tokens in `tailwind.config.js` (`pop-in`, `bubble-in`, `fill-in`) —
transform/opacity only, under 250ms, and always paired with
`motion-reduce:animate-none`. That constraint is documented in the config and
enforced throughout the codebase.

## House rules for this repo

- Run `npx tsc -b --force` before every commit. Bare `tsc --noEmit` checks
  nothing here (solution-style tsconfig) — do not rely on it.
- `vite build` does not run in every sandbox (missing rolldown native binding);
  that's environmental, not a code failure.
- **Verify every new RLS policy live** with rolled-back transactions
  (`begin; set local role anon; ...; rollback;`). Test the negative cases —
  anon must not read registrations, must not update or delete. A policy that
  was never exercised is not verified.
- When testing policies as `authenticated`, `request.jwt.claims` must include
  `user_status`, `user_role`, `user_verified` — `app.is_builder()` reads
  `user_status`, so a claims object with only `sub` produces false failures.
- **No fabricated data.** No placeholder people, no invented partner names, no
  unconfirmed numbers. If something isn't known yet, leave it out or ship an
  honest empty state.
- Commit messages: explain the root cause and what was verified, not just what
  changed.
- Push is done by the founder — you cannot reach github.com.

## Definition of done

- `/contest` covers About / Judging / Register / FAQ / Sponsors, in uz/ru/en,
  and is usable by someone who has never used the product.
- A 12-year-old can register with name + region without creating an account,
  and `MINIMUM_AGE` in `src/pages/Onboarding.tsx` is still `13`, untouched.
- Registrations and complaints are visible in the internal panel and invisible
  to everyone else — proven with rolled-back RLS tests, negative cases included.
- The judging criteria published on the page are the ones that will actually be
  used.
- No prize figure until confirmed.
- `npx tsc -b --force` clean; committed on `landing-contest`.
