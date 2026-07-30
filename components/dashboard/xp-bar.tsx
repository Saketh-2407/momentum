"use client";

import { motion } from "motion/react";
import { getLevelProgress } from "@/lib/gamification/levels";
import { AnimatedNumber } from "@/components/ui/animated-number";

export function XpBar({ totalXp }: { totalXp: number }) {
  const progress = getLevelProgress(totalXp);
  const percent =
    progress.xpForNextLevel > 0 ? (progress.xpIntoLevel / progress.xpForNextLevel) * 100 : 100;

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">
          Level <AnimatedNumber value={progress.level} />
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          <AnimatedNumber value={progress.xpIntoLevel} /> / {progress.xpForNextLevel} XP
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
