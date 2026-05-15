import type { VercelRequest, VercelResponse } from "@vercel/node";
import { jwtVerify } from "jose";
import { readSnapshot } from "../_lib/snapshot";

const SESSION_COOKIE = "unicity_session";

async function requireSession(req: VercelRequest): Promise<{ email: string } | null> {
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (!match) return null;
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) return null;
  try {
    const { payload } = await jwtVerify(
      match[1],
      new TextEncoder().encode(sessionSecret)
    );
    return { email: String(payload.email || "") };
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = await requireSession(req);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

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
