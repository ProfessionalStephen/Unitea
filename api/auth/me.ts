import type { VercelRequest, VercelResponse } from "@vercel/node";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "unicity_session";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (!match) return res.status(200).json({ signedIn: false });

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) return res.status(500).json({ error: "Server not configured" });

  try {
    const { payload } = await jwtVerify(
      match[1],
      new TextEncoder().encode(sessionSecret)
    );
    return res.status(200).json({
      signedIn: true,
      email: payload.email,
      name: payload.name,
    });
  } catch {
    return res.status(200).json({ signedIn: false });
  }
}