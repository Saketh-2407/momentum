-- Momentum: gamification fields on profiles (the User object's streak state).
-- Run once in the Supabase SQL Editor, after 0002_tasks_habits_xp.sql.
--
-- Total XP and level are deliberately NOT stored here — they're derived from
-- xp_events (the ledger) by pure functions in lib/gamification/, so they can
-- never drift out of sync with the ledger that is their source of truth.

alter table public.profiles
  add column current_streak integer not null default 0,
  add column longest_streak integer not null default 0,
  add column streak_freeze_count integer not null default 0,
  add column streak_last_date date;
