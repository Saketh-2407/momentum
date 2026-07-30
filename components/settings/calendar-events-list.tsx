import { CalendarClock } from "lucide-react";
import type { Database } from "@/lib/supabase/database.types";

type CalendarEvent = Database["public"]["Tables"]["calendar_events"]["Row"];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function CalendarEventsList({ events }: { events: CalendarEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No upcoming events synced yet — hit &quot;Sync now&quot; above.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {events.map((event) => (
        <li
          key={event.id}
          className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2"
        >
          <CalendarClock className="size-4 text-muted-foreground" />
          <span className="flex-1 text-sm">{event.title}</span>
          <span className="text-xs text-muted-foreground">
            {event.is_all_day ? "All day" : dateFormatter.format(new Date(event.starts_at))}
          </span>
        </li>
      ))}
    </ul>
  );
}
