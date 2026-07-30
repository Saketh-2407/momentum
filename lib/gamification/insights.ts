import { addDays, toLocalDateString, toLocalHour } from "@/lib/date/local-day";

export interface CompletedTaskLike {
  completedAt: string;
  category: string | null;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface TimeOfDayBucket {
  label: string;
  count: number;
}

export interface CategoryCount {
  label: string;
  count: number;
}

const TIME_BUCKETS = [
  { label: "Night", startHour: 0, endHour: 6 },
  { label: "Morning", startHour: 6, endHour: 12 },
  { label: "Afternoon", startHour: 12, endHour: 18 },
  { label: "Evening", startHour: 18, endHour: 24 },
];

/** Completions per day for the `days` calendar days ending on `today`, oldest first. */
export function computeCompletionTrend(
  tasks: CompletedTaskLike[],
  days: number,
  timezone: string,
  today: string,
): TrendPoint[] {
  const counts = new Map<string, number>();
  for (const task of tasks) {
    const date = toLocalDateString(new Date(task.completedAt), timezone);
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  const points: TrendPoint[] = [];
  let cursor = addDays(today, -(days - 1));
  for (let i = 0; i < days; i++) {
    points.push({ date: cursor, count: counts.get(cursor) ?? 0 });
    cursor = addDays(cursor, 1);
  }
  return points;
}

/** How many completions fall in each quarter of the day, in the user's timezone. */
export function computeBestTimes(
  tasks: CompletedTaskLike[],
  timezone: string,
): TimeOfDayBucket[] {
  const buckets = TIME_BUCKETS.map((bucket) => ({ label: bucket.label, count: 0 }));

  for (const task of tasks) {
    const hour = toLocalHour(new Date(task.completedAt), timezone);
    const index = TIME_BUCKETS.findIndex(
      (bucket) => hour >= bucket.startHour && hour < bucket.endHour,
    );
    if (index !== -1) {
      buckets[index].count++;
    }
  }

  return buckets;
}

const UNCATEGORIZED_LABEL = "Uncategorized";

/** Completion counts by category, most-completed first. */
export function computeCategoryBreakdown(tasks: CompletedTaskLike[]): CategoryCount[] {
  const counts = new Map<string, number>();
  for (const task of tasks) {
    const label = task.category?.trim() || UNCATEGORIZED_LABEL;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}
