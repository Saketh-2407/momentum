import { describe, expect, it } from "vitest";
import {
  computeCompletionTrend,
  computeBestTimes,
  computeCategoryBreakdown,
  type CompletedTaskLike,
} from "@/lib/gamification/insights";

describe("computeCompletionTrend", () => {
  it("returns a zero-filled series for no completions", () => {
    const trend = computeCompletionTrend([], 3, "UTC", "2026-03-05");
    expect(trend).toEqual([
      { date: "2026-03-03", count: 0 },
      { date: "2026-03-04", count: 0 },
      { date: "2026-03-05", count: 0 },
    ]);
  });

  it("counts completions per local calendar day, oldest first", () => {
    const tasks: CompletedTaskLike[] = [
      { completedAt: "2026-03-04T10:00:00Z", category: null },
      { completedAt: "2026-03-04T18:00:00Z", category: null },
      { completedAt: "2026-03-05T09:00:00Z", category: null },
    ];
    const trend = computeCompletionTrend(tasks, 3, "UTC", "2026-03-05");
    expect(trend).toEqual([
      { date: "2026-03-03", count: 0 },
      { date: "2026-03-04", count: 2 },
      { date: "2026-03-05", count: 1 },
    ]);
  });

  it("buckets completions by the requested timezone, not UTC", () => {
    // 02:00 UTC on 03-05 is still 18:00 on 03-04 in Los Angeles.
    const tasks: CompletedTaskLike[] = [{ completedAt: "2026-03-05T02:00:00Z", category: null }];
    const trend = computeCompletionTrend(tasks, 2, "America/Los_Angeles", "2026-03-05");
    expect(trend).toEqual([
      { date: "2026-03-04", count: 1 },
      { date: "2026-03-05", count: 0 },
    ]);
  });
});

describe("computeBestTimes", () => {
  it("returns all-zero buckets for no completions", () => {
    const buckets = computeBestTimes([], "UTC");
    expect(buckets.every((b) => b.count === 0)).toBe(true);
    expect(buckets.map((b) => b.label)).toEqual(["Night", "Morning", "Afternoon", "Evening"]);
  });

  it("sorts completions into the correct quarter of the day", () => {
    const tasks: CompletedTaskLike[] = [
      { completedAt: "2026-03-05T03:00:00Z", category: null }, // Night
      { completedAt: "2026-03-05T08:00:00Z", category: null }, // Morning
      { completedAt: "2026-03-05T14:00:00Z", category: null }, // Afternoon
      { completedAt: "2026-03-05T20:00:00Z", category: null }, // Evening
    ];
    const buckets = computeBestTimes(tasks, "UTC");
    expect(buckets.map((b) => b.count)).toEqual([1, 1, 1, 1]);
  });

  it("groups multiple completions into the same bucket", () => {
    const tasks: CompletedTaskLike[] = [
      { completedAt: "2026-03-05T09:00:00Z", category: null },
      { completedAt: "2026-03-06T10:00:00Z", category: null },
    ];
    const buckets = computeBestTimes(tasks, "UTC");
    const morning = buckets.find((b) => b.label === "Morning");
    expect(morning?.count).toBe(2);
  });
});

describe("computeCategoryBreakdown", () => {
  it("returns an empty list for no completions", () => {
    expect(computeCategoryBreakdown([])).toEqual([]);
  });

  it("groups null and blank categories under Uncategorized", () => {
    const tasks: CompletedTaskLike[] = [
      { completedAt: "2026-03-05T09:00:00Z", category: null },
      { completedAt: "2026-03-05T09:00:00Z", category: "  " },
    ];
    expect(computeCategoryBreakdown(tasks)).toEqual([{ label: "Uncategorized", count: 2 }]);
  });

  it("sorts categories by count, most-completed first", () => {
    const tasks: CompletedTaskLike[] = [
      { completedAt: "2026-03-05T09:00:00Z", category: "Work" },
      { completedAt: "2026-03-05T09:00:00Z", category: "Health" },
      { completedAt: "2026-03-05T09:00:00Z", category: "Work" },
    ];
    expect(computeCategoryBreakdown(tasks)).toEqual([
      { label: "Work", count: 2 },
      { label: "Health", count: 1 },
    ]);
  });
});
