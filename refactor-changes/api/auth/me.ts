import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readSession } from "../_lib/session";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = await readSession(req);
  if (!session) return res.status(200).json({ signedIn: false });
  return res.status(200).json({
    signedIn: true,
    email: session.email,
    name: session.name,
  });
}
