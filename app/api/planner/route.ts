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

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", userId)
    .maybeSingle();

  const result = await generatePlan(rawText, {
    nowIso: new Date().toISOString(),
    timezone: profile?.timezone ?? "UTC",
  });

  return NextResponse.json(result);
}
