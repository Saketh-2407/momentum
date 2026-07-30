import { describe, expect, it, vi } from "vitest";
import { generatePlan } from "@/lib/planner";
import type { ParsedTaskDraft, PlannerContext, PlannerProvider } from "@/lib/planner/types";

const context: PlannerContext = { nowIso: "2026-03-05T09:00:00Z", timezone: "UTC" };

function fakeDraft(overrides: Partial<ParsedTaskDraft> = {}): ParsedTaskDraft {
  return {
    title: "Do the thing",
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

function fakeProvider(drafts: ParsedTaskDraft[] | Error): PlannerProvider {
  return {
    parse: vi.fn(async () => {
      if (drafts instanceof Error) throw drafts;
      return drafts;
    }),
  };
}

describe("generatePlan", () => {
  it("returns an empty plan for blank input without calling the provider", async () => {
    const provider = fakeProvider([fakeDraft()]);
    const result = await generatePlan("   ", context, provider);
    expect(result).toEqual({ plan: { items: [] } });
    expect(provider.parse).not.toHaveBeenCalled();
  });

  it("returns an empty plan for empty string input", async () => {
    const provider = fakeProvider([]);
    const result = await generatePlan("", context, provider);
    expect(result.plan?.items).toEqual([]);
  });

  it("rejects input over the length limit without calling the provider", async () => {
    const provider = fakeProvider([]);
    const result = await generatePlan("x".repeat(9000), context, provider);
    expect(result.error).toBeDefined();
    expect(provider.parse).not.toHaveBeenCalled();
  });

  it("returns a scored, ordered plan from the provider's drafts", async () => {
    const provider = fakeProvider([
      fakeDraft({ title: "Low priority" }),
      fakeDraft({ title: "Urgent", importance: 5, deadline: "2026-03-05T10:00:00Z" }),
    ]);
    const result = await generatePlan("stuff to do", context, provider);
    expect(result.error).toBeUndefined();
    expect(result.plan?.items[0].title).toBe("Urgent");
  });

  it("surfaces a provider error as a message instead of throwing", async () => {
    const provider = fakeProvider(new Error("network exploded"));
    const result = await generatePlan("stuff to do", context, provider);
    expect(result.error).toBe("network exploded");
    expect(result.plan).toBeUndefined();
  });

  it("surfaces garbage-input rejections from response parsing as a message", async () => {
    const provider: PlannerProvider = {
      parse: vi.fn(async () => {
        throw new Error("Planner response did not match the expected shape.");
      }),
    };
    const result = await generatePlan("asdkjaslkdj garbage", context, provider);
    expect(result.error).toContain("did not match");
  });
});
