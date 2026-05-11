import type { VercelRequest, VercelResponse } from "@vercel/node";
import { OAuth2Client } from "googleapis-common";

// ─────────────────────────────────────────────
// Cron: send-briefings
// Runs on Vercel cron schedule. Also callable manually with ?key=<CRON_SECRET>.
// Pulls live Pipedrive data once, builds a deterministic email per recipient,
// sends via Gmail using the stored sender refresh token.
// ─────────────────────────────────────────────

const TEAM = [
    { name: "Jordan Lee", title: "Owner", role: "Owner", email: "jordan@unicitysolar.com", boards: "all" as "all" | string[] },
    { name: "Mallory Amend", title: "COO", role: "COO", email: "mamend@unicitysolar.com", boards: "all" as "all" | string[] },
    { name: "Josh Labarre", title: "VP of Operations", role: "VP of Operations", email: "josh@unicitysolar.com", boards: "all" as "all" | string[] },
    { name: "Julie Schultz", title: "Office Manager", role: "Office Manager", email: "jschultz@unicitysolar.com", boards: ["Welcome", "Funding"] },
    { name: "Julio Valdes", title: "Installation Manager", role: "Installation Manager", email: "jvaldes@unicitysolar.com", boards: ["Installation"] },
    { name: "Aidon Paris", title: "Warehouse Manager", role: "Warehouse Manager", email: "aparis@unicitysolar.com", boards: ["Installation"] },
    { name: "Anthony Cowan", title: "Engineering Coordinator", role: "Engineering Coordinator", email: "acowan@unicitysolar.com", boards: ["Design", "Permit"] },
    { name: "Dan Sperruzzi", title: "President of Sales", role: "President of Sales", email: "dsperruzzi@unicitysolar.com", boards: ["Sales"] },
    { name: "Stephen Farrell", title: "AI Back-End Developer", role: "AI Back-End Developer", email: "stephen@unicityhome.com", boards: "all" as "all" | string[] },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
        return res.status(500).json({ error: "CRON_SECRET not configured" });
    }
    const authHeader = req.headers.authorization || "";
    const queryKey = String(req.query.key || "");
    const authorized = authHeader === `Bearer ${cronSecret}` || queryKey === cronSecret;
    if (!authorized) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const testRecipient = process.env.CRON_TEST_RECIPIENT;
    const recipients = testRecipient
        ? TEAM.filter((m) => m.email.toLowerCase() === testRecipient.toLowerCase())
        : TEAM.filter((m) => m.email);

    if (recipients.length === 0) {
        return res.status(400).json({
            error: testRecipient
                ? `CRON_TEST_RECIPIENT (${testRecipient}) doesn't match any team member`
                : "No team members have email addresses set",
        });
    }

    const apiKey = process.env.PIPEDRIVE_API_KEY;
    const domain = process.env.PIPEDRIVE_DOMAIN;
    let pipelineData: any = null;
    let dataSource = "simulated";

    if (apiKey && domain) {
        try {
            pipelineData = await pullPipedrive(domain, apiKey);
            dataSource = "live";
        } catch (e: any) {
            console.error("Pipedrive pull failed:", e?.message);
        }
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const senderRefresh = process.env.SENDER_REFRESH_TOKEN;
    const senderEmail = process.env.SENDER_EMAIL;
    if (!clientId || !clientSecret || !senderRefresh || !senderEmail) {
        return res.status(500).json({ error: "Sender not configured" });
    }

    const oauth2 = new OAuth2Client(clientId, clientSecret);
    oauth2.setCredentials({ refresh_token: senderRefresh });
    let accessToken: string;
    try {
        const { token } = await oauth2.getAccessToken();
        if (!token) throw new Error("No access token");
        accessToken = token;
    } catch (e: any) {
        return res.status(500).json({ error: "Sender token refresh failed: " + e?.message });
    }

    const results: Array<{ name: string; email: string; status: "sent" | "failed"; messageId?: string; error?: string }> = [];

    for (const person of recipients) {
        try {
            const html = buildEmail(person, pipelineData, dataSource);
            const subject = `Unicity KPI Briefing — ${todayLabel()}`;
            const messageId = await sendGmail(accessToken, senderEmail, person.email, subject, html);
            results.push({ name: person.name, email: person.email, status: "sent", messageId });
        } catch (e: any) {
            results.push({ name: person.name, email: person.email, status: "failed", error: e?.message || "unknown" });
        }
    }

    const summary = {
        success: true,
        timestamp: new Date().toISOString(),
        mode: testRecipient ? "test" : "live",
        dataSource,
        sent: results.filter((r) => r.status === "sent").length,
        failed: results.filter((r) => r.status === "failed").length,
        results,
    };

    console.log("[cron/send-briefings]", JSON.stringify(summary));
    return res.status(200).json(summary);
}

