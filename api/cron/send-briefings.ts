import type { VercelRequest, VercelResponse } from "@vercel/node";
import { OAuth2Client } from "googleapis-common";

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

const LOGO_URL = "https://unicity-kpi.vercel.app/Unicity_Solar_Logo_only.png";
const DASHBOARD_URL = "https://unicity-kpi.vercel.app";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return res.status(500).json({ error: "CRON_SECRET not configured" });
  const authHeader = req.headers.authorization || "";
  const queryKey = String(req.query.key || "");
  const authorized = authHeader === `Bearer ${cronSecret}` || queryKey === cronSecret;
  if (!authorized) return res.status(401).json({ error: "Unauthorized" });

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
      const subject = buildSubject(person, pipelineData);
      const messageId = await sendGmail(accessToken, senderEmail, person.email, subject, html);
      results.push({ name: person.name, email: person.email, status: "sent", messageId });
    } catch (e: any) {
      results.push({ name: person.name, email: person.email, status: "failed", error: e?.message || "unknown" });
    }
  }

  const summary = {
    success: true, timestamp: new Date().toISOString(),
    mode: testRecipient ? "test" : "live", dataSource,
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
    pdGet("/pipelines"), pdGet("/stages"), pdGet("/deals?status=open&limit=500"),
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
        const stageDealsRaw = pipelineDeals.filter((d: any) => d.stage_id === s.id);
        const stageDeals = stageDealsRaw.map((d: any) => ({
          id: d.id, title: d.title || `Deal ${d.id}`,
          value: Number(d.value || 0), currency: d.currency || "USD",
          days: daysSince(d.stage_change_time || d.add_time),
          url: `https://${domain}.pipedrive.com/deal/${d.id}`,
          ownerName: d.owner_name || "Unassigned",
        }));
        const avgDays = stageDeals.length
          ? Math.round(stageDeals.reduce((sum: number, d: any) => sum + d.days, 0) / stageDeals.length)
          : 0;
        return { name: s.name, count: stageDeals.length, avgDays, deals: stageDeals };
      });
    boardData[p.name] = { totalDeals: pipelineDeals.length, stages: stageRows };
  });

  type Stalled = {
    board: string; stage: string; dealId: number; title: string; days: number;
    value: number; currency: string; url: string; ownerName: string; threshold: number;
  };
  const stalled: Stalled[] = [];
  Object.keys(boardData).forEach((boardName) => {
    const board = boardData[boardName];
    const totalDays = board.stages.reduce((s: number, st: any) => s + (st.avgDays * st.count), 0);
    const totalCount = board.stages.reduce((s: number, st: any) => s + st.count, 0);
    if (totalCount === 0) return;
    const boardAvg = totalDays / totalCount;
    const threshold = Math.max(7, Math.round(boardAvg * 1.5));
    board.stages.forEach((st: any) => {
      st.deals.forEach((d: any) => {
        if (d.days >= threshold) {
          stalled.push({
            board: boardName, stage: st.name, dealId: d.id, title: d.title,
            days: d.days, value: d.value, currency: d.currency, url: d.url,
            ownerName: d.ownerName, threshold,
          });
        }
      });
    });
  });
  stalled.sort((a, b) => b.days - a.days);

  const moved24h = dealsArr
    .filter((d: any) => {
      const changeTime = Date.parse(d.stage_change_time || "");
      if (isNaN(changeTime)) return false;
      return Date.now() - changeTime < 86400000;
    })
    .map((d: any) => ({
      title: d.title || `Deal ${d.id}`,
      value: Number(d.value || 0),
      url: `https://${domain}.pipedrive.com/deal/${d.id}`,
    }));

  return {
    totalActiveJobs: dealsArr.length,
    boardData, stalled, moved24h,
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
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}`;
}

function escHtml(s: any): string {
  if (s === null || s === undefined) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function fmtMoney(n: number): string {
  if (!n || isNaN(n)) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}

function buildSubject(person: typeof TEAM[number], pd: any): string {
  if (!pd) return `${todayLabel()} · Briefing (data unavailable)`;
  const personBoards = person.boards === "all" ? null : (person.boards as string[]);
  const myStalled = pd.stalled.filter((s: any) => !personBoards || personBoards.indexOf(s.board) >= 0);
  const myStalledValue = myStalled.reduce((sum: number, s: any) => sum + s.value, 0);
  if (myStalled.length === 0) return `${todayLabel()} · No stalled deals in your boards`;
  const valuePart = myStalledValue > 0 ? ` · ${fmtMoney(myStalledValue)} at risk` : "";
  return `${todayLabel()} · ${myStalled.length} stalled${valuePart}`;
}

function buildEmail(person: typeof TEAM[number], pd: any, dataSource: string): string {
  const firstName = person.name.split(" ")[0];
  const personBoards = person.boards === "all"
    ? (pd ? Object.keys(pd.boardData) : [])
    : (person.boards as string[]);

  const myStalled = pd ? pd.stalled.filter((s: any) => personBoards.indexOf(s.board) >= 0) : [];
  const myStalledValue = myStalled.reduce((sum: number, s: any) => sum + s.value, 0);
  const myMoved = pd ? pd.moved24h : [];
  const myMovedValue = myMoved.reduce((sum: number, d: any) => sum + d.value, 0);
  const myBoards = personBoards.filter((b) => pd?.boardData?.[b]);

  const header = `
    <div style="padding:20px 24px;background:linear-gradient(135deg,#2A2C30 0%,#24262B 100%);">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="vertical-align:middle;width:48px;">
            <img src="${LOGO_URL}" alt="Unicity Solar" width="40" height="40" style="display:block;border:0;">
          </td>
          <td style="vertical-align:middle;padding-left:12px;">
            <div style="font-size:18px;color:#F0F0F0;font-weight:600;">Good morning, ${escHtml(firstName)}</div>
            <div style="font-size:12px;color:#897C80;margin-top:2px;">${todayLabel()} · ${escHtml(person.title)}</div>
          </td>
        </tr>
      </table>
    </div>`;

  const summaryCard = pd ? `
    <div style="padding:18px 24px;background:#1F2125;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="width:33%;padding-right:8px;vertical-align:top;">
            <div style="font-size:11px;color:#897C80;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;">Stalled deals</div>
            <div style="font-size:26px;color:${myStalled.length > 0 ? "#EF4444" : "#22C55E"};font-weight:700;line-height:1;">${myStalled.length}</div>
            <div style="font-size:10px;color:#6B6266;margin-top:4px;line-height:1.3;">Deals in their stage longer than 1.5x your board's average. Minimum 7 days.</div>
          </td>
          <td style="width:33%;padding:0 8px;vertical-align:top;">
            <div style="font-size:11px;color:#897C80;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;">At-risk value</div>
            <div style="font-size:26px;color:${myStalledValue > 0 ? "#F28F1D" : "#22C55E"};font-weight:700;line-height:1;">${fmtMoney(myStalledValue)}</div>
            <div style="font-size:10px;color:#6B6266;margin-top:4px;line-height:1.3;">Sum of stalled deal values. What's exposed to slipping if nothing changes today.</div>
          </td>
          <td style="width:33%;padding-left:8px;vertical-align:top;">
            <div style="font-size:11px;color:#897C80;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;">Moved yesterday</div>
            <div style="font-size:26px;color:#4A9EE0;font-weight:700;line-height:1;">${myMoved.length}</div>
            <div style="font-size:10px;color:#6B6266;margin-top:4px;line-height:1.3;">Deals that progressed stage in the last 24 hours. ${fmtMoney(myMovedValue)} total.</div>
          </td>
        </tr>
      </table>
    </div>` : `
    <div style="padding:18px 24px;background:#1F2125;color:#897C80;font-size:13px;">
      Pipedrive data unavailable this morning. <a href="${DASHBOARD_URL}" style="color:#F28F1D;">View dashboard</a> to check live status.
    </div>`;

  const stalledList = pd && myStalled.length > 0 ? `
    <div style="padding:18px 24px;">
      <div style="font-size:13px;color:#F28F1D;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">Look at these first</div>
      ${myStalled.slice(0, 5).map((s: any) => `
        <a href="${escHtml(s.url)}" style="text-decoration:none;color:inherit;">
          <div style="margin-bottom:8px;padding:10px 12px;background:rgba(239,68,68,0.08);border-left:3px solid #EF4444;border-radius:0 4px 4px 0;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="vertical-align:top;">
                  <div style="font-size:13px;color:#F0F0F0;font-weight:500;">${escHtml(s.title)}</div>
                  <div style="font-size:11px;color:#897C80;margin-top:3px;">${escHtml(s.board)} &rsaquo; ${escHtml(s.stage)} &middot; ${escHtml(s.ownerName)}</div>
                </td>
                <td style="vertical-align:top;text-align:right;width:80px;">
                  <div style="font-size:14px;color:#EF4444;font-weight:600;">${s.days}d</div>
                  <div style="font-size:11px;color:#897C80;margin-top:3px;">${fmtMoney(s.value)}</div>
                </td>
              </tr>
            </table>
          </div>
        </a>
      `).join("")}
      ${myStalled.length > 5 ? `
        <a href="${DASHBOARD_URL}" style="display:block;margin-top:6px;font-size:12px;color:#4A9EE0;text-decoration:none;text-align:center;">
          + ${myStalled.length - 5} more stalled &mdash; view all on dashboard &rarr;
        </a>` : ""}
    </div>` : pd ? `
    <div style="padding:18px 24px;">
      <div style="font-size:13px;color:#22C55E;font-weight:500;">&#10003; No stalled deals in your boards today.</div>
    </div>` : "";

  const boardRows = pd ? myBoards
    .filter((b) => pd.boardData[b].totalDeals > 0)
    .sort((a, b) => pd.boardData[b].totalDeals - pd.boardData[a].totalDeals)
    .map((b) => {
      const bd = pd.boardData[b];
      const boardStalled = myStalled.filter((s: any) => s.board === b).length;
      return `<tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
        <td style="padding:8px 0;font-size:13px;color:#F0F0F0;">${escHtml(b)}</td>
        <td style="padding:8px 0;font-size:13px;color:#F0F0F0;text-align:right;width:60px;">${bd.totalDeals}</td>
        <td style="padding:8px 0;font-size:13px;color:${boardStalled > 0 ? "#EF4444" : "#897C80"};text-align:right;width:80px;">${boardStalled > 0 ? boardStalled + " stalled" : "&mdash;"}</td>
      </tr>`;
    }).join("") : "";

  const boardSection = pd && boardRows ? `
    <div style="padding:18px 24px;border-top:1px solid rgba(255,255,255,0.06);">
      <div style="font-size:13px;color:#F28F1D;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Your boards</div>
      <table style="width:100%;border-collapse:collapse;">
        <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
          <td style="padding:6px 0;font-size:11px;color:#6B6266;text-transform:uppercase;">Board</td>
          <td style="padding:6px 0;font-size:11px;color:#6B6266;text-align:right;">Open</td>
          <td style="padding:6px 0;font-size:11px;color:#6B6266;text-align:right;">Status</td>
        </tr>
        ${boardRows}
      </table>
      <div style="margin-top:8px;font-size:10px;color:#6B6266;line-height:1.4;">
        Boards with 0 open deals hidden. "Stalled" = open longer than 1.5x this board's average.
      </div>
    </div>` : "";

  const priorities = getPriorities(person.role).map((p, i) =>
    `<div style="margin-bottom:8px;font-size:13px;color:#F0F0F0;">
      <span style="color:#F28F1D;font-weight:600;margin-right:8px;">${i + 1}.</span>${escHtml(p)}
    </div>`
  ).join("");

  const prioritySection = `
    <div style="padding:18px 24px;border-top:1px solid rgba(255,255,255,0.06);">
      <div style="font-size:13px;color:#F28F1D;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">Today's priorities</div>
      ${priorities}
    </div>`;

  const footer = `
    <div style="padding:16px 24px;background:#1F2125;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
      <a href="${DASHBOARD_URL}" style="display:inline-block;background:linear-gradient(135deg,#F28F1D,#D4721A);color:#fff;padding:8px 18px;border-radius:6px;text-decoration:none;font-weight:500;font-size:13px;">Open dashboard &rarr;</a>
      <div style="margin-top:10px;font-size:10px;color:#6B6266;line-height:1.4;">
        Unicity Solar Energy &middot; ${dataSource === "live" ? "Live Pipedrive snapshot" : "Data unavailable"} &middot; ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET<br>
        Read-only system. Numbers update each weekday at 6am ET.
      </div>
    </div>`;

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:640px;margin:0 auto;background:#24262B;color:#F0F0F0;border-radius:8px;overflow:hidden;">
    ${header}${summaryCard}${stalledList}${boardSection}${prioritySection}${footer}
  </div>`;
}

