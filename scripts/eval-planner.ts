/**
 * Scores the AI planner against lib/planner/eval-set.ts using the real
 * configured provider. Not part of `npm test` (it costs real API calls and
 * isn't deterministic) — run it manually with `npm run eval:planner`.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { EVAL_SET, scoreEvalCase } from "@/lib/planner/eval-set";
import { getDefaultProvider } from "@/lib/planner";
import { buildPlan } from "@/lib/planner/scoring";

async function main() {
  const provider = getDefaultProvider();
  let totalPassed = 0;
  let totalChecks = 0;

  for (const evalCase of EVAL_SET) {
    const context = { nowIso: evalCase.nowIso, timezone: evalCase.timezone };

    try {
      const drafts = await provider.parse(evalCase.rawText, context);
      const plan = buildPlan(drafts, context);
      const result = scoreEvalCase(evalCase, plan);

      totalPassed += result.passedCount;
      totalChecks += result.totalCount;

      const summary = `${result.passedCount}/${result.totalCount}`;
      console.log(`\n${result.passedCount === result.totalCount ? "PASS" : "PART"} ${evalCase.name} (${summary})`);
      for (const check of result.results) {
        console.log(`  ${check.passed ? "✓" : "✗"} ${check.description}`);
      }
      console.log(`  plan: ${plan.map((item) => item.title).join(" -> ") || "(empty)"}`);
    } catch (error) {
      totalChecks += evalCase.checks.length;
      console.log(`\nERROR ${evalCase.name}`);
      console.log(`  ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const percent = totalChecks > 0 ? Math.round((totalPassed / totalChecks) * 100) : 0;
  console.log(`\n=== Planner eval score: ${totalPassed}/${totalChecks} (${percent}%) ===`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
