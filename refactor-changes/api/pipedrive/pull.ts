import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireSession } from "../_lib/session";
import { pullPipedrive } from "../_lib/pipedrive";

// ─────────────────────────────────────────────
// Pipedrive proxy — read-only, server-side
// Returns the full PipelineData shape (boardData + aggregates)
// from the shared pullPipedrive in api/_lib/pipedrive.ts so the
// frontend gets the same enriched data the cron sees.
// ─────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = await requireSession(req, res);
  if (!session) return;

  // ── Verify Pipedrive credentials present ──
  const apiKey = process.env.PIPEDRIVE_API_KEY;
  const domain = process.env.PIPEDRIVE_DOMAIN;
  if (!apiKey || !domain) {
    return res.status(500).json({ error: "Pipedrive not configured. Set PIPEDRIVE_API_KEY and PIPEDRIVE_DOMAIN env vars." });
  }

  try {
    const pd = await pullPipedrive(domain, apiKey);
    return res.status(200).json({
      success: true,
      // Legacy fields kept for backwards compat
      totalDeals: pd.totalActiveJobs,
      pipelines: pd.pipelines,
      boardData: pd.boardData,
      // New aggregate fields
      totalActiveJobs: pd.totalActiveJobs,
      totalPipelineValue: pd.totalPipelineValue,
      endToEndDays: pd.endToEndDays,
      wonThisWeek: pd.wonThisWeek,
      wonThisWeekValue: pd.wonThisWeekValue,
      wonLast30d: pd.wonLast30d,
      lostLast30d: pd.lostLast30d,
      lostLast30dValue: pd.lostLast30dValue,
      cancellationRate30d: pd.cancellationRate30d,
      activitiesDueToday: pd.activitiesDueToday,
      activitiesOverdue: pd.activitiesOverdue,
      callsDueToday: pd.callsDueToday,
      // Tactical lists (frontend may want these in future)
      stalled: pd.stalled,
      moved24h: pd.moved24h,
    });
  } catch (e: any) {
    const msg = e?.message || "unknown error";
    const isAuth = /401|403|unauthorized/i.test(msg);
    return res.status(isAuth ? 401 : 502).json({
      success: false,
      error: msg,
    });
  }
}
