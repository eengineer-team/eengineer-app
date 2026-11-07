# eengineer Physics backend setup

The site runs without a backend: the waitlist and the AI tutor just show an offline notice. This guide turns both on. It takes about 20 minutes, and nothing here deploys the website itself.

What you'll end up with:

| Piece | Where it lives | What it does |
|---|---|---|
| `physics_waitlist` table | `supabase/migrations/20261107000001_physics_waitlist.sql` | Stores Pro waitlist emails. Clients can insert only; nobody can read the list from the browser. |
| `tutor_usage`, `tutor_global_usage`, `tutor_consume()`, `tutor_release()` | `supabase/migrations/20261107000002_tutor_usage.sql` | Per-student daily limit plus a global daily cap that protects the API budget. |
| `tutor` Edge Function | `supabase/functions/tutor/` | Checks the student's session, validates the request, counts it, and calls Claude. The Anthropic key stays on the server. |

All commands below are run from `E:\eengineer-app\physics-prep` (not the repo root).

> **Use a separate Supabase project for Physics.** The repo root (`E:\eengineer-app\supabase`) already belongs to another Supabase project with its own migration history. If you link `physics-prep` to that same project, `supabase db push` will refuse because the remote has migrations this folder doesn't know about. A second project on the free plan avoids that. (If you really want one project, copy the two migration files into the root `supabase/migrations` and the `functions/tutor` folder into the root `supabase/functions`, and run the commands from the root instead.)

## 0. Supabase CLI

The repo root already has the Supabase CLI installed as a dev dependency. From `physics-prep`, call it as:

```powershell
..\node_modules\.bin\supabase.cmd --version
```

The rest of this guide writes `supabase ...` for short; substitute the path above (or `npx supabase@latest ...`).

## 1. Create the Supabase project

1. Go to https://supabase.com/dashboard and click **New project**.
2. Name it `eengineer-physics`, pick a strong database password (save it in your password manager), and choose the region closest to most students (for US students, an East US region is a good default).
3. When it's ready, open **Project Settings → General** and copy the **Project ID** (the project ref, e.g. `abcdefghijklmnop`).

Link this folder to it:

```powershell
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

`link` asks for the database password from step 2.

## 2. Apply the migrations

```powershell
supabase db push
```

It lists the two migrations and asks for confirmation. Afterwards, check in the dashboard under **Table Editor** that `physics_waitlist`, `tutor_usage` and `tutor_global_usage` exist, each marked with RLS enabled.

No CLI? Open **SQL Editor**, paste the contents of `20261107000001_physics_waitlist.sql`, run it, then do the same for `20261107000002_tutor_usage.sql`, in that order.

## 3. Enable anonymous sign-ins

The tutor rate-limits per student without asking anyone to create an account: the app signs each browser in anonymously.

1. Dashboard → **Authentication → Sign In / Providers**.
2. Turn on **Allow anonymous sign-ins** and save.
3. Optional but recommended: **Authentication → Rate Limits** controls how many anonymous sign-ins one IP can make per hour. The default is fine for launch; lower it if you see abuse. (A cleared browser gets a fresh anonymous user and therefore a fresh daily allowance. The global daily cap in step 4 is what bounds total spend no matter what.)

## 4. Get an Anthropic API key with a spend limit

Do this before setting secrets so the hard budget backstop exists from day one.

1. Sign in at https://console.anthropic.com.
2. **Settings → Workspaces → Create workspace**, name it `eengineer-physics`. A dedicated workspace keeps this app's usage and limits separate from anything else you run.
3. In that workspace, set a **monthly spend limit** of $100 (Settings → Limits, or the workspace's Limits tab). When it's reached, API calls fail and the tutor shows "unavailable" instead of running up a bill. Also set an email **spend alert** at around $70.
4. **API Keys → Create key**, in the `eengineer-physics` workspace. Copy it once; it starts with `sk-ant-`.

Never put this key in `.env.local`, frontend code, or a commit. It only goes into Supabase secrets.

## 5. Set the function secrets

Create a file **outside the repo**, for example `C:\Users\<you>\eengineer-tutor.env`:

```ini
ANTHROPIC_API_KEY=sk-ant-...
TUTOR_FREE_DAILY_LIMIT=5
TUTOR_GLOBAL_DAILY_LIMIT=80
# Optional: lock CORS to your site(s). Leave unset to allow any origin.
TUTOR_ALLOWED_ORIGINS=https://physics.eengineer.net,http://localhost:5173
```

Then:

```powershell
supabase secrets set --env-file C:\Users\<you>\eengineer-tutor.env
supabase secrets list
```

Delete the file afterwards (or keep it only in your password manager). Using a file keeps the key out of your shell history.

| Secret | Default | Meaning |
|---|---|---|
| `ANTHROPIC_API_KEY` | none (required) | Without it the tutor answers "unavailable" and no question is counted. |
| `TUTOR_FREE_DAILY_LIMIT` | 5 | Questions per student per UTC day. |
| `TUTOR_GLOBAL_DAILY_LIMIT` | 80 | Questions across all students per UTC day. This is the budget guard. |
| `TUTOR_ALLOWED_ORIGINS` | any origin | Comma-separated list of origins allowed by CORS. Use the exact origin of your site, no trailing slash. |

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are provided to Edge Functions automatically; don't set them.

### Sizing the global cap

The tutor uses Claude Opus 5.5 ($4 per million input tokens, $20 per million output tokens) with adaptive thinking at medium effort, at most 4,000 output tokens per reply. A typical question sends roughly 2,000 to 5,000 input tokens (instructions, problem, reference solution, recent chat) and gets back a few hundred to about 1,500 output tokens including thinking, so expect very roughly $0.02 to $0.05 per question, and about $0.10 at the absolute worst.

Budget per day is $100 / 30 ≈ $3.30. At an estimated $0.04 per question that's about 80 questions a day, which is where the default comes from. After the first week, check the real cost in the Anthropic Console (Usage / Cost for the workspace), then set:

```
TUTOR_GLOBAL_DAILY_LIMIT ≈ 3.30 / (actual cost per question)
```

and re-run `supabase secrets set`. Secrets take effect on the next request, no redeploy needed. The Console spend limit stays as the hard stop either way.

## 6. Deploy the function

```powershell
supabase functions deploy tutor
```

`supabase/config.toml` keeps `verify_jwt = true`, so the Supabase gateway rejects requests without a valid session token before they reach the function. The function also re-checks the token with `auth.getUser` because it needs the user id for rate limiting.

If the deploy complains that Docker isn't running, add `--use-api` to bundle on Supabase's side instead.

## 7. Point the site at the backend

Dashboard → **Project Settings → API Keys**. Copy the project URL and the **publishable** key (`sb_publishable_...`). Do not use the secret / service-role key in the frontend.

Create `physics-prep/.env.local` (already git-ignored):

```ini
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Restart the dev server (`npm run dev`) so Vite picks it up. For production, set the same two variables in your hosting provider's environment settings and rebuild.

