import { describe, expect, it } from "vitest";
import { computeStreaks } from "@/lib/habits/streak";

const daily = { type: "daily" as const };

describe("computeStreaks — daily cadence", () => {
  it("returns zero for a brand-new habit with no completions", () => {
    expect(computeStreaks([], daily, "2026-03-10")).toEqual({ current: 0, best: 0 });
  });

  it("counts a single completion today", () => {
    expect(computeStreaks(["2026-03-10"], daily, "2026-03-10")).toEqual({
      current: 1,
      best: 1,
    });
  });

  it("keeps an unbroken streak alive when today is not yet completed", () => {
    const dates = ["2026-03-08", "2026-03-09"];
    expect(computeStreaks(dates, daily, "2026-03-10")).toEqual({ current: 2, best: 2 });
  });

  it("breaks the streak at midnight when yesterday was missed", () => {
    // Completed three days ago, but not yesterday — the streak is broken,
    // regardless of whether today gets completed.
    const dates = ["2026-03-07"];
    expect(computeStreaks(dates, daily, "2026-03-10")).toEqual({ current: 0, best: 1 });
  });

  it("dedupes duplicate completion dates", () => {
    const dates = ["2026-03-10", "2026-03-10", "2026-03-09"];
    expect(computeStreaks(dates, daily, "2026-03-10")).toEqual({ current: 2, best: 2 });
  });

  it("tracks best streak separately from a since-broken current streak", () => {
    const dates = ["2026-03-01", "2026-03-02", "2026-03-03", "2026-03-08"];
    expect(computeStreaks(dates, daily, "2026-03-10")).toEqual({ current: 0, best: 3 });
  });
});

describe("computeStreaks — weekly cadence", () => {
  const mwf = { type: "weekly" as const, daysOfWeek: [1, 3, 5] }; // Mon/Wed/Fri

  it("only counts due-days, skipping non-due days without breaking the streak", () => {
    // Mon 3/2, Wed 3/4, Fri 3/6 all completed; today is Sat 3/7 (not due).
    const dates = ["2026-03-02", "2026-03-04", "2026-03-06"];
    expect(computeStreaks(dates, mwf, "2026-03-07")).toEqual({ current: 3, best: 3 });
  });

  it("breaks when a due day in the past is missed", () => {
    // Missed Wed 3/4; Mon 3/2 and Fri 3/6 don't chain across the gap.
    const dates = ["2026-03-02", "2026-03-06"];
    expect(computeStreaks(dates, mwf, "2026-03-07")).toEqual({ current: 1, best: 1 });
  });

  it("is always zero when the habit is never due", () => {
    const neverDue = { type: "weekly" as const, daysOfWeek: [] };
    expect(computeStreaks(["2026-03-02"], neverDue, "2026-03-07")).toEqual({
      current: 0,
      best: 0,
    });
  });
});
