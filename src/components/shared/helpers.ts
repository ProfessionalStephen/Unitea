import { BOARDS } from "../../../shared/domain/boards.js";
import { resolveKpi, viewFromFrontend } from "../../../shared/kpi/index.js";

type RawDeal = {
  id: number;
  name?: string;
  title?: string;
  days?: number;
  ownerName?: string;
  url?: string;
  pipedriveUrl?: string;
};

type RawStage = {
  name?: string;
  count?: number;
  avgDays?: string | number;
  totalValue?: string | number;
  deals?: RawDeal[];
};

type RawBoard = {
  stages?: RawStage[];
};

type LiveApiData = {
  boardData?: Record<string, RawBoard>;
  totalActiveJobs?: number;
  totalDeals?: number;
  stalled?: unknown[];
  totalPipelineValue?: number;
  wonThisWeek?: number;
  wonThisWeekValue?: number;
  wonLast30d?: number;
  lostLast30d?: number;
  lostLast30dValue?: number;
  cancellationRate30d?: number;
  activitiesDueToday?: number;
  activitiesOverdue?: number;
  callsDueToday?: number;
  installsCompletedYesterday?: number;
  installsScheduledThisWeek?: number;
  permitsSubmittedThisWeek?: number;
  sentToPermittingToday?: number;
  nmaSubmittedThisWeek?: number;
  serviceRequestsToday?: number;
  techniciansScheduledToday?: number;
  inspectionsScheduledToday?: number;
};

type DealView = {
  id: number;
  name: string;
  address: string;
  days: number;
  rep: string;
  pipedriveUrl?: string;
  notes: string[];
  flags: string[];
};

type StageView = {
  name: string;
  jobCount: number;
  avgDays: number;
  threshold: number | null;
  stuckCount: number;
  totalValue: number;
  deals: DealView[];
};

type BoardView = {
  name: string;
  region: string;
  jobCount: number;
  avgDays: number;
  stuckCount: number;
  totalValue: number;
  status: "green" | "amber" | "red";
  stages: Record<string, StageView>;
  live: boolean;
};

type RepStat = {
  rep: string;
  jobCount: number;
  totalDays: number;
  avgDays?: number;
};

type PipelineDealView = DealView & {
  board: string;
  stage: string;
};

type BottleneckView = {
  board: string;
  stage: string;
  stuckCount: number;
  avgDays: number;
  boardAvg: number;
  pctAbove: number;
};

type EmailHealthStage = {
  name?: string;
  stuckCount?: number;
  avgDays?: number;
};

type EmailHealthBoard = {
  status: "green" | "amber" | "red";
  jobCount: number;
  avgDays: number;
  stuckCount: number;
  stages: Record<string, EmailHealthStage>;
};

type EmailHealthData = {
  endToEndDays: number;
  boards: Record<string, EmailHealthBoard>;
  bottlenecks: Array<{
    board: string;
    stage: string;
    avgDays: number;
    pctAbove: number;
  }>;
};

type KpiEmailPerson = {
  kpis: string[];
};

type KpiTag = {
  name: string;
  sources?: unknown[];
  fallback?: string;
};

type NeedsAttentionData = {
  bottlenecks: Array<{
    board: string;
  }>;
};

type PriorityPerson = {
  role?: string;
};

type PriorityPipelineData = {
  totalStuck?: number;
};

type EmailPerson = {
  name: string;
  nested?: boolean;
};

type EmailContent = {
  greeting?: string;
  priorities?: string[];
  teamPulse?: string;
  weekReview?: string;
};

export type PipelineDataView = {
  boards: Record<string, BoardView>;
  totalActiveJobs: number;
  configuredActiveJobs: number;
  unmappedActiveJobs: number;
  totalStuck: number;
  endToEndDays: number;
  bottlenecks: BottleneckView[];
  repStats: Record<string, RepStat>;
  allDeals: PipelineDealView[];
  isLive: boolean;
  totalPipelineValue?: number;
  wonThisWeek?: number;
  wonThisWeekValue?: number;
  wonLast30d?: number;
  lostLast30d?: number;
  lostLast30dValue?: number;
  cancellationRate30d?: number;
  activitiesDueToday?: number;
  activitiesOverdue?: number;
  callsDueToday?: number;
  installsCompletedYesterday?: number;
  installsScheduledThisWeek?: number;
  permitsSubmittedThisWeek?: number;
  sentToPermittingToday?: number;
  nmaSubmittedThisWeek?: number;
  serviceRequestsToday?: number;
  techniciansScheduledToday?: number;
  inspectionsScheduledToday?: number;
};

