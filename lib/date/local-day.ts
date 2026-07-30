/**
 * Calendar-day helpers. A "date string" here is an abstract YYYY-MM-DD
 * calendar date with no timezone attached — once a timestamp has been
 * converted to a local date via `toLocalDateString`, all further arithmetic
 * (addDays, getWeekday) is done in UTC so it can never be shifted again by a
 * host machine's timezone or DST.
 */

/** Converts an instant to the calendar date it falls on in `timeZone`. */
export function toLocalDateString(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Adds (or subtracts, for negative `days`) whole days to a date string. */
export function addDays(dateString: string, days: number): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return toLocalDateString(date, "UTC");
}

/** 0 = Sunday .. 6 = Saturday, for a given date string. */
export function getWeekday(dateString: string): number {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}
