import { describe, it, expect } from "vitest";
import { resolveKpi } from "../shared/kpi/resolver";
import type { PipelineView } from "../shared/kpi/view";

// ─────────────────────────────────────────────────────────────
// Cycle 5 — time-window KPIs
//
// These KPIs require date-windowed queries against Pipedrive
// (won/lost/movements). Rather than build a heavy per-deal
// /dealFlow endpoint, we aggregate in pullPipedrive() using the
// already-fetched won/lost/open lists with stage_change_time,
// then surface as named aggregates on PipelineView.
// ─────────────────────────────────────────────────────────────

function viewWithWindowAggregates(): PipelineView {
  return {
    totalActiveJobs: 0,
    totalPipelineValue: 0,
    endToEndDays: 0,
    bottlenecksCount: 0,
    wonThisWeek: 7,
    wonThisWeekValue: 0,
    lostLast30d: 0,
    cancellationRate30d: 0,
    activitiesDueToday: 9,
    activitiesOverdue: 0,
    callsDueToday: 0,
    // ── Time-window aggregates added in Cycle 5 ──
    installsCompletedYesterday: 4,
    installsScheduledThisWeek: 12,
    permitsSubmittedThisWeek: 6,
    sentToPermittingToday: 3,
    nmaSubmittedThisWeek: 2,
    serviceRequestsToday: 5,
    techniciansScheduledToday: 8,
    inspectionsScheduledToday: 11,
    boards: {},
  } as any;
}

describe("Cycle 5 — time-window KPIs resolve from view aggregates", () => {
  const view = viewWithWindowAggregates();

  it("Installs completed yesterday", () => {
    expect(resolveKpi("Installs completed yesterday", undefined, view)).toBe("4");
  });

  it("Installs scheduled this week", () => {
    expect(resolveKpi("Installs scheduled this week", undefined, view)).toBe("12");
  });

  it("Permits submitted this week", () => {
    expect(resolveKpi("Permits submitted this week", undefined, view)).toBe("6");
  });

  it("Sent to permitting today", () => {
    expect(resolveKpi("Sent to permitting today", undefined, view)).toBe("3");
  });

  it("NMA submitted this week", () => {
    expect(resolveKpi("NMA submitted this week", undefined, view)).toBe("2");
  });

  it("Service requests today", () => {
    expect(resolveKpi("Service requests today", undefined, view)).toBe("5");
  });

  it("Technicians scheduled today", () => {
    expect(resolveKpi("Technicians scheduled today", undefined, view)).toBe("8");
  });

  it("Inspections scheduled today", () => {
    expect(resolveKpi("Inspections scheduled today", undefined, view)).toBe("11");
  });
});
