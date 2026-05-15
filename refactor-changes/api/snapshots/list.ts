import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireSession } from "../_lib/session";
import { listSnapshots } from "../_lib/snapshot";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = await requireSession(req, res);
  if (!session) return;

  try {
    const entries = await listSnapshots();
    return res.status(200).json({
      count: entries.length,
      oldest: entries.length ? entries[entries.length - 1].date : null,
      newest: entries.length ? entries[0].date : null,
      entries,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Failed to list snapshots" });
  }
}
