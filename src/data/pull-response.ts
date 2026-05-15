// ─────────────────────────────────────────────────────────────
// /api/pipedrive/pull RESPONSE → React state mapper
//
// Single source of truth for the shape that ends up in
// `liveApiData` after a successful Pull. Previously this lived
// inline in fetchPD() and silently dropped aggregate fields,
// causing name-keyed aggregate KPIs to render "N/A" in the
// dashboard even on a successful pull. Now: forward EVERY
// aggregate so buildPipelineData + viewFromFrontend can see it.
// ─────────────────────────────────────────────────────────────

export type PullResponseState = {
  // Legacy
  boardData: Record<string, any>;
  totalDeals: number;            // alias of totalActiveJobs, kept for audit log + UI
  pipelines: Array<{ id: number; name: string }>;
  // Pipedrive aggregates (must match api/_lib/pipedrive.ts PipelineData)
  totalActiveJobs: number;
  totalPipelineValue: number;
  endToEndDays: number;
  wonThisWeek: number;
  wonThisWeekValue: number;
  wonLast30d: number;
  lostLast30d: number;
  lostLast30dValue: number;
  cancellationRate30d: number;
  activitiesDueToday: number;
  activitiesOverdue: number;
  callsDueToday: number;
  // Time-window aggregates (Cycle 5)
  installsCompletedYesterday: number;
  installsScheduledThisWeek: number;
  permitsSubmittedThisWeek: number;
  sentToPermittingToday: number;
  nmaSubmittedThisWeek: number;
  serviceRequestsToday: number;
  techniciansScheduledToday: number;
  inspectionsScheduledToday: number;
  // Tactical lists
  stalled: any[];
  moved24h: any[];
};

export function mapPullResponse(p: any): PullResponseState {
  return {
    boardData: p?.boardData ?? {},
    totalDeals: Number(p?.totalActiveJobs ?? p?.totalDeals ?? 0),
    pipelines: Array.isArray(p?.pipelines) ? p.pipelines : [],
    totalActiveJobs: Number(p?.totalActiveJobs ?? 0),
    totalPipelineValue: Number(p?.totalPipelineValue ?? 0),
    endToEndDays: Number(p?.endToEndDays ?? 0),
    wonThisWeek: Number(p?.wonThisWeek ?? 0),
    wonThisWeekValue: Number(p?.wonThisWeekValue ?? 0),
    wonLast30d: Number(p?.wonLast30d ?? 0),
    lostLast30d: Number(p?.lostLast30d ?? 0),
    lostLast30dValue: Number(p?.lostLast30dValue ?? 0),
    cancellationRate30d: Number(p?.cancellationRate30d ?? 0),
    activitiesDueToday: Number(p?.activitiesDueToday ?? 0),
    activitiesOverdue: Number(p?.activitiesOverdue ?? 0),
    callsDueToday: Number(p?.callsDueToday ?? 0),
    installsCompletedYesterday: Number(p?.installsCompletedYesterday ?? 0),
    installsScheduledThisWeek: Number(p?.installsScheduledThisWeek ?? 0),
    permitsSubmittedThisWeek: Number(p?.permitsSubmittedThisWeek ?? 0),
    sentToPermittingToday: Number(p?.sentToPermittingToday ?? 0),
    nmaSubmittedThisWeek: Number(p?.nmaSubmittedThisWeek ?? 0),
    serviceRequestsToday: Number(p?.serviceRequestsToday ?? 0),
    techniciansScheduledToday: Number(p?.techniciansScheduledToday ?? 0),
    inspectionsScheduledToday: Number(p?.inspectionsScheduledToday ?? 0),
    stalled: Array.isArray(p?.stalled) ? p.stalled : [],
    moved24h: Array.isArray(p?.moved24h) ? p.moved24h : [],
  };
}
