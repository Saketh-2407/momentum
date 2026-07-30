import { addDays } from "@/lib/date/local-day";

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  freezeCount: number;
  lastProcessedDate: string | null;
}

export interface DayOutcome {
  date: string;
  completed: boolean;
}

const FREEZE_MILESTONE_DAYS = 7;
const MAX_FREEZES = 3;
const DECAY_FRACTION = 0.5;

/**
 * Settles a single calendar day against the streak. A completed day extends
 * the streak (and banks a freeze every `FREEZE_MILESTONE_DAYS`, capped at
 * `MAX_FREEZES`). A missed day is never a hard reset to zero — kind loss
 * aversion, per SPEC: it auto-spends a banked freeze ("mercy day") if one is
 * available, otherwise the streak decays by `DECAY_FRACTION` rather than
 * zeroing out entirely.
 */
export function applyDayOutcome(state: StreakState, outcome: DayOutcome): StreakState {
  if (outcome.completed) {
    const currentStreak = state.currentStreak + 1;
    const longestStreak = Math.max(state.longestStreak, currentStreak);
    const earnedFreeze = currentStreak % FREEZE_MILESTONE_DAYS === 0;
    const freezeCount = Math.min(MAX_FREEZES, state.freezeCount + (earnedFreeze ? 1 : 0));
    return { currentStreak, longestStreak, freezeCount, lastProcessedDate: outcome.date };
  }

  if (state.freezeCount > 0) {
    return { ...state, freezeCount: state.freezeCount - 1, lastProcessedDate: outcome.date };
  }

  const currentStreak = Math.floor(state.currentStreak * (1 - DECAY_FRACTION));
  return { ...state, currentStreak, lastProcessedDate: outcome.date };
}

/**
 * Advances a streak state up through `today`. Past days (before `today`) are
 * always settled via `applyDayOutcome`. `today` itself is only settled if
 * it's already a win — completing something today should bump the streak
 * immediately, but an incomplete "today" stays pending (not yet a miss)
 * until a later call finds it in the past.
 */
export function advanceStreak(
  state: StreakState,
  completedDates: ReadonlySet<string>,
  today: string,
): StreakState {
  let cursor = state.lastProcessedDate ? addDays(state.lastProcessedDate, 1) : today;
  let next = state;

  while (cursor < today) {
    next = applyDayOutcome(next, { date: cursor, completed: completedDates.has(cursor) });
    cursor = addDays(cursor, 1);
  }

  if (cursor === today && next.lastProcessedDate !== today && completedDates.has(today)) {
    next = applyDayOutcome(next, { date: today, completed: true });
  }

  return next;
}

export const EMPTY_STREAK_STATE: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  freezeCount: 0,
  lastProcessedDate: null,
};
