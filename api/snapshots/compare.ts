import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireSession } from "../_lib/session.js";
import { listSnapshots, readSnapshot } from "../_lib/snapshot.js";
import { baselineDateForRange, compareSnapshots, nearestSnapshotOnOrBefore } from "../../shared/history/compare.js";

// ─────────────────────────────────────────────────────────────
// Snapshot comparison endpoint
// GET /api/snapshots/compare?range=Week+over+week
//
// 1. Resolves baseline date from range (today minus N days, ET).
// 2. Walks snapshot index to find the closest ≤ baseline date.
// 3. Reads current (newest) + baseline snapshot.
// 4. Returns labeled deltas via shared compareSnapshots().
//
// Returns 200 with rows: DiffRow[] on success.
// Returns 200 with status: "insufficient_data" when no snapshot
// exists on or before the baseline date.
// ─────────────────────────────────────────────────────────────

function easternYMD(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = await requireSession(req, res);
  if (!session) return;

  const range = String(req.query.range || "Week over week");
  const todayYmd = easternYMD();
  const baselineYmd = baselineDateForRange(range, todayYmd);

  try {
    const entries = await listSnapshots();
    if (entries.length === 0) {
      return res.status(200).json({
        success: true,
        status: "no_snapshots",
        range,
        todayYmd,
        baselineYmd,
        message: "No snapshots stored yet. Comparisons activate after the next cron run.",
      });
    }

    const availableDates = entries.map((e) => e.date);
    const newestDate = availableDates[0];
    const baselineDate = nearestSnapshotOnOrBefore(baselineYmd, availableDates);

    if (!baselineDate || baselineDate === newestDate) {
      return res.status(200).json({
        success: true,
        status: "insufficient_data",
        range,
        todayYmd,
        baselineYmd,
        newestDate,
        availableDays: entries.length,
        message: baselineDate === newestDate
          ? "Only one snapshot exists. Need at least 2 for comparison."
          : `No snapshot on or before ${baselineYmd}. Oldest available: ${entries[entries.length - 1].date}.`,
      });
    }

    const [currentSnap, baselineSnap] = await Promise.all([
      readSnapshot(newestDate),
      readSnapshot(baselineDate),
    ]);
    if (!currentSnap || !baselineSnap) {
      return res.status(500).json({ success: false, error: "Snapshot read failed" });
    }

    const rows = compareSnapshots(currentSnap, baselineSnap);
    return res.status(200).json({
      success: true,
      status: "ok",
      range,
      currentDate: newestDate,
      baselineDate,
      baselineYmd,
      rows,
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || "compare failed" });
  }
}
