import type { VercelRequest, VercelResponse } from "@vercel/node";
import { OAuth2Client } from "googleapis-common";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "unicity_session";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // --- Verify session ---
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (!match) return res.status(401).json({ error: "Not signed in" });

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) return res.status(500).json({ error: "Server not configured" });

  let sessionEmail: string;
  try {
    const { payload } = await jwtVerify(
      match[1],
      new TextEncoder().encode(sessionSecret)
    );
    sessionEmail = String(payload.email);
  } catch {
    return res.status(401).json({ error: "Invalid session" });
  }

  // --- Validate input ---
  const body = req.body || {};
  const to = String(body.to || "").trim();
  const subject = String(body.subject || "").trim();
  const html = String(body.html || "").trim();

  if (!to || !subject || !html) {
    return res.status(400).json({ error: "Missing to, subject, or html" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return res.status(400).json({ error: "Invalid recipient address" });
  }

  // --- Get a fresh access token using the stored refresh token ---
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const senderRefresh = process.env.SENDER_REFRESH_TOKEN;
  const senderEmail = process.env.SENDER_EMAIL;

  if (!clientId || !clientSecret || !senderRefresh || !senderEmail) {
    return res.status(500).json({
      error: "Sender not configured. Run the one-time sender authorization.",
    });
  }

  const oauth2 = new OAuth2Client(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: senderRefresh });

  let accessToken: string;
  try {
    const { token } = await oauth2.getAccessToken();
    if (!token) throw new Error("No access token returned");
    accessToken = token;
  } catch (e: any) {
    return res.status(500).json({
      error: "Failed to refresh sender token: " + (e?.message || "unknown"),
    });
  }

  // --- Build the RFC-2822 message ---
  // Subject is MIME-encoded as UTF-8 Base64 (RFC 2047) to preserve em-dashes,
  // ellipses, and any other non-ASCII characters across all email clients.
  const message = [
    `From: Unicity Solar KPI <${senderEmail}>`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=UTF-8`,
    ``,
    html,
  ].join("\r\n");

  const encoded = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // --- Send via Gmail API ---
  const gmailRes = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encoded }),
    }
  );

  if (!gmailRes.ok) {
    const errorText = await gmailRes.text();
    return res.status(502).json({
      error: "Gmail send failed: " + errorText.slice(0, 300),
    });
  }

  const result = await gmailRes.json();
  return res.status(200).json({
    ok: true,
    messageId: result.id,
    sentBy: sessionEmail,
    sentAs: senderEmail,
  });
}
