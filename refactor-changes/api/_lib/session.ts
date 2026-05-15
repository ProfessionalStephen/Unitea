// ─────────────────────────────────────────────────────────────
// SESSION AUTH
// One place to read/validate the session cookie. Used by every
// API endpoint that needs to know who's calling.
//
// readSession(req)         — returns Session or null. Caller decides
//                            how to respond (200 signed-out vs 401).
// requireSession(req, res) — strict variant: returns Session or
//                            null AND sends 401 on null. Caller
//                            should `return` immediately if null.
//
// Adding a new endpoint:
//   1. import { requireSession } from "../_lib/session";
//   2. const session = await requireSession(req, res); if (!session) return;
//   3. use session.email / session.name
//
// Misconfiguration (missing SESSION_SECRET) returns null + 500.
// ─────────────────────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { jwtVerify } from "jose";

export type Session = {
  email: string;
  name?: string;
};

export const SESSION_COOKIE = "unicity_session";

/**
 * Read and verify the session cookie. Returns null if absent,
 * invalid, or expired. Never throws. Returns null on missing
 * SESSION_SECRET (logs error).
 */
export async function readSession(req: VercelRequest): Promise<Session | null> {
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (!match) return null;

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    console.error("[session] SESSION_SECRET not configured");
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      match[1],
      new TextEncoder().encode(sessionSecret),
    );
    return {
      email: String(payload.email || ""),
      name: payload.name ? String(payload.name) : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Strict variant: returns Session or sends 401 and returns null.
 * Caller MUST `return` immediately when result is null —
 * the response has already been finalized.
 *
 * Also sends 500 if SESSION_SECRET is missing (server misconfig).
 */
export async function requireSession(
  req: VercelRequest,
  res: VercelResponse,
): Promise<Session | null> {
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (!match) {
    res.status(401).json({ error: "Not signed in" });
    return null;
  }

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    res.status(500).json({ error: "Server not configured" });
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      match[1],
      new TextEncoder().encode(sessionSecret),
    );
    return {
      email: String(payload.email || ""),
      name: payload.name ? String(payload.name) : undefined,
    };
  } catch {
    res.status(401).json({ error: "Invalid session" });
    return null;
  }
}
