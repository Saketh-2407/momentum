import { describe, expect, it } from "vitest";
import {
  applyDayOutcome,
  advanceStreak,
  EMPTY_STREAK_STATE,
  type StreakState,
} from "@/lib/gamification/streak";

describe("applyDayOutcome", () => {
  it("increments the streak on a completed day", () => {
    const next = applyDayOutcome(EMPTY_STREAK_STATE, { date: "2026-03-01", completed: true });
    expect(next).toEqual({
      currentStreak: 1,
      longestStreak: 1,
      freezeCount: 0,
      lastProcessedDate: "2026-03-01",
    });
  });

  it("decays the streak on a missed day with no freeze available", () => {
    const state: StreakState = {
      currentStreak: 10,
      longestStreak: 10,
      freezeCount: 0,
      lastProcessedDate: "2026-03-01",
    };
    const next = applyDayOutcome(state, { date: "2026-03-02", completed: false });
    expect(next.currentStreak).toBe(5); // floor(10 * 0.5)
    expect(next.longestStreak).toBe(10); // never decreases
  });

  it("never lets decay go negative from a small streak", () => {
    const state: StreakState = { ...EMPTY_STREAK_STATE, currentStreak: 1 };
    const next = applyDayOutcome(state, { date: "2026-03-02", completed: false });
    expect(next.currentStreak).toBe(0);
  });

  it("spends a banked freeze instead of decaying, leaving the streak untouched", () => {
    const state: StreakState = {
      currentStreak: 7,
      longestStreak: 7,
      freezeCount: 1,
      lastProcessedDate: "2026-03-01",
    };
    const next = applyDayOutcome(state, { date: "2026-03-02", completed: false });
    expect(next.currentStreak).toBe(7);
    expect(next.freezeCount).toBe(0);
  });

  it("earns a freeze every 7-day milestone, capped at 3", () => {
    let state: StreakState = EMPTY_STREAK_STATE;
    let date = "2026-01-01";
    for (let day = 1; day <= 7; day++) {
      state = applyDayOutcome(state, { date, completed: true });
      date = `2026-01-${String(day + 1).padStart(2, "0")}`;
    }
    expect(state.currentStreak).toBe(7);
    expect(state.freezeCount).toBe(1);
  });

  it("caps banked freezes at 3 even across multiple milestones", () => {
    let state: StreakState = { ...EMPTY_STREAK_STATE, freezeCount: 3, currentStreak: 13 };
    state = applyDayOutcome(state, { date: "2026-01-14", completed: true }); // day 14: milestone
    expect(state.currentStreak).toBe(14);
    expect(state.freezeCount).toBe(3);
  });
});

describe("advanceStreak", () => {
  it("does nothing for a brand-new user before their first day passes", () => {
    const next = advanceStreak(EMPTY_STREAK_STATE, new Set(), "2026-03-01");
    expect(next).toEqual(EMPTY_STREAK_STATE);
  });

  it("bumps the streak immediately when today is already completed", () => {
    const next = advanceStreak(EMPTY_STREAK_STATE, new Set(["2026-03-01"]), "2026-03-01");
    expect(next.currentStreak).toBe(1);
    expect(next.lastProcessedDate).toBe("2026-03-01");
  });

  it("does not double-count today on a second call the same day", () => {
    const once = advanceStreak(EMPTY_STREAK_STATE, new Set(["2026-03-01"]), "2026-03-01");
    const twice = advanceStreak(once, new Set(["2026-03-01"]), "2026-03-01");
    expect(twice).toEqual(once);
  });

  it("leaves an incomplete today pending rather than treating it as missed", () => {
    const state: StreakState = {
      currentStreak: 3,
      longestStreak: 3,
      freezeCount: 0,
      lastProcessedDate: "2026-03-01",
    };
    const next = advanceStreak(state, new Set(), "2026-03-02");
    expect(next).toEqual(state);
  });

  it("settles a gap of missed days once time has passed, decaying once per missed day", () => {
    const state: StreakState = {
      currentStreak: 4,
      longestStreak: 4,
      freezeCount: 0,
      lastProcessedDate: "2026-03-01",
    };
    // 03-02 and 03-03 passed with nothing completed; "today" is now 03-04.
    const next = advanceStreak(state, new Set(), "2026-03-04");
    expect(next.currentStreak).toBe(1); // floor(4*0.5)=2, then floor(2*0.5)=1
    expect(next.lastProcessedDate).toBe("2026-03-03");
  });

  it("uses a banked freeze to cover exactly one missed day in a gap", () => {
    const state: StreakState = {
      currentStreak: 4,
      longestStreak: 4,
      freezeCount: 1,
      lastProcessedDate: "2026-03-01",
    };
    const next = advanceStreak(state, new Set(["2026-03-03"]), "2026-03-04");
    // 03-02 missed (freeze spent, streak stays 4), 03-03 completed (streak -> 5).
    expect(next.currentStreak).toBe(5);
    expect(next.freezeCount).toBe(0);
  });
});
