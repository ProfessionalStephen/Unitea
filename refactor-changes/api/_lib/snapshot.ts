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
  pipelineData: Omit<PipelineSnapshot, "version" | "capturedAt" | "date" | "dataSource"> & { totalActiveJobs?: number },
  dataSource: "live" | "simulated"
): Promise<SnapshotIndexEntry> {
  const date = easternDateKey();
  const snapshot: PipelineSnapshot = {
    version: 1,
    capturedAt: new Date().toISOString(),
    date,
    dataSource,
    totalActiveJobs: pipelineData.totalActiveJobs ?? 0,
    boardData: pipelineData.boardData ?? {},
    stalled: pipelineData.stalled ?? [],
    moved24h: pipelineData.moved24h ?? [],
    pipelines: pipelineData.pipelines ?? [],
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
