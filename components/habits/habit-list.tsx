"use client";

import { useTransition } from "react";
import { Flame, Trash2 } from "lucide-react";
import { setHabitCompletedToday, deleteHabit } from "@/app/dashboard/actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface HabitListItem {
  id: string;
  title: string;
  cadenceLabel: string;
  currentStreak: number;
  bestStreak: number;
  completedToday: boolean;
}

function HabitRow({ habit }: { habit: HabitListItem }) {
  const [isPending, startTransition] = useTransition();

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border/60 bg-card px-3 py-2.5",
        isPending && "opacity-60",
      )}
    >
      <Checkbox
        checked={habit.completedToday}
        onCheckedChange={(checked) =>
          startTransition(() => {
            setHabitCompletedToday(habit.id, Boolean(checked));
          })
        }
        aria-label={`Mark "${habit.title}" as done today`}
      />
      <div className="flex flex-1 flex-col">
        <span className="text-sm">{habit.title}</span>
        <span className="text-xs text-muted-foreground">{habit.cadenceLabel}</span>
      </div>
      {habit.currentStreak > 0 ? (
        <Badge variant="secondary" className="gap-1 text-warning">
          <Flame className="size-3.5" />
          {habit.currentStreak}
        </Badge>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Delete "${habit.title}"`}
        onClick={() => startTransition(() => deleteHabit(habit.id))}
      >
        <Trash2 />
      </Button>
    </li>
  );
}

export function HabitList({ habits }: { habits: HabitListItem[] }) {
  if (habits.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No habits yet — add one above to start a streak.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {habits.map((habit) => (
        <HabitRow key={habit.id} habit={habit} />
      ))}
    </ul>
  );
}
