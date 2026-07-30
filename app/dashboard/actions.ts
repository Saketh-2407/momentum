"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateTaskDraft, type TaskDraft } from "@/lib/tasks/validation";
import { toLocalDateString } from "@/lib/date/local-day";

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

export async function setTaskStatus(taskId: string, status: "todo" | "done"): Promise<void> {
  const userId = await requireUserId();
  const supabase = await createClient();

  await supabase
    .from("tasks")
    .update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
    })
    .eq("id", taskId)
    .eq("user_id", userId);

  revalidatePath("/dashboard");
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
