"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "motion/react";

export function AnimatedNumber({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const controls = animate(previousValue.current, value, {
      duration: prefersReducedMotion ? 0 : 0.6,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    previousValue.current = value;

    return () => controls.stop();
  }, [value]);

  return <span className={className}>{display.toLocaleString()}</span>;
}
