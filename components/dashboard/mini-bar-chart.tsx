"use client";

import { useState } from "react";
import { motion } from "motion/react";

export interface MiniBarChartDatum {
  label: string;
  value: number;
}

export function MiniBarChart({
  data,
  formatValue = (value: number) => String(value),
  emptyMessage = "Nothing here yet.",
}: {
  data: MiniBarChartDatum[];
  formatValue?: (value: number) => string;
  emptyMessage?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));

  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-24 items-end gap-1.5">
        {data.map((point, index) => (
          <div
            key={`${point.label}-${index}`}
            className="relative flex h-full flex-1 flex-col justify-end"
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(index)}
            onBlur={() => setHovered(null)}
            tabIndex={0}
          >
            {hovered === index ? (
              <div className="absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-sm">
                {point.label}: {formatValue(point.value)}
              </div>
            ) : null}
            <motion.div
              className="w-full rounded-t-md bg-primary/80"
              style={{ minHeight: 4 }}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(4, (point.value / max) * 100)}%` }}
              transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.03 }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        {data.map((point, index) => (
          <span
            key={`${point.label}-label-${index}`}
            className="flex-1 truncate text-center text-[10px] text-muted-foreground"
          >
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}
