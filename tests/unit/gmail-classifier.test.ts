import { describe, expect, it } from "vitest";
import {
  buildClassifierPrompt,
  parseClassificationResponse,
} from "@/lib/connectors/gmail-classifier";

describe("buildClassifierPrompt", () => {
  it("includes the current time, timezone, and each email's fields", () => {
    const prompt = buildClassifierPrompt(
      [{ id: "1", subject: "Lease renewal", snippet: "Please respond by...", from: "landlord@x.com" }],
      { nowIso: "2026-03-05T09:00:00Z", timezone: "America/New_York" },
    );
    expect(prompt).toContain("2026-03-05T09:00:00Z");
    expect(prompt).toContain("America/New_York");
    expect(prompt).toContain("Lease renewal");
    expect(prompt).toContain("landlord@x.com");
  });
});

describe("parseClassificationResponse", () => {
  it("returns an empty array for no valid ids", () => {
    expect(parseClassificationResponse([], [])).toEqual([]);
  });

  it("parses a well-formed actionable classification", () => {
    const result = parseClassificationResponse(
      [{ id: "1", isActionable: true, title: "Reply to landlord", deadline: "2026-03-06T00:00:00Z" }],
      ["1"],
    );
    expect(result).toEqual([
      {
        id: "1",
        isActionable: true,
        title: "Reply to landlord",
        deadline: "2026-03-06T00:00:00.000Z",
      },
    ]);
  });

  it("nulls out title and deadline when not actionable, even if the model provided them", () => {
    const result = parseClassificationResponse(
      [{ id: "1", isActionable: false, title: "Ignore this newsletter", deadline: "2026-03-06T00:00:00Z" }],
      ["1"],
    );
    expect(result).toEqual([{ id: "1", isActionable: false, title: null, deadline: null }]);
  });

  it("drops a hallucinated id not present in the input", () => {
    const result = parseClassificationResponse(
      [
        { id: "1", isActionable: true, title: "Real one", deadline: null },
        { id: "999", isActionable: true, title: "Made up", deadline: null },
      ],
      ["1"],
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("fails closed (not-actionable) for an input id the model omitted", () => {
    const result = parseClassificationResponse([{ id: "1", isActionable: true, title: "T", deadline: null }], [
      "1",
      "2",
    ]);
    expect(result).toEqual([
      { id: "1", isActionable: true, title: "T", deadline: null },
      { id: "2", isActionable: false, title: null, deadline: null },
    ]);
  });

  it("fails closed entirely for a malformed response shape", () => {
    const result = parseClassificationResponse("not an array", ["1", "2"]);
    expect(result).toEqual([
      { id: "1", isActionable: false, title: null, deadline: null },
      { id: "2", isActionable: false, title: null, deadline: null },
    ]);
  });

  it("treats an unparseable deadline as no deadline", () => {
    const result = parseClassificationResponse(
      [{ id: "1", isActionable: true, title: "T", deadline: "garbage" }],
      ["1"],
    );
    expect(result[0].deadline).toBeNull();
  });
});
