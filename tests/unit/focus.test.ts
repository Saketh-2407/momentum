import { describe, expect, it } from "vitest";
import { computeFocusXp } from "@/lib/gamification/focus";

describe("computeFocusXp", () => {
  it("scales with session length", () => {
    expect(computeFocusXp(25)).toBe(50);
    expect(computeFocusXp(10)).toBeLessThan(computeFocusXp(25));
  });

  it("is zero for a zero-length session", () => {
    expect(computeFocusXp(0)).toBe(0);
  });

  it("rounds to a whole number", () => {
    expect(Number.isInteger(computeFocusXp(7))).toBe(true);
  });
});