async function pullPipedrive(domain: string, apiKey: string): Promise<any> {
    const baseUrl = `https://${domain}.pipedrive.com/api/v1`;
    async function pdGet(path: string): Promise<any> {
        const url = `${baseUrl}${path}${path.includes("?") ? "&" : "?"}api_token=${apiKey}`;
        const r = await fetch(url);
        if (!r.ok) throw new Error(`Pipedrive ${path} ${r.status}`);
        const j = await r.json();
        if (j && j.success === false) throw new Error(`Pipedrive ${path}: ${j.error}`);
        return j.data;
    }
    const [pipelines, stages, deals] = await Promise.all([
        pdGet("/pipelines"),
        pdGet("/stages"),
        pdGet("/deals?status=open&limit=500"),
    ]);
    const pipelinesArr = Array.isArray(pipelines) ? pipelines : [];
    const stagesArr = Array.isArray(stages) ? stages : [];
    const dealsArr = Array.isArray(deals) ? deals : [];

    const boardData: Record<string, any> = {};
    pipelinesArr.forEach((p: any) => {
        const pipelineDeals = dealsArr.filter((d: any) => d.pipeline_id === p.id);
        const pipelineStages = stagesArr.filter((s: any) => s.pipeline_id === p.id);
        const stageRows = pipelineStages
            .sort((a: any, b: any) => (a.order_nr || 0) - (b.order_nr || 0))
            .map((s: any) => {
                const stageDeals = pipelineDeals.filter((d: any) => d.stage_id === s.id);
                return {
                    name: s.name,
                    count: stageDeals.length,
                    avgDays: stageDeals.length
                        ? Math.round(stageDeals.reduce((sum: number, d: any) => sum + daysSince(d.stage_change_time || d.add_time), 0) / stageDeals.length)
                        : 0,
                };
            });
        boardData[p.name] = { totalDeals: pipelineDeals.length, stages: stageRows };
    });

    const bottlenecks: Array<{ board: string; stage: string; stuckCount: number; pctAbove: number; avgDays: number }> = [];
    Object.keys(boardData).forEach((boardName) => {
        const board = boardData[boardName];
        const avgOfBoard = board.stages.length > 0
            ? board.stages.reduce((s: number, st: any) => s + st.avgDays, 0) / board.stages.length
            : 0;
        if (avgOfBoard <= 0) return;
        board.stages.forEach((st: any) => {
            if (st.avgDays > avgOfBoard * 1.3 && st.count > 0) {
                bottlenecks.push({
                    board: boardName,
                    stage: st.name,
                    stuckCount: st.count,
                    pctAbove: Math.round(((st.avgDays - avgOfBoard) / avgOfBoard) * 100),
                    avgDays: st.avgDays,
                });
            }
        });
    });
    bottlenecks.sort((a, b) => b.pctAbove - a.pctAbove);

    return {
        totalActiveJobs: dealsArr.length,
        totalStuck: bottlenecks.reduce((s, b) => s + b.stuckCount, 0),
        boardData,
        bottlenecks,
        pipelines: pipelinesArr.map((p: any) => ({ id: p.id, name: p.name })),
    };
}

function daysSince(iso: string | null | undefined): number {
    if (!iso) return 0;
    const t = Date.parse(iso);
    if (isNaN(t)) return 0;
    return Math.max(0, Math.round((Date.now() - t) / 86400000));
}

function todayLabel(): string {
    const d = new Date();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return `${days[d.getDay()]} ${d.toLocaleDateString("en-US")}`;
}

