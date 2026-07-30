"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { disconnectProvider, syncCalendar, syncGmail } from "@/app/dashboard/settings/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ConnectorProvider } from "@/lib/supabase/database.types";

const PROVIDER_LABEL: Record<ConnectorProvider, string> = {
  google_calendar: "Google Calendar",
  gmail: "Gmail",
};

// Explicit locale, or server (Node's OS locale) and client (browser locale)
// can format the same instant differently and trigger a hydration mismatch.
const syncedAtFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function ConnectorCard({
  provider,
  connected,
  lastSyncedAt,
  description,
}: {
  provider: ConnectorProvider;
  connected: boolean;
  lastSyncedAt: string | null;
  description: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSync() {
    startTransition(async () => {
      const result = provider === "google_calendar" ? await syncCalendar() : await syncGmail();
      if (result.error) {
        toast.error("Sync failed", { description: result.error });
      } else {
        toast.success(`${PROVIDER_LABEL[provider]} synced`);
      }
    });
  }

  function handleDisconnect() {
    startTransition(() => disconnectProvider(provider));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Badge variant={connected ? "default" : "secondary"}>
          {connected ? "Connected" : "Not connected"}
        </Badge>
        {connected && lastSyncedAt ? (
          <span className="text-xs text-muted-foreground">
            Last synced {syncedAtFormatter.format(new Date(lastSyncedAt))}
          </span>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="flex gap-2">
        {connected ? (
          <>
            <Button type="button" size="sm" disabled={isPending} onClick={handleSync}>
              {isPending ? "Syncing…" : "Sync now"}
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={handleDisconnect}>
              Disconnect
            </Button>
          </>
        ) : (
          <a
            href={`/api/connectors/google/authorize?provider=${provider}`}
            className={buttonVariants({ size: "sm" })}
          >
            Connect {PROVIDER_LABEL[provider]}
          </a>
        )}
      </div>
    </div>
  );
}
