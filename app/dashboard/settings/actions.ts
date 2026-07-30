"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { decryptSecret } from "@/lib/connectors/crypto";
import { refreshAccessToken } from "@/lib/connectors/google-oauth";
import { fetchUpcomingEvents } from "@/lib/connectors/calendar";
import { fetchRecentMessages } from "@/lib/connectors/gmail";
import { classifyEmails } from "@/lib/connectors/gmail-classifier";
import { validateTaskDraft, type TaskDraft } from "@/lib/tasks/validation";
import type { ActionState } from "@/app/dashboard/actions";
import type { ConnectorProvider } from "@/lib/supabase/database.types";

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) {
    throw new Error("Not signed in.");
  }
  return userId;
}

async function getAccessToken(userId: string, provider: ConnectorProvider): Promise<string> {
  const supabase = await createClient();
  const { data: connection } = await supabase
    .from("connections")
    .select("encrypted_refresh_token")
    .eq("user_id", userId)
    .eq("provider", provider)
    .maybeSingle();

  if (!connection) {
    throw new Error(`${provider} is not connected.`);
  }

  const refreshToken = decryptSecret(connection.encrypted_refresh_token);
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth is not configured.");
  }

  const { accessToken } = await refreshAccessToken({ clientId, clientSecret, refreshToken });
  return accessToken;
}

export async function disconnectProvider(provider: ConnectorProvider): Promise<void> {
  const userId = await requireUserId();
  const supabase = await createClient();

  await supabase.from("connections").delete().eq("user_id", userId).eq("provider", provider);

  if (provider === "google_calendar") {
    await supabase.from("calendar_events").delete().eq("user_id", userId);
  } else {
    await supabase.from("suggested_tasks").delete().eq("user_id", userId);
  }

  revalidatePath("/dashboard/settings");
}

export async function syncCalendar(): Promise<ActionState> {
  const userId = await requireUserId();

  try {
    const accessToken = await getAccessToken(userId, "google_calendar");
    const events = await fetchUpcomingEvents(accessToken);

    const supabase = await createClient();
    await supabase.from("calendar_events").delete().eq("user_id", userId);

    if (events.length > 0) {
      const { error } = await supabase.from("calendar_events").insert(
        events.map((event) => ({
          user_id: userId,
          source_ref: event.sourceRef,
          title: event.title,
          starts_at: event.startsAt,
          ends_at: event.endsAt,
          is_all_day: event.isAllDay,
        })),
      );
      if (error) return { error: error.message };
    }

    await supabase
      .from("connections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("provider", "google_calendar");
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Calendar sync failed." };
  }

  revalidatePath("/dashboard/settings");
  return {};
}

export async function syncGmail(): Promise<ActionState> {
  const userId = await requireUserId();

  try {
    const accessToken = await getAccessToken(userId, "gmail");
    const messages = await fetchRecentMessages(accessToken);

    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("timezone")
      .eq("id", userId)
      .maybeSingle();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { error: "GEMINI_API_KEY is not configured." };
    }

    const classifications = await classifyEmails(
      messages,
      { nowIso: new Date().toISOString(), timezone: profile?.timezone ?? "UTC" },
      apiKey,
      process.env.GEMINI_MODEL,
    );

    const actionable = classifications.filter((c) => c.isActionable && c.title);
    if (actionable.length > 0) {
      const { error } = await supabase.from("suggested_tasks").upsert(
        actionable.map((c) => ({
          user_id: userId,
          source_type: "gmail" as const,
          source_ref: c.id,
          title: c.title!,
          suggested_deadline: c.deadline,
        })),
        { onConflict: "user_id,source_ref", ignoreDuplicates: true },
      );
      if (error) return { error: error.message };
    }

    await supabase
      .from("connections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("provider", "gmail");
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gmail sync failed." };
  }

  revalidatePath("/dashboard/settings");
  return {};
}

export async function acceptSuggestedTask(
  suggestionId: string,
  editedTitle?: string,
): Promise<ActionState> {
  const userId = await requireUserId();
  const supabase = await createClient();

  const { data: suggestion } = await supabase
    .from("suggested_tasks")
    .select("*")
    .eq("id", suggestionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!suggestion) {
    return { error: "That suggestion no longer exists." };
  }

  const draft: TaskDraft = {
    title: editedTitle?.trim() || suggestion.title,
    notes: suggestion.notes,
    category: "Email",
    scheduledAt: null,
    deadline: suggestion.suggested_deadline,
    importance: 3,
    effort: 2,
  };

  const validation = validateTaskDraft(draft);
  if (!validation.valid) {
    return { error: validation.errors.join(" ") };
  }

  const { error: insertError } = await supabase.from("tasks").insert({
    user_id: userId,
    title: draft.title.trim(),
    notes: draft.notes,
    category: draft.category,
    deadline: draft.deadline,
    importance: draft.importance,
    effort: draft.effort,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  await supabase.from("suggested_tasks").update({ status: "accepted" }).eq("id", suggestionId);

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return {};
}

export async function dismissSuggestedTask(suggestionId: string): Promise<void> {
  const userId = await requireUserId();
  const supabase = await createClient();
  await supabase
    .from("suggested_tasks")
    .update({ status: "dismissed" })
    .eq("id", suggestionId)
    .eq("user_id", userId);
  revalidatePath("/dashboard/settings");
}
