// ─────────────────────────────────────────────────────────────
// SNAPSHOT STORAGE — Vercel Blob
//
// One JSON file per day under `snapshots/YYYY-MM-DD.json`.
// Append-only. Daily cron writes; UI reads via list+get endpoints.
//
// Requires env: BLOB_READ_WRITE_TOKEN (auto-injected when Vercel
// Blob is enabled on the project).
//
// Schema (SnapshotV1): see PipelineSnapshot type below. Bump
// `version` when shape changes; readers should branch on version.
// ─────────────────────────────────────────────────────────────

import { put, list, head } from "@vercel/blob";

export type PipelineSnapshot = {
  version: 1;
  capturedAt: string;       // ISO timestamp of the cron run
  date: string;             // YYYY-MM-DD (Eastern Time anchor)
  dataSource: "live" | "simulated";
  totalActiveJobs: number;
  boardData: Record<string, any>;
  stalled: any[];
  moved24h: any[];
  pipelines: Array<{ id: number; name: string }>;
  // Aggregates — required for History-tab range comparisons.
  // If any of these are missing from a stored snapshot, that snapshot was
  // written before this schema change; readers should treat missing fields as 0.
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
};

export type SnapshotIndexEntry = {
  date: string;
  pathname: string;
  url: string;
  uploadedAt: string;
  size: number;
};

const PREFIX = "snapshots/";

function easternDateKey(d: Date = new Date()): string {
  // Anchor snapshots to ET so weekday cron alignment is stable
  // regardless of UTC date wrap.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${day}`;
}

export async function writeSnapshot(
  pipelineData: Omit<PipelineSnapshot, "version" | "capturedAt" | "date" | "dataSource"> & {
    totalActiveJobs?: number;
    totalPipelineValue?: number;
    endToEndDays?: number;
    wonThisWeek?: number;
    wonThisWeekValue?: number;
    wonLast30d?: number;
    lostLast30d?: number;
    lostLast30dValue?: number;
    cancellationRate30d?: number;
    activitiesDueToday?: number;
    activitiesOverdue?: number;
    callsDueToday?: number;
    installsCompletedYesterday?: number;
    installsScheduledThisWeek?: number;
    permitsSubmittedThisWeek?: number;
    sentToPermittingToday?: number;
    nmaSubmittedThisWeek?: number;
    serviceRequestsToday?: number;
    techniciansScheduledToday?: number;
    inspectionsScheduledToday?: number;
  },
  dataSource: "live" | "simulated"
): Promise<SnapshotIndexEntry> {
  const date = easternDateKey();

  // ── Compact projection for storage ──
  // Once the live pull is un-truncated (16k+ open deals), the per-deal arrays
  // inside boardData.stages[].deals — and the full stalled/moved lists — make
  // each daily blob tens of MB, which would break History reads (series/compare
  // fetch up to ~180 whole snapshots at once). Those readers use ONLY the scalar
  // aggregates + per-stage counts, and the UI reads per-deal data from the LIVE
  // pull, never from a stored snapshot. So drop the per-deal arrays and cap the
  // tactical lists here — the daily blob stays small regardless of CRM size.
  const STORE_LIST_CAP = 250;
  const srcBoards: Record<string, any> = pipelineData.boardData ?? {};
  const compactBoardData: Record<string, any> = {};
  for (const name of Object.keys(srcBoards)) {
    const b = srcBoards[name] ?? {};
    const stages = Array.isArray(b.stages)
      ? b.stages.map((s: any) => {
          const lean: Record<string, any> = {};
          for (const k of Object.keys(s)) { if (k !== "deals") lean[k] = s[k]; }
          return lean;
        })
      : [];
    compactBoardData[name] = { ...b, stages };
  }

  const snapshot: PipelineSnapshot = {
    version: 1,
    capturedAt: new Date().toISOString(),
    date,
    dataSource,
    totalActiveJobs: pipelineData.totalActiveJobs ?? 0,
    boardData: compactBoardData,
    stalled: (pipelineData.stalled ?? []).slice(0, STORE_LIST_CAP),
    moved24h: (pipelineData.moved24h ?? []).slice(0, STORE_LIST_CAP),
    pipelines: pipelineData.pipelines ?? [],
    // Aggregates — copied verbatim from pullPipedrive's PipelineData
    totalPipelineValue: pipelineData.totalPipelineValue ?? 0,
    endToEndDays: pipelineData.endToEndDays ?? 0,
    wonThisWeek: pipelineData.wonThisWeek ?? 0,
    wonThisWeekValue: pipelineData.wonThisWeekValue ?? 0,
    wonLast30d: pipelineData.wonLast30d ?? 0,
    lostLast30d: pipelineData.lostLast30d ?? 0,
    lostLast30dValue: pipelineData.lostLast30dValue ?? 0,
    cancellationRate30d: pipelineData.cancellationRate30d ?? 0,
    activitiesDueToday: pipelineData.activitiesDueToday ?? 0,
    activitiesOverdue: pipelineData.activitiesOverdue ?? 0,
    callsDueToday: pipelineData.callsDueToday ?? 0,
    installsCompletedYesterday: pipelineData.installsCompletedYesterday ?? 0,
    installsScheduledThisWeek: pipelineData.installsScheduledThisWeek ?? 0,
    permitsSubmittedThisWeek: pipelineData.permitsSubmittedThisWeek ?? 0,
    sentToPermittingToday: pipelineData.sentToPermittingToday ?? 0,
    nmaSubmittedThisWeek: pipelineData.nmaSubmittedThisWeek ?? 0,
    serviceRequestsToday: pipelineData.serviceRequestsToday ?? 0,
    techniciansScheduledToday: pipelineData.techniciansScheduledToday ?? 0,
    inspectionsScheduledToday: pipelineData.inspectionsScheduledToday ?? 0,
  };

  const pathname = `${PREFIX}${date}.json`;
  const result = await put(pathname, JSON.stringify(snapshot), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,        // re-runs on same day overwrite (cron may fire test + live)
    contentType: "application/json",
  });

  return {
    date,
    pathname: result.pathname,
    url: result.url,
    uploadedAt: snapshot.capturedAt,
    size: snapshot.totalActiveJobs ? JSON.stringify(snapshot).length : 0,
  };
}

export async function listSnapshots(): Promise<SnapshotIndexEntry[]> {
  const { blobs } = await list({ prefix: PREFIX, limit: 1000 });
  return blobs
    .map((b) => {
      const match = b.pathname.match(/snapshots\/(\d{4}-\d{2}-\d{2})\.json$/);
      return match
        ? {
            date: match[1],
            pathname: b.pathname,
            url: b.url,
            uploadedAt: b.uploadedAt instanceof Date ? b.uploadedAt.toISOString() : String(b.uploadedAt),
            size: b.size,
          }
        : null;
    })
    .filter((e): e is SnapshotIndexEntry => e !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
}

export async function readSnapshot(date: string): Promise<PipelineSnapshot | null> {
  const pathname = `${PREFIX}${date}.json`;
  try {
    const meta = await head(pathname);
    if (!meta?.url) return null;
    const r = await fetch(meta.url);
    if (!r.ok) return null;
    const json = await r.json();
    if (!json || typeof json !== "object" || json.version !== 1) return null;
    return json as PipelineSnapshot;
  } catch {
    return null;
  }
}
