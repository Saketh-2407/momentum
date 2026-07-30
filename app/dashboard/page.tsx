import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { toLocalDateString } from "@/lib/date/local-day";
import { cadenceFromRow } from "@/lib/habits/cadence";
import { computeStreaks } from "@/lib/habits/streak";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskList } from "@/components/tasks/task-list";
import { HabitForm } from "@/components/habits/habit-form";
import { HabitList, type HabitListItem } from "@/components/habits/habit-list";

export const metadata: Metadata = { title: "Dashboard" };

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function cadenceLabel(row: { cadence_type: "daily" | "weekly"; days_of_week: number[] }) {
  if (row.cadence_type === "daily") return "Every day";
  return row.days_of_week
    .slice()
    .sort()
    .map((day) => WEEKDAY_LABELS[day])
    .join(", ");
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const userId = claims?.sub;

  const [{ data: profile }, { data: tasks }, { data: habits }, { data: completions }] =
    await Promise.all([
      supabase.from("profiles").select("timezone").eq("id", userId!).maybeSingle(),
      supabase
        .from("tasks")
        .select("*")
        .eq("status", "todo")
        .order("scheduled_at", { ascending: true, nullsFirst: false }),
      supabase.from("habits").select("*").order("created_at", { ascending: true }),
      supabase.from("habit_completions").select("habit_id, completed_on"),
    ]);

  const timezone = profile?.timezone ?? "UTC";
  const today = toLocalDateString(new Date(), timezone);

  const completionsByHabit = new Map<string, string[]>();
  for (const completion of completions ?? []) {
    const list = completionsByHabit.get(completion.habit_id) ?? [];
    list.push(completion.completed_on);
    completionsByHabit.set(completion.habit_id, list);
  }

  const habitItems: HabitListItem[] = (habits ?? []).map((habit) => {
    const dates = completionsByHabit.get(habit.id) ?? [];
    const streak = computeStreaks(dates, cadenceFromRow(habit), today);
    return {
      id: habit.id,
      title: habit.title,
      cadenceLabel: cadenceLabel(habit),
      currentStreak: streak.current,
      bestStreak: streak.best,
      completedToday: dates.includes(today),
    };
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome{claims?.email ? `, ${claims.email}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            {claims?.is_anonymous
              ? "You're exploring in demo mode — your data may be cleared."
              : "Here's your day."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {claims?.is_anonymous ? <Badge variant="secondary">Demo</Badge> : null}
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="outline" size="sm">
              Log out
            </Button>
          </form>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle render={<h2 />}>Today</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <TaskForm />
          <TaskList tasks={tasks ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle render={<h2 />}>Habits</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <HabitForm />
          <HabitList habits={habitItems} />
        </CardContent>
      </Card>
    </div>
  );
}