function getPriorities(role: string): string[] {
  const r = role.toLowerCase();
  if (r.includes("owner") || r.includes("ceo") || r.includes("coo") || r.includes("vp")) {
    return [
      "Open the 'Look at these first' deals above — they're your biggest stalled risks",
      "Check team workload distribution against current pipeline volume",
      "Review weekly revenue pipeline trajectory on the dashboard",
    ];
  }
  if (r.includes("sales")) {
    return [
      "Follow up on stalled deals in your Sales board",
      "Review yesterday's deal movements — pattern of progress or stagnation",
      "Coordinate with Installation on upcoming hand-offs",
    ];
  }
  if (r.includes("install") || r.includes("warehouse") || r.includes("operations")) {
    return [
      "Confirm today's installation schedule against open jobs",
      "Check material availability for next 5 scheduled installs",
      "Review safety/permit status for active jobs in your board",
    ];
  }
  if (r.includes("finance") || r.includes("office")) {
    return [
      "Review M1/M2/M3 invoice status for any stalled deals above",
      "Reconcile prior week payments",
      "Flag any aging receivables >30 days",
    ];
  }
  if (r.includes("engineer") || r.includes("design") || r.includes("coordinator")) {
    return [
      "Review pending design queue against stalled deals above",
      "Address engineering revisions blocking progress",
      "Coordinate utility submission status",
    ];
  }
  return [
    "Review the stalled deals listed above",
    "Address items in your specific boards",
    "Coordinate with your manager on blockers",
  ];
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
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

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
