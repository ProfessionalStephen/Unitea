// ─────────────────────────────────────────────────────────────
// SHARED KPI — PIPELINE VIEW
//
// A normalized read-model of pipeline state, consumed by the KPI
// resolver. Both the frontend and cron emit different `pd` shapes:
//
//   • frontend (buildPipelineData output): pd.boards[name].stages[stageName]
//   • cron     (pullPipedrive output):     pd.boardData[name].stages: Array
//
// Adapters in this module translate either into one shape so the
// resolver doesn't have to branch on data source.
//
// Adding a new aggregate (e.g. "Permits submitted this week"):
//   1. Add field to PipelineView
//   2. Populate it in both viewFromFrontend and viewFromCron
//   3. Add name-keyed special case in resolver (see resolver.ts)
// ─────────────────────────────────────────────────────────────

export type NormStage = {
  jobCount: number;
  totalValue: number;
  avgDays: number;
  stuckCount: number;
};

export type NormBoard = {
  jobCount: number;
  totalValue: number;
  avgDays: number;
  stuckCount: number;
  stages: Record<string, NormStage>;       // keyed by stage name
};

export type PipelineView = {
  // Whole-pipeline aggregates — name-keyed KPIs read from here
  totalActiveJobs: number;
  totalPipelineValue: number;
  endToEndDays: number;
  bottlenecksCount: number;
  wonThisWeek: number;
  wonThisWeekValue: number;
  lostLast30d: number;
  cancellationRate30d: number;
  activitiesDueToday: number;
  activitiesOverdue: number;
  callsDueToday: number;

  // Time-window aggregates — Cycle 5. All counts.
  installsCompletedYesterday: number;
  installsScheduledThisWeek: number;
  permitsSubmittedThisWeek: number;
  sentToPermittingToday: number;
  nmaSubmittedThisWeek: number;
  serviceRequestsToday: number;
  techniciansScheduledToday: number;
  inspectionsScheduledToday: number;

  // Board/stage-keyed for source-resolved KPIs
  boards: Record<string, NormBoard>;
};

// ─── Frontend adapter ────────────────────────────────────────
// Input: pd from buildPipelineData(liveApiData) in src/App.tsx
//   pd.boards[name] = { jobCount, avgDays, stuckCount, totalValue, status, stages: {stageName: {jobCount, avgDays, stuckCount, totalValue, ...}} }
export function viewFromFrontend(pd: any): PipelineView {
  const boards: Record<string, NormBoard> = {};
  const rawBoards = pd?.boards || {};
  for (const name of Object.keys(rawBoards)) {
    const b = rawBoards[name] || {};
    const stages: Record<string, NormStage> = {};
    for (const sName of Object.keys(b.stages || {})) {
      const s = b.stages[sName];
      stages[sName] = {
        jobCount: Number(s.jobCount || 0),
        totalValue: Number(s.totalValue || 0),
        avgDays: Number(s.avgDays || 0),
        stuckCount: Number(s.stuckCount || 0),
      };
    }
    boards[name] = {
      jobCount: Number(b.jobCount || 0),
      totalValue: Number(b.totalValue || 0),
      avgDays: Number(b.avgDays || 0),
      stuckCount: Number(b.stuckCount || 0),
      stages,
    };
  }
  return {
    totalActiveJobs: Number(pd?.totalActiveJobs || 0),
    totalPipelineValue: Number(pd?.totalPipelineValue || 0),
    endToEndDays: Number(pd?.endToEndDays || 0),
    bottlenecksCount: Number(pd?.bottlenecks?.length || 0),
    wonThisWeek: Number(pd?.wonThisWeek || 0),
    wonThisWeekValue: Number(pd?.wonThisWeekValue || 0),
    lostLast30d: Number(pd?.lostLast30d || 0),
    cancellationRate30d: Number(pd?.cancellationRate30d || 0),
    activitiesDueToday: Number(pd?.activitiesDueToday || 0),
    activitiesOverdue: Number(pd?.activitiesOverdue || 0),
    callsDueToday: Number(pd?.callsDueToday || 0),
    installsCompletedYesterday: Number(pd?.installsCompletedYesterday || 0),
    installsScheduledThisWeek: Number(pd?.installsScheduledThisWeek || 0),
    permitsSubmittedThisWeek: Number(pd?.permitsSubmittedThisWeek || 0),
    sentToPermittingToday: Number(pd?.sentToPermittingToday || 0),
    nmaSubmittedThisWeek: Number(pd?.nmaSubmittedThisWeek || 0),
    serviceRequestsToday: Number(pd?.serviceRequestsToday || 0),
    techniciansScheduledToday: Number(pd?.techniciansScheduledToday || 0),
    inspectionsScheduledToday: Number(pd?.inspectionsScheduledToday || 0),
    boards,
  };
}

// ─── Cron adapter ─────────────────────────────────────────────
// Input: pd from pullPipedrive() in api/_lib/pipedrive.ts
//   pd.boardData[name] = { totalDeals, totalValue, avgDays, stages: [{name, count, avgDays, totalValue, stuckCount}] }
export function viewFromCron(pd: any): PipelineView {
  const boards: Record<string, NormBoard> = {};
  const rawBoardData = pd?.boardData || {};
  for (const name of Object.keys(rawBoardData)) {
    const b = rawBoardData[name] || {};
    const stages: Record<string, NormStage> = {};
    const stageArr: any[] = Array.isArray(b.stages) ? b.stages : [];
    for (const s of stageArr) {
      if (!s?.name) continue;
      stages[s.name] = {
        jobCount: Number(s.count || 0),
        totalValue: Number(s.totalValue || 0),
        avgDays: Number(s.avgDays || 0),
        stuckCount: Number(s.stuckCount || 0),
      };
    }
    boards[name] = {
      jobCount: Number(b.totalDeals || 0),
      totalValue: Number(b.totalValue || 0),
      avgDays: Number(b.avgDays || 0),
      stuckCount: stageArr.reduce((sum, s) => sum + Number(s?.stuckCount || 0), 0),
      stages,
    };
  }
  return {
    totalActiveJobs: Number(pd?.totalActiveJobs || 0),
    totalPipelineValue: Number(pd?.totalPipelineValue || 0),
    endToEndDays: Number(pd?.endToEndDays || 0),
    bottlenecksCount: Number(pd?.stalled?.length || 0),
    wonThisWeek: Number(pd?.wonThisWeek || 0),
    wonThisWeekValue: Number(pd?.wonThisWeekValue || 0),
    lostLast30d: Number(pd?.lostLast30d || 0),
    cancellationRate30d: Number(pd?.cancellationRate30d || 0),
    activitiesDueToday: Number(pd?.activitiesDueToday || 0),
    activitiesOverdue: Number(pd?.activitiesOverdue || 0),
    callsDueToday: Number(pd?.callsDueToday || 0),
    installsCompletedYesterday: Number(pd?.installsCompletedYesterday || 0),
    installsScheduledThisWeek: Number(pd?.installsScheduledThisWeek || 0),
    permitsSubmittedThisWeek: Number(pd?.permitsSubmittedThisWeek || 0),
    sentToPermittingToday: Number(pd?.sentToPermittingToday || 0),
    nmaSubmittedThisWeek: Number(pd?.nmaSubmittedThisWeek || 0),
    serviceRequestsToday: Number(pd?.serviceRequestsToday || 0),
    techniciansScheduledToday: Number(pd?.techniciansScheduledToday || 0),
    inspectionsScheduledToday: Number(pd?.inspectionsScheduledToday || 0),
    boards,
  };
}
