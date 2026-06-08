import { describe, expect, it } from "vitest";
import { BOARDS } from "../shared/domain/boards";
import { KpiCatalog } from "../shared/domain/kpi-catalog";
import { RoleAssignments } from "../shared/domain/role-assignments";
import { RT } from "../shared/domain/roles";
import { resolveKpi } from "../shared/kpi/resolver";
import type { NormBoard, NormStage, PipelineView } from "../shared/kpi/view";

// KPI COVERAGE
//
// Contract: every role-facing KPI returned by RoleAssignments must resolve to
// something other than its fallback when fed a fully populated synthetic view.
// RoleAssignments returns canonical names only. KpiCatalog resolves canonical
// definitions and retired aliases. Non-Pipedrive KPIs stay removed from RT.

function syntheticStage(): NormStage {
  return { jobCount: 7, totalValue: 25000, avgDays: 12, stuckCount: 2 };
}

function syntheticBoard(stageNames: string[]): NormBoard {
  const stages: Record<string, NormStage> = {};
  for (const stage of stageNames) stages[stage] = syntheticStage();
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
    installsCompletedYesterday: 4,
    installsScheduledThisWeek: 12,
    permitsSubmittedThisWeek: 6,
    sentToPermittingToday: 3,
    nmaSubmittedThisWeek: 2,
    serviceRequestsToday: 5,
    techniciansScheduledToday: 8,
    inspectionsScheduledToday: 11,
    boards,
  } as PipelineView;
}

function allRoleKpis(): string[] {
  const set = new Set<string>();
  for (const role of Object.keys(RT)) {
    for (const kpi of RoleAssignments.kpisForRole(role)) set.add(kpi);
  }
  return [...set].sort();
}

describe("KPI coverage - every role KPI must resolve to a real value", () => {
  const view = fullView();
  const kpis = allRoleKpis();

  for (const name of kpis) {
    it(`"${name}" resolves to non-fallback value`, () => {
      const tag = KpiCatalog.findByName(name) ?? undefined;
      const value = resolveKpi(name, tag, view);
      const fallback = tag?.fallback ?? "-";

      expect(
        value,
        `KPI "${name}" returned fallback ${JSON.stringify(fallback)} - needs wiring or removal from RT`,
      ).not.toBe(fallback);
      expect(value).not.toBe("-");
    });
  }
});
