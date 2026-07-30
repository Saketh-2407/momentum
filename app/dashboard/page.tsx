import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { toLocalDateString } from "@/lib/date/local-day";
import { cadenceFromRow } from "@/lib/habits/cadence";
import { computeStreaks } from "@/lib/habits/streak";
import {
  computeCompletionTrend,
  computeBestTimes,
  computeCategoryBreakdown,
} from "@/lib/gamification/insights";
import { syncStreak } from "@/app/dashboard/actions";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { StatsRow } from "@/components/dashboard/stats-row";
import { InsightsSection } from "@/components/dashboard/insights-section";
import { PlannerCard } from "@/components/planner/planner-card";

export const metadata: Metadata = { title: "Dashboard" };

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TREND_DAYS = 7;

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

  const [{ data: profile }, { data: allTasks }, { data: habits }, { data: completions }, { data: xpEvents }] =
    await Promise.all([
      supabase.from("profiles").select("timezone").eq("id", userId!).maybeSingle(),
      supabase.from("tasks").select("*").order("scheduled_at", { ascending: true, nullsFirst: false }),
      supabase.from("habits").select("*").order("created_at", { ascending: true }),
      supabase.from("habit_completions").select("habit_id, completed_on"),
      supabase.from("xp_events").select("amount").eq("user_id", userId!),
    ]);

  const timezone = profile?.timezone ?? "UTC";
  const today = toLocalDateString(new Date(), timezone);
  const streak = await syncStreak(userId!);

  const tasks = allTasks ?? [];
  const todoTasks = tasks.filter((task) => task.status === "todo");
  const doneTasks = tasks.filter((task) => task.status === "done" && task.completed_at);
  const doneTodayTasks = doneTasks.filter(
    (task) => toLocalDateString(new Date(task.completed_at!), timezone) === today,
  );

  const totalXp = (xpEvents ?? []).reduce((sum, event) => sum + event.amount, 0);

  const completionsByHabit = new Map<string, string[]>();
  for (const completion of completions ?? []) {
    const list = completionsByHabit.get(completion.habit_id) ?? [];
    list.push(completion.completed_on);
    completionsByHabit.set(completion.habit_id, list);
  }

  const habitItems: HabitListItem[] = (habits ?? []).map((habit) => {
    const dates = completionsByHabit.get(habit.id) ?? [];
    const habitStreak = computeStreaks(dates, cadenceFromRow(habit), today);
    return {
      id: habit.id,
      title: habit.title,
      cadenceLabel: cadenceLabel(habit),
      currentStreak: habitStreak.current,
      bestStreak: habitStreak.best,
      completedToday: dates.includes(today),
    };
  });

  const completedTaskLikes = doneTasks.map((task) => ({
    completedAt: task.completed_at!,
    category: task.category,
  }));
  const trend = computeCompletionTrend(completedTaskLikes, TREND_DAYS, timezone, today);
  const bestTimes = computeBestTimes(completedTaskLikes, timezone);
  const categories = computeCategoryBreakdown(completedTaskLikes);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-16">
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
          <Link href="/dashboard/social" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Friends
          </Link>
          <Link href="/dashboard/settings" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Integrations
          </Link>
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="outline" size="sm">
              Log out
            </Button>
          </form>
        </div>
      </div>

      <StatsRow
        doneToday={doneTodayTasks.length}
        totalToday={todoTasks.length + doneTodayTasks.length}
        currentStreak={streak.currentStreak}
        freezeCount={streak.freezeCount}
        totalXp={totalXp}
      />

      <Card>
        <CardHeader>
          <CardTitle render={<h2 />}>Brain dump</CardTitle>
        </CardHeader>
        <CardContent>
          <PlannerCard />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle render={<h2 />}>Today</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <TaskForm />
          <TaskList tasks={todoTasks} />
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

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Insights</h2>
        <InsightsSection trend={trend} bestTimes={bestTimes} categories={categories} />
      </div>
    </div>
  );
}
