import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectorCard } from "@/components/settings/connector-card";
import { CalendarEventsList } from "@/components/settings/calendar-events-list";
import { SuggestedTasksList } from "@/components/settings/suggested-tasks-list";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  const [{ data: connections }, { data: calendarEvents }, { data: suggestedTasks }] =
    await Promise.all([
      supabase.from("connections").select("*").eq("user_id", userId!),
      supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", userId!)
        .order("starts_at", { ascending: true }),
      supabase
        .from("suggested_tasks")
        .select("*")
        .eq("user_id", userId!)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
    ]);

  const calendarConnection = connections?.find((c) => c.provider === "google_calendar") ?? null;
  const gmailConnection = connections?.find((c) => c.provider === "gmail") ?? null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
          <p className="text-sm text-muted-foreground">
            Connect Gmail and Calendar so Momentum can prioritize your real commitments.
          </p>
        </div>
        <Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Back to dashboard
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle render={<h2 />}>Google Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <ConnectorCard
            provider="google_calendar"
            connected={Boolean(calendarConnection)}
            lastSyncedAt={calendarConnection?.last_synced_at ?? null}
            description="Reads upcoming events (read-only) so the AI planner schedules around real meetings."
          />
        </CardContent>
      </Card>

      {calendarConnection ? (
        <Card>
          <CardHeader>
            <CardTitle render={<h3 />} className="text-sm">
              Upcoming commitments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarEventsList events={calendarEvents ?? []} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle render={<h2 />}>Gmail</CardTitle>
        </CardHeader>
        <CardContent>
          <ConnectorCard
            provider="gmail"
            connected={Boolean(gmailConnection)}
            lastSyncedAt={gmailConnection?.last_synced_at ?? null}
            description="Reads recent message subjects and snippets (never full bodies) to suggest action-worthy tasks — you accept, edit, or dismiss each one."
          />
        </CardContent>
      </Card>

      {gmailConnection ? (
        <Card>
          <CardHeader>
            <CardTitle render={<h3 />} className="text-sm">
              Suggested tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SuggestedTasksList suggestions={suggestedTasks ?? []} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
