"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { computeWeekStart } from "@/lib/social/leaderboard";
import { computeQuestProgress } from "@/lib/social/quest";
import { computeFocusXp } from "@/lib/gamification/focus";
import {
  WEEKLY_BOSS_BATTLE_TARGET,
  WEEKLY_BOSS_BATTLE_BONUS_XP,
} from "@/lib/gamification/boss-battle";
import { didLevelUp, getLevelProgress } from "@/lib/gamification/levels";
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

export interface BossBattleSummary {
  target: number;
  bonusXp: number;
  completed: number;
  percent: number;
  isComplete: boolean;
  claimed: boolean;
  justClaimed: boolean;
}

/**
 * Gets (lazily creating) this week's boss battle and claims its bonus XP the
 * moment the target is reached. Safe to call on every dashboard load, same
 * pattern as syncStreak in app/dashboard/actions.ts.
 */
export async function syncBossBattle(userId: string): Promise<BossBattleSummary> {
  const supabase = await createClient();
  const weekStartIso = computeWeekStart(new Date().toISOString());
  const weekStartDate = weekStartIso.slice(0, 10);

  const { data: existing } = await supabase
    .from("boss_battles")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start", weekStartDate)
    .maybeSingle();

  const battle =
    existing ??
    (
      await supabase
        .from("boss_battles")
        .insert({
          user_id: userId,
          week_start: weekStartDate,
          target_count: WEEKLY_BOSS_BATTLE_TARGET,
          bonus_xp: WEEKLY_BOSS_BATTLE_BONUS_XP,
        })
        .select("*")
        .single()
    ).data;

  if (!battle) {
    return {
      target: WEEKLY_BOSS_BATTLE_TARGET,
      bonusXp: WEEKLY_BOSS_BATTLE_BONUS_XP,
      completed: 0,
      percent: 0,
      isComplete: false,
      claimed: false,
      justClaimed: false,
    };
  }

  const { count } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "done")
    .gte("completed_at", weekStartIso);

  const progress = computeQuestProgress([count ?? 0], battle.target_count);
  let justClaimed = false;

  if (progress.isComplete && !battle.claimed_at) {
    await supabase.from("xp_events").insert({
      user_id: userId,
      amount: battle.bonus_xp,
      reason: "Weekly boss battle defeated",
      source_type: "bonus",
      source_id: battle.id,
    });
    await supabase
      .from("boss_battles")
      .update({ claimed_at: new Date().toISOString() })
      .eq("id", battle.id);
    justClaimed = true;
  }

  return {
    target: battle.target_count,
    bonusXp: battle.bonus_xp,
    completed: progress.completed,
    percent: progress.percent,
    isComplete: progress.isComplete,
    claimed: Boolean(battle.claimed_at) || justClaimed,
    justClaimed,
  };
}

export interface CompleteFocusSessionResult extends ActionState {
  xpAwarded?: number;
  leveledUp?: boolean;
  newLevel?: number;
}

export async function completeFocusSession(
  durationMinutes: number,
  taskId: string | null,
): Promise<CompleteFocusSessionResult> {
  const userId = await requireUserId();

  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return { error: "Invalid session length." };
  }

  const supabase = await createClient();
  const { error: insertError } = await supabase.from("focus_sessions").insert({
    user_id: userId,
    task_id: taskId,
    duration_minutes: Math.round(durationMinutes),
  });

  if (insertError) {
    return { error: insertError.message };
  }

  const { data: xpEvents } = await supabase.from("xp_events").select("amount").eq("user_id", userId);
  const previousTotal = (xpEvents ?? []).reduce((sum, event) => sum + event.amount, 0);
  const amount = computeFocusXp(durationMinutes);

  await supabase.from("xp_events").insert({
    user_id: userId,
    amount,
    reason: "Focus session completed",
    source_type: "bonus",
  });

  const newTotal = previousTotal + amount;
  const leveledUp = didLevelUp(previousTotal, newTotal);

  revalidatePath("/dashboard");

  return {
    xpAwarded: amount,
    leveledUp,
    newLevel: leveledUp ? getLevelProgress(newTotal).level : undefined,
  };
}
