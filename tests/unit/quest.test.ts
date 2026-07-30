import { describe, expect, it } from "vitest";
import { computeQuestProgress } from "@/lib/social/quest";

describe("computeQuestProgress", () => {
  it("is zero progress with no contributions", () => {
    expect(computeQuestProgress([], 10)).toEqual({
      completed: 0,
      target: 10,
      percent: 0,
      isComplete: false,
    });
  });

  it("sums contributions from multiple members", () => {
    const progress = computeQuestProgress([3, 5, 2], 10);
    expect(progress.completed).toBe(10);
    expect(progress.isComplete).toBe(true);
  });

  it("caps percent at 100 even if contributions exceed the target", () => {
    const progress = computeQuestProgress([8, 8], 10);
    expect(progress.completed).toBe(16);
    expect(progress.percent).toBe(100);
    expect(progress.isComplete).toBe(true);
  });

  it("rounds the percent to the nearest whole number", () => {
    const progress = computeQuestProgress([1], 3);
    expect(progress.percent).toBe(33);
  });

  it("is not complete just below the target", () => {
    const progress = computeQuestProgress([9], 10);
    expect(progress.isComplete).toBe(false);
  });
});
