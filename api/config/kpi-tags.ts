import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireSession } from "../_lib/session.js";
import { readKpiConfig, writeKpiConfig } from "../_lib/kpi-config-store.js";

// ─────────────────────────────────────────────────────────────
// KPI tag config endpoint
// GET  → { tags, source, updatedAt } from Blob, or KPI_INIT defaults
// POST → save tags array to Blob (admin only)
// ─────────────────────────────────────────────────────────────

const ADMIN_EMAILS = ["stephen@unicityhome.com", "aparis@unicitysolar.com"];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = await requireSession(req, res);
  if (!session) return;

  if (req.method === "GET") {
    try {
      const result = await readKpiConfig();
      return res.status(200).json({ success: true, ...result });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e?.message || "read failed" });
    }
  }

  if (req.method === "POST") {
    // Admin gate — only stephen@ and aparis@ can mutate org-wide KPI config
    const email = (session.email || "").toLowerCase();
    if (!ADMIN_EMAILS.includes(email)) {
      return res.status(403).json({ success: false, error: "Admin access required" });
    }
    const body = (req.body || {}) as { tags?: unknown };
    if (!Array.isArray(body.tags)) {
      return res.status(400).json({ success: false, error: "Body must include `tags` array" });
    }
    // Light schema check — each tag must have id + name
    for (const t of body.tags as any[]) {
      if (!t || typeof t.id !== "string" || typeof t.name !== "string") {
        return res.status(400).json({ success: false, error: "Each tag must have string id + name" });
      }
    }
    try {
      const { updatedAt } = await writeKpiConfig(body.tags as any);
      return res.status(200).json({ success: true, updatedAt });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e?.message || "write failed" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
