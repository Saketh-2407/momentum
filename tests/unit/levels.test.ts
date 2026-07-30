import { describe, expect, it } from "vitest";
import { xpRequiredForLevel, getLevelProgress, didLevelUp } from "@/lib/gamification/levels";

describe("xpRequiredForLevel", () => {
  it("requires zero XP to be level 1", () => {
    expect(xpRequiredForLevel(1)).toBe(0);
  });

  it("grows by roughly 1.4-1.5x per level", () => {
    const requirement = (level: number) => xpRequiredForLevel(level + 1) - xpRequiredForLevel(level);
    for (let level = 2; level < 10; level++) {
      const ratio = requirement(level + 1) / requirement(level);
      expect(ratio).toBeGreaterThanOrEqual(1.3);
      expect(ratio).toBeLessThanOrEqual(1.6);
    }
  });

  it("is monotonically increasing", () => {
    for (let level = 1; level < 20; level++) {
      expect(xpRequiredForLevel(level + 1)).toBeGreaterThan(xpRequiredForLevel(level));
    }
  });
});

describe("getLevelProgress", () => {
  it("places a brand-new user (zero XP) at level 1 with no progress", () => {
    expect(getLevelProgress(0)).toEqual({
      level: 1,
      xpIntoLevel: 0,
      xpForNextLevel: xpRequiredForLevel(2),
      totalXp: 0,
    });
  });

  it("stays at level 1 just below the level-2 threshold", () => {
    const threshold = xpRequiredForLevel(2);
    expect(getLevelProgress(threshold - 1).level).toBe(1);
  });

  it("reaches level 2 exactly at the threshold", () => {
    const threshold = xpRequiredForLevel(2);
    expect(getLevelProgress(threshold).level).toBe(2);
  });

  it("treats negative XP as zero rather than throwing", () => {
    expect(getLevelProgress(-50)).toEqual(getLevelProgress(0));
  });

  it("computes xpIntoLevel relative to the current level's own threshold", () => {
    const threshold = xpRequiredForLevel(2);
    const progress = getLevelProgress(threshold + 10);
    expect(progress.level).toBe(2);
    expect(progress.xpIntoLevel).toBe(10);
  });
});

describe("didLevelUp", () => {
  it("is false when XP increases without crossing a threshold", () => {
    expect(didLevelUp(10, 20)).toBe(false);
  });

  it("is true when XP crosses a level threshold", () => {
    const threshold = xpRequiredForLevel(2);
    expect(didLevelUp(threshold - 1, threshold)).toBe(true);
  });

  it("is false for a zero-XP gain", () => {
    expect(didLevelUp(50, 50)).toBe(false);
  });
});
