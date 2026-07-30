import { describe, expect, it } from "vitest";
import { computeTaskXp } from "@/lib/gamification/xp";

describe("computeTaskXp", () => {
  it("awards the minimum for the lowest importance and effort", () => {
    expect(computeTaskXp(1, 1)).toBe(5);
  });

  it("awards the maximum for the highest importance and effort", () => {
    expect(computeTaskXp(5, 5)).toBe(125);
  });

  it("scales with importance holding effort fixed", () => {
    expect(computeTaskXp(2, 3)).toBeLessThan(computeTaskXp(4, 3));
  });

  it("scales with effort holding importance fixed", () => {
    expect(computeTaskXp(3, 2)).toBeLessThan(computeTaskXp(3, 4));
  });

  it("cannot be gamed by trivial tasks — low importance and effort pays little", () => {
    expect(computeTaskXp(1, 1)).toBeLessThan(computeTaskXp(5, 5) / 10);
  });
});
