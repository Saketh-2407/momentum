"use client";

import { motion } from "motion/react";
import { Flame, Snowflake } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StreakFlame({
  currentStreak,
  freezeCount,
}: {
  currentStreak: number;
  freezeCount: number;
}) {
  const isActive = currentStreak > 0;

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Flame
          className={cn(
            "size-9",
            isActive ? "fill-warning/30 text-warning" : "text-muted-foreground",
          )}
        />
      </motion.div>
      <span className="text-2xl font-semibold tabular-nums">
        <AnimatedNumber value={currentStreak} />
      </span>
      <span className="text-xs text-muted-foreground">day streak</span>
      {freezeCount > 0 ? (
        <Badge variant="secondary" className="gap-1">
          <Snowflake className="size-3" />
          {freezeCount} freeze{freezeCount === 1 ? "" : "s"}
        </Badge>
      ) : null}
    </div>
  );
}
