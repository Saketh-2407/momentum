# Momentum

A gamified task and habit tracker: an AI planner that orders your day, an animated dashboard,
streaks with kind loss-aversion (decay + freezes, not hard resets), friend leaderboards,
shareable workbooks, co-op quests, and Gmail/Calendar smart triage. See [`SPEC.md`](./SPEC.md)
for the full product spec and [`ROADMAP.md`](./ROADMAP.md) for the phase-by-phase build plan and
Definition of Done. **[`PROGRESS.md`](./PROGRESS.md) is the build log and the single most
important file to read** — it documents what's built, what's verified, and what still needs your
input, phase by phase, newest first.

## Status

All 8 roadmap phases are built, tested, and committed locally. **Nothing is deployed yet** — see
[Deploying](#deploying) below for the ~10 minutes of setup this needs from you (a database
migration run and a GitHub/Vercel connection, both of which require a human in a browser and
can't be completed autonomously). Everything else — the code, the tests, the design — is done.

## Features

| Phase | What it built |
| --- | --- |
| 0 — Foundations | Next.js 16 + Tailwind v4 + shadcn/ui + Motion, dark theme, Supabase auth (email, Google, anonymous demo mode) |
| 1 — Core engine | Tasks and habits: CRUD, scheduled day view, cadence-aware streaks |
| 2 — Gamification | XP tied to task priority, a level curve, streak decay + earnable freezes, the animated dashboard (completion ring, streak flame, XP bar, insights charts) |
| 3 — AI planner | Brain-dump → Gemini-extracted tasks → deterministic urgency/importance/energy scoring and time-blocking, with a human-in-the-loop review UI and an eval script |
| 4 — Social | Friends (request/accept), an opt-in weekly leaderboard, publishable/cloneable workbooks, co-op quests |
| 5 — Integrations | Gmail + Google Calendar smart triage: calendar events become fixed commitments the planner schedules around; action-worthy emails become accept/edit/dismiss suggestions |
| 6 — Standout + polish | Shareable progress card (real generated PNG), weekly boss battle, focus-mode timer, a full marketing landing page, global error/404 pages |
| 7 — Ship & document | This README, the consolidated open-items list in `PROGRESS.md`, and (once you deploy) a live URL |

## Stack

- **Framework:** Next.js 16 (App Router), TypeScript (strict), Turbopack
- **Styling:** Tailwind CSS v4, shadcn/ui (Base UI primitives), lucide-react icons
- **Animation:** Motion (motion.dev), respecting `prefers-reduced-motion` globally via
  `<MotionConfig reducedMotion="user">` in the root layout
- **Backend:** Supabase (Postgres, Auth, Row-Level Security)
- **AI planner:** Google Gemini (`gemini-2.5-flash`), isolated behind `lib/planner/` — see
  `PROGRESS.md`'s Setup entry for why this may need to move to a different provider before real
  Gmail data flows through it for real users
- **Testing:** Vitest + React Testing Library (unit/component), Playwright (e2e)
- **Hosting:** Vercel (once connected — see [Deploying](#deploying))

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in real values — see below
npm run dev
```

Open http://localhost:3000. Before the app is fully usable locally, also run the one-time
[Supabase setup](#one-time-supabase-setup) below (the SQL migrations haven't been applied yet).

### Environment variables

| Variable | Where it comes from |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API (server-only, never expose) |
| `GEMINI_API_KEY` | Google AI Studio |
| `GEMINI_MODEL` | Defaults to `gemini-2.5-flash` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud OAuth client (Gmail + Calendar, Phase 5) |
| `GOOGLE_REDIRECT_URI` | Your app's `/api/connectors/google/callback` URL |
| `NEXT_PUBLIC_SITE_URL` | Base URL of the deployment (`http://localhost:3000` locally) |
| `TOKEN_ENCRYPTION_KEY` | 32-byte key, base64: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` — encrypts connector refresh tokens at rest |

Real values live in `.env.local`, which is gitignored and never committed.

### One-time Supabase setup

1. Run the SQL in [`db/migrations/`](./db/migrations) **in order** (`0001` through `0006`) via
   the Supabase SQL Editor. I couldn't run these myself — this environment has no database
   credential (no DB password, no Supabase personal access token), so this is the one manual step
   every phase's `PROGRESS.md` entry has been waiting on.
2. In **Authentication → Providers**, enable **Email**, **Google** (paste the same
   `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` used above, and add
   `https://<project-ref>.supabase.co/auth/v1/callback` as an authorized redirect URI in the
   Google Cloud OAuth client), and **Anonymous Sign-Ins** (powers the no-login demo mode).

### Google Cloud setup (Gmail + Calendar smart triage, Phase 5)

This is a *separate* OAuth flow from Supabase's "Sign in with Google" above — it requests
broader, read-only data scopes (`calendar.readonly`, `gmail.readonly`) and stores its own
encrypted refresh token in the `connections` table, never touching the Supabase Auth session.

1. In the same (or a new) Google Cloud project, enable the **Gmail API** and **Google Calendar
   API** (APIs & Services → Library).
2. **OAuth consent screen**: User type **External**, publishing status **Testing**, and add
   yourself (and anyone else testing) as a **test user**. This avoids Google's formal review —
   fine for personal/testing use, required before a public launch (see `SPEC.md`).
3. Add `http://localhost:3000/api/connectors/google/callback` (and your production URL's
   equivalent once deployed) as an **authorized redirect URI** on the same OAuth client used for
   `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` above.
4. From `/dashboard/settings` in the app, click **Connect** for Calendar and/or Gmail — this
   redirects to Google's consent screen. Approving it is a one-time, human, in-browser step that
   cannot be scripted or automated; nothing else in the app can complete this on your behalf.

## Deploying

This repo is a plain git repository (initialized locally) with no GitHub remote and no Vercel
project connected yet — completing either requires an authenticated interactive session (`gh
auth login` / `vercel login` both open a browser OAuth flow), which isn't possible in this
environment. Two ways to get a live URL, easiest first:

1. Create an empty repo on GitHub, then from this folder:
   ```bash
   git remote add origin <your-new-repo-url>
   git push -u origin master
   ```
   The first push may pop a browser window for GitHub's Credential Manager login — that's
   expected and only happens once. Then on [vercel.com](https://vercel.com), **Add New → Project**
   and import that repo. Paste in the environment variables above (Project Settings →
   Environment Variables) and deploy. Every future `git push` auto-deploys.
2. Alternatively, paste a GitHub personal access token (repo scope) into a future session and an
   agent can create the repo and push via the API directly, no browser step needed.

Once deployed, update `NEXT_PUBLIC_SITE_URL` and `GOOGLE_REDIRECT_URI` (both in Vercel's env vars
and the Google Cloud OAuth client's authorized redirect URIs) to the real Vercel domain.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Serve a production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (unit + component tests) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Playwright end-to-end tests (starts its own dev server) |
| `npm run eval:planner` | Scores the AI planner against `lib/planner/eval-set.ts` using the real Gemini API. Not part of `npm test` — costs real API calls and isn't deterministic. |

## Project structure

```
app/                Routes (App Router). proxy.ts (project root) protects /dashboard and
                     redirects signed-in users away from /login, /signup.
  api/planner/       Server-side AI planner endpoint.
  api/connectors/    Google OAuth authorize/callback routes (Phase 5).
  api/progress-card/ Generates the shareable progress-card PNG (next/og).
  dashboard/         Main app: tasks, habits, brain-dump, boss battle, focus mode, insights.
  dashboard/social/  Friends, leaderboard, workbooks, co-op quests.
  dashboard/settings/ Gmail/Calendar connectors and triage inbox.
components/          React components, organized by feature (auth/, tasks/, habits/, dashboard/,
                     planner/, social/, settings/, marketing/); components/ui/ is shadcn/ui.
lib/                 Framework-free, near-100%-unit-tested logic:
  auth/              Route protection rules.
  supabase/          Browser/server clients + hand-authored database types.
  tasks/, habits/    Validation, scheduling, cadence, streaks.
  gamification/      XP, levels, streak decay/freeze, insights, boss battle, focus XP.
  planner/           The AI planner: types, prompt, scoring/scheduling, provider abstraction,
                     eval set. lib/planner/providers/gemini.ts is the only provider today.
  connectors/        Google OAuth, Calendar/Gmail API mapping, token encryption, email classifier.
  social/            Leaderboard ranking, co-op quest progress.
  ai/                Shared Gemini JSON-calling helper used by both the planner and the
                     Gmail classifier.
db/migrations/       Hand-applied SQL migrations, in order (0001-0006). No migration runner —
                     see PROGRESS.md's Setup entry for why.
scripts/             eval-planner.ts — the planner eval runner (npm run eval:planner).
tests/               tests/unit (pure logic), tests/components (RTL), tests/e2e (Playwright).
```

## Auth model

Three ways in, all producing a normal Supabase-authenticated session subject to the same
Row-Level Security policies:

- **Email + password** — `supabase.auth.signUp` / `signInWithPassword`.
- **Google** — `supabase.auth.signInWithOAuth({ provider: "google" })`. This is Supabase's own
  OAuth flow for *identity* (who is this user), separate from the Gmail/Calendar *data* OAuth
  flow built in Phase 5, which requests broader scopes and stores its own refresh token in a
  `connections` table rather than relying on the Supabase session.
- **Demo mode** — `supabase.auth.signInAnonymously()`. Anonymous users are real (if temporary)
  Supabase-authenticated users, so they get the exact same RLS-protected data model as everyone
  else with no special-casing in application code.

`proxy.ts` (Next.js 16's renamed `middleware.ts`) refreshes the session on every request and
enforces route protection centrally; see `lib/supabase/middleware.ts` and
`lib/auth/protected-routes.ts` for the actual logic.

## What to read next

- **`PROGRESS.md`** — start here. Read top-down; each phase entry explains what was built, what
  was verified and how, and what's deferred to you.
- **`SPEC.md`** / **`ROADMAP.md`** — the product spec and phase plan this was built against.
- This README's [Deploying](#deploying) section — the one step standing between this repo and a
  live URL.
