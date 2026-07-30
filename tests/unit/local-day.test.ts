import { describe, expect, it } from "vitest";
import { toLocalDateString, addDays, getWeekday, toLocalHour } from "@/lib/date/local-day";

describe("toLocalDateString", () => {
  it("formats a UTC instant in UTC", () => {
    expect(toLocalDateString(new Date("2026-03-05T12:00:00Z"), "UTC")).toBe("2026-03-05");
  });

  it("rolls back to the previous day west of UTC near midnight", () => {
    // 01:30 UTC is still 17:30 the previous day in Los Angeles (UTC-8).
    expect(toLocalDateString(new Date("2026-03-05T01:30:00Z"), "America/Los_Angeles")).toBe(
      "2026-03-04",
    );
  });

  it("rolls forward to the next day east of UTC near midnight", () => {
    // 22:30 UTC is already 07:30 the next day in Tokyo (UTC+9).
    expect(toLocalDateString(new Date("2026-03-04T22:30:00Z"), "Asia/Tokyo")).toBe("2026-03-05");
  });
});

describe("addDays", () => {
  it("adds days within a month", () => {
    expect(addDays("2026-03-05", 3)).toBe("2026-03-08");
  });

  it("subtracts days across a month boundary", () => {
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("handles a leap year February", () => {
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
  });

  it("handles a year boundary", () => {
    expect(addDays("2025-12-31", 1)).toBe("2026-01-01");
  });

  it("is a no-op for zero days", () => {
    expect(addDays("2026-03-05", 0)).toBe("2026-03-05");
  });
});

describe("getWeekday", () => {
  it("identifies a known Sunday", () => {
    expect(getWeekday("2026-03-01")).toBe(0);
  });

  it("identifies a known Saturday", () => {
    expect(getWeekday("2026-03-07")).toBe(6);
  });
});

describe("toLocalHour", () => {
  it("reads the hour directly in UTC", () => {
    expect(toLocalHour(new Date("2026-03-05T14:30:00Z"), "UTC")).toBe(14);
  });

  it("normalizes midnight to 0 rather than 24", () => {
    expect(toLocalHour(new Date("2026-03-05T00:15:00Z"), "UTC")).toBe(0);
  });

  it("shifts the hour across a timezone boundary", () => {
    // 02:00 UTC is 18:00 the previous day in Los Angeles (UTC-8).
    expect(toLocalHour(new Date("2026-03-05T02:00:00Z"), "America/Los_Angeles")).toBe(18);
  });
});
