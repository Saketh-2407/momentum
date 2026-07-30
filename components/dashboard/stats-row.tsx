import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CompletionRing } from "@/components/dashboard/completion-ring";
import { StreakFlame } from "@/components/dashboard/streak-flame";
import { XpBar } from "@/components/dashboard/xp-bar";
import { AnimatedNumber } from "@/components/ui/animated-number";

export function StatsRow({
  doneToday,
  totalToday,
  currentStreak,
  freezeCount,
  totalXp,
}: {
  doneToday: number;
  totalToday: number;
  currentStreak: number;
  freezeCount: number;
  totalXp: number;
}) {
  const remaining = Math.max(0, totalToday - doneToday);

  return (
    <div className="grid gap-4 sm:grid-cols-4">
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-1 py-6">
          <CompletionRing done={doneToday} total={totalToday} size={96} />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-1 py-6">
          <StreakFlame currentStreak={currentStreak} freezeCount={freezeCount} />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-6">
          <XpBar totalXp={totalXp} />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-6">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <CheckCircle2 className="size-5 text-success" />
              <span className="text-xl font-semibold tabular-nums">
                <AnimatedNumber value={doneToday} />
              </span>
              <span className="text-xs text-muted-foreground">Done</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Circle className="size-5 text-muted-foreground" />
              <span className="text-xl font-semibold tabular-nums">
                <AnimatedNumber value={remaining} />
              </span>
              <span className="text-xs text-muted-foreground">Left</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
