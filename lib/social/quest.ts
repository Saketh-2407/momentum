export interface QuestProgress {
  completed: number;
  target: number;
  percent: number;
  isComplete: boolean;
}

/** Combined progress toward a co-op quest's shared goal from member contributions. */
export function computeQuestProgress(contributionAmounts: number[], targetCount: number): QuestProgress {
  const completed = contributionAmounts.reduce((sum, amount) => sum + amount, 0);
  const percent = targetCount > 0 ? Math.min(100, Math.round((completed / targetCount) * 100)) : 0;

  return {
    completed,
    target: targetCount,
    percent,
    isComplete: completed >= targetCount,
  };
}
