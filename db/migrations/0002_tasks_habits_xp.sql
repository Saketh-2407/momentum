-- Momentum: Task, Habit, and XP-event ledger tables with RLS.
-- Run once in the Supabase SQL Editor, after 0001_init_profiles.sql.

create type task_status as enum ('todo', 'done', 'skipped');
create type cadence_type as enum ('daily', 'weekly');

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  notes text,
  category text,
  scheduled_at timestamptz,
  deadline timestamptz,
  importance smallint not null default 3 check (importance between 1 and 5),
  effort smallint not null default 3 check (effort between 1 and 5),
  status task_status not null default 'todo',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_user_id_idx on public.tasks (user_id);
create index tasks_scheduled_at_idx on public.tasks (user_id, scheduled_at);

alter table public.tasks enable row level security;

create policy "Users can view own tasks" on public.tasks
  for select using (auth.uid() = user_id);
create policy "Users can insert own tasks" on public.tasks
  for insert with check (auth.uid() = user_id);
create policy "Users can update own tasks" on public.tasks
  for update using (auth.uid() = user_id);
create policy "Users can delete own tasks" on public.tasks
  for delete using (auth.uid() = user_id);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  notes text,
  cadence_type cadence_type not null default 'daily',
  -- Only used when cadence_type = 'weekly'. 0 = Sunday .. 6 = Saturday.
  days_of_week smallint[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index habits_user_id_idx on public.habits (user_id);

alter table public.habits enable row level security;

create policy "Users can view own habits" on public.habits
  for select using (auth.uid() = user_id);
create policy "Users can insert own habits" on public.habits
  for insert with check (auth.uid() = user_id);
create policy "Users can update own habits" on public.habits
  for update using (auth.uid() = user_id);
create policy "Users can delete own habits" on public.habits
  for delete using (auth.uid() = user_id);

create table public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- The user's local calendar date (YYYY-MM-DD) the habit was completed on,
  -- not an instant — streaks are calendar-day math, not 24h-window math.
  completed_on date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, completed_on)
);

create index habit_completions_habit_id_idx on public.habit_completions (habit_id);

alter table public.habit_completions enable row level security;

create policy "Users can view own habit completions" on public.habit_completions
  for select using (auth.uid() = user_id);
create policy "Users can insert own habit completions" on public.habit_completions
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own habit completions" on public.habit_completions
  for delete using (auth.uid() = user_id);

-- Append-only ledger. Every XP change (task completion, habit streak, bonus)
-- is recorded here so the dashboard and leaderboard can derive totals exactly
-- and reconstruct history. Not populated until Phase 2 (gamification).
create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null,
  reason text not null,
  source_type text not null check (source_type in ('task', 'habit', 'bonus')),
  source_id uuid,
  created_at timestamptz not null default now()
);

create index xp_events_user_id_idx on public.xp_events (user_id, created_at);

alter table public.xp_events enable row level security;

create policy "Users can view own xp events" on public.xp_events
  for select using (auth.uid() = user_id);
create policy "Users can insert own xp events" on public.xp_events
  for insert with check (auth.uid() = user_id);
