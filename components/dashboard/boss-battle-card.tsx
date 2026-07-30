"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Swords } from "lucide-react";
import type { BossBattleSummary } from "@/app/dashboard/standout/actions";

export function BossBattleCard({ battle }: { battle: BossBattleSummary }) {
  useEffect(() => {
    if (battle.justClaimed) {
      toast(`Boss battle defeated! +${battle.bonusXp} XP`, {
        description: "New battle starts next week.",
        icon: <Swords className="size-4 text-warning" />,
      });
    }
  }, [battle.justClaimed, battle.bonusXp]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="size-4 text-primary" />
          <span className="text-sm font-medium">
            {battle.isComplete ? "Boss defeated" : "This week's boss"}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {battle.completed} / {battle.target} tasks · +{battle.bonusXp} XP
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${battle.percent}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
