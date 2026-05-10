import type { VercelRequest, VercelResponse } from "@vercel/node";
import { OAuth2Client } from "googleapis-common";
import { SignJWT } from "jose";

const ALLOWED_DOMAINS = ["unicitysolar.com", "unicityhome.com"];
const SESSION_COOKIE = "unicity_session";
const SESSION_DAYS = 7;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const code = String(req.query.code || "");
    const state = String(req.query.state || "dashboard");
    const error = req.query.error;

    if (error) {
        return res.status(400).send(`Google returned an error: ${error}`);
    }
    if (!code) {
        return res.status(400).send("Missing authorization code");
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const baseUrl = process.env.APP_BASE_URL;
    const sessionSecret = process.env.SESSION_SECRET;

    if (!clientId || !clientSecret || !baseUrl || !sessionSecret) {
        return res.status(500).send("Server not configured. Missing env vars.");
    }

    // Exchange the code for tokens
    const oauth2 = new OAuth2Client(clientId, clientSecret, `${baseUrl}/auth/callback`);
    let tokens;
    try {
        const result = await oauth2.getToken(code);
        tokens = result.tokens;
    } catch (e: any) {
        return res.status(400).send("Token exchange failed: " + (e?.message || "unknown"));
    }

    // Decode the ID token to get user identity (no signature check needed —
    // we got it directly from Google over HTTPS)
    if (!tokens.id_token) {
        return res.status(400).send("No ID token returned");
    }
    const payload = JSON.parse(
        Buffer.from(tokens.id_token.split(".")[1], "base64").toString("utf8")
    );
    const email: string = (payload.email || "").toLowerCase();
    const name: string = payload.name || email;
    const domain = email.split("@")[1];

    // ---------- Branch 1: Sender authorization (one-time) ----------
    if (state === "sender") {
        // Only Stephen or info@unicityhome can authorize the sender
        const allowedSenders = ["info@unicityhome.com", "stephen@unicityhome.com"];
        if (!allowedSenders.includes(email)) {
            return res.status(403).send(
                `Access denied. Sender authorization is restricted to specific accounts. You signed in as ${email}.`
            );
        }
        if (!tokens.refresh_token) {
            return res
                .status(400)
                .send(
                    "No refresh token received. Go to myaccount.google.com → Security → Third-party apps → revoke 'Unicity Solar KPI Briefing', then try again."
                );
        }

        // Show the token to copy. This page is only ever seen by you.
        const html = `<!doctype html>
<html><head><title>Sender authorized</title>
<style>
body{font-family:system-ui,sans-serif;background:#1A1C20;color:#F0F0F0;padding:2rem;max-width:700px;margin:0 auto}
h1{color:#F28F1D}
code{background:#2E3138;color:#22C55E;padding:0.5rem;border-radius:6px;display:block;word-break:break-all;margin:1rem 0;font-size:13px}
.warn{background:rgba(245,158,11,0.1);border:1px solid #F59E0B;border-radius:8px;padding:1rem;margin:1rem 0}
ol li{margin-bottom:0.5rem}
</style></head><body>
<h1>✓ Sender authorized as ${email}</h1>
<p>Copy the refresh token below and paste it into Vercel as the <code>SENDER_REFRESH_TOKEN</code> environment variable.</p>
<code>${tokens.refresh_token}</code>
<div class="warn"><strong>Important:</strong> this is the only time you'll see this token. Save it now.</div>
<h2 style="color:#F28F1D">Next steps</h2>
<ol>
<li>Open <a href="https://vercel.com/dashboard" style="color:#1D6FB5">Vercel dashboard</a> → unicity-kpi → Settings → Environment Variables</li>
<li>Add <code style="display:inline">SENDER_REFRESH_TOKEN</code> with the value above</li>
<li>Add <code style="display:inline">SENDER_EMAIL</code> with the value <code style="display:inline">${email}</code></li>
<li>Redeploy (Deployments → latest → ⋯ → Redeploy)</li>
</ol>
</body></html>`;
        return res.setHeader("Content-Type", "text/html").send(html);
    }

    // ---------- Branch 2: Dashboard sign-in ----------
    if (!ALLOWED_DOMAINS.includes(domain)) {
        return res.status(403).send(
            `Access denied. The dashboard is restricted to @unicitysolar.com and @unicityhome.com accounts. You signed in as ${email}.`
        );
    }

    // Sign a session JWT
    const secret = new TextEncoder().encode(sessionSecret);
    const jwt = await new SignJWT({ email, name })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(`${SESSION_DAYS}d`)
        .sign(secret);

    // Set cookie and redirect home
    res.setHeader(
        "Set-Cookie",
        `${SESSION_COOKIE}=${jwt}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`
    );
    return res.redirect("/");
}