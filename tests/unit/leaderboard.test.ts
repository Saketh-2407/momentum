import { describe, expect, it } from "vitest";
import { computeWeekStart, rankLeaderboard, type LeaderboardEntry } from "@/lib/social/leaderboard";

describe("computeWeekStart", () => {
  it("returns the same Monday for a Wednesday", () => {
    // 2026-03-04 is a Wednesday; the Monday of that week is 2026-03-02.
    expect(computeWeekStart("2026-03-04T15:00:00Z")).toBe("2026-03-02T00:00:00.000Z");
  });

  it("returns itself (midnight) for a Monday", () => {
    expect(computeWeekStart("2026-03-02T00:00:00Z")).toBe("2026-03-02T00:00:00.000Z");
  });

  it("rolls back across a month boundary for a Sunday", () => {
    // 2026-03-01 is a Sunday, the last day of the week starting 2026-02-23.
    expect(computeWeekStart("2026-03-01T23:00:00Z")).toBe("2026-02-23T00:00:00.000Z");
  });
});

function entry(overrides: Partial<LeaderboardEntry>): LeaderboardEntry {
  return { userId: "u", displayName: "User", weeklyXp: 0, currentStreak: 0, ...overrides };
}

describe("rankLeaderboard", () => {
  it("returns an empty ranking for no entries", () => {
    expect(rankLeaderboard([])).toEqual([]);
  });

  it("ranks by weekly XP descending", () => {
    const entries = [entry({ userId: "a", weeklyXp: 10 }), entry({ userId: "b", weeklyXp: 50 })];
    const ranked = rankLeaderboard(entries);
    expect(ranked.map((e) => e.userId)).toEqual(["b", "a"]);
    expect(ranked.map((e) => e.rank)).toEqual([1, 2]);
  });

  it("breaks a weekly XP tie using current streak", () => {
    const entries = [
      entry({ userId: "a", weeklyXp: 20, currentStreak: 2 }),
      entry({ userId: "b", weeklyXp: 20, currentStreak: 9 }),
    ];
    const ranked = rankLeaderboard(entries);
    expect(ranked.map((e) => e.userId)).toEqual(["b", "a"]);
  });

  it("gives fully tied entries the same rank and skips the next rank number", () => {
    const entries = [
      entry({ userId: "a", weeklyXp: 30, currentStreak: 3 }),
      entry({ userId: "b", weeklyXp: 30, currentStreak: 3 }),
      entry({ userId: "c", weeklyXp: 10, currentStreak: 1 }),
    ];
    const ranked = rankLeaderboard(entries);
    expect(ranked.map((e) => e.rank)).toEqual([1, 1, 3]);
  });

  it("handles a single entry", () => {
    const ranked = rankLeaderboard([entry({ userId: "solo", weeklyXp: 5 })]);
    expect(ranked).toEqual([{ userId: "solo", displayName: "User", weeklyXp: 5, currentStreak: 0, rank: 1 }]);
  });
});
