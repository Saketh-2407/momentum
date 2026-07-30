import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { getLevelProgress } from "@/lib/gamification/levels";
import { computeWeekStart } from "@/lib/social/leaderboard";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    return new Response("Not signed in.", { status: 401 });
  }

  const [{ data: profile }, { data: xpEvents }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, current_streak, longest_streak")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("xp_events").select("amount, created_at").eq("user_id", userId),
  ]);

  const totalXp = (xpEvents ?? []).reduce((sum, event) => sum + event.amount, 0);
  const weekStart = computeWeekStart(new Date().toISOString());
  const weeklyXp = (xpEvents ?? [])
    .filter((event) => event.created_at >= weekStart)
    .reduce((sum, event) => sum + event.amount, 0);

  const progress = getLevelProgress(totalXp);
  const percent =
    progress.xpForNextLevel > 0 ? Math.round((progress.xpIntoLevel / progress.xpForNextLevel) * 100) : 100;
  const name = profile?.display_name ?? "Momentum user";
  const streak = profile?.current_streak ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          backgroundColor: "#0d0b14",
          backgroundImage: "linear-gradient(135deg, #1a1330 0%, #0d0b14 60%)",
          color: "#f5f3ff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 28, letterSpacing: 6, color: "#a78bfa", fontWeight: 600 }}>
            MOMENTUM
          </span>
          <span style={{ fontSize: 40, fontWeight: 700, marginTop: 12 }}>{name}&apos;s week</span>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 64 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 22, color: "#a1a1aa" }}>Level</span>
            <span style={{ fontSize: 96, fontWeight: 800, lineHeight: 1 }}>{progress.level}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 22, color: "#a1a1aa" }}>Streak</span>
            <span style={{ fontSize: 64, fontWeight: 800, lineHeight: 1, color: "#fbbf24" }}>
              {streak}d
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 22, color: "#a1a1aa" }}>This week</span>
            <span style={{ fontSize: 64, fontWeight: 800, lineHeight: 1 }}>{weeklyXp} XP</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, color: "#a1a1aa" }}>
            <span>Progress to level {progress.level + 1}</span>
            <span>{percent}%</span>
          </div>
          <div
            style={{
              display: "flex",
              height: 16,
              width: "100%",
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                height: "100%",
                width: `${Math.max(4, percent)}%`,
                borderRadius: 999,
                backgroundColor: "#7c5cff",
              }}
            />
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
