export type ImportanceEffortValue = 1 | 3 | 5;

export interface ImportanceEffortLevel {
  value: ImportanceEffortValue;
  label: "Low" | "Medium" | "High";
}

/** The three user-facing levels for importance/effort selects. Stored as numbers (1/3/5). */
export const IMPORTANCE_EFFORT_LEVELS: readonly ImportanceEffortLevel[] = [
  { value: 1, label: "Low" },
  { value: 3, label: "Medium" },
  { value: 5, label: "High" },
];

/**
 * Rounds an arbitrary value (e.g. 2 or 4, as the AI planner can still return
 * on the underlying 1-5 scale) to the nearest selectable level. Ties round
 * toward the lower level.
 */
export function nearestImportanceEffortLevel(value: number): ImportanceEffortValue {
  return IMPORTANCE_EFFORT_LEVELS.reduce((closest, level) =>
    Math.abs(level.value - value) < Math.abs(closest.value - value) ? level : closest,
  ).value;
}

/**
 * `{ value, label }` pairs with string values, for Base UI Select's `items`
 * prop — required so `<SelectValue>` renders "Medium" instead of the raw
 * underlying value "3" in the trigger.
 */
export const IMPORTANCE_EFFORT_SELECT_ITEMS = IMPORTANCE_EFFORT_LEVELS.map((level) => ({
  value: String(level.value),
  label: level.label,
}));
