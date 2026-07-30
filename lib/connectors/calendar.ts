const SYNC_WINDOW_DAYS = 14;
const MS_PER_DAY = 86_400_000;

export interface CalendarEventData {
  sourceRef: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  isAllDay: boolean;
}

interface GoogleCalendarEventRaw {
  id?: string;
  summary?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
}

/**
 * Maps one raw Google Calendar API event into our internal shape. Returns
 * null for events missing an id/title/start (e.g. cancelled placeholders) —
 * the caller filters those out rather than failing the whole sync.
 */
export function mapCalendarEvent(item: GoogleCalendarEventRaw): CalendarEventData | null {
  if (!item.id || !item.summary) return null;

  const isAllDay = Boolean(item.start?.date && !item.start?.dateTime);
  const rawStart = item.start?.dateTime ?? (item.start?.date ? `${item.start.date}T00:00:00Z` : null);
  if (!rawStart) return null;

  const rawEnd = item.end?.dateTime ?? (item.end?.date ? `${item.end.date}T00:00:00Z` : null);

  return {
    sourceRef: item.id,
    title: item.summary,
    startsAt: new Date(rawStart).toISOString(),
    endsAt: rawEnd ? new Date(rawEnd).toISOString() : null,
    isAllDay,
  };
}

export async function fetchUpcomingEvents(accessToken: string): Promise<CalendarEventData[]> {
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + SYNC_WINDOW_DAYS * MS_PER_DAY).toISOString();

  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "50");

  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Google Calendar request failed (${response.status}): ${body.slice(0, 500)}`);
  }

  const data = await response.json();
  const items: GoogleCalendarEventRaw[] = data.items ?? [];
  return items
    .map(mapCalendarEvent)
    .filter((event): event is CalendarEventData => event !== null);
}
