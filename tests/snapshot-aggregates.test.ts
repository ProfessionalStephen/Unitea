import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ─────────────────────────────────────────────────────────────
// Cycle 3 — Snapshot aggregates
//
// Bug: writeSnapshot() stored only {boardData, stalled, moved24h,
// pipelines, totalActiveJobs}. So week-over-week, month-over-month,
// etc. comparisons in the History tab CAN'T show pipeline value,
// won/lost, activities, or cancellation rate — the data isn't
// captured at snapshot time.
//
// Contract: PipelineSnapshot must include every aggregate that
// pullPipedrive() returns. Otherwise History range comparisons are
// limited to total job count, which is useless on its own.
// ─────────────────────────────────────────────────────────────

const snapshotSrc = readFileSync(resolve(__dirname, "../api/_lib/snapshot.ts"), "utf8");

describe("PipelineSnapshot — preserves aggregates for historical comparison", () => {
  const requiredFields = [
    "totalPipelineValue",
    "endToEndDays",
    "wonThisWeek",
    "wonThisWeekValue",
    "wonLast30d",
    "lostLast30d",
    "lostLast30dValue",
    "cancellationRate30d",
    "activitiesDueToday",
    "activitiesOverdue",
    "callsDueToday",
  ];

  for (const field of requiredFields) {
    it(`PipelineSnapshot type declares ${field}`, () => {
      expect(snapshotSrc).toMatch(new RegExp(`${field}\\s*:\\s*number`));
    });

    it(`writeSnapshot copies ${field} from pipelineData`, () => {
      // Match either `field: pipelineData.field ?? 0` or `field: pipelineData.field ?? something`
      const re = new RegExp(`${field}\\s*:\\s*pipelineData\\.${field}\\s*\\?\\?`);
      expect(snapshotSrc).toMatch(re);
    });
  }
});
