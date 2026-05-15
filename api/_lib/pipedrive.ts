// ─────────────────────────────────────────────────────────────
// SHARED PIPEDRIVE PULL
// One source of truth used by:
//   • api/cron/send-briefings.ts  (daily email cron)
//   • api/pipedrive/pull.ts       (frontend "Pull live data" button)
//
// Returns a single PipelineData shape with both raw board/stage
// data and pre-computed aggregates (won/lost/activities/value)
// so resolveKpi() consumers don't have to re-query Pipedrive.
// ─────────────────────────────────────────────────────────────

export type PipedriveDeal = {
  id: number;
  title: string;
  value: number;
  currency: string;
  days: number;             // days since last stage change
  url: string;
  ownerName: string;
};

export type PipedriveStage = {
  name: string;
  count: number;
  avgDays: number;
  totalValue: number;       // sum of value across stage's deals
  stuckCount: number;       // deals past threshold (computed during stalled pass)
  deals: PipedriveDeal[];
};

export type PipedriveBoard = {
  totalDeals: number;
  totalValue: number;       // sum of value across all deals in board
  avgDays: number;          // weighted avg across stages with deals
  stages: PipedriveStage[];
};

export type StalledDeal = {
  board: string; stage: string; dealId: number; title: string; days: number;
  value: number; currency: string; url: string; ownerName: string; threshold: number;
};

export type MovedDeal = {
  id: number; title: string; value: number; url: string;
  ownerName: string; boardName: string; stageName: string;
};

export type PipelineData = {
  // Raw structures
  boardData: Record<string, PipedriveBoard>;
  pipelines: Array<{ id: number; name: string }>;
  stalled: StalledDeal[];
  moved24h: MovedDeal[];

  // Aggregates (pre-computed so resolvers don't re-iterate)
  totalActiveJobs: number;
  totalPipelineValue: number;          // sum of all open deal values
  endToEndDays: number;                // sum of board avgDays across boards with deals
  wonThisWeek: number;                 // count of deals won since Monday ET
  wonThisWeekValue: number;            // sum of value, won since Monday ET
  wonLast30d: number;                  // count, won in last 30 days
  lostLast30d: number;                 // count, lost in last 30 days
  lostLast30dValue: number;            // sum of value, lost in last 30 days
  cancellationRate30d: number;         // lost / (won + lost) * 100, rounded
  activitiesDueToday: number;          // open activities with due_date == today ET
  activitiesOverdue: number;           // open activities with due_date < today ET
  callsDueToday: number;               // subset where type == "call"
};

function daysSince(iso: string | null | undefined): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  if (isNaN(t)) return 0;
  return Math.max(0, Math.round((Date.now() - t) / 86400000));
}

