import { describe, expect, it } from "vitest";
import { validateTaskDraft, type TaskDraft } from "@/lib/tasks/validation";

function draft(overrides: Partial<TaskDraft> = {}): TaskDraft {
  return { title: "Write the report", importance: 3, effort: 3, ...overrides };
}

describe("validateTaskDraft", () => {
  it("accepts a well-formed task", () => {
    expect(validateTaskDraft(draft())).toEqual({ valid: true });
  });

  it("rejects an empty title", () => {
    const result = validateTaskDraft(draft({ title: "" }));
    expect(result).toEqual({ valid: false, errors: ["Title is required."] });
  });

  it("rejects a whitespace-only title", () => {
    const result = validateTaskDraft(draft({ title: "   " }));
    expect(result.valid).toBe(false);
  });

  it("rejects a title over 200 characters", () => {
    const result = validateTaskDraft(draft({ title: "x".repeat(201) }));
    expect(result.valid).toBe(false);
  });

  it("rejects importance outside the 1-5 scale", () => {
    expect(validateTaskDraft(draft({ importance: 0 })).valid).toBe(false);
    expect(validateTaskDraft(draft({ importance: 6 })).valid).toBe(false);
    expect(validateTaskDraft(draft({ importance: 2.5 })).valid).toBe(false);
  });

  it("rejects effort outside the 1-5 scale", () => {
    expect(validateTaskDraft(draft({ effort: 0 })).valid).toBe(false);
    expect(validateTaskDraft(draft({ effort: 6 })).valid).toBe(false);
  });

  it("allows a deadline in the past — overdue is a valid, expected state", () => {
    const result = validateTaskDraft(draft({ deadline: "2020-01-01T00:00:00Z" }));
    expect(result).toEqual({ valid: true });
  });

  it("allows no scheduled time or deadline at all", () => {
    const result = validateTaskDraft(draft({ scheduledAt: null, deadline: null }));
    expect(result).toEqual({ valid: true });
  });

  it("rejects an unparseable scheduled time", () => {
    const result = validateTaskDraft(draft({ scheduledAt: "not-a-date" }));
    expect(result.valid).toBe(false);
  });

  it("collects multiple errors at once", () => {
    const result = validateTaskDraft(draft({ title: "", importance: 9, effort: 9 }));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toHaveLength(3);
    }
  });
});
