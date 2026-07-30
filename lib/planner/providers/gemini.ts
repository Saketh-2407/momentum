import { SYSTEM_INSTRUCTION, buildUserPrompt } from "@/lib/planner/prompt";
import { parsePlannerResponse } from "@/lib/planner/parse-response";
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
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ parts: [{ text: buildUserPrompt(rawText, context) }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Gemini request failed (${response.status}): ${body.slice(0, 500)}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") {
      throw new Error("Gemini response did not include any text output.");
    }

    let rawJson: unknown;
    try {
      rawJson = JSON.parse(text);
    } catch {
      throw new Error("Gemini response was not valid JSON.");
    }

    return parsePlannerResponse(rawJson);
  }
}
