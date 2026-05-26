// ─────────────────────────────────────────────────────────────
// pipedrive-setup
//
// Idempotent setup: ensures every board in BOARDS has a matching
// Pipedrive pipeline with stages in the correct order.
//
// Run via: npx tsx scripts/pipedrive-setup.ts
// Reads PIPEDRIVE_API_KEY + PIPEDRIVE_DOMAIN from environment.
//
// The runSetup function is exported for testing — it takes any
// PipedriveAdmin implementation, including mocks.
// ─────────────────────────────────────────────────────────────

import type { PipedriveAdmin } from "./_lib/pipedrive-admin.js";
import { createPipedriveAdmin } from "./_lib/pipedrive-admin.js";
import type { BoardConfig } from "../shared/domain/types.js";

export interface SetupSummary {
  pipelinesCreated: string[];
  pipelinesSkipped: string[];
  stagesCreated: Array<{ board: string; stage: string }>;
  stagesSkipped: Array<{ board: string; stage: string }>;
}

export async function runSetup(
  admin: PipedriveAdmin,
  boards: Record<string, BoardConfig>,
): Promise<SetupSummary> {
  const summary: SetupSummary = {
    pipelinesCreated: [],
    pipelinesSkipped: [],
    stagesCreated: [],
    stagesSkipped: [],
  };

  const existingPipelines = await admin.listPipelines();
  const existingByName = new Map(existingPipelines.map((p) => [p.name, p]));

  for (const [boardName, boardConfig] of Object.entries(boards)) {
    let pipelineId: number;
    if (existingByName.has(boardName)) {
      pipelineId = existingByName.get(boardName)!.id;
      summary.pipelinesSkipped.push(boardName);
    } else {
      pipelineId = await admin.createPipeline(boardName);
      summary.pipelinesCreated.push(boardName);
    }

    const existingStages = await admin.listStages(pipelineId);
    const existingStageNames = new Set(existingStages.map((s) => s.name));

    for (let i = 0; i < boardConfig.stages.length; i++) {
      const stageName = boardConfig.stages[i];
      if (existingStageNames.has(stageName)) {
        summary.stagesSkipped.push({ board: boardName, stage: stageName });
      } else {
        await admin.createStage(pipelineId, stageName, i);
        summary.stagesCreated.push({ board: boardName, stage: stageName });
      }
    }
  }

  return summary;
}

// ─────────────────────────────────────────────────────────────
// CLI shell — runs when invoked directly (not when imported in tests)
// ─────────────────────────────────────────────────────────────

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const apiKey = process.env.PIPEDRIVE_API_KEY;
  const domain = process.env.PIPEDRIVE_DOMAIN;
  if (!apiKey || !domain) {
    console.error("Missing PIPEDRIVE_API_KEY or PIPEDRIVE_DOMAIN in environment.");
    process.exit(1);
  }

  const { BOARDS } = await import("../shared/domain/boards.js");
  const admin = createPipedriveAdmin({ apiKey, domain });

  console.log(`Running setup against ${domain}.pipedrive.com...`);
  const summary = await runSetup(admin, BOARDS);

  console.log("\n=== SUMMARY ===");
  console.log(`Pipelines created: ${summary.pipelinesCreated.length}`);
  summary.pipelinesCreated.forEach((n) => console.log(`  + ${n}`));
  console.log(`Pipelines already existed: ${summary.pipelinesSkipped.length}`);
  summary.pipelinesSkipped.forEach((n) => console.log(`  = ${n}`));
  console.log(`Stages created: ${summary.stagesCreated.length}`);
  summary.stagesCreated.forEach((s) => console.log(`  + ${s.board}: ${s.stage}`));
  console.log(`Stages already existed: ${summary.stagesSkipped.length}`);
  console.log("\nDone. Re-run safely — idempotent.");
}
