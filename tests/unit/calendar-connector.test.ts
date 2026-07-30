import { describe, expect, it } from "vitest";
import { mapCalendarEvent } from "@/lib/connectors/calendar";

describe("mapCalendarEvent", () => {
  it("maps a timed event", () => {
    const result = mapCalendarEvent({
      id: "evt-1",
      summary: "Team standup",
      start: { dateTime: "2026-03-05T09:00:00-08:00" },
      end: { dateTime: "2026-03-05T09:30:00-08:00" },
    });
    expect(result).toEqual({
      sourceRef: "evt-1",
      title: "Team standup",
      startsAt: new Date("2026-03-05T09:00:00-08:00").toISOString(),
      endsAt: new Date("2026-03-05T09:30:00-08:00").toISOString(),
      isAllDay: false,
    });
  });

  it("maps an all-day event using date rather than dateTime", () => {
    const result = mapCalendarEvent({
      id: "evt-2",
      summary: "Conference",
      start: { date: "2026-03-06" },
      end: { date: "2026-03-08" },
    });
    expect(result?.isAllDay).toBe(true);
    expect(result?.startsAt).toBe(new Date("2026-03-06T00:00:00Z").toISOString());
  });

  it("returns null for an event missing an id", () => {
    expect(mapCalendarEvent({ summary: "No id", start: { dateTime: "2026-03-05T09:00:00Z" } })).toBeNull();
  });

  it("returns null for an event missing a title", () => {
    expect(mapCalendarEvent({ id: "evt-3", start: { dateTime: "2026-03-05T09:00:00Z" } })).toBeNull();
  });

  it("returns null for an event missing a start time", () => {
    expect(mapCalendarEvent({ id: "evt-4", summary: "No start" })).toBeNull();
  });

  it("handles a missing end time", () => {
    const result = mapCalendarEvent({
      id: "evt-5",
      summary: "Open-ended",
      start: { dateTime: "2026-03-05T09:00:00Z" },
    });
    expect(result?.endsAt).toBeNull();
  });
});
