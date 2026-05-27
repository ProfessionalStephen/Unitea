// ─────────────────────────────────────────────────────────────
// pipedrive-inspect
//
// READ-ONLY. Lists every pipeline, its stages, and the deal
// count per stage. Use to ground the codebase-trim PRD in
// what Pipedrive actually has today.
//
// Run via: npx tsx scripts/pipedrive-inspect.ts
// Reads PIPEDRIVE_API_KEY + PIPEDRIVE_DOMAIN from environment.
// Prints a structured report to stdout. Paste the output back
// for analysis.
// ─────────────────────────────────────────────────────────────

import { createPipedriveAdmin } from "./_lib/pipedrive-admin.js";

const apiKey = process.env.PIPEDRIVE_API_KEY;
const domain = process.env.PIPEDRIVE_DOMAIN;
if (!apiKey || !domain) {
  console.error("Missing PIPEDRIVE_API_KEY or PIPEDRIVE_DOMAIN in environment.");
  process.exit(1);
}

const admin = createPipedriveAdmin({ apiKey, domain });

console.log(`# Pipedrive Inspection Report`);
console.log(`Account: ${domain}.pipedrive.com`);
console.log(`Generated: ${new Date().toISOString()}`);
console.log("");

const pipelines = await admin.listPipelines();
console.log(`## Pipelines (${pipelines.length} total)`);
console.log("");

let totalDeals = 0;

for (const p of pipelines) {
  const stages = await admin.listStages(p.id);
  const deals = await admin.listDeals(p.id);
  totalDeals += deals.length;

  // Count deals per stage
  const dealsByStage = new Map<number, number>();
  for (const d of deals) {
    dealsByStage.set(d.stageId, (dealsByStage.get(d.stageId) ?? 0) + 1);
  }

  console.log(`### Pipeline: "${p.name}" (id ${p.id})`);
  console.log(`Deals in this pipeline: ${deals.length}`);
  console.log("");
  console.log(`Stages (${stages.length}):`);
  for (const s of stages) {
    const count = dealsByStage.get(s.id) ?? 0;
    console.log(`  ${s.orderNr}. "${s.name}" (id ${s.id}) — ${count} deal${count === 1 ? "" : "s"}`);
  }
  console.log("");

  // Sample a few deal titles (first 5) to help understand what's in there
  if (deals.length > 0) {
    console.log(`Sample deal titles (first 5):`);
    for (const d of deals.slice(0, 5)) {
      console.log(`  - "${d.title}" (stage id ${d.stageId})`);
    }
    console.log("");
  }
}

console.log(`## Summary`);
console.log(`Total pipelines: ${pipelines.length}`);
console.log(`Total deals across all pipelines: ${totalDeals}`);
console.log("");
console.log(`Paste this entire report back to continue scoping the codebase-trim PRD.`);
