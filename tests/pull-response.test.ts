import { describe, it, expect } from "vitest";
import { mapPullResponse } from "../src/data/pull-response";

// ─────────────────────────────────────────────────────────────
// Cycle 1 — fetchPD bug: stripped aggregates
//
// Bug: the previous fetchPD returned only {boardData, totalDeals, pipelines}
// from the /api/pipedrive/pull JSON, so the React state never saw
// totalPipelineValue / wonThisWeek / endToEndDays / cancellationRate30d /
// activitiesDueToday / callsDueToday / etc. Resolver then fell through to
// fallback "N/A" for every name-keyed aggregate KPI.
//
// Contract under test: mapPullResponse must preserve every aggregate field
// that the resolver consumes. If the API returns it, the React state gets it.
// ─────────────────────────────────────────────────────────────

const fullApiResponse = {
  success: true,
  boardData: { Engineering: { totalDeals: 4, totalValue: 80_000, avgDays: 5, stages: [] } },
  pipelines: [{ id: 1, name: "Engineering" }],
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

describe("mapPullResponse — forwards every Pipedrive aggregate to React state", () => {
  it("preserves totalPipelineValue", () => {
    expect(mapPullResponse(fullApiResponse).totalPipelineValue).toBe(1_250_000);
  });

  it("preserves wonThisWeek and wonThisWeekValue", () => {
    const out = mapPullResponse(fullApiResponse);
    expect(out.wonThisWeek).toBe(3);
    expect(out.wonThisWeekValue).toBe(90_000);
  });

  it("preserves cancellation, activity, and end-to-end fields", () => {
    const out = mapPullResponse(fullApiResponse);
    expect(out.cancellationRate30d).toBe(14.3);
    expect(out.activitiesDueToday).toBe(5);
    expect(out.activitiesOverdue).toBe(1);
    expect(out.callsDueToday).toBe(2);
    expect(out.endToEndDays).toBe(84);
  });

  it("preserves legacy fields used elsewhere in the UI", () => {
    const out = mapPullResponse(fullApiResponse);
    expect(out.boardData).toEqual(fullApiResponse.boardData);
    expect(out.pipelines).toEqual(fullApiResponse.pipelines);
    // totalDeals: legacy alias kept for backwards compat with audit log + UI pill
    expect(out.totalDeals).toBe(17);
  });
});
