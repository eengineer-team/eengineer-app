# eengineer Physics: AP Physics C: Mechanics prep (MVP)

Interactive AP Physics C: Mechanics prep under the eengineer.net brand. Free tools and starter
problems build the habit; Pro (not live yet) adds the full problem bank, mock exams and unlimited tutoring.

## What's inside

| Route | What it is | Code |
|---|---|---|
| `/` | Landing page, animated projectile hero, early-access form, FAQ | `src/features/landing` |
| `/pro` | Free vs Pro; "Get Pro" is an honest demand test (email capture, no checkout) | `src/features/landing` |
| `/practice`, `/practice/:id` | 32 original problems (7 units), answer checking, hints, worked solutions, progress | `src/features/practice`, `src/content/problems` |
| `/tools/free-body` | Free-body diagram builder with "Check my diagram" feedback (5 scenarios) | `src/features/fbd` |
| `/tools/motion` | Motion simulator: projectile, incline, Atwood, free fall, spring, with x/v/a graphs | `src/features/motion` |
| AI tutor (on each problem part) | Socratic tutor, Claude Opus 5.5 via a Supabase Edge Function | `src/features/tutor`, `supabase/` |

Shared contracts: `src/types/problem.ts` (problem shape, simulator presets), `src/components/ui.tsx`
(primitives), `tailwind.config.js` + `src/index.css` (semantic color tokens, light + dark).

## Where it lives on the website

It is served at **eengineer.net/physics** by the main eengineer.net Vercel project. No separate Vercel
setup is needed: the root `vite.config.ts` builds this app into `dist/physics` (with base `/physics/`) as
part of the main build, and the root `vercel.json` routes `/physics/*` to it. Push to `main` and both deploy.

Its Supabase settings are `VITE_PHYSICS_SUPABASE_URL` / `VITE_PHYSICS_SUPABASE_PUBLISHABLE_KEY`, kept
separate from the main app's `VITE_SUPABASE_*` so it can never connect to the live eengineer database.

## Run it

This folder currently uses the parent repo's `node_modules` (no separate install needed):

```bash
node ../node_modules/vite/bin/vite.js          # dev server on http://localhost:5190
node ../node_modules/typescript/bin/tsc -p .   # type-check
node ../node_modules/vite/bin/vite.js build    # production build to dist/
```

To make it fully standalone later: `npm install` here, then `npm run dev` / `npm run build`.

Without `.env.local` the app runs fully except the waitlist and AI tutor, which show an offline notice.

## Backend (not deployed yet)

`supabase/` holds the migrations (waitlist, tutor rate limits) and the `tutor` Edge Function.
Follow `docs/BACKEND.md` to create a **separate** Supabase project, set `ANTHROPIC_API_KEY`, deploy,
and set a spend limit in the Anthropic Console. Defaults: 5 tutor questions per user per day,
80 per day in total (fits a ~$100/month API budget; adjust after a week of real usage).

## Content rules

All problems are original. Never copy College Board questions. Every answer was computed with a
script and independently re-solved by a second checker; keep doing that for new problems.
