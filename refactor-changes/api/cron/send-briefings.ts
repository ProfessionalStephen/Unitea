import type { VercelRequest, VercelResponse } from "@vercel/node";
import { OAuth2Client } from "googleapis-common";
import { writeSnapshot } from "../_lib/snapshot";
import { pullPipedrive } from "../_lib/pipedrive";
import {
  emailedTeam,
  kpisForRole,
  KPI_INIT,
  type TeamMember,
  type KpiTag,
} from "../../shared/domain";
import { resolveKpi, viewFromCron } from "../../shared/kpi";

// ─────────────────────────────────────────────────────────────
// All domain data (TEAM, role→kpis map, KPI configs) imported
// from ../../shared/domain. Single source of truth shared with
// the frontend in src/App.tsx and the status endpoint.
// ─────────────────────────────────────────────────────────────

const TEAM = emailedTeam();
const KPI_CONFIGS: KpiTag[] = KPI_INIT;
const ROLE_KPIS = (role: string) => kpisForRole(role);

const LOGO_URL = "https://unicity-kpi.vercel.app/Unicity_Solar_Logo_only.png";
const DASHBOARD_URL = "https://unicity-kpi.vercel.app";

// ─────────────────────────────────────────────────────────────
// KPI RESOLUTION — delegates to shared/kpi/resolver
// One algorithm for production emails and frontend preview.
// ─────────────────────────────────────────────────────────────
function findTagFor(name: string): KpiTag | undefined {
  return KPI_CONFIGS.find((t) => t.name === name);
}

