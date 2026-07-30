export type ImportanceLevel = 1 | 2 | 3 | 4 | 5;
export type EffortLevel = 1 | 2 | 3 | 4 | 5;
export type EnergyLevel = "low" | "medium" | "high";

/** A single item as extracted from raw brain-dump text, before scoring/ordering. */
export interface ParsedTaskDraft {
  title: string;
  notes: string | null;
  importance: ImportanceLevel;
  effort: EffortLevel;
  energy: EnergyLevel;
  /** ISO datetime, resolved from relative phrases like "tomorrow" — null if none mentioned. */
  deadline: string | null;
  /** The exact title of another item in this same batch this one should follow, if any. */
  dependsOnTitle: string | null;
  /** Short plain-language reason from the model, e.g. "due today and high impact". */
  rationale: string;
}

export interface FixedCommitment {
  title: string;
  startsAt: string;
  endsAt: string;
}

export interface PlannerContext {
  /** The instant the plan is being generated, as ISO. */
  nowIso: string;
  timezone: string;
  /** Calendar events (Phase 5) the planner must schedule tasks around, never into. */
  fixedCommitments?: FixedCommitment[];
}

/** A parsed item after deterministic scoring, ordering, and time-blocking. */
export interface PlanItem extends ParsedTaskDraft {
  score: number;
  suggestedScheduledAt: string;
}

export interface PlanResult {
  items: PlanItem[];
}

export interface PlannerProvider {
  parse(rawText: string, context: PlannerContext): Promise<ParsedTaskDraft[]>;
}
