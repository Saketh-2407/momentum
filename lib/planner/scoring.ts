import { toLocalHour } from "@/lib/date/local-day";
import type { EnergyLevel, ParsedTaskDraft, PlanItem, PlannerContext } from "@/lib/planner/types";

const URGENCY_IMPORTANCE_WEIGHT = 20;
const ENERGY_FIT_WEIGHT = 10;
const MINUTES_PER_EFFORT_POINT = 25;
const MAX_DEPENDENCY_PASSES = 50;

/**
 * Urgency in [0, 1] from a deadline relative to now. No deadline is a low,
 * constant baseline rather than zero — an undated task still matters some.
 */
export function computeUrgency(deadline: string | null, nowIso: string): number {
  if (!deadline) return 0.2;

  const hoursUntilDue = (Date.parse(deadline) - Date.parse(nowIso)) / 3_600_000;
  if (hoursUntilDue <= 0) return 1;
  if (hoursUntilDue <= 24) return 0.85;
  if (hoursUntilDue <= 72) return 0.6;
  if (hoursUntilDue <= 168) return 0.4;
  return 0.25;
}

/** How well a task's energy requirement suits the given hour of day, in [0, 1]. */
export function computeEnergyFit(energy: EnergyLevel, hour: number): number {
  const isMorning = hour >= 6 && hour < 12;
  const isAfternoon = hour >= 12 && hour < 18;

  if (energy === "high") return isMorning ? 1 : isAfternoon ? 0.6 : 0.2;
  if (energy === "medium") return isAfternoon ? 1 : isMorning ? 0.8 : 0.4;
  return isMorning || isAfternoon ? 0.7 : 1; // low-energy tasks fit fine anytime, best late.
}

/** Deterministic priority score: urgency x importance, plus a rough energy/time-of-day fit. */
export function computeScore(
  task: Pick<ParsedTaskDraft, "importance" | "deadline" | "energy">,
  context: PlannerContext,
): number {
  const urgency = computeUrgency(task.deadline, context.nowIso);
  const hour = toLocalHour(new Date(context.nowIso), context.timezone);
  const energyFit = computeEnergyFit(task.energy, hour);
  return urgency * task.importance * URGENCY_IMPORTANCE_WEIGHT + energyFit * ENERGY_FIT_WEIGHT;
}

/**
 * Moves each item with a `dependsOnTitle` to immediately after the item it
 * depends on, if it isn't already positioned after it. Bounded rather than a
 * full topological sort — good enough for the simple "do X before Y" case
 * the planner's prompt asks for, and a genuine cycle just stops adjusting
 * after the pass cap rather than looping forever.
 */
export function resolveDependencies<T extends { title: string; dependsOnTitle: string | null }>(
  items: T[],
): T[] {
  const ordered = [...items];

  for (let pass = 0; pass < MAX_DEPENDENCY_PASSES; pass++) {
    let moved = false;

    for (let i = 0; i < ordered.length; i++) {
      const dependsOnTitle = ordered[i].dependsOnTitle;
      if (!dependsOnTitle) continue;

      const dependencyIndex = ordered.findIndex((item) => item.title === dependsOnTitle);
      if (dependencyIndex === -1 || dependencyIndex < i) continue;

      const [item] = ordered.splice(i, 1);
      ordered.splice(dependencyIndex, 0, item);
      moved = true;
    }

    if (!moved) break;
  }

  return ordered;
}

/** Assigns sequential time-blocks starting now, sized by each task's effort. */
export function assignTimeBlocks<T extends { effort: number }>(
  items: T[],
  nowIso: string,
): (T & { suggestedScheduledAt: string })[] {
  let cursor = Date.parse(nowIso);

  return items.map((item) => {
    const suggestedScheduledAt = new Date(cursor).toISOString();
    cursor += item.effort * MINUTES_PER_EFFORT_POINT * 60_000;
    return { ...item, suggestedScheduledAt };
  });
}

/** Full pipeline: score, order by score (dependencies win ties), then time-block. */
export function buildPlan(drafts: ParsedTaskDraft[], context: PlannerContext): PlanItem[] {
  const scored = drafts.map((draft) => ({ ...draft, score: computeScore(draft, context) }));
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const dependencyOrdered = resolveDependencies(sorted);
  return assignTimeBlocks(dependencyOrdered, context.nowIso);
}
