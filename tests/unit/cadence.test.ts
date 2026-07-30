import { describe, expect, it } from "vitest";
import { isDueOnDate } from "@/lib/habits/cadence";

describe("isDueOnDate", () => {
  it("is always due for daily cadence", () => {
    expect(isDueOnDate({ type: "daily" }, "2026-03-01")).toBe(true);
    expect(isDueOnDate({ type: "daily" }, "2026-03-07")).toBe(true);
  });

  it("is due only on the configured weekdays", () => {
    // 2026-03-02 is a Monday, 2026-03-03 is a Tuesday.
    const cadence = { type: "weekly" as const, daysOfWeek: [1, 3, 5] }; // Mon/Wed/Fri
    expect(isDueOnDate(cadence, "2026-03-02")).toBe(true);
    expect(isDueOnDate(cadence, "2026-03-03")).toBe(false);
  });

  it("is never due when no weekdays are configured", () => {
    expect(isDueOnDate({ type: "weekly", daysOfWeek: [] }, "2026-03-01")).toBe(false);
  });
});
