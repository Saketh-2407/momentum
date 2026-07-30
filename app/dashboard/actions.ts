"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateTaskDraft, type TaskDraft } from "@/lib/tasks/validation";
import { toLocalDateString } from "@/lib/date/local-day";
import { computeTaskXp } from "@/lib/gamification/xp";
import { didLevelUp, getLevelProgress } from "@/lib/gamification/levels";
import { advanceStreak, type StreakState } from "@/lib/gamification/streak";

export interface ActionState {
  error?: string;
}

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) {
    throw new Error("Not signed in.");
  }
  return userId;
}

async function getUserTimezone(userId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", userId)
    .maybeSingle();
  return data?.timezone ?? "UTC";
}

function toIntOrDefault(value: FormDataEntryValue | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function createTask(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();

  const draft: TaskDraft = {
    title: String(formData.get("title") ?? ""),
    notes: String(formData.get("notes") ?? "") || null,
    category: String(formData.get("category") ?? "") || null,
    scheduledAt: String(formData.get("scheduledAt") ?? "") || null,
    deadline: String(formData.get("deadline") ?? "") || null,
    importance: toIntOrDefault(formData.get("importance"), 3),
    effort: toIntOrDefault(formData.get("effort"), 3),
  };

  const validation = validateTaskDraft(draft);
  if (!validation.valid) {
    return { error: validation.errors.join(" ") };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    user_id: userId,
    title: draft.title.trim(),
    notes: draft.notes,
    category: draft.category,
    scheduled_at: draft.scheduledAt ? new Date(draft.scheduledAt).toISOString() : null,
    deadline: draft.deadline ? new Date(draft.deadline).toISOString() : null,
    importance: draft.importance,
    effort: draft.effort,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return {};
}

export interface CommitPlanItemInput {
  title: string;
  notes: string | null;
  importance: number;
  effort: number;
  scheduledAt: string | null;
  deadline: string | null;
}

/**
 * Commits accepted AI-planner items as real tasks — only ever called after
 * the user reviews and accepts the plan (human-in-the-loop; the planner
 * itself never writes to the database).
 */
export async function commitPlanItems(items: CommitPlanItemInput[]): Promise<ActionState> {
  const userId = await requireUserId();

  if (items.length === 0) {
    return { error: "No items to add." };
  }

  const rows: Array<{
    user_id: string;
    title: string;
    notes: string | null;
    category: null;
    scheduled_at: string | null;
    deadline: string | null;
    importance: number;
    effort: number;
  }> = [];

  for (const item of items) {
    const draft: TaskDraft = {
      title: item.title,
      notes: item.notes,
      category: null,
      scheduledAt: item.scheduledAt,
      deadline: item.deadline,
      importance: item.importance,
      effort: item.effort,
    };

    const validation = validateTaskDraft(draft);
    if (!validation.valid) {
      return { error: `"${item.title}": ${validation.errors.join(" ")}` };
    }

    rows.push({
      user_id: userId,
      title: draft.title.trim(),
      notes: draft.notes ?? null,
      category: null,
      scheduled_at: draft.scheduledAt ?? null,
      deadline: draft.deadline ?? null,
      importance: draft.importance,
      effort: draft.effort,
    });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert(rows);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return {};
}

export interface SetTaskStatusResult {
  leveledUp: boolean;
  newLevel?: number;
}

async function getTotalXp(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.from("xp_events").select("amount").eq("user_id", userId);
  return (data ?? []).reduce((sum, event) => sum + event.amount, 0);
}

export async function setTaskStatus(
  taskId: string,
  status: "todo" | "done",
): Promise<SetTaskStatusResult> {
  const userId = await requireUserId();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("tasks")
    .select("status, importance, effort")
    .eq("id", taskId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) {
    return { leveledUp: false };
  }

  await supabase
    .from("tasks")
    .update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
    })
    .eq("id", taskId)
    .eq("user_id", userId);

  let result: SetTaskStatusResult = { leveledUp: false };

  const justCompleted = status === "done" && existing.status !== "done";
  const justReverted = status === "todo" && existing.status === "done";

  if (justCompleted || justReverted) {
    const amount = computeTaskXp(existing.importance, existing.effort);
    const previousTotal = await getTotalXp(userId);
    const signedAmount = justCompleted ? amount : -amount;

    await supabase.from("xp_events").insert({
      user_id: userId,
      amount: signedAmount,
      reason: justCompleted ? "Task completed" : "Task reopened",
      source_type: "task",
      source_id: taskId,
    });

    if (justCompleted) {
      const newTotal = previousTotal + signedAmount;
      if (didLevelUp(previousTotal, newTotal)) {
        result = { leveledUp: true, newLevel: getLevelProgress(newTotal).level };
      }
    }
  }

  revalidatePath("/dashboard");
  return result;
}

export async function deleteTask(taskId: string): Promise<void> {
  const userId = await requireUserId();
  const supabase = await createClient();

  await supabase.from("tasks").delete().eq("id", taskId).eq("user_id", userId);

  revalidatePath("/dashboard");
}

export async function createHabit(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const title = String(formData.get("title") ?? "").trim();

  if (!title) {
    return { error: "Title is required." };
  }
  if (title.length > 200) {
    return { error: "Title must be 200 characters or fewer." };
  }

  const cadenceType = formData.get("cadenceType") === "weekly" ? "weekly" : "daily";
  const daysOfWeek = formData
    .getAll("daysOfWeek")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);

  if (cadenceType === "weekly" && daysOfWeek.length === 0) {
    return { error: "Choose at least one day for a weekly habit." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("habits").insert({
    user_id: userId,
    title,
    cadence_type: cadenceType,
    days_of_week: cadenceType === "weekly" ? daysOfWeek : [],
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return {};
}

export async function deleteHabit(habitId: string): Promise<void> {
  const userId = await requireUserId();
  const supabase = await createClient();

  await supabase.from("habits").delete().eq("id", habitId).eq("user_id", userId);

  revalidatePath("/dashboard");
}

export interface StreakSummary {
  currentStreak: number;
  longestStreak: number;
  freezeCount: number;
}

/**
 * Settles the user's overall daily streak up through today, persisting any
 * change. Safe to call on every dashboard load: catches up on decay/freeze
 * spending for any days missed since the last visit, and — if the user has
 * already completed something today — bumps the streak immediately rather
 * than waiting for a future visit to notice.
 */
export async function syncStreak(userId: string): Promise<StreakSummary> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone, current_streak, longest_streak, streak_freeze_count, streak_last_date")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    return { currentStreak: 0, longestStreak: 0, freezeCount: 0 };
  }

  const today = toLocalDateString(new Date(), profile.timezone);

  const [{ data: doneTasks }, { data: habitCompletions }] = await Promise.all([
    supabase.from("tasks").select("completed_at").eq("user_id", userId).eq("status", "done"),
    supabase.from("habit_completions").select("completed_on").eq("user_id", userId),
  ]);

  const completedDates = new Set<string>();
  for (const task of doneTasks ?? []) {
    if (task.completed_at) {
      completedDates.add(toLocalDateString(new Date(task.completed_at), profile.timezone));
    }
  }
  for (const completion of habitCompletions ?? []) {
    completedDates.add(completion.completed_on);
  }

  const state: StreakState = {
    currentStreak: profile.current_streak,
    longestStreak: profile.longest_streak,
    freezeCount: profile.streak_freeze_count,
    lastProcessedDate: profile.streak_last_date,
  };

  const next = advanceStreak(state, completedDates, today);

  const changed =
    next.currentStreak !== state.currentStreak ||
    next.longestStreak !== state.longestStreak ||
    next.freezeCount !== state.freezeCount ||
    next.lastProcessedDate !== state.lastProcessedDate;

  if (changed) {
    await supabase
      .from("profiles")
      .update({
        current_streak: next.currentStreak,
        longest_streak: next.longestStreak,
        streak_freeze_count: next.freezeCount,
        streak_last_date: next.lastProcessedDate,
      })
      .eq("id", userId);
  }

  return {
    currentStreak: next.currentStreak,
    longestStreak: next.longestStreak,
    freezeCount: next.freezeCount,
  };
}

export async function setHabitCompletedToday(
  habitId: string,
  completed: boolean,
): Promise<void> {
  const userId = await requireUserId();
  const timezone = await getUserTimezone(userId);
  const today = toLocalDateString(new Date(), timezone);
  const supabase = await createClient();

  if (completed) {
    await supabase
      .from("habit_completions")
      .upsert(
        { habit_id: habitId, user_id: userId, completed_on: today },
        { onConflict: "habit_id,completed_on" },
      );
  } else {
    await supabase
      .from("habit_completions")
      .delete()
      .eq("habit_id", habitId)
      .eq("user_id", userId)
      .eq("completed_on", today);
  }

  revalidatePath("/dashboard");
}
