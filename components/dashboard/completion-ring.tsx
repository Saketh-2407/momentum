"use client";

import { motion } from "motion/react";

export function CompletionRing({
  done,
  total,
  size = 120,
}: {
  done: number;
  total: number;
  size?: number;
}) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? done / total : 0;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {total > 0 ? (
          <>
            <span className="text-2xl font-semibold tabular-nums">
              {done}/{total}
            </span>
            <span className="text-xs text-muted-foreground">today</span>
          </>
        ) : (
          <span className="px-4 text-center text-xs text-muted-foreground">
            No tasks yet
          </span>
        )}
      </div>
    </div>
  );
}
