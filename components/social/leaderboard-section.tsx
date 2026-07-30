"use client";

import { useTransition } from "react";
import { Trophy } from "lucide-react";
import { setLeaderboardOptIn } from "@/app/dashboard/social/actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RankedLeaderboardEntry } from "@/lib/social/leaderboard";

export function LeaderboardSection({
  entries,
  optedIn,
}: {
  entries: RankedLeaderboardEntry[];
  optedIn: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Checkbox
          id="leaderboard-opt-in"
          checked={optedIn}
          onCheckedChange={(checked) =>
            startTransition(() => setLeaderboardOptIn(Boolean(checked)))
          }
          disabled={isPending}
        />
        <Label htmlFor="leaderboard-opt-in" className="text-sm font-normal">
          Show my weekly XP to friends on the leaderboard
        </Label>
      </div>

      {!optedIn ? (
        <p className="text-sm text-muted-foreground">
          You&apos;re opted out — only friends who&apos;ve also opted in appear below.
        </p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No one&apos;s on the board yet — add friends who&apos;ve also opted in.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li
              key={entry.userId}
              className={cn(
                "flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2",
                entry.rank === 1 && "border-warning/40 bg-warning/5",
              )}
            >
              <span className="flex size-6 items-center justify-center text-sm font-semibold text-muted-foreground">
                {entry.rank === 1 ? <Trophy className="size-4 text-warning" /> : entry.rank}
              </span>
              <span className="flex-1 text-sm">{entry.displayName}</span>
              <Badge variant="secondary">{entry.weeklyXp} XP</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
