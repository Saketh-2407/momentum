"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/app/dashboard/actions";

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) {
    throw new Error("Not signed in.");
  }
  return userId;
}

export async function sendFriendRequest(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return { error: "Enter an email address." };
  }

  const supabase = await createClient();
  const { data: friendId, error: lookupError } = await supabase.rpc("find_user_id_by_email", {
    lookup_email: email,
  });

  if (lookupError) {
    return { error: lookupError.message };
  }
  if (!friendId) {
    return { error: "No Momentum account found with that email." };
  }
  if (friendId === userId) {
    return { error: "You can't add yourself as a friend." };
  }

  const { error } = await supabase.from("friendships").insert({
    requester_id: userId,
    addressee_id: friendId,
  });

  if (error) {
    return {
      error: error.code === "23505" ? "You're already friends or have a pending request." : error.message,
    };
  }

  revalidatePath("/dashboard/social");
  return {};
}

export async function respondToFriendRequest(friendshipId: string, accept: boolean): Promise<void> {
  const userId = await requireUserId();
  const supabase = await createClient();

  if (accept) {
    await supabase
      .from("friendships")
      .update({ status: "accepted", responded_at: new Date().toISOString() })
      .eq("id", friendshipId)
      .eq("addressee_id", userId);
  } else {
    await supabase.from("friendships").delete().eq("id", friendshipId);
  }

  revalidatePath("/dashboard/social");
}

export async function removeFriendship(friendshipId: string): Promise<void> {
  await requireUserId();
  const supabase = await createClient();
  await supabase.from("friendships").delete().eq("id", friendshipId);
  revalidatePath("/dashboard/social");
}

export async function setLeaderboardOptIn(optIn: boolean): Promise<void> {
  const userId = await requireUserId();
  const supabase = await createClient();
  await supabase.from("profiles").update({ leaderboard_opt_in: optIn }).eq("id", userId);
  revalidatePath("/dashboard/social");
}

export async function publishWorkbookFromSelection(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const taskIds = formData.getAll("taskIds").map(String);
  const habitIds = formData.getAll("habitIds").map(String);

  if (!title) {
    return { error: "Give your workbook a title." };
  }
  if (taskIds.length === 0 && habitIds.length === 0) {
    return { error: "Select at least one task or habit to include." };
  }

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();

  const [{ data: tasks }, { data: habits }] = await Promise.all([
    taskIds.length
      ? supabase.from("tasks").select("*").eq("user_id", userId).in("id", taskIds)
      : Promise.resolve({ data: [] as never[] }),
    habitIds.length
      ? supabase.from("habits").select("*").eq("user_id", userId).in("id", habitIds)
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const { data: workbook, error: workbookError } = await supabase
    .from("workbooks")
    .insert({
      user_id: userId,
      title,
      description,
      is_published: true,
      owner_display_name: profile?.display_name ?? "A Momentum user",
    })
    .select("id")
    .single();

  if (workbookError || !workbook) {
    return { error: workbookError?.message ?? "Couldn't create the workbook." };
  }

  const items = [
    ...(tasks ?? []).map((task, index) => ({
      workbook_id: workbook.id,
      kind: "task" as const,
      title: task.title,
      notes: task.notes,
      category: task.category,
      importance: task.importance,
      effort: task.effort,
      position: index,
    })),
    ...(habits ?? []).map((habit, index) => ({
      workbook_id: workbook.id,
      kind: "habit" as const,
      title: habit.title,
      notes: habit.notes,
      cadence_type: habit.cadence_type,
      days_of_week: habit.days_of_week,
      position: (tasks?.length ?? 0) + index,
    })),
  ];

  const { error: itemsError } = await supabase.from("workbook_items").insert(items);
  if (itemsError) {
    return { error: itemsError.message };
  }

  revalidatePath("/dashboard/social");
  return {};
}

export async function setWorkbookPublished(workbookId: string, published: boolean): Promise<void> {
  const userId = await requireUserId();
  const supabase = await createClient();
  await supabase
    .from("workbooks")
    .update({ is_published: published })
    .eq("id", workbookId)
    .eq("user_id", userId);
  revalidatePath("/dashboard/social");
}

export async function deleteWorkbook(workbookId: string): Promise<void> {
  const userId = await requireUserId();
  const supabase = await createClient();
  await supabase.from("workbooks").delete().eq("id", workbookId).eq("user_id", userId);
  revalidatePath("/dashboard/social");
}

export async function cloneWorkbook(workbookId: string): Promise<ActionState> {
  const userId = await requireUserId();
  const supabase = await createClient();

  const { data: items, error: itemsError } = await supabase
    .from("workbook_items")
    .select("*")
    .eq("workbook_id", workbookId);

  if (itemsError) {
    return { error: itemsError.message };
  }
  if (!items || items.length === 0) {
    return { error: "This workbook has nothing to clone." };
  }

  const taskItems = items.filter((item) => item.kind === "task");
  const habitItems = items.filter((item) => item.kind === "habit");

  if (taskItems.length > 0) {
    const { error } = await supabase.from("tasks").insert(
      taskItems.map((item) => ({
        user_id: userId,
        title: item.title,
        notes: item.notes,
        category: item.category,
        importance: item.importance,
        effort: item.effort,
      })),
    );
    if (error) return { error: error.message };
  }

  if (habitItems.length > 0) {
    const { error } = await supabase.from("habits").insert(
      habitItems.map((item) => ({
        user_id: userId,
        title: item.title,
        notes: item.notes,
        cadence_type: item.cadence_type ?? "daily",
        days_of_week: item.days_of_week,
      })),
    );
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard");
  return {};
}

export async function createQuest(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const title = String(formData.get("title") ?? "").trim();
  const targetCount = Number(formData.get("targetCount"));
  const friendId = String(formData.get("friendId") ?? "").trim();

  if (!title) {
    return { error: "Give your quest a title." };
  }
  if (!Number.isInteger(targetCount) || targetCount <= 0) {
    return { error: "Target must be a whole number greater than 0." };
  }
  if (!friendId) {
    return { error: "Choose a friend to quest with." };
  }

  const supabase = await createClient();
  const { data: quest, error: questError } = await supabase
    .from("co_op_quests")
    .insert({ title, target_count: targetCount, created_by: userId })
    .select("id")
    .single();

  if (questError || !quest) {
    return { error: questError?.message ?? "Couldn't create the quest." };
  }

  const { error: membersError } = await supabase.from("co_op_quest_members").insert([
    { quest_id: quest.id, user_id: userId },
    { quest_id: quest.id, user_id: friendId },
  ]);

  if (membersError) {
    return { error: membersError.message };
  }

  revalidatePath("/dashboard/social");
  return {};
}

export async function logQuestContribution(questId: string): Promise<void> {
  const userId = await requireUserId();
  const supabase = await createClient();
  await supabase.from("co_op_quest_contributions").insert({ quest_id: questId, user_id: userId, amount: 1 });
  revalidatePath("/dashboard/social");
}
