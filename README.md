# Momentum

Momentum is a gamified task and habit tracker. An AI planner turns a messy brain-dump into an
ordered, time-blocked plan; XP, levels, and forgiving streaks (decay and earnable freezes instead
of hard resets) turn getting things done into something worth coming back to; and friends,
leaderboards, shareable routines, and co-op quests make the habit social.

## Features

- **AI planner** — dump your tasks in any order and get back a plan scored by urgency,
  importance, and effort, with a plain-language reason for each item. Review, tweak, or regenerate
  before anything is saved.
- **Gamification** — XP scaled to task priority, a level curve, and streaks that decay gently or
  spend an earned freeze instead of resetting to zero on a missed day.
- **Animated dashboard** — a completion ring, a live streak flame, an XP bar, and insights into
  completion trends, best times of day, and category breakdown.
- **Social** — add friends, compete on a weekly leaderboard (opt-in), publish and clone shareable
  task/habit "workbooks," and take on co-op quests together.
- **Gmail + Google Calendar smart triage** — calendar events become fixed commitments the planner
  schedules around; action-worthy emails become suggested tasks you accept, edit, or dismiss.
- **Shareable progress card** — a generated image of your level, streak, and weekly XP, ready to
  download or share.
- **Weekly boss battle** — a bonus-XP goal that resets each week.
- **Focus mode** — a Pomodoro-style timer that awards XP for focused sessions.

## Tech stack

- **Framework:** Next.js 16 (App Router), TypeScript (strict), Turbopack
- **Styling:** Tailwind CSS v4, shadcn/ui (Base UI primitives), lucide-react icons
- **Animation:** Motion (motion.dev), respecting `prefers-reduced-motion` globally
- **Backend:** Supabase (Postgres, Auth, Row-Level Security)
- **AI planner:** Google Gemini (`gemini-2.5-flash`), isolated behind `lib/planner/` so the
  provider can be swapped in one place
- **Testing:** Vitest + React Testing Library (unit/component), Playwright (e2e)
- **Hosting:** Vercel

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in real values — see below
npm run dev
```

Open http://localhost:3000. Complete the [Supabase setup](#one-time-supabase-setup) below before
the app is fully usable.

### Environment variables

| Variable | Where it comes from |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API (publishable/anon key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API (server-only, never expose) |
| `GEMINI_API_KEY` | Google AI Studio |
| `GEMINI_MODEL` | Defaults to `gemini-2.5-flash` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud OAuth client (Gmail + Calendar) |
| `GOOGLE_REDIRECT_URI` | Your app's `/api/connectors/google/callback` URL |
| `NEXT_PUBLIC_SITE_URL` | Base URL of the deployment (`http://localhost:3000` locally) |
| `TOKEN_ENCRYPTION_KEY` | 32-byte key, base64: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` — encrypts connector refresh tokens at rest |

Real values live in `.env.local`, which is gitignored and never committed.

### One-time Supabase setup

1. Create a Supabase project, then run the SQL in [`db/migrations/`](./db/migrations) **in
   order** (`0001` through `0006`) via the Supabase SQL Editor.
2. In **Authentication → Providers**, enable **Email**, **Google** (paste the same
   `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` used above, and add
   `https://<project-ref>.supabase.co/auth/v1/callback` as an authorized redirect URI in the
   Google Cloud OAuth client), and **Anonymous Sign-Ins** (powers the no-login demo mode).

### Google Cloud setup (Gmail + Calendar)

This is a *separate* OAuth flow from Supabase's "Sign in with Google" above — it requests
broader, read-only data scopes (`calendar.readonly`, `gmail.readonly`) and stores its own
encrypted refresh token in the `connections` table, never touching the Supabase Auth session.

1. In a Google Cloud project, enable the **Gmail API** and **Google Calendar API** (APIs &
   Services → Library).
2. **OAuth consent screen**: User type **External**. While testing, keep publishing status
   **Testing** and add test users; move to production and complete Google's verification before a
   public launch (Gmail's read scope is "restricted" and requires a security assessment; Calendar's
   is "sensitive" and needs a lighter review).
3. Add `http://localhost:3000/api/connectors/google/callback` (and your production URL's
   equivalent once deployed) as an **authorized redirect URI** on the OAuth client used for
   `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` above.
4. From `/dashboard/settings` in the app, click **Connect** for Calendar and/or Gmail to complete
   the OAuth consent flow.

## Deploying to Vercel

1. Push this repo to GitHub.
2. On [vercel.com](https://vercel.com), **Add New → Project** and import the repo.
3. Add all the environment variables above under Project Settings → Environment Variables.
4. Deploy. Every future push to the default branch auto-deploys.
5. Update `NEXT_PUBLIC_SITE_URL` and `GOOGLE_REDIRECT_URI` (both in Vercel's env vars and the
   Google Cloud OAuth client's authorized redirect URIs) to the real deployed domain.

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
app/                 Routes (App Router). proxy.ts (project root) protects /dashboard and
                      redirects signed-in users away from /login, /signup.
  api/planner/        Server-side AI planner endpoint.
  api/connectors/     Google OAuth authorize/callback routes.
  api/progress-card/  Generates the shareable progress-card PNG.
  dashboard/          Main app: tasks, habits, brain-dump, boss battle, focus mode, insights.
  dashboard/social/   Friends, leaderboard, workbooks, co-op quests.
  dashboard/settings/ Gmail/Calendar connectors and triage inbox.
components/           React components, organized by feature (auth/, tasks/, habits/, dashboard/,
                      planner/, social/, settings/, marketing/); components/ui/ is shadcn/ui.
lib/                  Framework-free, unit-tested logic:
  auth/               Route protection rules.
  supabase/           Browser/server clients + database types.
  tasks/, habits/     Validation, scheduling, cadence, streaks.
  gamification/       XP, levels, streak decay/freeze, insights, boss battle, focus XP.
  planner/            The AI planner: types, prompt, scoring/scheduling, provider abstraction,
                      eval set.
  connectors/         Google OAuth, Calendar/Gmail API mapping, token encryption, email classifier.
  social/             Leaderboard ranking, co-op quest progress.
  ai/                 Shared Gemini JSON-calling helper used by the planner and Gmail classifier.
db/migrations/        SQL migrations, in order (0001-0006).
scripts/              eval-planner.ts — the planner eval runner (npm run eval:planner).
tests/                tests/unit (pure logic), tests/components (RTL), tests/e2e (Playwright).
```

## Auth model

Three ways in, all producing a normal Supabase-authenticated session subject to the same
Row-Level Security policies:

- **Email + password** — `supabase.auth.signUp` / `signInWithPassword`.
- **Google** — `supabase.auth.signInWithOAuth({ provider: "google" })`. This is Supabase's own
  OAuth flow for *identity* (who is this user), separate from the Gmail/Calendar *data* OAuth
  flow, which requests broader scopes and stores its own refresh token in a `connections` table
  rather than relying on the Supabase session.
- **Demo mode** — `supabase.auth.signInAnonymously()`. Anonymous users are real (if temporary)
  Supabase-authenticated users, so they get the exact same RLS-protected data model as everyone
  else with no special-casing in application code.

`proxy.ts` refreshes the session on every request and enforces route protection centrally; see
`lib/supabase/middleware.ts` and `lib/auth/protected-routes.ts`.
