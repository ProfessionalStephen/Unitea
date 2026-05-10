import type { VercelRequest, VercelResponse } from "@vercel/node";

const SESSION_COOKIE = "unicity_session";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
  );
  res.redirect("/");
}