function buildKpiSection(person: TeamMember, pd: any): string {
  const kpis = ROLE_KPIS(person.role);
  if (kpis.length === 0) return "";
  const view = viewFromCron(pd);
  const cells = kpis.map((k) => {
    const v = resolveKpi(k, findTagFor(k), view);
    return `<td width="33%" style="padding:4px;">
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px 12px;text-align:center;">
        <p style="margin:0 0 4px;font-size:11px;color:#897C80;">${escHtml(k)}</p>
        <p style="margin:0;font-size:18px;font-weight:500;color:#F0F0F0;">${escHtml(v)}</p>
      </div></td>`;
  });
  // Build rows of 3
  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += 3) {
    let row = "<tr>" + cells.slice(i, i + 3).join("");
    const pad = 3 - Math.min(3, cells.length - i);
    for (let p = 0; p < pad; p++) row += `<td width="33%" style="padding:4px;"></td>`;
    rows.push(row + "</tr>");
  }
  return `
    <div style="padding:18px 24px;background:#1A1D22;">
      <div style="font-size:13px;color:#F28F1D;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">Your KPIs</div>
      <table style="width:100%;border-collapse:collapse;">${rows.join("")}</table>
      <p style="margin:8px 0 0;font-size:10px;color:#6B6266;text-align:center;">Values pulled from Pipedrive. KPIs showing "N/A" need source mapping in dashboard.</p>
    </div>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return res.status(500).json({ error: "CRON_SECRET not configured" });
  const authHeader = req.headers.authorization || "";
  const queryKey = String(req.query.key || "");
  const authorized = authHeader === `Bearer ${cronSecret}` || queryKey === cronSecret;
  if (!authorized) return res.status(401).json({ error: "Unauthorized" });

  // ── PAUSE GATE ──
  // Set EMAILS_PAUSED=true in Vercel env vars to block all sends.
  // Cron still fires but exits cleanly without contacting recipients.
  const paused = String(process.env.EMAILS_PAUSED || "").toLowerCase() === "true";
  if (paused) {
    const pausedSummary = {
      success: true,
      paused: true,
      timestamp: new Date().toISOString(),
      message: "EMAILS_PAUSED=true — cron fired but no emails sent. Unset env var to resume.",
    };
    console.log("[cron/send-briefings]", JSON.stringify(pausedSummary));
    return res.status(200).json(pausedSummary);
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
  let dataSource: "live" | "simulated" = "simulated";

  if (apiKey && domain) {
    try {
      pipelineData = await pullPipedrive(domain, apiKey);
      dataSource = "live";
    } catch (e: any) {
      console.error("Pipedrive pull failed:", e?.message);
    }
  }

  // Write daily snapshot before sending emails. Skips on test runs
  // (CRON_TEST_RECIPIENT) and on simulated data — we only snapshot
  // real Pipedrive state. Failures here must not block email sends.
  let snapshotResult: { date: string; pathname: string; bytes: number } | { error: string } | null = null;
  if (dataSource === "live" && pipelineData && !testRecipient) {
    try {
      const entry = await writeSnapshot(pipelineData, dataSource);
      snapshotResult = { date: entry.date, pathname: entry.pathname, bytes: entry.size };
    } catch (e: any) {
      console.error("Snapshot write failed:", e?.message);
      snapshotResult = { error: e?.message || "snapshot write failed" };
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
    snapshot: snapshotResult,
    sent: results.filter((r) => r.status === "sent").length,
    failed: results.filter((r) => r.status === "failed").length,
    results,
  };
  console.log("[cron/send-briefings]", JSON.stringify(summary));
  return res.status(200).json(summary);
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

function buildSubject(person: TeamMember, pd: any): string {
  if (!pd) return `${todayLabel()} · Briefing (data unavailable)`;
  const personBoards = person.boards;
  const myStalled = pd.stalled.filter((s: any) => personBoards.indexOf(s.board) >= 0);
  const myStalledValue = myStalled.reduce((sum: number, s: any) => sum + s.value, 0);
  if (myStalled.length === 0) return `${todayLabel()} · No stalled deals in your boards`;
  const valuePart = myStalledValue > 0 ? ` · ${fmtMoney(myStalledValue)} at risk` : "";
  return `${todayLabel()} · ${myStalled.length} stalled${valuePart}`;
}

function buildEmail(person: TeamMember, pd: any, dataSource: string): string {
  const firstName = person.name.split(" ")[0];
  const personBoards = person.boards;

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

  // ── Owner-level deep section: stage breakdowns, rep distribution, all stalled, movements ──
  const isOwner = /(owner|ceo|coo|vp)/i.test(person.role);
  const ownerSection = (isOwner && pd) ? buildOwnerSection(pd, myStalled, myMoved) : "";

  const footer = `
    <div style="padding:16px 24px;background:#1F2125;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
      <a href="${DASHBOARD_URL}" style="display:inline-block;background:linear-gradient(135deg,#F28F1D,#D4721A);color:#fff;padding:8px 18px;border-radius:6px;text-decoration:none;font-weight:500;font-size:13px;">Open dashboard &rarr;</a>
      <div style="margin-top:10px;font-size:10px;color:#6B6266;line-height:1.4;">
        Unicity Solar Energy &middot; ${dataSource === "live" ? "Live Pipedrive snapshot" : "Data unavailable"} &middot; ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET<br>
        Read-only system. Numbers update each weekday at 7am EDT (6am EST).
      </div>
    </div>`;

  const kpiSection = buildKpiSection(person, pd);

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:640px;margin:0 auto;background:#24262B;color:#F0F0F0;border-radius:8px;overflow:hidden;">
    ${header}${summaryCard}${kpiSection}${stalledList}${boardSection}${prioritySection}${ownerSection}${footer}
  </div>`;
}

