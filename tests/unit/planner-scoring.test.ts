import { describe, expect, it } from "vitest";
import {
  computeUrgency,
  computeEnergyFit,
  computeScore,
  resolveDependencies,
  assignTimeBlocks,
  buildPlan,
} from "@/lib/planner/scoring";
import type { ParsedTaskDraft, PlannerContext } from "@/lib/planner/types";

const NOW = "2026-03-05T09:00:00Z"; // a Thursday morning, UTC

function draft(overrides: Partial<ParsedTaskDraft> = {}): ParsedTaskDraft {
  return {
    title: "Task",
    notes: null,
    importance: 3,
    effort: 3,
    energy: "medium",
    deadline: null,
    dependsOnTitle: null,
    rationale: "because",
    ...overrides,
  };
}

describe("computeUrgency", () => {
  it("gives a low baseline with no deadline", () => {
    expect(computeUrgency(null, NOW)).toBe(0.2);
  });

  it("is maximum for an overdue deadline", () => {
    expect(computeUrgency("2026-03-04T00:00:00Z", NOW)).toBe(1);
  });

  it("is high for something due within 24 hours", () => {
    expect(computeUrgency("2026-03-05T20:00:00Z", NOW)).toBe(0.85);
  });

  it("is lower for something due next week", () => {
    expect(computeUrgency("2026-03-11T09:00:00Z", NOW)).toBe(0.4);
  });

  it("is lowest for something due far in the future", () => {
    expect(computeUrgency("2026-06-01T00:00:00Z", NOW)).toBe(0.25);
  });

  it("decreases monotonically as the deadline moves further out", () => {
    const near = computeUrgency("2026-03-05T10:00:00Z", NOW);
    const mid = computeUrgency("2026-03-07T09:00:00Z", NOW);
    const far = computeUrgency("2026-04-01T09:00:00Z", NOW);
    expect(near).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThan(far);
  });
});

describe("computeEnergyFit", () => {
  it("fits a high-energy task best in the morning", () => {
    expect(computeEnergyFit("high", 8)).toBeGreaterThan(computeEnergyFit("high", 20));
  });

  it("fits a medium-energy task best in the afternoon", () => {
    expect(computeEnergyFit("medium", 14)).toBeGreaterThan(computeEnergyFit("medium", 3));
  });

  it("fits a low-energy task fine at any hour, best late", () => {
    expect(computeEnergyFit("low", 22)).toBeGreaterThanOrEqual(computeEnergyFit("low", 9));
  });
});

describe("computeScore", () => {
  const context: PlannerContext = { nowIso: NOW, timezone: "UTC" };

  it("scores an urgent, important task higher than a trivial one", () => {
    const urgentImportant = draft({ importance: 5, deadline: "2026-03-05T12:00:00Z" });
    const trivial = draft({ importance: 1, deadline: null });
    expect(computeScore(urgentImportant, context)).toBeGreaterThan(computeScore(trivial, context));
  });

  it("is deterministic for identical input", () => {
    const task = draft({ importance: 4, deadline: "2026-03-06T00:00:00Z" });
    expect(computeScore(task, context)).toBe(computeScore(task, context));
  });
});

describe("resolveDependencies", () => {
  it("leaves independent items in their scored order", () => {
    const items = [{ title: "A", dependsOnTitle: null }, { title: "B", dependsOnTitle: null }];
    expect(resolveDependencies(items).map((i) => i.title)).toEqual(["A", "B"]);
  });

  it("moves a dependent item to after its dependency", () => {
    // "Reply to email" (depends on "Read email") was scored ahead of it.
    const items = [
      { title: "Reply to email", dependsOnTitle: "Read email" },
      { title: "Read email", dependsOnTitle: null },
    ];
    expect(resolveDependencies(items).map((i) => i.title)).toEqual([
      "Read email",
      "Reply to email",
    ]);
  });

  it("ignores a dependency that references a nonexistent title", () => {
    const items = [{ title: "A", dependsOnTitle: "Nonexistent" }, { title: "B", dependsOnTitle: null }];
    expect(resolveDependencies(items).map((i) => i.title)).toEqual(["A", "B"]);
  });

  it("does not loop forever on a dependency cycle", () => {
    const items = [
      { title: "A", dependsOnTitle: "B" },
      { title: "B", dependsOnTitle: "A" },
    ];
    expect(() => resolveDependencies(items)).not.toThrow();
  });

  it("settles a chain of three dependencies into the correct order", () => {
    const items = [
      { title: "C", dependsOnTitle: "B" },
      { title: "A", dependsOnTitle: null },
      { title: "B", dependsOnTitle: "A" },
    ];
    expect(resolveDependencies(items).map((i) => i.title)).toEqual(["A", "B", "C"]);
  });
});

describe("assignTimeBlocks", () => {
  it("returns an empty plan for no items", () => {
    expect(assignTimeBlocks([], NOW)).toEqual([]);
  });

  it("schedules the first item at now", () => {
    const [first] = assignTimeBlocks([{ effort: 2 }], NOW);
    expect(Date.parse(first.suggestedScheduledAt)).toBe(Date.parse(NOW));
  });

  it("schedules each following item after the previous one's effort-sized block", () => {
    const [first, second] = assignTimeBlocks([{ effort: 2 }, { effort: 1 }], NOW);
    const gapMinutes = (Date.parse(second.suggestedScheduledAt) - Date.parse(first.suggestedScheduledAt)) / 60_000;
    expect(gapMinutes).toBe(2 * 25);
  });
});

describe("buildPlan", () => {
  const context: PlannerContext = { nowIso: NOW, timezone: "UTC" };

  it("returns an empty plan for no drafts", () => {
    expect(buildPlan([], context)).toEqual([]);
  });

  it("orders an urgent task before an undated trivial one", () => {
    const drafts = [
      draft({ title: "Someday maybe", importance: 1, deadline: null }),
      draft({ title: "Due today", importance: 5, deadline: "2026-03-05T12:00:00Z" }),
    ];
    const plan = buildPlan(drafts, context);
    expect(plan[0].title).toBe("Due today");
  });

  it("keeps a dependent task after the task it depends on even if scored higher", () => {
    const drafts = [
      draft({
        title: "Submit form",
        importance: 5,
        deadline: "2026-03-05T10:00:00Z",
        dependsOnTitle: "Gather documents",
      }),
      draft({ title: "Gather documents", importance: 2, deadline: null }),
    ];
    const plan = buildPlan(drafts, context);
    const submitIndex = plan.findIndex((i) => i.title === "Submit form");
    const gatherIndex = plan.findIndex((i) => i.title === "Gather documents");
    expect(gatherIndex).toBeLessThan(submitIndex);
  });

  it("assigns every item a suggested time in scored order", () => {
    const drafts = [
      draft({ title: "Low priority", importance: 1, effort: 1 }),
      draft({ title: "High priority", importance: 5, deadline: "2026-03-05T10:00:00Z", effort: 1 }),
    ];
    const plan = buildPlan(drafts, context);
    expect(plan[0].title).toBe("High priority");
    expect(Date.parse(plan[0].suggestedScheduledAt)).toBeLessThan(
      Date.parse(plan[1].suggestedScheduledAt),
    );
  });
});
