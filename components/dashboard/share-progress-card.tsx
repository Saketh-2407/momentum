"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export function ShareProgressCard() {
  const [cacheBust, setCacheBust] = useState(0);
  const src = `/api/progress-card?v=${cacheBust}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-lg border border-border/60">
        {/* eslint-disable-next-line @next/next/no-img-element -- generated image, not an optimizable static asset */}
        <img src={src} alt="Your Momentum progress card" className="w-full" />
      </div>
      <div className="flex gap-2">
        <a
          href={src}
          download="momentum-progress.png"
          className={buttonVariants({ size: "sm", variant: "outline" })}
        >
          <Download /> Download
        </a>
        <Button type="button" size="sm" variant="ghost" onClick={() => setCacheBust((v) => v + 1)}>
          Refresh
        </Button>
      </div>
    </div>
  );
}