// ─────────────────────────────────────────────
// Owner-level deep section: rendered only for Owner/CEO/COO/VP recipients.
// Adds: per-board stage breakdowns, rep distribution, all stalled list with
// aging cohorts, and yesterday's stage movements.
// ─────────────────────────────────────────────
function buildOwnerSection(pd: any, allStalled: any[], movedDeals: any[]): string {
  // ── (1) Aging cohorts: bucket stalled deals by days-stuck ──
  const cohorts = { fresh: [] as any[], building: [] as any[], serious: [] as any[], critical: [] as any[] };
  allStalled.forEach((s) => {
    if (s.days <= 14) cohorts.fresh.push(s);
    else if (s.days <= 30) cohorts.building.push(s);
    else if (s.days <= 60) cohorts.serious.push(s);
    else cohorts.critical.push(s);
  });
  const cohortValue = (arr: any[]) => arr.reduce((sum, d) => sum + d.value, 0);
  const cohortCard = (label: string, range: string, items: any[], color: string) => `
    <td style="width:25%;padding:10px 8px;vertical-align:top;background:${color}0d;border:1px solid ${color}22;border-radius:6px;">
      <div style="font-size:10px;color:${color};text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">${label}</div>
      <div style="font-size:11px;color:#6B6266;margin:2px 0 6px;">${range}</div>
      <div style="font-size:22px;color:#F0F0F0;font-weight:700;line-height:1;">${items.length}</div>
      <div style="font-size:11px;color:#897C80;margin-top:4px;">${fmtMoney(cohortValue(items))}</div>
    </td>`;
  const cohortRow = `
    <table style="width:100%;border-collapse:separate;border-spacing:6px 0;">
      <tr>
        ${cohortCard("Fresh", "7-14 days", cohorts.fresh, "#F5A623")}
        ${cohortCard("Building", "15-30 days", cohorts.building, "#F28F1D")}
        ${cohortCard("Serious", "31-60 days", cohorts.serious, "#EF4444")}
        ${cohortCard("Critical", "61+ days", cohorts.critical, "#B91C1C")}
      </tr>
    </table>`;

  // ── (2) Rep distribution: who's holding the most stalled deals/value ──
  const byRep: Record<string, { count: number; value: number; deals: any[] }> = {};
  allStalled.forEach((s) => {
    const r = s.ownerName || "Unassigned";
    if (!byRep[r]) byRep[r] = { count: 0, value: 0, deals: [] };
    byRep[r].count++;
    byRep[r].value += s.value;
    byRep[r].deals.push(s);
  });
  const repRows = Object.entries(byRep)
    .sort(([, a], [, b]) => b.value - a.value)
    .slice(0, 8)
    .map(([rep, data]) => `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
        <td style="padding:8px 0;font-size:13px;color:#F0F0F0;">${escHtml(rep)}</td>
        <td style="padding:8px 0;font-size:13px;color:#F0F0F0;text-align:right;">${data.count}</td>
        <td style="padding:8px 0;font-size:13px;color:#F0F0F0;text-align:right;">${fmtMoney(data.value)}</td>
      </tr>`).join("");
  const repSection = Object.keys(byRep).length > 0 ? `
    <div style="margin-top:18px;">
      <div style="font-size:11px;color:#897C80;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:8px;">Stalled deals by owner</div>
      <table style="width:100%;border-collapse:collapse;">
        <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
          <td style="padding:6px 0;font-size:10px;color:#6B6266;text-transform:uppercase;">Owner</td>
          <td style="padding:6px 0;font-size:10px;color:#6B6266;text-align:right;">Stalled</td>
          <td style="padding:6px 0;font-size:10px;color:#6B6266;text-align:right;">Value</td>
        </tr>
        ${repRows}
      </table>
    </div>` : "";

  // ── (3) Per-board stage breakdown — only boards with deals, top 3 stages each ──
  const boardBreakdownRows = Object.keys(pd.boardData)
    .filter((b) => pd.boardData[b].totalDeals > 0)
    .sort((a, b) => pd.boardData[b].totalDeals - pd.boardData[a].totalDeals)
    .map((boardName) => {
      const board = pd.boardData[boardName];
      const topStages = board.stages
        .filter((s: any) => s.count > 0)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 3);
      const boardStalledHere = allStalled.filter((s: any) => s.board === boardName);
      const stageRows = topStages.map((s: any) => {
        const stageStalled = boardStalledHere.filter((b: any) => b.stage === s.name).length;
        const stalledFlag = stageStalled > 0
          ? `<span style="color:#EF4444;font-size:11px;font-weight:500;margin-left:6px;">${stageStalled} stalled</span>`
          : "";
        return `<div style="padding:4px 0;font-size:12px;color:#897C80;">
          ${escHtml(s.name)} <span style="color:#F0F0F0;font-weight:500;">${s.count}</span>
          <span style="color:#6B6266;"> · ${s.avgDays}d avg</span>
          ${stalledFlag}
        </div>`;
      }).join("");
      const moreStages = board.stages.filter((s: any) => s.count > 0).length - topStages.length;
      const moreStagesNote = moreStages > 0
        ? `<div style="font-size:11px;color:#6B6266;margin-top:4px;">+ ${moreStages} more stage${moreStages > 1 ? "s" : ""}</div>`
        : "";
      return `<tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
        <td style="padding:10px 0;vertical-align:top;">
          <div style="font-size:13px;color:#F0F0F0;font-weight:500;">${escHtml(boardName)}</div>
          <div style="font-size:11px;color:#897C80;margin-top:2px;">${board.totalDeals} open · ${boardStalledHere.length} stalled</div>
        </td>
        <td style="padding:10px 0;vertical-align:top;">${stageRows}${moreStagesNote}</td>
      </tr>`;
    }).join("");
  const boardBreakdownSection = boardBreakdownRows ? `
    <div style="margin-top:18px;">
      <div style="font-size:11px;color:#897C80;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:8px;">Per-board stage breakdown</div>
      <table style="width:100%;border-collapse:collapse;">${boardBreakdownRows}</table>
      <div style="margin-top:8px;font-size:10px;color:#6B6266;line-height:1.4;">
        Top 3 stages by deal count per board. View all stages on the dashboard.
      </div>
    </div>` : "";

  // ── (4) Yesterday's movements: list, not count ──
  const movedRows = movedDeals.slice(0, 8).map((m: any) => `
    <a href="${escHtml(m.url)}" style="display:block;text-decoration:none;color:inherit;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="vertical-align:top;">
            <div style="font-size:12px;color:#F0F0F0;">${escHtml(m.title)}</div>
            <div style="font-size:10px;color:#6B6266;margin-top:2px;">${escHtml(m.boardName)} &rsaquo; ${escHtml(m.stageName)} &middot; ${escHtml(m.ownerName)}</div>
          </td>
          <td style="vertical-align:top;text-align:right;width:70px;font-size:11px;color:#897C80;">${fmtMoney(m.value)}</td>
        </tr>
      </table>
    </a>`).join("");
  const moveSection = movedDeals.length > 0 ? `
    <div style="margin-top:18px;">
      <div style="font-size:11px;color:#897C80;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:8px;">Moved in last 24 hours</div>
      ${movedRows}
      ${movedDeals.length > 8 ? `<div style="font-size:11px;color:#6B6266;margin-top:6px;">+ ${movedDeals.length - 8} more</div>` : ""}
    </div>` : `
    <div style="margin-top:18px;">
      <div style="font-size:11px;color:#897C80;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:6px;">Moved in last 24 hours</div>
      <div style="font-size:12px;color:#6B6266;">No stage changes in the last 24 hours.</div>
    </div>`;

  // ── (5) All stalled deals (beyond the top 5 shown above) ──
  const remainingStalled = allStalled.slice(5);
  const allStalledRows = remainingStalled.slice(0, 15).map((s: any) => `
    <a href="${escHtml(s.url)}" style="display:block;text-decoration:none;color:inherit;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="vertical-align:top;">
            <div style="font-size:12px;color:#F0F0F0;">${escHtml(s.title)}</div>
            <div style="font-size:10px;color:#6B6266;margin-top:2px;">${escHtml(s.board)} &rsaquo; ${escHtml(s.stage)} &middot; ${escHtml(s.ownerName)}</div>
          </td>
          <td style="vertical-align:top;text-align:right;width:90px;">
            <div style="font-size:12px;color:#EF4444;font-weight:600;">${s.days}d</div>
            <div style="font-size:10px;color:#897C80;margin-top:2px;">${fmtMoney(s.value)}</div>
          </td>
        </tr>
      </table>
    </a>`).join("");
  const remainingStalledSection = remainingStalled.length > 0 ? `
    <div style="margin-top:18px;">
      <div style="font-size:11px;color:#897C80;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:8px;">Remaining stalled (${remainingStalled.length})</div>
      ${allStalledRows}
      ${remainingStalled.length > 15 ? `<div style="font-size:11px;color:#6B6266;margin-top:6px;">+ ${remainingStalled.length - 15} more &mdash; <a href="${DASHBOARD_URL}" style="color:#4A9EE0;text-decoration:none;">view all on dashboard</a></div>` : ""}
    </div>` : "";

  return `
    <div style="padding:18px 24px;background:#1A1C20;border-top:2px solid rgba(242,143,29,0.4);">
      <div style="font-size:13px;color:#F28F1D;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:14px;">
        Owner overview
      </div>
      <div style="font-size:11px;color:#897C80;margin-bottom:14px;line-height:1.5;">
        Deep view across the company. Every section below is filtered for your role and rolls up the same data as the dashboard.
      </div>
      ${allStalled.length > 0 ? cohortRow : ""}
      ${repSection}
      ${boardBreakdownSection}
      ${moveSection}
      ${remainingStalledSection}
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
