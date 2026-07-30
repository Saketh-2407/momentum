import { z } from "zod";
import { callGeminiJson } from "@/lib/ai/gemini-json";
import type { EmailSummary } from "@/lib/connectors/gmail";

export interface EmailClassification {
  id: string;
  isActionable: boolean;
  title: string | null;
  deadline: string | null;
}

export interface ClassifierContext {
  nowIso: string;
  timezone: string;
}

const SYSTEM_INSTRUCTION = `You are the email triage engine inside Momentum, a task app. You will
receive a list of emails (id, subject, sender, and a short snippet — never the full body).

For each email, decide: does it need a reply, contain a task, or imply a deadline? Ignore
newsletters, receipts, notifications, and anything not requiring the user's action.

For each email id in the input, return exactly one object:
- id: the email's id, copied exactly.
- isActionable: true only if the user genuinely needs to do something about this email.
- title: if actionable, a short action title (e.g. "Reply to landlord about lease"). Null otherwise.
- deadline: an absolute ISO 8601 datetime if the email implies one, resolved using the current
  date/time and timezone given below. Null otherwise.

Return ONLY the JSON array, one entry per input email, in the same order — no prose.`;

const RESPONSE_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      id: { type: "STRING" },
      isActionable: { type: "BOOLEAN" },
      title: { type: "STRING", nullable: true },
      deadline: { type: "STRING", nullable: true },
    },
    required: ["id", "isActionable"],
  },
};

export function buildClassifierPrompt(emails: EmailSummary[], context: ClassifierContext): string {
  const list = emails
    .map((email) => `- id: ${email.id}\n  subject: ${email.subject}\n  from: ${email.from}\n  snippet: ${email.snippet}`)
    .join("\n");

  return [`Current date/time: ${context.nowIso}`, `User's timezone: ${context.timezone}`, "", "Emails:", list].join(
    "\n",
  );
}

const rawClassificationSchema = z.object({
  id: z.string(),
  isActionable: z.coerce.boolean().nullish(),
  title: z.string().nullish(),
  deadline: z.string().nullish(),
});

const rawArraySchema = z.array(rawClassificationSchema);

function normalizeDeadline(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

/**
 * Validates the model's raw output and reconciles it against the known set
 * of input ids: a hallucinated id is dropped, and any input id the model
 * silently omitted defaults to not-actionable (fail closed — no suggestion
 * is safer than a fabricated one).
 */
export function parseClassificationResponse(
  rawJson: unknown,
  validIds: string[],
): EmailClassification[] {
  const result = rawArraySchema.safeParse(rawJson);
  const byId = new Map<string, EmailClassification>();

  if (result.success) {
    for (const item of result.data) {
      if (!validIds.includes(item.id)) continue;
      byId.set(item.id, {
        id: item.id,
        isActionable: item.isActionable ?? false,
        title: item.isActionable ? item.title?.trim() || null : null,
        deadline: item.isActionable ? normalizeDeadline(item.deadline) : null,
      });
    }
  }

  return validIds.map(
    (id) => byId.get(id) ?? { id, isActionable: false, title: null, deadline: null },
  );
}

export async function classifyEmails(
  emails: EmailSummary[],
  context: ClassifierContext,
  apiKey: string,
  model?: string,
): Promise<EmailClassification[]> {
  if (emails.length === 0) return [];

  const rawJson = await callGeminiJson({
    apiKey,
    model,
    systemInstruction: SYSTEM_INSTRUCTION,
    userPrompt: buildClassifierPrompt(emails, context),
    responseSchema: RESPONSE_SCHEMA,
  });

  return parseClassificationResponse(
    rawJson,
    emails.map((e) => e.id),
  );
}
