import { describe, expect, it } from "vitest";
import {
  IMPORTANCE_EFFORT_LEVELS,
  nearestImportanceEffortLevel,
} from "@/lib/tasks/importance-effort";

describe("IMPORTANCE_EFFORT_LEVELS", () => {
  it("defines exactly Low, Medium, High mapped to 1, 3, 5", () => {
    expect(IMPORTANCE_EFFORT_LEVELS).toEqual([
      { value: 1, label: "Low" },
      { value: 3, label: "Medium" },
      { value: 5, label: "High" },
    ]);
  });
});

describe("nearestImportanceEffortLevel", () => {
  it("maps exact level values to themselves", () => {
    expect(nearestImportanceEffortLevel(1)).toBe(1);
    expect(nearestImportanceEffortLevel(3)).toBe(3);
    expect(nearestImportanceEffortLevel(5)).toBe(5);
  });

  it("rounds 2 down to 1 (tie rounds toward the lower level)", () => {
    expect(nearestImportanceEffortLevel(2)).toBe(1);
  });

  it("rounds 4 down to 3 (tie rounds toward the lower level)", () => {
    expect(nearestImportanceEffortLevel(4)).toBe(3);
  });

  it("clamps a value below the range to the lowest level", () => {
    expect(nearestImportanceEffortLevel(0)).toBe(1);
    expect(nearestImportanceEffortLevel(-5)).toBe(1);
  });

  it("clamps a value above the range to the highest level", () => {
    expect(nearestImportanceEffortLevel(6)).toBe(5);
    expect(nearestImportanceEffortLevel(100)).toBe(5);
  });
});
