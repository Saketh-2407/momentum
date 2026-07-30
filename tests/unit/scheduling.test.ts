import { describe, expect, it } from "vitest";
import { sortForDayView } from "@/lib/tasks/scheduling";

describe("sortForDayView", () => {
  it("returns empty buckets for an empty task list", () => {
    expect(sortForDayView([])).toEqual({ scheduled: [], unscheduled: [] });
  });

  it("sorts scheduled tasks chronologically", () => {
    const tasks = [
      { id: "a", scheduledAt: "2026-03-05T15:00:00Z" },
      { id: "b", scheduledAt: "2026-03-05T09:00:00Z" },
      { id: "c", scheduledAt: "2026-03-05T12:00:00Z" },
    ];
    const { scheduled } = sortForDayView(tasks);
    expect(scheduled.map((t) => t.id)).toEqual(["b", "c", "a"]);
  });

  it("buckets tasks with no scheduled time as unscheduled", () => {
    const tasks = [
      { id: "a", scheduledAt: null },
      { id: "b", scheduledAt: "2026-03-05T09:00:00Z" },
    ];
    const { scheduled, unscheduled } = sortForDayView(tasks);
    expect(scheduled.map((t) => t.id)).toEqual(["b"]);
    expect(unscheduled.map((t) => t.id)).toEqual(["a"]);
  });

  it("preserves every task when scheduled times collide (duplicate tasks)", () => {
    const tasks = [
      { id: "a", scheduledAt: "2026-03-05T09:00:00Z" },
      { id: "b", scheduledAt: "2026-03-05T09:00:00Z" },
    ];
    const { scheduled } = sortForDayView(tasks);
    expect(scheduled).toHaveLength(2);
  });

  it("handles a list that is entirely unscheduled", () => {
    const tasks = [
      { id: "a", scheduledAt: null },
      { id: "b", scheduledAt: null },
    ];
    const { scheduled, unscheduled } = sortForDayView(tasks);
    expect(scheduled).toHaveLength(0);
    expect(unscheduled).toHaveLength(2);
  });
});
