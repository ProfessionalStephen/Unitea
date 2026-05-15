import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireSession } from "../_lib/session";
import { readSnapshot } from "../_lib/snapshot";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = await requireSession(req, res);
  if (!session) return;

  const date = String(req.query.date || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "date query param required (YYYY-MM-DD)" });
  }

  try {
    const snap = await readSnapshot(date);
    if (!snap) return res.status(404).json({ error: "Snapshot not found", date });
    return res.status(200).json(snap);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Failed to read snapshot" });
  }
}