function escHtml(s: any): string {
    if (s === null || s === undefined) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function buildEmail(person: typeof TEAM[number], pd: any, dataSource: string): string {
    const firstName = person.name.split(" ")[0];
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const day = days[new Date().getDay()];

    let kpiCells = "";
    let bottleneckRows = "";
    let totalLine = "";

    if (pd && pd.boardData) {
        const personBoards = person.boards === "all" ? Object.keys(pd.boardData) : (person.boards as string[]);
        const relevantBottlenecks = (pd.bottlenecks || [])
            .filter((b: any) => personBoards.indexOf(b.board) >= 0)
            .slice(0, 3);

        bottleneckRows = relevantBottlenecks.length === 0
            ? `<p style="margin:0;font-size:13px;color:#22C55E;">No bottlenecks in your boards. ✓</p>`
            : relevantBottlenecks.map((b: any) =>
                `<div style="margin-bottom:8px;padding:8px 10px;background:rgba(239,68,68,0.08);border-left:3px solid #EF4444;border-radius:0 4px 4px 0;">
            <div style="font-size:13px;color:#F0F0F0;font-weight:500;">${escHtml(b.board)} › ${escHtml(b.stage)}</div>
            <div style="font-size:11px;color:#897C80;margin-top:2px;">${b.stuckCount} stuck deals · ${b.pctAbove}% above board avg · ${b.avgDays}d in stage</div>
          </div>`
            ).join("");

        const stats = personBoards.filter((b) => pd.boardData[b]).map((b) => ({ board: b, count: pd.boardData[b].totalDeals }));
        const cells = stats.map((s) =>
            `<td style="padding:10px 8px;vertical-align:top;width:33%;">
        <div style="font-size:11px;color:#897C80;margin-bottom:3px;">${escHtml(s.board)}</div>
        <div style="font-size:18px;color:#F0F0F0;font-weight:600;">${s.count}</div>
      </td>`
        );
        while (cells.length % 3 !== 0) cells.push("<td></td>");
        let rows = "";
        for (let i = 0; i < cells.length; i += 3) rows += `<tr>${cells.slice(i, i + 3).join("")}</tr>`;
        kpiCells = rows;
        totalLine = `${pd.totalActiveJobs} active deals across all pipelines · ${pd.totalStuck} stuck`;
    } else {
        kpiCells = `<tr><td style="padding:10px;color:#897C80;font-size:13px;">Pipedrive data unavailable this morning. <a href="https://unicity-kpi.vercel.app" style="color:#F28F1D;">View dashboard</a></td></tr>`;
        bottleneckRows = `<p style="margin:0;font-size:13px;color:#897C80;">No data — Pipedrive pull failed. Check dashboard.</p>`;
        totalLine = "Data source unavailable.";
    }

    const priorities = getPriorities(person.role).map((p, i) =>
        `<div style="margin-bottom:6px;font-size:13px;color:#F0F0F0;">
      <span style="color:#F28F1D;font-weight:600;margin-right:6px;">${i + 1}.</span>${escHtml(p)}
    </div>`
    ).join("");

    return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#24262B;color:#F0F0F0;border-radius:8px;overflow:hidden;">
    <div style="padding:18px;">
      <h1 style="margin:0 0 4px;font-size:20px;color:#F28F1D;font-weight:600;">Good morning, ${escHtml(firstName)}</h1>
      <p style="margin:0;font-size:13px;color:#897C80;">${escHtml(day)} · ${escHtml(person.title)} · ${escHtml(totalLine)}</p>
    </div>
    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0;">
    <div style="padding:18px;">
      <h2 style="margin:0 0 10px;font-size:15px;color:#F28F1D;font-weight:600;">Your boards</h2>
      <table style="width:100%;border-collapse:collapse;">${kpiCells}</table>
    </div>
    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0;">
    <div style="padding:18px;">
      <h2 style="margin:0 0 10px;font-size:15px;color:#F28F1D;font-weight:600;">Needs attention</h2>
      ${bottleneckRows}
    </div>
    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0;">
    <div style="padding:18px;">
      <h2 style="margin:0 0 10px;font-size:15px;color:#F28F1D;font-weight:600;">Today's priorities</h2>
      ${priorities}
    </div>
    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0;">
    <div style="padding:14px 18px;font-size:11px;color:#897C80;text-align:center;">
      Unicity Solar Energy · ${dataSource === "live" ? "Live Pipedrive data" : "Data unavailable"} · <a href="https://unicity-kpi.vercel.app" style="color:#F28F1D;text-decoration:none;">View dashboard</a>
    </div>
  </div>`;
}

function getPriorities(role: string): string[] {
    const r = role.toLowerCase();
    if (r.includes("owner") || r.includes("ceo") || r.includes("coo") || r.includes("vp")) {
        return ["Review top 3 bottlenecks with relevant managers", "Check team workload distribution", "Verify weekly revenue pipeline trajectory"];
    }
    if (r.includes("sales")) {
        return ["Follow up on stale leads (>14 days no activity)", "Review weekly conversion metrics", "Coordinate with Installation on hand-off readiness"];
    }
    if (r.includes("install") || r.includes("warehouse") || r.includes("operations")) {
        return ["Confirm today's installation schedule", "Check material availability for next 5 jobs", "Review safety/permit status for active jobs"];
    }
    if (r.includes("finance") || r.includes("office")) {
        return ["Review M1/M2/M3 invoice status", "Reconcile prior week payments", "Flag any aging receivables >30 days"];
    }
    if (r.includes("engineer") || r.includes("design") || r.includes("coordinator")) {
        return ["Review pending design queue", "Address engineering revisions", "Coordinate utility submission status"];
    }
    return ["Review your boards above", "Address items in 'Needs attention'", "Coordinate with your manager on blockers"];
}

async function sendGmail(accessToken: string, fromEmail: string, toEmail: string, subject: string, html: string): Promise<string> {
    const message = [
        `From: Unicity Solar KPI <${fromEmail}>`,
        `To: ${toEmail}`,
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

    const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ raw: encoded }),
    });

    if (!r.ok) {
        const errText = await r.text();
        throw new Error(`Gmail send failed: ${r.status} ${errText.slice(0, 200)}`);
    }
    const result = await r.json();
    return result.id;
}