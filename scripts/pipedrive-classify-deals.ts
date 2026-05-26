// ─────────────────────────────────────────────────────────────
// pipedrive-classify-deals
//
// Reads all deals from Pipedrive, proposes a destination board
// for each based on keyword matching. Outputs a migration plan
// as JSON to .scratch/deal-migration-plan.json for human review.
//
// THIS IS A SUGGESTION — operator must review needsReview cases
// (and probably all proposals) before running pipedrive-migrate-deals.
//
// Run via: npx tsx scripts/pipedrive-classify-deals.ts
// ─────────────────────────────────────────────────────────────

import type { Deal, PipedriveAdmin } from "./_lib/pipedrive-admin.js";
import { createPipedriveAdmin } from "./_lib/pipedrive-admin.js";
import type { BoardConfig } from "../shared/domain/types.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export type Confidence = "high" | "medium" | "low";

export interface ClassificationProposal {
  dealId: number;
  dealTitle: string;
  currentPipelineId: number;
  currentStageId: number;
  proposedBoard: string | null;
  proposedStage: string | null;
  confidence: Confidence;
  reason: string;
}

export interface ClassificationPlan {
  proposals: ClassificationProposal[];
  needsReview: ClassificationProposal[];
  generatedAt: string;
}

// Keyword -> (boardName, optional stage hint). Order matters: first match wins.
// Operator should edit this map when patterns change.
const KEYWORD_MAP: Array<{
  pattern: RegExp;
  board: string;
  stage?: string;
  reason: string;
}> = [
  { pattern: /\bperm(it|itting)\b/i, board: "Permitting", reason: "title mentions permit/permitting" },
  { pattern: /\bengineer(ing)?\b/i, board: "Engineering", reason: "title mentions engineering" },
  { pattern: /\b(revision|redesign|plan set)\b/i, board: "Engineering", reason: "title mentions revisions/plan set" },
  { pattern: /\b(install|installation)\b/i, board: "Scheduling/Coordinating", reason: "title mentions installation" },
  { pattern: /\bschedul(e|ing|ed)\b/i, board: "Scheduling/Coordinating", reason: "title mentions scheduling" },
  { pattern: /\b(nma|net meter(ing)?|pto)\b/i, board: "Net Metering", reason: "title mentions NMA/PTO/net metering" },
  { pattern: /\b(service|warranty|leak|repair)\b/i, board: "Service", reason: "title mentions service/warranty/leak" },
  { pattern: /\b(inspect(ion)?|inspector)\b/i, board: "Inspection", reason: "title mentions inspection" },
  { pattern: /\b(cancel(l|led|lation)?)\b/i, board: "Cancellations", reason: "title mentions cancellation" },
  { pattern: /\b(funding|m1|m2|m3|invoice)\b/i, board: "Funding", reason: "title mentions funding/invoice" },
  { pattern: /\b(welcome call|thank you call|customer service)\b/i, board: "Customer Service", reason: "title mentions customer service call" },
  { pattern: /\b(r&r|reinstall|uninstall)\b/i, board: "R&R", reason: "title mentions R&R/reinstall/uninstall" },
  { pattern: /\b(new deal|brand new|ntp|site survey)\b/i, board: "New Sale", reason: "title mentions new deal/site survey" },
  { pattern: /\b(disco|utility)\b/i, board: "Utility Disco", reason: "title mentions utility disco" },
  { pattern: /\bcalifornia\b/i, board: "California", reason: "title mentions California" },
];

export function classifyDeals(
  deals: Deal[],
  boards: Record<string, BoardConfig>,
): ClassificationPlan {
  const proposals: ClassificationProposal[] = deals.map((d) => {
    // Try keyword matching against deal title
    for (const { pattern, board, stage, reason } of KEYWORD_MAP) {
      if (boards[board] && pattern.test(d.title)) {
        return {
          dealId: d.id,
          dealTitle: d.title,
          currentPipelineId: d.pipelineId,
          currentStageId: d.stageId,
          proposedBoard: board,
          proposedStage: stage ?? boards[board].stages[0],
          confidence: "high",
          reason,
        };
      }
    }

    // No keyword match -> low confidence, needs human review
    return {
      dealId: d.id,
      dealTitle: d.title,
      currentPipelineId: d.pipelineId,
      currentStageId: d.stageId,
      proposedBoard: null,
      proposedStage: null,
      confidence: "low",
      reason: "no keyword pattern matched — needs human classification",
    };
  });

  return {
    proposals,
    needsReview: proposals.filter((p) => p.confidence !== "high"),
    generatedAt: new Date().toISOString(),
  };
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

  const { BOARDS } = await import("../shared/domain/boards.js");
  const admin: PipedriveAdmin = createPipedriveAdmin({ apiKey, domain });

  console.log(`Fetching all deals from ${domain}.pipedrive.com...`);
  const deals = await admin.listDeals();
  console.log(`Got ${deals.length} deals. Classifying...`);

  const plan = classifyDeals(deals, BOARDS);

  const outPath = ".scratch/deal-migration-plan.json";
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(plan, null, 2));

  console.log(`\nWrote plan to ${outPath}`);
  console.log(`Total proposals: ${plan.proposals.length}`);
  console.log(`High confidence: ${plan.proposals.filter((p) => p.confidence === "high").length}`);
  console.log(`Needs review:    ${plan.needsReview.length}`);
  console.log("\nReview the file. Edit any incorrect proposed boards/stages.");
  console.log("Then run scripts/pipedrive-migrate-deals.ts to apply.");
}
