// ─────────────────────────────────────────────────────────────
// pipedrive-migrate-deals
//
// Applies a (reviewed and approved) deal migration plan from
// .scratch/deal-migration-plan.json. Calls admin.updateDeal for
// each high-confidence proposal. Idempotent: re-running after
// partial success skips deals already in their target state.
//
// Run via: npx tsx scripts/pipedrive-migrate-deals.ts
// Add --force to apply medium/low confidence proposals too.
// ─────────────────────────────────────────────────────────────

import type { PipedriveAdmin } from "./_lib/pipedrive-admin.js";
import { createPipedriveAdmin } from "./_lib/pipedrive-admin.js";
import type { ClassificationPlan, ClassificationProposal } from "./pipedrive-classify-deals.js";
import { readFileSync } from "node:fs";

export interface MigrationOptions {
  force?: boolean;
}

export interface MigrationSummary {
  moved: ClassificationProposal[];
  alreadyInPlace: ClassificationProposal[];
  skippedUnclassified: ClassificationProposal[];
  skippedLowConfidence: ClassificationProposal[];
  failures: Array<{ proposal: ClassificationProposal; reason: string }>;
}

export async function runMigration(
  admin: PipedriveAdmin,
  plan: ClassificationPlan,
  options: MigrationOptions = {},
): Promise<MigrationSummary> {
  const summary: MigrationSummary = {
    moved: [],
    alreadyInPlace: [],
    skippedUnclassified: [],
    skippedLowConfidence: [],
    failures: [],
  };

  // Resolve board name -> pipeline id, and (pipelineId, stage name) -> stage id
  const pipelines = await admin.listPipelines();
  const pipelineByName = new Map(pipelines.map((p) => [p.name, p.id]));
  const stageCache = new Map<number, Map<string, number>>();

  async function resolveStageId(pipelineId: number, stageName: string): Promise<number | null> {
    if (!stageCache.has(pipelineId)) {
      const stages = await admin.listStages(pipelineId);
      stageCache.set(pipelineId, new Map(stages.map((s) => [s.name, s.id])));
    }
    return stageCache.get(pipelineId)!.get(stageName) ?? null;
  }

  for (const proposal of plan.proposals) {
    // Skip unclassified (null board)
    if (proposal.proposedBoard === null || proposal.proposedStage === null) {
      summary.skippedUnclassified.push(proposal);
      continue;
    }

    // Skip low-confidence unless forced
    if (proposal.confidence !== "high" && !options.force) {
      summary.skippedLowConfidence.push(proposal);
      continue;
    }

    // Resolve pipeline
    const pipelineId = pipelineByName.get(proposal.proposedBoard);
    if (pipelineId === undefined) {
      summary.failures.push({
        proposal,
        reason: `pipeline not found in Pipedrive: ${proposal.proposedBoard}`,
      });
      continue;
    }

    // Resolve stage
    const stageId = await resolveStageId(pipelineId, proposal.proposedStage);
    if (stageId === null) {
      summary.failures.push({
        proposal,
        reason: `stage not found in pipeline ${proposal.proposedBoard}: ${proposal.proposedStage}`,
      });
      continue;
    }

    // Apply move (updateDeal handles idempotency internally)
    try {
      const changed = await admin.updateDeal(proposal.dealId, { pipelineId, stageId });
      if (changed) {
        summary.moved.push(proposal);
      } else {
        summary.alreadyInPlace.push(proposal);
      }
    } catch (err) {
      summary.failures.push({
        proposal,
        reason: (err as Error).message,
      });
    }
  }

  return summary;
}

// ─────────────────────────────────────────────────────────────
// CLI shell
// ─────────────────────────────────────────────────────────────

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const apiKey = process.env.PIPEDRIVE_API_KEY;
  const domain = process.env.PIPEDRIVE_DOMAIN;
  if (!apiKey || !domain) {
    console.error("Missing PIPEDRIVE_API_KEY or PIPEDRIVE_DOMAIN in environment.");
    process.exit(1);
  }

  const force = process.argv.includes("--force");
  const planPath = ".scratch/deal-migration-plan.json";

  let plan: ClassificationPlan;
  try {
    plan = JSON.parse(readFileSync(planPath, "utf-8")) as ClassificationPlan;
  } catch {
    console.error(`Could not read ${planPath}. Run pipedrive-classify-deals.ts first.`);
    process.exit(1);
  }

  const admin = createPipedriveAdmin({ apiKey, domain });

  console.log(`Migrating ${plan.proposals.length} deals against ${domain}.pipedrive.com...`);
  if (force) console.log("WARNING: --force enabled, applying medium/low confidence proposals too");

  const summary = await runMigration(admin, plan, { force });

  console.log("\n=== SUMMARY ===");
  console.log(`Moved:                 ${summary.moved.length}`);
  console.log(`Already in place:      ${summary.alreadyInPlace.length}`);
  console.log(`Skipped (unclassified): ${summary.skippedUnclassified.length}`);
  console.log(`Skipped (low conf):    ${summary.skippedLowConfidence.length}`);
  console.log(`Failures:              ${summary.failures.length}`);
  if (summary.failures.length > 0) {
    console.log("\nFailures:");
    summary.failures.forEach((f) =>
      console.log(`  - deal ${f.proposal.dealId} (${f.proposal.dealTitle}): ${f.reason}`),
    );
  }
}
