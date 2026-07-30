const BASE_LEVEL_XP = 100;
const GROWTH_RATE = 1.45;

export interface LevelProgress {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  totalXp: number;
}

/** Total cumulative XP required to REACH a level (level 1 requires 0). */
export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;

  let total = 0;
  let requirement = BASE_LEVEL_XP;
  for (let current = 2; current <= level; current++) {
    total += requirement;
    requirement = Math.round(requirement * GROWTH_RATE);
  }
  return total;
}

/** Derives level + progress toward the next level from a total XP amount. */
export function getLevelProgress(totalXp: number): LevelProgress {
  const safeTotalXp = Math.max(0, totalXp);

  let level = 1;
  while (xpRequiredForLevel(level + 1) <= safeTotalXp) {
    level++;
  }

  const currentThreshold = xpRequiredForLevel(level);
  const nextThreshold = xpRequiredForLevel(level + 1);

  return {
    level,
    xpIntoLevel: safeTotalXp - currentThreshold,
    xpForNextLevel: nextThreshold - currentThreshold,
    totalXp: safeTotalXp,
  };
}

/** Whether gaining XP from `previousTotalXp` to `newTotalXp` crosses a level boundary. */
export function didLevelUp(previousTotalXp: number, newTotalXp: number): boolean {
  return getLevelProgress(newTotalXp).level > getLevelProgress(previousTotalXp).level;
}