function easternYMD(d: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${day}`;
}

function startOfWeekETIso(): string {
  // Monday 00:00 ET of current week, as ISO date string YYYY-MM-DD
  const now = new Date();
  // Get current weekday in ET
  const etDay = Number(new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", weekday: "short",
  }).formatToParts(now).find((p) => p.type === "weekday")?.value === "Sun" ? 0 : 1);
  // Simpler: compute weekday number via formatToParts of a date object — but ET tz makes this ugly.
  // Use a portable approach: count back from today ET to Monday.
  const todayStr = easternYMD(now);
  const [y, m, d] = todayStr.split("-").map(Number);
  // Construct a UTC date at noon to avoid DST edge
  const utcMidday = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const wkdayUtc = utcMidday.getUTCDay(); // 0=Sun..6=Sat in UTC for that noon
  const daysBack = wkdayUtc === 0 ? 6 : wkdayUtc - 1; // back to Monday
  const monday = new Date(utcMidday.getTime() - daysBack * 86400000);
  return easternYMD(monday);
}

function nDaysAgoEt(n: number): string {
  const now = new Date();
  const todayStr = easternYMD(now);
  const [y, m, d] = todayStr.split("-").map(Number);
  const utcMidday = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return easternYMD(new Date(utcMidday.getTime() - n * 86400000));
}

function isWithinIsoRange(iso: string | undefined | null, startYMD: string, endYMD: string): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  if (isNaN(t)) return false;
  const dateStr = new Date(t).toISOString().slice(0, 10);
  return dateStr >= startYMD && dateStr <= endYMD;
}

function isBeforeYMD(iso: string | undefined | null, ymd: string): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  if (isNaN(t)) return false;
  return new Date(t).toISOString().slice(0, 10) < ymd;
}

export async function pullPipedrive(domain: string, apiKey: string): Promise<PipelineData> {
  const baseUrl = `https://${domain}.pipedrive.com/api/v1`;
  async function pdGet(path: string): Promise<any> {
    const url = `${baseUrl}${path}${path.includes("?") ? "&" : "?"}api_token=${apiKey}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Pipedrive ${path} ${r.status}`);
    const j = await r.json();
    if (j && j.success === false) throw new Error(`Pipedrive ${path}: ${j.error}`);
    return j.data;
  }

  // Parallel fetch: 6 endpoints
  const [pipelinesRaw, stagesRaw, openDealsRaw, wonDealsRaw, lostDealsRaw, activitiesRaw] = await Promise.all([
    pdGet("/pipelines"),
    pdGet("/stages"),
    pdGet("/deals?status=open&limit=500"),
    pdGet("/deals?status=won&limit=500&sort=won_time%20DESC"),
    pdGet("/deals?status=lost&limit=500&sort=lost_time%20DESC"),
    pdGet("/activities?done=0&limit=500"),
  ]);

  const pipelinesArr = Array.isArray(pipelinesRaw) ? pipelinesRaw : [];
  const stagesArr = Array.isArray(stagesRaw) ? stagesRaw : [];
  const openDeals = Array.isArray(openDealsRaw) ? openDealsRaw : [];
  const wonDeals = Array.isArray(wonDealsRaw) ? wonDealsRaw : [];
  const lostDeals = Array.isArray(lostDealsRaw) ? lostDealsRaw : [];
  const activities = Array.isArray(activitiesRaw) ? activitiesRaw : [];

  // ── Build boardData with stage + board value aggregates ──
  const boardData: Record<string, PipedriveBoard> = {};
  pipelinesArr.forEach((p: any) => {
    const pipelineStages = stagesArr.filter((s: any) => s.pipeline_id === p.id);
    const pipelineDeals = openDeals.filter((d: any) => d.pipeline_id === p.id);

    const stageRows: PipedriveStage[] = pipelineStages
      .sort((a: any, b: any) => (a.order_nr || 0) - (b.order_nr || 0))
      .map((s: any) => {
        const stageDeals = pipelineDeals.filter((d: any) => d.stage_id === s.id);
        const deals: PipedriveDeal[] = stageDeals.map((d: any) => ({
          id: d.id,
          title: d.title || `Deal ${d.id}`,
          value: Number(d.value || 0),
          currency: d.currency || "USD",
          days: daysSince(d.stage_change_time || d.add_time),
          url: `https://${domain}.pipedrive.com/deal/${d.id}`,
          ownerName: d.owner_name || "Unassigned",
        }));
        const totalValue = deals.reduce((sum, x) => sum + x.value, 0);
        const avgDays = deals.length
          ? Math.round(deals.reduce((sum, x) => sum + x.days, 0) / deals.length)
          : 0;
        return { name: s.name, count: deals.length, avgDays, totalValue, stuckCount: 0, deals };
      });

    const totalValue = stageRows.reduce((sum, st) => sum + st.totalValue, 0);
    const boardWeightedDays = stageRows.reduce((sum, st) => sum + st.avgDays * st.count, 0);
    const boardTotalCount = stageRows.reduce((sum, st) => sum + st.count, 0);
    const boardAvgDays = boardTotalCount > 0 ? boardWeightedDays / boardTotalCount : 0;
    boardData[p.name] = {
      totalDeals: pipelineDeals.length,
      totalValue,
      avgDays: Math.round(boardAvgDays * 10) / 10,
      stages: stageRows,
    };
  });

  // ── Stalled deals (≥1.5x board avg, min 7d) ──
  const stalled: StalledDeal[] = [];
  Object.keys(boardData).forEach((boardName) => {
    const board = boardData[boardName];
    const totalDays = board.stages.reduce((s, st) => s + st.avgDays * st.count, 0);
    const totalCount = board.stages.reduce((s, st) => s + st.count, 0);
    if (totalCount === 0) return;
    const boardAvg = totalDays / totalCount;
    const threshold = Math.max(7, Math.round(boardAvg * 1.5));
    board.stages.forEach((st) => {
      st.deals.forEach((d) => {
        if (d.days >= threshold) {
          st.stuckCount += 1;
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

  // ── Movements in last 24h ──
  const moved24h: MovedDeal[] = openDeals
    .filter((d: any) => {
      const t = Date.parse(d.stage_change_time || "");
      if (isNaN(t)) return false;
      return Date.now() - t < 86400000;
    })
    .map((d: any) => {
      const stage = stagesArr.find((s: any) => s.id === d.stage_id);
      const pipeline = pipelinesArr.find((p: any) => p.id === d.pipeline_id);
      return {
        id: d.id,
        title: d.title || `Deal ${d.id}`,
        value: Number(d.value || 0),
        url: `https://${domain}.pipedrive.com/deal/${d.id}`,
        ownerName: d.owner_name || "Unassigned",
        boardName: pipeline?.name || "Unknown",
        stageName: stage?.name || "Unknown",
      };
    })
    .sort((a, b) => b.value - a.value);

  // ── Aggregates ──
  const totalPipelineValue = openDeals.reduce((sum: number, d: any) => sum + Number(d.value || 0), 0);

  const mondayYMD = startOfWeekETIso();
  const todayYMD = easternYMD();
  const thirtyDaysAgoYMD = nDaysAgoEt(30);

  const wonThisWeekArr = wonDeals.filter((d: any) => isWithinIsoRange(d.won_time, mondayYMD, todayYMD));
  const wonThisWeek = wonThisWeekArr.length;
  const wonThisWeekValue = wonThisWeekArr.reduce((s: number, d: any) => s + Number(d.value || 0), 0);

  const wonLast30dArr = wonDeals.filter((d: any) => isWithinIsoRange(d.won_time, thirtyDaysAgoYMD, todayYMD));
  const wonLast30d = wonLast30dArr.length;

  const lostLast30dArr = lostDeals.filter((d: any) => isWithinIsoRange(d.lost_time, thirtyDaysAgoYMD, todayYMD));
  const lostLast30d = lostLast30dArr.length;
  const lostLast30dValue = lostLast30dArr.reduce((s: number, d: any) => s + Number(d.value || 0), 0);

  const cancellationDenom = wonLast30d + lostLast30d;
  const cancellationRate30d = cancellationDenom > 0
    ? Math.round((lostLast30d / cancellationDenom) * 1000) / 10  // one decimal
    : 0;

  const activitiesDueToday = activities.filter((a: any) => a.due_date === todayYMD).length;
  const activitiesOverdue = activities.filter((a: any) => isBeforeYMD(a.due_date, todayYMD)).length;
  const callsDueToday = activities.filter((a: any) => a.due_date === todayYMD && a.type === "call").length;

  const endToEndDays = Object.values(boardData)
    .filter((b) => b.totalDeals > 0)
    .reduce((sum, b) => sum + b.avgDays, 0);

  return {
    boardData,
    pipelines: pipelinesArr.map((p: any) => ({ id: p.id, name: p.name })),
    stalled,
    moved24h,
    totalActiveJobs: openDeals.length,
    totalPipelineValue,
    endToEndDays: Math.round(endToEndDays * 10) / 10,
    wonThisWeek, wonThisWeekValue, wonLast30d,
    lostLast30d, lostLast30dValue,
    cancellationRate30d,
    activitiesDueToday, activitiesOverdue, callsDueToday,
  };
}
