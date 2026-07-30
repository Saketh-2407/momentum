import { getWeekday } from "@/lib/date/local-day";

export type Cadence = { type: "daily" } | { type: "weekly"; daysOfWeek: number[] };

/** Whether a habit with the given cadence is due on a calendar date. */
export function isDueOnDate(cadence: Cadence, dateString: string): boolean {
  if (cadence.type === "daily") return true;
  return cadence.daysOfWeek.includes(getWeekday(dateString));
}

/** Adapts a `habits` table row (cadence_type + days_of_week) into a Cadence. */
export function cadenceFromRow(row: {
  cadence_type: CadenceType;
  days_of_week: number[];
}): Cadence {
  return row.cadence_type === "daily"
    ? { type: "daily" }
    : { type: "weekly", daysOfWeek: row.days_of_week };
}

type CadenceType = "daily" | "weekly";
