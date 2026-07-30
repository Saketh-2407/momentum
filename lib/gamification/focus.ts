const XP_PER_MINUTE = 2;

/** XP for a completed focus session, proportional to its length. */
export function computeFocusXp(durationMinutes: number): number {
  return Math.round(durationMinutes * XP_PER_MINUTE);
}
