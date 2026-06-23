import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireSession } from "../_lib/session.js";
import { listSnapshots, readSnapshot } from "../_lib/snapshot.js";
import type { SnapshotLike } from "../../shared/history/compare.js";
import { BOARDS } from "../../shared/domain/boards.js";
import { isTerminalStage } from "../../shared/domain/terminal-stages.js";

// ─────────────────────────────────────────────────────────────
// Snapshot time-series endpoint
// GET /api/snapshots/series?days=90
//
// Returns a date-ordered (oldest→newest) series of the headline aggregates across
// the daily snapshots within the window, so the dashboard can draw a real, date-
// rangeable KPI trend (the "change the range of data" reporting control). Read-only;
// no Pipedrive fetch — snapshots only.
// ─────────────────────────────────────────────────────────────

const KEYS: (keyof SnapshotLike)[] = [
  "totalActiveJobs", "totalPipelineValue", "endToEndDays",
  "wonThisWeek", "wonLast30d", "lostLast30d", "cancellationRate30d",
  "activitiesOverdue", "callsDueToday",
  "installsScheduledThisWeek", "permitsSubmittedThisWeek", "nmaSubmittedThisWeek",
];
const MAX_READS = 180; // safety cap on blob reads per request

function regionBoards(region: string): Set<string> {
  const wanted = new Set<string>();
  for (const name of Object.keys(BOARDS)) {
    if (!region || region === "All" || BOARDS[name]?.region === region) wanted.add(name);
  }
  return wanted;
}

function applyRegion(row: Record<string, number | string>, snap: any, wanted: Set<string>) {
  const boardData = snap?.boardData || {};
  if (Object.keys(boardData).length === 0) return;
  let totalActiveJobs = 0;
  let totalPipelineValue = 0;
  let activeWeightedDays = 0;
  for (const name of Object.keys(boardData)) {
    if (!wanted.has(name)) continue;
    const b = boardData[name] || {};
    totalPipelineValue += Number(b.totalValue || 0);
    const stages = Array.isArray(b.stages) ? b.stages : [];
    for (const s of stages) {
      if (!s || isTerminalStage(name, String(s.name || ""))) continue;
      const count = Number(s.count || 0);
      if (count <= 0) continue;
      totalActiveJobs += count;
      activeWeightedDays += Number(s.avgDays || 0) * count;
    }
  }
  row.totalActiveJobs = totalActiveJobs;
  row.totalPipelineValue = totalPipelineValue;
  row.endToEndDays = totalActiveJobs > 0 ? Math.round((activeWeightedDays / totalActiveJobs) * 10) / 10 : 0;
}

function ymdNDaysAgo(days: number): string {
  const now = new Date();
  const t = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12) - days * 86400000);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = await requireSession(req, res);
  if (!session) return;

  const days = Math.min(Math.max(Number(req.query.days) || 90, 1), 730);
  const region = String(req.query.region || "All");
  const wantedBoards = regionBoards(region);
  const cutoff = ymdNDaysAgo(days);

  try {
    const entries = await listSnapshots(); // newest first
    if (entries.length === 0) {
      return res.status(200).json({ success: true, status: "no_snapshots", keys: KEYS, series: [], message: "No snapshots stored yet." });
    }
    // entries within the window, oldest→newest, capped
    let sel = entries.filter((e) => e.date >= cutoff).sort((a, b) => (a.date < b.date ? -1 : 1));
    if (sel.length > MAX_READS) {
      const step = Math.ceil(sel.length / MAX_READS);
      sel = sel.filter((_, i) => i % step === 0 || i === sel.length - 1);
    }
    const snaps = await Promise.all(sel.map((e) => readSnapshot(e.date)));
    const series = snaps
      .filter((s): s is NonNullable<typeof s> => s != null)
      .map((s) => {
        const rec = s as unknown as Record<string, unknown>;
        const row: Record<string, number | string> = { date: s.date };
        for (const k of KEYS) row[k] = Number(rec[k] ?? 0);
        applyRegion(row, s, wantedBoards);
        return row;
      });
    return res.status(200).json({ success: true, status: "ok", keys: KEYS, days, region, count: series.length, series });
  } catch (e) {
    return res.status(500).json({ success: false, error: e instanceof Error ? e.message : "series failed" });
  }
}
