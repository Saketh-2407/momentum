import type { PlanItem } from "@/lib/planner/types";

export interface EvalCheck {
  description: string;
  check: (plan: PlanItem[]) => boolean;
}

export interface EvalCase {
  name: string;
  rawText: string;
  nowIso: string;
  timezone: string;
  checks: EvalCheck[];
}

export interface EvalCheckResult {
  description: string;
  passed: boolean;
}

export interface EvalCaseResult {
  name: string;
  results: EvalCheckResult[];
  passedCount: number;
  totalCount: number;
}

function findItem(plan: PlanItem[], keyword: string): { item: PlanItem; index: number } | undefined {
  const lower = keyword.toLowerCase();
  const index = plan.findIndex(
    (item) =>
      item.title.toLowerCase().includes(lower) || (item.notes ?? "").toLowerCase().includes(lower),
  );
  return index === -1 ? undefined : { item: plan[index], index };
}

function mentions(plan: PlanItem[], keyword: string): boolean {
  return findItem(plan, keyword) !== undefined;
}

function isBefore(plan: PlanItem[], firstKeyword: string, secondKeyword: string): boolean {
  const first = findItem(plan, firstKeyword);
  const second = findItem(plan, secondKeyword);
  if (!first || !second) return false;
  return first.index < second.index;
}

const NOW = "2026-03-05T09:00:00Z"; // a Thursday morning, UTC

export const EVAL_SET: EvalCase[] = [
  {
    name: "urgent deadline outranks a someday-maybe item",
    rawText:
      "Finish the tax filing, it's due by end of day today. Also I should reorganize my bookshelf sometime, no rush.",
    nowIso: NOW,
    timezone: "UTC",
    checks: [
      { description: "extracts the tax filing as an item", check: (plan) => mentions(plan, "tax") },
      {
        description: "ranks the tax filing before the bookshelf item",
        check: (plan) => !mentions(plan, "bookshelf") || isBefore(plan, "tax", "bookshelf"),
      },
      {
        description: "the tax filing is the top-ranked item",
        check: (plan) => plan.length > 0 && plan[0].title.toLowerCase().includes("tax"),
      },
    ],
  },
  {
    name: "simple dependency is respected",
    rawText:
      "I need to read the client's email first, then reply to it once I've read it. Also water the plants.",
    nowIso: NOW,
    timezone: "UTC",
    checks: [
      { description: "extracts a 'read' item", check: (plan) => mentions(plan, "read") },
      { description: "extracts a 'reply' item", check: (plan) => mentions(plan, "reply") },
      {
        description: "orders reading the email before replying to it",
        check: (plan) => isBefore(plan, "read", "reply"),
      },
    ],
  },
  {
    name: "pure venting produces no actionable items",
    rawText:
      "I'm just so stressed out today, everything feels like too much and I don't know where to even start.",
    nowIso: NOW,
    timezone: "UTC",
    checks: [
      { description: "does not fabricate tasks from venting", check: (plan) => plan.length === 0 },
    ],
  },
  {
    name: "garbage input yields little to nothing",
    rawText: "asdkfj alksdjf laksjdf ??? !!! blah blah nothing here",
    nowIso: NOW,
    timezone: "UTC",
    checks: [
      { description: "extracts at most one spurious item", check: (plan) => plan.length <= 1 },
    ],
  },
  {
    name: "a realistic mixed brain-dump extracts most items",
    rawText:
      "Buy groceries, call mom back she left a voicemail, finish the quarterly report due Friday, book a dentist appointment, and reply to Sarah's email about the project timeline.",
    nowIso: NOW,
    timezone: "UTC",
    checks: [
      { description: "extracts at least 4 of the 5 items", check: (plan) => plan.length >= 4 },
      {
        description: "the quarterly report (has an explicit deadline) ranks in the top half",
        check: (plan) => {
          const found = findItem(plan, "report");
          return found !== undefined && found.index < Math.ceil(plan.length / 2);
        },
      },
    ],
  },
  {
    name: "relative effort reflects task size",
    rawText:
      "Write the full strategic proposal for the board — this needs deep, focused thinking and will take a while. Also just reply 'ok' to a text message, that's a 10-second thing.",
    nowIso: NOW,
    timezone: "UTC",
    checks: [
      { description: "extracts the proposal item", check: (plan) => mentions(plan, "proposal") },
      { description: "extracts the quick-reply item", check: (plan) => mentions(plan, "text") || mentions(plan, "reply") },
      {
        description: "the proposal is rated more effort than the quick text reply",
        check: (plan) => {
          const proposal = findItem(plan, "proposal");
          const reply = findItem(plan, "text") ?? findItem(plan, "reply");
          if (!proposal || !reply) return false;
          return proposal.item.effort > reply.item.effort;
        },
      },
    ],
  },
];

export function scoreEvalCase(evalCase: EvalCase, plan: PlanItem[]): EvalCaseResult {
  const results = evalCase.checks.map((check) => ({
    description: check.description,
    passed: check.check(plan),
  }));

  return {
    name: evalCase.name,
    results,
    passedCount: results.filter((r) => r.passed).length,
    totalCount: results.length,
  };
}
