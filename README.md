# Momentum

A gamified task and habit tracker with an AI planner, an animated dashboard, friend
leaderboards, and shareable routines. See [`SPEC.md`](./SPEC.md) for the full product spec and
[`ROADMAP.md`](./ROADMAP.md) for the phase-by-phase build plan and Definition of Done. Progress
against the roadmap is logged in [`PROGRESS.md`](./PROGRESS.md).

## Stack

- **Framework:** Next.js 16 (App Router), TypeScript (strict), Turbopack
- **Styling:** Tailwind CSS v4, shadcn/ui (Base UI primitives), lucide-react icons
- **Animation:** Motion (motion.dev), respecting `prefers-reduced-motion` globally via
  `<MotionConfig reducedMotion="user">` in the root layout
- **Backend:** Supabase (Postgres, Auth, Row-Level Security)
- **AI planner:** Google Gemini (`gemini-2.5-flash`), isolated behind `lib/planner/` (Phase 3+)
- **Testing:** Vitest + React Testing Library (unit/component), Playwright (e2e)
- **Hosting:** Vercel

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in real values — see below
npm run dev
```

Open http://localhost:3000.

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

Real values live in `.env.local`, which is gitignored and never committed.

### One-time Supabase setup

1. Run the SQL in [`db/migrations/`](./db/migrations) (in order) via the Supabase SQL Editor.
2. In **Authentication → Providers**, enable **Email**, **Google** (paste the same
   `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` used above, and add
   `https://<project-ref>.supabase.co/auth/v1/callback` as an authorized redirect URI in the
   Google Cloud OAuth client), and **Anonymous Sign-Ins** (powers the no-login demo mode).

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
app/          Routes (App Router). proxy.ts (project root) protects /dashboard and
              redirects signed-in users away from /login, /signup.
components/   React components. components/ui/ is shadcn/ui; components/auth/ etc.
              are app-specific.
lib/          Framework-free logic (auth route rules, Supabase clients, the planner
              in lib/planner/, connectors in lib/connectors/). Near-100% unit-tested.
db/migrations/ Hand-applied SQL migrations, in order. No migration runner yet — see
              PROGRESS.md for why.
tests/        tests/unit (pure logic), tests/components (RTL), tests/e2e (Playwright).
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
