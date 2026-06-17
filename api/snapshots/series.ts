import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireSession } from "../_lib/session.js";
import { listSnapshots, readSnapshot } from "../_lib/snapshot.js";
import type { SnapshotLike } from "../../shared/history/compare.js";

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

function ymdNDaysAgo(days: number): string {
  const now = new Date();
  const t = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12) - days * 86400000);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = await requireSession(req, res);
  if (!session) return;

  const days = Math.min(Math.max(Number(req.query.days) || 90, 1), 730);
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
        return row;
      });
    return res.status(200).json({ success: true, status: "ok", keys: KEYS, days, count: series.length, series });
  } catch (e) {
    return res.status(500).json({ success: false, error: e instanceof Error ? e.message : "series failed" });
  }
}
