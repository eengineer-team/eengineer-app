# Finish eengineer — completion runbook

Everything left to ship, in order. Backend is LIVE and verified; the rest is
your dashboard clicks, Claude Code (frontend), and Vercel. Work top to bottom.

## Where things stand (done)

- **Supabase backend LIVE** (project ref `bgdlpdokubhutwicsfyp`): 25 tables, RLS on all
  (66 policies, deny-by-default), auth hook + signup trigger, storage buckets, age/consent
  tables (block 18), security advisors clean. Migrations in `supabase/migrations/`,
  reference data in `supabase/seed.sql`, spec in `docs/AUTHORIZATION.md`.
- **Auth works end-to-end**: GitHub login → Supabase → profile + role created (verified).
- **Frontend AUTH domain migrated** to `supabase.auth` (`src/lib/auth-context.tsx`,
  `src/lib/supabase.ts`, `src/lib/database.types.ts`). Boot/loader screens added.
- **Reference data seeded**: competitions (3), webinars (4), opportunities (6).

## Reference values (you'll reuse these)

- Supabase URL: `https://bgdlpdokubhutwicsfyp.supabase.co`
- **OAuth callback URL** (set this in GitHub/LinkedIn/Google app settings):
  `https://bgdlpdokubhutwicsfyp.supabase.co/auth/v1/callback`
- Publishable key: already in `.env.local` (`VITE_SUPABASE_PUBLISHABLE_KEY`).
- Local redirect allow-list entry: `http://localhost:5173/**`
- Frontend migration prompt: **block 19** in `docs/claude-code-fix-prompts.md`.

---

## Step 1 — Finish the two remaining OAuth providers  (Supabase dashboard, ~15 min)

GitHub is done. Same pattern for the other two. Authentication → Providers.

### LinkedIn (provider is "LinkedIn (OIDC)")
1. linkedin.com/developers → Create app.
2. Products → add **"Sign In with LinkedIn using OpenID Connect"**.
3. Auth tab → Authorized redirect URLs → add the callback URL above.
4. Copy Client ID + Client Secret → Supabase → LinkedIn (OIDC) → Enable → paste → Save.

### Google (this is the "preview" path)
1. Google Cloud Console → APIs & Services → OAuth consent screen (configure once).
2. Credentials → Create OAuth client ID → **Web application** → Authorized redirect URI =
   the callback URL above.
3. Copy Client ID + Secret → Supabase → Google → Enable → paste → Save.

Test each by clicking its button on `/auth`. Google returns a read-only preview (no profile).

*(Optional hardening: Authentication → Providers → disable **Email** if you only want social
login, or enable "leaked password protection" — harmless either way since you use OAuth.)*

---

## Step 2 — Migrate the frontend to Supabase  (Claude Code, block 19 — the big one)

The dashboard still reads mock/localStorage. Wire it to the live backend, one domain at a time.

**Prereqs (once):** `npm install` in the repo; make sure `.env.local` exists (it does);
Step 1 providers + the Custom Access Token hook are on (they are).

**How to run it:** open Claude Code in the repo and paste this first message:

```
The Supabase backend is LIVE (ref bgdlpdokubhutwicsfyp): schema, RLS, auth hook, storage
buckets, and seeded reference data all exist. The AUTH domain is already migrated in
src/lib/auth-context.tsx — do NOT redo it. Follow block 19 in docs/claude-code-fix-prompts.md
exactly. Do DOMAIN 1 (profiles) ONLY this round: create src/lib/api/profiles.ts and rewrite
src/lib/profiles-context.tsx onto Supabase, keeping useProfiles() byte-identical (no component/
JSX changes). Remember: profile_project_entries (portfolio) ≠ projects (hub); connectStatus/
mutuals are derived per viewer from `connections`; birthdate/guardian live in profile_private
(self-only); avatars upload to the `avatars` bucket at `<uid>/<file>`. RLS is the only auth
boundary — keep permissions.ts as UX. Run `npm run build`, then stop and tell me what to test.
Do not push to origin.
```

Then, after you smoke-test each domain, send the next one:
- `Continue with DOMAIN 2 (projects) per block 19.`
- `Continue with DOMAIN 3 (community: questions/votes/comments, clubs, webinars+RSVP) per block 19.`
- `Continue with DOMAIN 4 (messages, Supabase Realtime) per block 19.`
- `Continue with DOMAIN 5 (opportunities read + calendar). The opportunities table is already
   widened and seeded — just read from it; drop the local SEED_OPPORTUNITIES.`

**Smoke-test after each domain:** sign in → create something → edit your own → confirm you
*cannot* edit someone else's → refresh (it persists) → sign out/in (clean).

---

## Step 3 — Age-gate, consent, report/block  (Claude Code, block 18 app-side)

Backend tables exist (`profile_private`, `consent_records`, `reports`, `blocks`); the UI isn't
wired. Paste **block 18** from `docs/claude-code-fix-prompts.md` into Claude Code after Step 2.
It adds: a date-of-birth step in onboarding (writes `profile_private`, hard-blocks under-13),
guardian-consent flow where required, and report/block buttons in Messages. Do this before any
public launch — it's the minors-safety baseline.

---

## Step 4 — Real Terms/Privacy + legal review

`src/pages/legal/Terms.tsx` / `Privacy.tsx` are mock-stage drafts. Block 18 §5 has Claude Code
rewrite them to match what the backend actually collects (OAuth identity, profile, messages,
age; stored in Supabase; retention; minors'/guardians' rights; how to request deletion). **Then
have a real lawyer review them before public launch** — this is not legal advice, and rules for
minors' data vary by country (COPPA / GDPR-K / local law).

---

## Step 5 — UI polish (optional, Claude Code — blocks 5 / 13 / 14)

Not blockers, but they were in the audit:
- **Block 5**: replace the remaining stock photos (Opportunities cards, project covers) and the
  generic lucide discipline glyphs with the brand `DisciplineMotif`.
- **Blocks 13/14**: token/cleanup tidy-ups.
- Delete the now-unused `src/lib/use-disable-zoom.ts` (I couldn't remove it from my sandbox).

---

## Step 6 — Deploy to Vercel  (your hands, last)

Do this only after Steps 1–2 are verified locally.

1. **Vercel → Project → Settings → Environment Variables** (all environments): add
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (same values as `.env.local`).
2. **Supabase → Authentication → URL Configuration**: set Site URL to your production domain
   and add `https://YOUR_DOMAIN/**` to Redirect URLs. (The OAuth provider callback stays the
   Supabase callback — no change there.)
3. **Commit + push** (on your machine, where git works normally):
   `git add -A && git commit -m "supabase frontend migration"` → make sure it's on `main`
   (`git checkout main && git merge <your-branch>` if needed) → `git push origin main`.
   That triggers the Vercel deploy.
4. After deploy: test GitHub login on the production URL.

⚠️ Don't push before Steps 1–2 are green — pushing deploys, and a half-migrated build with
unconfigured providers would break login in production.

---

## File map (what lives where)

- `supabase/migrations/*.sql` — schema, RLS, auth, block 18, storage, opportunities widen.
- `supabase/seed.sql` — competitions / webinars / opportunities reference data.
- `supabase/tests/authorization_test.sql` — RLS positive/negative tests.
- `docs/AUTHORIZATION.md` — the permission matrix + Action→RLS map + gaps.
- `docs/claude-code-fix-prompts.md` — blocks 1–15 (UX/UI), 16–18 (backend), 19 (frontend migration).
- `src/lib/supabase.ts`, `src/lib/database.types.ts`, `src/lib/auth-context.tsx` — the live wiring.
```
