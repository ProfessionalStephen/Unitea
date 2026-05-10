import type { VercelRequest, VercelResponse } from "@vercel/node";

const ALLOWED_DOMAINS = ["unicitysolar.com", "unicityhome.com"];

export default function handler(req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const baseUrl = process.env.APP_BASE_URL;

  if (!clientId || !baseUrl) {
    return res.status(500).json({ error: "Server not configured" });
  }

  // Sender authorization mode (one-time, requests gmail.send)
  const isSenderAuth = req.query.mode === "sender";

  const scopes = isSenderAuth
    ? ["openid", "email", "profile", "https://www.googleapis.com/auth/gmail.send"]
    : ["openid", "email", "profile"];

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${baseUrl}/auth/callback`,
    response_type: "code",
    scope: scopes.join(" "),
    access_type: "offline",
    prompt: "consent",
    state: isSenderAuth ? "sender" : "dashboard",
    hd: ALLOWED_DOMAINS.join(","), // hint, not enforcement
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}