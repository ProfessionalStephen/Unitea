import { describe, it, expect } from "vitest";
import { RT } from "../shared/domain/roles";
import { BOARDS } from "../shared/domain/boards";
import { KPI_INIT } from "../shared/domain/kpi-configs";
import { resolveKpi } from "../shared/kpi/resolver";
import type { PipelineView, NormBoard, NormStage } from "../shared/kpi/view";

// ─────────────────────────────────────────────────────────────
// Cycle 4 — KPI coverage
//
// Pre-fix state: 98 of 119 unique KPI names in RT[role].kpis
// resolved to the fallback string ("N/A" or "0") because they had
// neither a name-keyed aggregate case in the resolver nor a default
// source mapping in KPI_INIT.
//
// Contract: for every KPI name in any role's kpis list, resolveKpi
// must return something other than the fallback when fed a fully
// populated synthetic view. KPI names that legitimately can't be
// sourced from Pipedrive (e.g. "Email delivery rate", "PTO requests")
// have been removed from RT — they don't appear here at all.
//
// This test guards against:
//   1. New roles adding KPI names without wiring them
//   2. Anyone re-adding a name-only "decorative" KPI
// ─────────────────────────────────────────────────────────────

function syntheticStage(): NormStage {
  // Non-zero everywhere so resolver-extractors don't return 0 and look mapped
  return { jobCount: 7, totalValue: 25000, avgDays: 12, stuckCount: 2 };
}
function syntheticBoard(stageNames: string[]): NormBoard {
  const stages: Record<string, NormStage> = {};
  for (const s of stageNames) stages[s] = syntheticStage();
  return { jobCount: 17, totalValue: 250000, avgDays: 14, stuckCount: 4, stages };
}

function fullView(): PipelineView {
  const boards: Record<string, NormBoard> = {};
  for (const name of Object.keys(BOARDS)) {
    boards[name] = syntheticBoard(BOARDS[name].stages);
  }
  return {
    totalActiveJobs: 100,
    totalPipelineValue: 1_500_000,
    endToEndDays: 90,
    bottlenecksCount: 6,
    wonThisWeek: 4,
    wonThisWeekValue: 90_000,
    lostLast30d: 3,
    cancellationRate30d: 12.0,
    activitiesDueToday: 9,
    activitiesOverdue: 4,
    callsDueToday: 5,
    boards,
  };
}

function allRoleKpis(): string[] {
  const set = new Set<string>();
  for (const role of Object.keys(RT)) {
    for (const k of RT[role].kpis) set.add(k);
  }
  return [...set].sort();
}

function findTag(name: string) {
  return KPI_INIT.find((t) => t.name === name);
}

describe("KPI coverage — every role KPI must resolve to a real value", () => {
  const view = fullView();
  const kpis = allRoleKpis();

  for (const name of kpis) {
    it(`"${name}" resolves to non-fallback value`, () => {
      const tag = findTag(name);
      const v = resolveKpi(name, tag, view);
      const fallback = tag?.fallback ?? "—";
      expect(v, `KPI "${name}" returned fallback ${JSON.stringify(fallback)} — needs wiring or removal from RT`).not.toBe(fallback);
      expect(v).not.toBe("—");
    });
  }
});
