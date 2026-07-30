"use client";

import { motion } from "motion/react";
import type { CategoryCount } from "@/lib/gamification/insights";

const MAX_ROWS = 6;

export function CategoryBreakdown({ data }: { data: CategoryCount[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No completed tasks yet.</p>;
  }

  const rows = data.slice(0, MAX_ROWS);
  const max = Math.max(...rows.map((row) => row.count));

  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((row, index) => (
        <li key={row.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate text-sm" title={row.label}>
            {row.label}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary/80"
              initial={{ width: 0 }}
              animate={{ width: `${(row.count / max) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.05 }}
            />
          </div>
          <span className="w-6 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
            {row.count}
          </span>
        </li>
      ))}
    </ul>
  );
}
