import { describe, expect, it } from "vitest";
import { parsePlannerResponse } from "@/lib/planner/parse-response";

describe("parsePlannerResponse", () => {
  it("returns an empty array for an empty response", () => {
    expect(parsePlannerResponse([])).toEqual([]);
  });

  it("parses a well-formed item", () => {
    const [item] = parsePlannerResponse([
      {
        title: "Reply to landlord",
        notes: "About the lease renewal",
        importance: 4,
        effort: 2,
        energy: "medium",
        deadline: "2026-03-06T09:00:00Z",
        dependsOnTitle: null,
        rationale: "due soon",
      },
    ]);
    expect(item).toEqual({
      title: "Reply to landlord",
      notes: "About the lease renewal",
      importance: 4,
      effort: 2,
      energy: "medium",
      deadline: "2026-03-06T09:00:00.000Z",
      dependsOnTitle: null,
      rationale: "due soon",
    });
  });

  it("clamps out-of-range importance and effort into 1-5", () => {
    const [item] = parsePlannerResponse([
      { title: "X", importance: 12, effort: -3, rationale: "r" },
    ]);
    expect(item.importance).toBe(5);
    expect(item.effort).toBe(1);
  });

  it("defaults missing importance/effort to the middle of the scale", () => {
    const [item] = parsePlannerResponse([{ title: "X", rationale: "r" }]);
    expect(item.importance).toBe(3);
    expect(item.effort).toBe(3);
  });

  it("normalizes an invalid energy value to medium", () => {
    const [item] = parsePlannerResponse([
      { title: "X", energy: "extreme", rationale: "r" },
    ]);
    expect(item.energy).toBe("medium");
  });

  it("treats an unparseable deadline as no deadline", () => {
    const [item] = parsePlannerResponse([
      { title: "X", deadline: "not a date", rationale: "r" },
    ]);
    expect(item.deadline).toBeNull();
  });

  it("falls back to a generic rationale when the model omits one", () => {
    const [item] = parsePlannerResponse([{ title: "X" }]);
    expect(item.rationale).toBe("Part of your brain dump.");
  });

  it("rejects a response that is not an array", () => {
    expect(() => parsePlannerResponse({ title: "X" })).toThrow();
  });

  it("rejects an item missing a title", () => {
    expect(() => parsePlannerResponse([{ rationale: "r" }])).toThrow();
  });

  it("rejects a completely malformed response", () => {
    expect(() => parsePlannerResponse("not json at all")).toThrow();
  });
});
