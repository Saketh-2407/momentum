import { describe, expect, it } from "vitest";
import { EVAL_SET, scoreEvalCase } from "@/lib/planner/eval-set";
import type { PlanItem } from "@/lib/planner/types";

function item(overrides: Partial<PlanItem>): PlanItem {
  return {
    title: "Item",
    notes: null,
    importance: 3,
    effort: 3,
    energy: "medium",
    deadline: null,
    dependsOnTitle: null,
    rationale: "r",
    score: 0,
    suggestedScheduledAt: "2026-03-05T09:00:00Z",
    ...overrides,
  };
}

describe("EVAL_SET", () => {
  it("defines at least 5 cases, each with checks", () => {
    expect(EVAL_SET.length).toBeGreaterThanOrEqual(5);
    for (const evalCase of EVAL_SET) {
      expect(evalCase.checks.length).toBeGreaterThan(0);
    }
  });
});

describe("scoreEvalCase", () => {
  const urgentCase = EVAL_SET.find((c) => c.name.includes("urgent deadline"))!;

  it("passes all checks for a well-ordered plan", () => {
    const plan = [item({ title: "Finish the tax filing" }), item({ title: "Reorganize bookshelf" })];
    const result = scoreEvalCase(urgentCase, plan);
    expect(result.passedCount).toBe(result.totalCount);
  });

  it("fails the ordering check when ranked the wrong way", () => {
    const plan = [item({ title: "Reorganize bookshelf" }), item({ title: "Finish the tax filing" })];
    const result = scoreEvalCase(urgentCase, plan);
    expect(result.passedCount).toBeLessThan(result.totalCount);
  });

  const ventingCase = EVAL_SET.find((c) => c.name.includes("venting"))!;

  it("passes the venting case for an empty plan", () => {
    const result = scoreEvalCase(ventingCase, []);
    expect(result.passedCount).toBe(result.totalCount);
  });

  it("fails the venting case if items were fabricated", () => {
    const result = scoreEvalCase(ventingCase, [item({ title: "Feel less stressed" })]);
    expect(result.passedCount).toBe(0);
  });
});