## 8. Check that it works

1. Open any practice problem and click **Stuck? Ask the tutor**. Ask "Where do I start?". You should get a short hint (not the answer) and a "4 questions left today" line.
2. Submit the waitlist form on the landing or Pro page, then confirm the row in **Table Editor → physics_waitlist**.
3. In **Table Editor → tutor_usage** you'll see one row per student per day; `tutor_global_usage` has one row per day.
4. Function logs: **Edge Functions → tutor → Logs**. The function logs only error classes and status codes, never prompts, student text or keys.

To reset a test user's allowance today, run in the SQL Editor:

```sql
delete from public.tutor_usage where day = (now() at time zone 'utc')::date;
delete from public.tutor_global_usage where day = (now() at time zone 'utc')::date;
```

## Troubleshooting

| Symptom in the app | Likely cause | Fix |
|---|---|---|
| "The tutor isn't connected in this preview" | `.env.local` missing or dev server not restarted | Step 7. |
| "Couldn't start a tutor session" | Anonymous sign-ins are off, or the anonymous sign-in rate limit was hit | Step 3. |
| "The tutor is unavailable right now" on every question | `ANTHROPIC_API_KEY` missing or wrong, Console spend limit reached, or the migrations weren't applied | Check `supabase secrets list`, the Console limits page, and the function logs (look for `tutor_consume failed` or `Anthropic API error 401`). |
| Every request fails with 401 | The token isn't reaching the function, or the gateway rejects it | Make sure the frontend uses this project's URL and publishable key. If the project uses the new asymmetric JWT signing keys and the gateway check misbehaves, see Supabase's current docs on `verify_jwt`. The function verifies the token itself, so setting `verify_jwt = false` in `config.toml` is a safe fallback. |
| "Today's free tutor questions are used up" for everyone | The global cap was reached | Expected on a busy day. Raise `TUTOR_GLOBAL_DAILY_LIMIT` only if the budget allows. |
| CORS error in the browser console | `TUTOR_ALLOWED_ORIGINS` doesn't include the site's exact origin | Add it (scheme + host + port, no path) and re-set the secret. |

## Security notes

- The Anthropic key lives only in Supabase secrets. It is never logged and never returned to the browser; errors from the API become a generic `unavailable`.
- The rate-limit tables have RLS on and no client policies. `tutor_consume` and `tutor_release` are `security definer` with `search_path = ''` and are executable by `service_role` only, so a student can't reset or inspect counters.
- Requests are validated server-side: statement, prompt and reference solution ≤ 4,000 characters each, student answer ≤ 500, at most 10 chat messages of ≤ 2,000 characters, alternating roles that end with the student. Anything else is rejected before a question is counted.
- The problem text and reference solution come from the browser, so a determined student could edit them. That only affects their own tutor session, and the size limits, per-user limit and global cap bound the cost. Moving the problem bank server-side (for Pro) would remove this.
- A question is refunded only when the Claude call fails for network or API reasons. Refusals still count, since they can consume tokens.