function numberFrom(value: string | number | undefined): number {
  return Number.parseFloat(String(value ?? 0)) || 0;
}

function findLiveStage(liveBoard: RawBoard | undefined, stageName: string): RawStage | null {
  const stages = liveBoard?.stages;
  if (!stages) return null;
  return stages.find((stage) => stage.name?.toLowerCase() === stageName.toLowerCase()) ?? null;
}

function resolveKpiValue(tag: KpiTag | undefined, pd: unknown): string {
  if (!tag) return "—";
  return resolveKpi(tag.name, tag, viewFromFrontend(pd));
}

export function escHtml(s: unknown): string {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function valKey(k?: string | null): string | null {
  if (!k || k.length < 20) return "Key too short";
  if (!/^[a-f0-9]+$/i.test(k)) return "Invalid characters";
  return null;
}

export function todayStr(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

export function dlCSV(data: Array<Record<string, unknown>>, fn: string): void {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const csv = [keys.join(",")]
    .concat(
      data.map((row) =>
        keys
          .map((key) => `"${String(row[key] || "").replace(/"/g, '""')}"`)
          .join(","),
      ),
    )
    .join("\n");
  const anchor = document.createElement("a");
  anchor.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  anchor.download = fn;
  anchor.click();
}

export function dlJSON(data: unknown, fn: string): void {
  const anchor = document.createElement("a");
  anchor.href = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
  anchor.download = fn;
  anchor.click();
}

export function buildPipelineData(liveApiData?: LiveApiData | null): PipelineDataView {
  const boards: Record<string, BoardView> = {};
  let totalActiveJobs = 0;
  let totalStuck = 0;
  const allDeals: PipelineDealView[] = [];

  for (const boardName of Object.keys(BOARDS)) {
    const config = BOARDS[boardName];
    const stages: Record<string, StageView> = {};
    let boardTotalJobs = 0;
    let boardTotalDays = 0;
    let boardStuck = 0;
    const liveBoard = liveApiData?.boardData?.[boardName];

    for (const stageName of config.stages) {
      const threshold = config.rotting[stageName] || null;
      const liveStage = findLiveStage(liveBoard, stageName);
      const jobCount = liveStage?.count ?? 0;
      const avgDays = numberFrom(liveStage?.avgDays);
      const stageTotalValue = numberFrom(liveStage?.totalValue);
      const deals = (liveStage?.deals ?? []).map((deal): DealView => {
        const days = deal.days ?? 0;
        return {
          id: deal.id,
          name: deal.name || deal.title || "Unknown",
          address: "",
          days,
          rep: deal.ownerName || "Unassigned",
          pipedriveUrl: deal.url || deal.pipedriveUrl,
          notes: [],
          flags: days > (threshold || 999) ? ["Past rotting threshold"] : [],
        };
      });

      const stuckCount = deals.filter((deal) => threshold && deal.days > threshold).length;
      boardTotalJobs += jobCount;
      boardTotalDays += avgDays * jobCount;
      boardStuck += stuckCount;
      for (const deal of deals) allDeals.push({ ...deal, board: boardName, stage: stageName });

      stages[stageName] = {
        name: stageName,
        jobCount,
        avgDays: Number.parseFloat(avgDays.toFixed(1)),
        threshold,
        stuckCount,
        totalValue: stageTotalValue,
        deals,
      };
    }

    const boardAvgDays =
      boardTotalJobs > 0 ? Number.parseFloat((boardTotalDays / boardTotalJobs).toFixed(1)) : 0;
    const boardTotalValue = Object.values(stages).reduce(
      (sum, stage) => sum + (stage.totalValue || 0),
      0,
    );
    const stuckRatio = boardTotalJobs > 0 ? boardStuck / boardTotalJobs : 0;
    const status = stuckRatio >= 0.2 ? "red" : stuckRatio >= 0.05 ? "amber" : "green";

    totalActiveJobs += boardTotalJobs;
    totalStuck += boardStuck;
    boards[boardName] = {
      name: boardName,
      region: config.region,
      jobCount: boardTotalJobs,
      avgDays: boardAvgDays,
      stuckCount: boardStuck,
      totalValue: boardTotalValue,
      status,
      stages,
      live: !!liveBoard,
    };
  }

  const endToEndDays = Object.values(boards).reduce(
    (sum, board) => sum + (board.jobCount > 0 ? board.avgDays : 0),
    0,
  );

  const bottlenecks: BottleneckView[] = [];
  for (const board of Object.values(boards)) {
    if (board.jobCount === 0 || board.avgDays === 0) continue;
    const threshold = Math.max(7, board.avgDays * 1.5);
    for (const stage of Object.values(board.stages)) {
      if (stage.jobCount > 0 && stage.avgDays >= threshold) {
        bottlenecks.push({
          board: board.name,
          stage: stage.name,
          stuckCount: stage.jobCount,
          avgDays: stage.avgDays,
          boardAvg: board.avgDays,
          pctAbove: board.avgDays > 0 ? Math.round(((stage.avgDays - board.avgDays) / board.avgDays) * 100) : 0,
        });
      }
    }
  }
  bottlenecks.sort((left, right) => right.pctAbove - left.pctAbove);

  const repStats: Record<string, RepStat> = {};
  for (const deal of allDeals) {
    const rep = deal.rep || "Unassigned";
    if (!repStats[rep]) repStats[rep] = { rep, jobCount: 0, totalDays: 0 };
    repStats[rep].jobCount += 1;
    repStats[rep].totalDays += deal.days || 0;
  }
  for (const rep of Object.values(repStats)) {
    rep.avgDays = rep.jobCount > 0 ? Number.parseFloat((rep.totalDays / rep.jobCount).toFixed(1)) : 0;
  }

  const live = liveApiData || {};
  const configuredActiveJobs = totalActiveJobs;
  const apiActiveJobs = Number(live.totalActiveJobs ?? live.totalDeals);
  const apiStuck = Array.isArray(live.stalled) ? live.stalled.length : NaN;
  return {
    boards,
    totalActiveJobs: Number.isFinite(apiActiveJobs) ? apiActiveJobs : configuredActiveJobs,
    configuredActiveJobs,
    unmappedActiveJobs: Number.isFinite(apiActiveJobs)
      ? Math.max(0, apiActiveJobs - configuredActiveJobs)
      : 0,
    totalStuck: Number.isFinite(apiStuck) ? apiStuck : totalStuck,
    endToEndDays: Number.parseFloat(endToEndDays.toFixed(1)),
    bottlenecks,
    repStats,
    allDeals,
    isLive: !!liveApiData,
    totalPipelineValue: live.totalPipelineValue,
    wonThisWeek: live.wonThisWeek,
    wonThisWeekValue: live.wonThisWeekValue,
    wonLast30d: live.wonLast30d,
    lostLast30d: live.lostLast30d,
    lostLast30dValue: live.lostLast30dValue,
    cancellationRate30d: live.cancellationRate30d,
    activitiesDueToday: live.activitiesDueToday,
    activitiesOverdue: live.activitiesOverdue,
    callsDueToday: live.callsDueToday,
    installsCompletedYesterday: live.installsCompletedYesterday,
    installsScheduledThisWeek: live.installsScheduledThisWeek,
    permitsSubmittedThisWeek: live.permitsSubmittedThisWeek,
    sentToPermittingToday: live.sentToPermittingToday,
    nmaSubmittedThisWeek: live.nmaSubmittedThisWeek,
    serviceRequestsToday: live.serviceRequestsToday,
    techniciansScheduledToday: live.techniciansScheduledToday,
    inspectionsScheduledToday: live.inspectionsScheduledToday,
  };
}

export function buildEmailHealthSection(pd: EmailHealthData, memberBoards: string[]): string {
  const boards = (memberBoards || []).filter((board) => pd.boards[board]);
  const severityOrder = { red: 0, amber: 1, green: 2 };
  const sorted = boards.slice().sort((left, right) => {
    const leftStatus = pd.boards[left]?.status || "green";
    const rightStatus = pd.boards[right]?.status || "green";
    return severityOrder[leftStatus] - severityOrder[rightStatus];
  });
  const greenCount = boards.filter((board) => pd.boards[board]?.status === "green").length;
  const amberCount = boards.filter((board) => pd.boards[board]?.status === "amber").length;
  const redCount = boards.filter((board) => pd.boards[board]?.status === "red").length;
  const top3 = pd.bottlenecks.slice(0, 3);

  const boardCards = sorted
    .map((boardName) => {
      const board = pd.boards[boardName];
      if (!board) return "";
      const color = board.status === "green" ? "#22C55E" : board.status === "amber" ? "#F59E0B" : "#EF4444";
      const icon = board.status === "green" ? "&#9679;" : board.status === "amber" ? "&#9650;" : "&#10005;";
      const topStageEntry = Object.entries(board.stages).sort(
        ([, left], [, right]) => (right.stuckCount || 0) - (left.stuckCount || 0),
      )[0];
      const topStageName = topStageEntry ? topStageEntry[1].name || topStageEntry[0] : "";
      const topStage = topStageEntry ? topStageEntry[1] : undefined;
      const stageInfo =
        topStage && (topStage.stuckCount || 0) > 0
          ? `Top stuck: ${topStageName} (${topStage.stuckCount} deals, avg ${topStage.avgDays}d)`
          : "No stuck jobs";
      return "<div style='width:100%;margin-bottom:7px;'>"
        + `<details style='border-radius:8px;overflow:hidden;border:1px solid ${color}40;'>`
        + `<summary style='padding:10px 14px;background:${color}15;cursor:pointer;list-style:none;font-family:Arial,sans-serif;'>`
        + "<table width='100%' cellpadding='0' cellspacing='0' border='0'><tr>"
        + `<td style='color:${color};font-size:13px;font-weight:500;'>${icon} ${boardName} &mdash; ${board.jobCount} jobs</td>`
        + `<td style='text-align:right;color:${color};font-size:11px;'>${board.avgDays}d avg &middot; ${board.stuckCount} stuck &#9662;</td>`
        + "</tr></table></summary>"
        + "<div style='padding:10px 14px;background:#1E2228;font-family:Arial,sans-serif;'>"
        + `<p style='margin:0 0 5px;font-size:11px;color:#897C80;'>${stageInfo}</p>`
        + `<p style='margin:0;font-size:11px;color:#897C80;'>Avg days in board: ${board.avgDays}d &middot; ${board.jobCount} jobs &middot; ${board.stuckCount} past rotting threshold</p>`
        + "</div></details></div>";
    })
    .join("");

  const bottleneckRows = top3
    .map((bottleneck) =>
      "<tr>"
      + `<td style='padding:5px 8px;font-size:11px;color:#F0F0F0;font-family:Arial,sans-serif;'>${bottleneck.board}</td>`
      + `<td style='padding:5px 8px;font-size:11px;color:#897C80;font-family:Arial,sans-serif;'>${bottleneck.stage}</td>`
      + `<td style='padding:5px 8px;font-size:11px;color:#EF4444;font-family:Arial,sans-serif;text-align:right;'>${bottleneck.avgDays}d (${bottleneck.pctAbove}% above avg)</td>`
      + "</tr>",
    )
    .join("");

  const sumRow = "<table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-bottom:14px;'><tr>"
    + `<td width='32%' style='text-align:center;padding:9px 6px;background:rgba(34,197,94,0.1);border-radius:8px;border:1px solid rgba(34,197,94,0.25);'><p style='margin:0;font-size:20px;font-weight:500;color:#22C55E;font-family:Arial,sans-serif;'>${greenCount}</p><p style='margin:3px 0 0;font-size:11px;color:#22C55E;font-family:Arial,sans-serif;'>&#9679; Healthy</p></td>`
    + "<td width='4%'></td>"
    + `<td width='28%' style='text-align:center;padding:9px 6px;background:rgba(245,158,11,0.1);border-radius:8px;border:1px solid rgba(245,158,11,0.25);'><p style='margin:0;font-size:20px;font-weight:500;color:#F59E0B;font-family:Arial,sans-serif;'>${amberCount}</p><p style='margin:3px 0 0;font-size:11px;color:#F59E0B;font-family:Arial,sans-serif;'>&#9650; Watch</p></td>`
    + "<td width='4%'></td>"
    + `<td width='32%' style='text-align:center;padding:9px 6px;background:rgba(239,68,68,0.1);border-radius:8px;border:1px solid rgba(239,68,68,0.25);'><p style='margin:0;font-size:20px;font-weight:500;color:#EF4444;font-family:Arial,sans-serif;'>${redCount}</p><p style='margin:3px 0 0;font-size:11px;color:#EF4444;font-family:Arial,sans-serif;'>&#10005; Critical</p></td>`
    + "</tr></table>";

  return "<div style='margin:0;padding:18px 22px;background:#1A1D22;border-top:1px solid rgba(255,255,255,0.08);border-bottom:1px solid rgba(255,255,255,0.08);'>"
    + "<p style='margin:0 0 12px;font-size:15px;font-weight:500;color:#F28F1D;font-family:Arial,sans-serif;'>Board health overview</p>"
    + sumRow
    + `<div style='width:100%;margin-bottom:14px;'>${boardCards}</div>`
    + (top3.length > 0
      ? "<p style='margin:0 0 7px;font-size:12px;font-weight:500;color:#F28F1D;font-family:Arial,sans-serif;'>Top bottlenecks this period</p>"
        + `<table width='100%' cellpadding='0' cellspacing='0' border='0' style='background:rgba(239,68,68,0.06);border-radius:8px;border:1px solid rgba(239,68,68,0.2);'>${bottleneckRows}</table>`
      : "")
    + `<p style='margin:10px 0 0;font-size:11px;color:#897C80;text-align:center;font-family:Arial,sans-serif;'>End-to-end pipeline avg: ${pd.endToEndDays} days &middot; Industry benchmark: 120 days</p>`
    + "</div>";
}

export function buildKpiTableHtml(person: KpiEmailPerson, pd: unknown, kpiTags: KpiTag[]): string {
  const kpis = person.kpis.map((kpiName) => {
    const tag = kpiTags.find((candidate) => candidate.name === kpiName);
    const val = tag ? resolveKpiValue(tag, pd) : "—";
    return { name: kpiName, val };
  });

  let rows = "";
  for (let i = 0; i < kpis.length; i += 3) {
    let cells = "";
    for (let j = i; j < Math.min(i + 3, kpis.length); j++) {
      cells += "<td width='33%' style='padding:4px;'>"
        + "<div style='background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px 12px;text-align:center;'>"
        + `<p style='margin:0 0 4px;font-size:11px;color:#897C80;font-family:Arial,sans-serif;'>${kpis[j].name}</p>`
        + `<p style='margin:0;font-size:18px;font-weight:500;color:#F0F0F0;font-family:Arial,sans-serif;'>${kpis[j].val}</p>`
        + "</div></td>";
    }
    const remaining = i + 3 - kpis.length;
    if (remaining > 0 && remaining < 3) {
      for (let p = 0; p < remaining; p++) cells += "<td width='33%' style='padding:4px;'></td>";
    }
    rows += `<tr>${cells}</tr>`;
  }
  return `<table width='100%' cellpadding='0' cellspacing='0' border='0'>${rows}</table>`;
}

export function buildNeedsAttentionHtml(alerts: string[], pd: NeedsAttentionData): string {
  return alerts
    .map((alert, index) => {
      const bottleneck = pd.bottlenecks[index];
      const pdUrl = bottleneck
        ? `https://app.pipedrive.com/deals/?filter_id=${encodeURIComponent(bottleneck.board)}`
        : "https://app.pipedrive.com";
      return "<div style='margin-bottom:8px;padding:10px 14px;background:rgba(239,68,68,0.07);border-left:3px solid #EF4444;border-radius:0 8px 8px 0;'>"
        + `<p style='margin:0 0 4px;font-size:13px;color:#F0F0F0;font-family:Arial,sans-serif;'>${alert}</p>`
        + `<a href='${pdUrl}' style='font-size:11px;color:#4A9EE0;text-decoration:none;font-family:Arial,sans-serif;'>View in Pipedrive &rarr;</a>`
        + "</div>";
    })
    .join("");
}

export function getPriorities(person: PriorityPerson, pd: PriorityPipelineData): string[] {
  const stuck = pd.totalStuck || 0;
  const role = (person.role || "").toLowerCase();

  if (role.includes("owner") || role.includes("ceo") || role.includes("coo") || role.includes("vp")) {
    return [
      "Review top 3 bottlenecks with relevant managers",
      stuck > 0 ? `Address ${stuck} stuck deals across all boards` : "Maintain current pipeline velocity",
      "Check team workload distribution",
    ];
  }

  if (role.includes("sales")) {
    return [
      "Follow up on stale leads (>14 days no activity)",
      "Review weekly conversion metrics",
      "Coordinate with Installation on hand-off readiness",
    ];
  }

  if (role.includes("install") || role.includes("warehouse") || role.includes("operations")) {
    return [
      "Confirm today's installation schedule",
      "Check material availability for next 5 jobs",
      "Review safety/permit status for active jobs",
    ];
  }

  if (role.includes("finance")) {
    return [
      "Review M1/M2/M3 invoice status",
      "Reconcile prior week payments",
      "Flag any aging receivables >30 days",
    ];
  }

  if (role.includes("engineer") || role.includes("design")) {
    return [
      "Review pending design queue",
      "Address engineering revisions",
      "Coordinate utility submission status",
    ];
  }

  return [
    "Review your KPIs above",
    "Address items in 'Needs attention'",
    "Coordinate with your manager on blockers",
  ];
}

export function assembleEmail(
  person: EmailPerson,
  content: EmailContent,
  kpiTableHtml: string,
  needsAttentionHtml: string,
  boardHealthHtml: string,
  isMonday: boolean,
  isOwnerLevel: boolean,
): string {
  const divider = "<div style='height:1px;background:rgba(255,255,255,0.08);margin:0;'></div>";
  const sectionStyle = "padding:18px 22px;background:#24262B;";
  const headerStyle = "margin:0 0 12px;font-size:14px;font-weight:500;color:#F28F1D;font-family:Arial,sans-serif;";
  const bodyStyle = "font-size:13px;color:#F0F0F0;font-family:Arial,sans-serif;line-height:1.6;";

  const sections = [
    `<div style='${sectionStyle}background:#1E2228;'>`
      + `<p style='${bodyStyle}margin:0;'>${content.greeting || ""}</p>`
      + "</div>",
    divider,
    `<div style='${sectionStyle}'>`
      + `<p style='${headerStyle}'>Your KPIs today</p>`
      + kpiTableHtml
      + "</div>",
    divider,
    `<div style='${sectionStyle}background:#1E2228;'>`
      + `<p style='${headerStyle}'>Needs attention</p>`
      + needsAttentionHtml
      + "</div>",
    divider,
    person.nested ? boardHealthHtml : null,
    person.nested ? divider : null,
    `<div style='${sectionStyle}'>`
      + `<p style='${headerStyle}'>Today's priorities</p>`
      + (content.priorities || [])
        .map(
          (priority, index) =>
            "<div style='display:flex;gap:10px;margin-bottom:8px;align-items:flex-start;'>"
            + `<span style='font-size:13px;color:#F28F1D;font-family:Arial,sans-serif;font-weight:500;flex-shrink:0;'>${index + 1}.</span>`
            + `<p style='margin:0;font-size:13px;color:#F0F0F0;font-family:Arial,sans-serif;'>${priority}</p>`
            + "</div>",
        )
        .join("")
      + "</div>",
    isOwnerLevel && content.teamPulse ? divider : null,
    isOwnerLevel && content.teamPulse
      ? `<div style='${sectionStyle}background:#1E2228;'>`
        + `<p style='${headerStyle}'>Team pulse</p>`
        + `<p style='margin:0;${bodyStyle}'>${content.teamPulse}</p>`
        + "</div>"
      : null,
    isMonday && content.weekReview ? divider : null,
    isMonday && content.weekReview
      ? `<div style='${sectionStyle}'>`
        + `<p style='${headerStyle}'>Week in review</p>`
        + `<p style='margin:0;${bodyStyle}'>${content.weekReview}</p>`
        + "</div>"
      : null,
    divider,
    "<div style='padding:14px 22px;background:#141618;text-align:center;'>"
      + "<p style='margin:0 0 6px;font-size:11px;color:#897C80;font-family:Arial,sans-serif;'>"
      + `<a href='mailto:ai@unicitysolar.com?subject=Snooze alert - ${person.name}' style='color:#897C80;margin:0 8px;'>Snooze alerts</a>`
      + "&middot;"
      + `<a href='mailto:ai@unicitysolar.com?subject=KPI Report - ${person.name}' style='color:#897C80;margin:0 8px;'>Flag an issue</a>`
      + "</p>"
      + `<p style='margin:0;font-size:11px;color:#4A5568;font-family:Arial,sans-serif;'>Read-only system &middot; Unicity Solar Energy &middot; ${new Date().toLocaleDateString()}</p>`
      + "</div>",
  ].filter((section) => section !== null && section !== undefined);

  return "<div style='max-width:600px;margin:0 auto;background:#24262B;border-radius:12px;overflow:hidden;border:1px solid rgba(242,143,29,0.2);'>"
    + sections.join("")
    + "</div>";
}
