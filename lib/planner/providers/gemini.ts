import { SYSTEM_INSTRUCTION, buildUserPrompt } from "@/lib/planner/prompt";
import { parsePlannerResponse } from "@/lib/planner/parse-response";
import { callGeminiJson } from "@/lib/ai/gemini-json";
import type { ParsedTaskDraft, PlannerContext, PlannerProvider } from "@/lib/planner/types";

const RESPONSE_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      title: { type: "STRING" },
      notes: { type: "STRING", nullable: true },
      importance: { type: "INTEGER" },
      effort: { type: "INTEGER" },
      energy: { type: "STRING", enum: ["low", "medium", "high"] },
      deadline: { type: "STRING", nullable: true },
      dependsOnTitle: { type: "STRING", nullable: true },
      rationale: { type: "STRING" },
    },
    required: ["title", "importance", "effort", "energy", "rationale"],
  },
};

export interface GeminiProviderOptions {
  apiKey: string;
  model?: string;
}

export class GeminiPlannerProvider implements PlannerProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(options: GeminiProviderOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model ?? "gemini-2.5-flash";
  }

  async parse(rawText: string, context: PlannerContext): Promise<ParsedTaskDraft[]> {
    const rawJson = await callGeminiJson({
      apiKey: this.apiKey,
      model: this.model,
      systemInstruction: SYSTEM_INSTRUCTION,
      userPrompt: buildUserPrompt(rawText, context),
      responseSchema: RESPONSE_SCHEMA,
    });

    return parsePlannerResponse(rawJson);
  }
}
