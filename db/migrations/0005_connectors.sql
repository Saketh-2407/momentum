-- Momentum: Gmail + Google Calendar smart triage (connectors, suggested
-- tasks, cached calendar events). Run once in the Supabase SQL Editor, after
-- 0001-0004.

create type connector_provider as enum ('google_calendar', 'gmail');

-- One row per connected source per user. The refresh token is encrypted
-- application-side (AES-256-GCM, TOKEN_ENCRYPTION_KEY) before it ever
-- reaches Postgres — RLS is the second layer of defense, not the only one.
create table public.connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider connector_provider not null,
  encrypted_refresh_token text not null,
  scope text not null,
  sync_cursor text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, provider)
);

alter table public.connections enable row level security;

create policy "Users can view own connections" on public.connections
  for select using (auth.uid() = user_id);
create policy "Users can create own connections" on public.connections
  for insert with check (auth.uid() = user_id);
create policy "Users can update own connections" on public.connections
  for update using (auth.uid() = user_id);
create policy "Users can delete own connections" on public.connections
  for delete using (auth.uid() = user_id);

-- Calendar events synced read-only from Google Calendar, used as fixed
-- commitments the planner schedules around. A cache, not the source of
-- truth — safe to wipe and re-sync at any time.
create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_ref text not null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  is_all_day boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, source_ref)
);

create index calendar_events_user_id_idx on public.calendar_events (user_id, starts_at);

alter table public.calendar_events enable row level security;

create policy "Users can view own calendar events" on public.calendar_events
  for select using (auth.uid() = user_id);
create policy "Users can insert own calendar events" on public.calendar_events
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own calendar events" on public.calendar_events
  for delete using (auth.uid() = user_id);

-- Gmail-derived suggestions: never auto-created as real tasks. Stores a
-- lightweight reference (message id) and the derived title/deadline only —
-- not the email body — per INTEGRATIONS.md's "store the minimum" rule.
create table public.suggested_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_type text not null default 'gmail' check (source_type = 'gmail'),
  source_ref text not null,
  title text not null,
  notes text,
  suggested_deadline timestamptz,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'dismissed')),
  created_at timestamptz not null default now(),
  unique (user_id, source_ref)
);

create index suggested_tasks_user_id_idx on public.suggested_tasks (user_id, status);

alter table public.suggested_tasks enable row level security;

create policy "Users can view own suggested tasks" on public.suggested_tasks
  for select using (auth.uid() = user_id);
create policy "Users can insert own suggested tasks" on public.suggested_tasks
  for insert with check (auth.uid() = user_id);
create policy "Users can update own suggested tasks" on public.suggested_tasks
  for update using (auth.uid() = user_id);
create policy "Users can delete own suggested tasks" on public.suggested_tasks
  for delete using (auth.uid() = user_id);
