import { z } from "zod";
import type { ParsedTaskDraft } from "@/lib/planner/types";

const rawItemSchema = z.object({
  title: z.string().trim().min(1),
  notes: z.string().nullish(),
  importance: z.coerce.number().nullish(),
  effort: z.coerce.number().nullish(),
  energy: z.string().nullish(),
  deadline: z.string().nullish(),
  dependsOnTitle: z.string().nullish(),
  rationale: z.string().nullish(),
});

const rawArraySchema = z.array(rawItemSchema);

function clampScale(value: number | null | undefined, fallback: 1 | 2 | 3 | 4 | 5): 1 | 2 | 3 | 4 | 5 {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const rounded = Math.round(value);
  return Math.min(5, Math.max(1, rounded)) as 1 | 2 | 3 | 4 | 5;
}

function normalizeEnergy(value: string | null | undefined): "low" | "medium" | "high" {
  return value === "low" || value === "high" ? value : "medium";
}

function normalizeDeadline(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

/**
 * Validates and normalizes a model's raw JSON output into safe ParsedTaskDrafts.
 * Defense-in-depth beyond the provider's own schema constraint: providers and
 * networks can still return malformed or partial data.
 */
export function parsePlannerResponse(rawJson: unknown): ParsedTaskDraft[] {
  const result = rawArraySchema.safeParse(rawJson);
  if (!result.success) {
    throw new Error("Planner response did not match the expected shape.");
  }

  return result.data.map((item) => ({
    title: item.title.trim(),
    notes: item.notes?.trim() || null,
    importance: clampScale(item.importance, 3),
    effort: clampScale(item.effort, 3),
    energy: normalizeEnergy(item.energy),
    deadline: normalizeDeadline(item.deadline),
    dependsOnTitle: item.dependsOnTitle?.trim() || null,
    rationale: item.rationale?.trim() || "Part of your brain dump.",
  }));
}
