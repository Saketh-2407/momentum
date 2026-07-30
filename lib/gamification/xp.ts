const XP_PER_POINT = 5;

/**
 * XP for completing a task, tied directly to the planner's priority scale
 * (importance x effort, each 1-5) so trivial tasks can't be gamed for the
 * same reward as hard, important ones. Range: 5 (1x1) to 125 (5x5).
 */
export function computeTaskXp(importance: number, effort: number): number {
  return importance * effort * XP_PER_POINT;
}
