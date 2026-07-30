export interface SchedulableTask {
  id: string;
  scheduledAt: string | null;
}

export interface DayView<T> {
  scheduled: T[];
  unscheduled: T[];
}

/**
 * Splits tasks into a time-sorted scheduled list and an unscheduled bucket
 * for the day timeline. Stable-sorts on scheduled time, so tasks that share
 * an identical scheduled time (or duplicate titles) keep a deterministic,
 * non-dropped order rather than colliding.
 */
export function sortForDayView<T extends SchedulableTask>(tasks: T[]): DayView<T> {
  const scheduled = tasks
    .filter((task): task is T & { scheduledAt: string } => task.scheduledAt !== null)
    .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt));
  const unscheduled = tasks.filter((task) => task.scheduledAt === null);

  return { scheduled, unscheduled };
}
