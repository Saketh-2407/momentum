export interface GeminiJsonCallParams {
  apiKey: string;
  model?: string;
  systemInstruction: string;
  userPrompt: string;
  responseSchema: unknown;
}

/**
 * Calls Gemini with schema-constrained JSON output and returns the parsed
 * result. Shared by lib/planner (task extraction) and the Gmail connector
 * (email classification) — both need the identical request shape and error
 * handling, just a different prompt/schema.
 */
export async function callGeminiJson(params: GeminiJsonCallParams): Promise<unknown> {
  const model = params.model ?? "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${params.apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: params.systemInstruction }] },
      contents: [{ parts: [{ text: params.userPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: params.responseSchema,
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

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Gemini response was not valid JSON.");
  }
}
