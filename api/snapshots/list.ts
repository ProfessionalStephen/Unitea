import type { VercelRequest, VercelResponse } from "@vercel/node";
import { jwtVerify } from "jose";
import { listSnapshots } from "../_lib/snapshot";

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
