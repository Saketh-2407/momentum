import { GeminiPlannerProvider } from "@/lib/planner/providers/gemini";
import { buildPlan } from "@/lib/planner/scoring";
import type { PlannerContext, PlannerProvider, PlanResult } from "@/lib/planner/types";

export type { PlannerContext, PlannerProvider, PlanResult, PlanItem, ParsedTaskDraft } from "@/lib/planner/types";
export { buildPlan } from "@/lib/planner/scoring";

const MAX_INPUT_LENGTH = 8000;

/**
 * The single place the active model provider is chosen. Swapping providers
 * (e.g. to a no-training-guaranteed one before real user email data flows
 * through Phase 5's Gmail triage) means changing this function alone.
 */
export function getDefaultProvider(): PlannerProvider {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return new GeminiPlannerProvider({ apiKey, model: process.env.GEMINI_MODEL });
}

export interface GeneratePlanResult {
  plan?: PlanResult;
  error?: string;
}

/**
 * Brain-dump text in, an ordered, time-blocked plan out. Empty input is a
 * valid, cheap no-op (no model call); oversized input and provider/network
 * failures are caught and returned as a message rather than thrown, so
 * callers (the API route, the eval script) always get a result object.
 */
export async function generatePlan(
  rawText: string,
  context: PlannerContext,
  provider: PlannerProvider = getDefaultProvider(),
): Promise<GeneratePlanResult> {
  const trimmed = rawText.trim();

  if (!trimmed) {
    return { plan: { items: [] } };
  }

  if (trimmed.length > MAX_INPUT_LENGTH) {
    return { error: `That's a lot — try under ${MAX_INPUT_LENGTH} characters at a time.` };
  }

  try {
    const drafts = await provider.parse(trimmed, context);
    return { plan: { items: buildPlan(drafts, context) } };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "The planner failed unexpectedly.",
    };
  }
}
