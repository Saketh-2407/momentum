import { addDays } from "@/lib/date/local-day";
import { isDueOnDate, type Cadence } from "@/lib/habits/cadence";

export interface StreakResult {
  current: number;
  best: number;
}

const MAX_LOOKBACK_DAYS = 3650; // 10 years — a sane bound, not a real limit.

/**
 * Computes a habit's current and best streak from its completion dates.
 *
 * `completedDates` and `todayString` are calendar dates (YYYY-MM-DD) already
 * resolved to the user's local timezone by the caller — this function is
 * pure calendar-date arithmetic and knows nothing about timezones itself.
 *
 * Today not yet being completed does not break the streak (the day isn't
 * over); a past due-day with no completion does.
 */
export function computeStreaks(
  completedDates: string[],
  cadence: Cadence,
  todayString: string,
): StreakResult {
  const completed = new Set(completedDates);

  if (completed.size === 0) {
    return { current: 0, best: 0 };
  }

  let current = 0;
  let cursor = todayString;
  for (let i = 0; i < MAX_LOOKBACK_DAYS; i++) {
    if (isDueOnDate(cadence, cursor)) {
      if (completed.has(cursor)) {
        current++;
      } else if (cursor !== todayString) {
        break;
      }
      // else: today, due, not yet completed — doesn't break the streak.
    }
    cursor = addDays(cursor, -1);
  }

  const sortedDates = [...completed].sort();
  let best = 0;
  let run = 0;
  let day = sortedDates[0];
  while (day <= todayString) {
    if (isDueOnDate(cadence, day)) {
      if (completed.has(day)) {
        run++;
        best = Math.max(best, run);
      } else {
        run = 0;
      }
    }
    day = addDays(day, 1);
  }

  return { current, best: Math.max(best, current) };
}
