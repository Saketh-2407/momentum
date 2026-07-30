const MS_PER_DAY = 86_400_000;

/** Start of the current UTC calendar week (Monday 00:00 UTC), as ISO. */
export function computeWeekStart(nowIso: string): string {
  const now = new Date(nowIso);
  const utcDay = now.getUTCDay(); // 0 = Sunday .. 6 = Saturday
  const daysSinceMonday = (utcDay + 6) % 7;
  const startOfDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return new Date(startOfDay - daysSinceMonday * MS_PER_DAY).toISOString();
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  weeklyXp: number;
  currentStreak: number;
}

export interface RankedLeaderboardEntry extends LeaderboardEntry {
  rank: number;
}

/**
 * Ranks entries by weekly XP (current streak as a tiebreaker). Ties share a
 * rank and the next distinct entry skips ahead accordingly (1, 2, 2, 4 — the
 * standard "competition ranking" convention).
 */
export function rankLeaderboard(entries: LeaderboardEntry[]): RankedLeaderboardEntry[] {
  const sorted = [...entries].sort((a, b) => {
    if (b.weeklyXp !== a.weeklyXp) return b.weeklyXp - a.weeklyXp;
    return b.currentStreak - a.currentStreak;
  });

  const ranked: RankedLeaderboardEntry[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    const previous = ranked[i - 1];
    const tiedWithPrevious =
      previous !== undefined &&
      previous.weeklyXp === entry.weeklyXp &&
      previous.currentStreak === entry.currentStreak;
    ranked.push({ ...entry, rank: tiedWithPrevious ? previous.rank : i + 1 });
  }
  return ranked;
}
