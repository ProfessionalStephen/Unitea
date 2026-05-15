import { describe, it, expect } from "vitest";
import { resolveKpi } from "../shared/kpi/resolver";
import { viewFromFrontend } from "../shared/kpi/view";
import type { PipelineView } from "../shared/kpi/view";

function emptyView(): PipelineView {
  return {
    totalActiveJobs: 0,
    totalPipelineValue: 0,
    endToEndDays: 0,
    bottlenecksCount: 0,
    wonThisWeek: 0,
    wonThisWeekValue: 0,
    lostLast30d: 0,
    cancellationRate30d: 0,
    activitiesDueToday: 0,
    activitiesOverdue: 0,
    callsDueToday: 0,
    boards: {},
  };
}

describe("resolveKpi — named aggregates", () => {
  it("Total active jobs reflects the view's totalActiveJobs", () => {
    const view = { ...emptyView(), totalActiveJobs: 42 };
    expect(resolveKpi("Total active jobs", undefined, view)).toBe("42");
  });
});

// ─── Cycle 1: aggregates must survive fetchPD → buildPipelineData → view ───
// Repros the bug where fetchPD stripped totalPipelineValue/wonThisWeek/etc.,
// causing "Revenue pipeline value" to render N/A even on a successful Pull.
describe("frontend KPI pipeline preserves Pipedrive aggregates after a Pull", () => {
  it("Revenue pipeline value reflects API totalPipelineValue after frontend pull", async () => {
    // Simulate the /api/pipedrive/pull JSON response shape
    const apiResponse = {
      success: true,
      boardData: {},
      pipelines: [],
      totalActiveJobs: 17,
      totalPipelineValue: 1_250_000,
      endToEndDays: 84,
      wonThisWeek: 3,
      wonThisWeekValue: 90_000,
      wonLast30d: 12,
      lostLast30d: 2,
      lostLast30dValue: 8_000,
      cancellationRate30d: 14.3,
      activitiesDueToday: 5,
      activitiesOverdue: 1,
      callsDueToday: 2,
      stalled: [],
      moved24h: [],
    };

    // Import the frontend's fetchPD-equivalent: build a PipelineView directly
    // from the API shape. Once buildPipelineData lives in a testable module
    // we'll exercise the whole chain; for now the contract under test is:
    // "viewFromFrontend, when fed an object that includes Pipedrive aggregates,
    //  exposes them on the view".
    const view = viewFromFrontend({
      // boards-derived fields (empty here — covered by other tests)
      boards: {},
      // Pipedrive aggregates that fetchPD MUST forward unmodified
      totalActiveJobs: apiResponse.totalActiveJobs,
      totalPipelineValue: apiResponse.totalPipelineValue,
      endToEndDays: apiResponse.endToEndDays,
      wonThisWeek: apiResponse.wonThisWeek,
      wonThisWeekValue: apiResponse.wonThisWeekValue,
      lostLast30d: apiResponse.lostLast30d,
      cancellationRate30d: apiResponse.cancellationRate30d,
      activitiesDueToday: apiResponse.activitiesDueToday,
      activitiesOverdue: apiResponse.activitiesOverdue,
      callsDueToday: apiResponse.callsDueToday,
    });

    expect(resolveKpi("Revenue pipeline value", undefined, view)).toBe("$1.3M");
    expect(resolveKpi("Total active jobs", undefined, view)).toBe("17");
    expect(resolveKpi("Jobs completed this week", undefined, view)).toBe("3");
    expect(resolveKpi("Cancellation rate", undefined, view)).toBe("14.3%");
  });
});

