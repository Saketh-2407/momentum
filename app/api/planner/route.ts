import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePlan } from "@/lib/planner";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let rawText: string;
  try {
    const body = await request.json();
    rawText = typeof body?.rawText === "string" ? body.rawText : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const nowIso = new Date().toISOString();

  const [{ data: profile }, { data: calendarEvents }] = await Promise.all([
    supabase.from("profiles").select("timezone").eq("id", userId).maybeSingle(),
    supabase
      .from("calendar_events")
      .select("title, starts_at, ends_at")
      .eq("user_id", userId)
      .gte("starts_at", nowIso),
  ]);

  const result = await generatePlan(rawText, {
    nowIso,
    timezone: profile?.timezone ?? "UTC",
    fixedCommitments: (calendarEvents ?? [])
      .filter((event) => event.ends_at)
      .map((event) => ({
        title: event.title,
        startsAt: event.starts_at,
        endsAt: event.ends_at!,
      })),
  });

  return NextResponse.json(result);
}
