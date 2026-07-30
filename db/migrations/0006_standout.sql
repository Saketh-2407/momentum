-- Momentum: weekly boss battle + focus mode (Phase 6 standout features).
-- Run once in the Supabase SQL Editor, after 0001-0005.

-- One row per user per ISO week (Monday). Created lazily the first time a
-- user's dashboard loads for a given week — no cron needed.
create table public.boss_battles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  target_count integer not null,
  bonus_xp integer not null,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table public.boss_battles enable row level security;

create policy "Users can view own boss battles" on public.boss_battles
  for select using (auth.uid() = user_id);
create policy "Users can create own boss battles" on public.boss_battles
  for insert with check (auth.uid() = user_id);
create policy "Users can update own boss battles" on public.boss_battles
  for update using (auth.uid() = user_id);

-- A completed Pomodoro-style focus session, optionally tied to a task.
create table public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete set null,
  duration_minutes integer not null check (duration_minutes > 0),
  completed_at timestamptz not null default now()
);

create index focus_sessions_user_id_idx on public.focus_sessions (user_id, completed_at);

alter table public.focus_sessions enable row level security;

create policy "Users can view own focus sessions" on public.focus_sessions
  for select using (auth.uid() = user_id);
create policy "Users can insert own focus sessions" on public.focus_sessions
  for insert with check (auth.uid() = user_id);
