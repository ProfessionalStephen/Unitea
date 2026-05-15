// ─────────────────────────────────────────────────────────────
// SHARED KPI — RESOLVER
//
// Single deep function: resolveKpi(name, tag, view) → display string.
//
// Resolution strategy:
//   1. Whole-pipeline named aggregates (e.g. "Total active jobs") —
//      read directly from PipelineView. Source config not needed.
//   2. Otherwise, sum tag.sources[] against view.boards. Format by
//      field type. Use tag.fallback if no source matched.
//
// Adding a new aggregate KPI:
//   1. Add field to PipelineView (view.ts) + both adapters
//   2. Add case in resolveKpi() switch below
//
// Adding a new field handler (e.g. activity-based KPIs):
//   1. Add case in extractFromStage / extractFromBoard
//   2. KpiMapping UI dropdown (PD_FIELDS_FLAT) already exposes it
// ─────────────────────────────────────────────────────────────

import type { KpiTag } from "../domain/types";
import { KPI_INIT } from "../domain/kpi-configs";
import { RT } from "../domain/roles";
import type { PipelineView, NormStage, NormBoard } from "./view";

// ─── Formatters ──────────────────────────────────────────────
export function fmtMoneyCompact(n: number): string {
  if (!n || isNaN(n)) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}

// ─── App-internal aggregates ─────────────────────────────────
// Computed off the KPI registry itself, not Pipedrive. Stable across calls.

// Coverage: percent of role-listed KPI names that resolve to a real source.
// A KPI counts as covered if it's in KPI_INIT (source-driven OR aggregate name)
// or if it's handled by the tryNamedAggregate switch above. This function
// approximates the second by checking KPI_INIT presence — name-only aggregates
// like "Total active jobs" appear in KPI_INIT with sources: [].
function kpiCoverageRate(): string {
  const known = new Set(KPI_INIT.map((k) => k.name));
  const roleKpis = new Set<string>();
  for (const role of Object.keys(RT)) {
    for (const k of RT[role].kpis) roleKpis.add(k);
  }
  if (roleKpis.size === 0) return "0%";
  let hit = 0;
  for (const name of roleKpis) if (known.has(name)) hit += 1;
  return Math.round((hit / roleKpis.size) * 100) + "%";
}

function unmappedKpiCount(): number {
  const known = new Set(KPI_INIT.map((k) => k.name));
  const roleKpis = new Set<string>();
  for (const role of Object.keys(RT)) {
    for (const k of RT[role].kpis) roleKpis.add(k);
  }
  let miss = 0;
  for (const name of roleKpis) if (!known.has(name)) miss += 1;
  return miss;
}

// Summary like "M1: 3 | M2: 0 | M3: 1" — sourced from Funding board stages.
function m1m2m3Summary(view: PipelineView): string {
  const f = view.boards["Funding"];
  if (!f) return "—";
  const m1 = f.stages["M1 Invoice needed"]?.jobCount ?? 0;
  const m2 = f.stages["M2 invoice needed"]?.jobCount ?? 0;
  const m3 = f.stages["M3 invoice needed"]?.jobCount ?? 0;
  return `M1: ${m1} | M2: ${m2} | M3: ${m3}`;
}

// ─── Field extractors ────────────────────────────────────────
function extractFromStage(stage: NormStage, field: string): number | null {
  switch (field) {
    case "stage.deal_count":   return stage.jobCount;
    case "calc.stuck_count":   return stage.stuckCount;
    case "deal.value":         return stage.totalValue;
    case "stage.avg_age_days":
    case "calc.days_in_stage": return stage.avgDays;
    case "stage.rotten_flag":
    case "calc.is_rotten":     return stage.stuckCount > 0 ? 1 : 0;
    default: return null; // unmappable in current view
  }
}

function extractFromBoard(board: NormBoard, field: string): number | null {
  switch (field) {
    case "pipeline.deal_count":
    case "stage.deal_count":   return board.jobCount;
    case "calc.stuck_count":   return board.stuckCount;
    case "deal.value":         return board.totalValue;
    case "stage.avg_age_days":
    case "calc.days_in_stage": return board.avgDays;
    default: return null;
  }
}

// ─── Whole-pipeline named aggregates ─────────────────────────
// Returns a formatted string when name matches; null otherwise.
function tryNamedAggregate(name: string, view: PipelineView, fallback: string): string | null {
  switch (name) {
    case "Total active jobs":
    case "Pipeline deals active":
      return String(view.totalActiveJobs);

    case "End-to-end pipeline days":  return view.endToEndDays > 0 ? view.endToEndDays + "d" : fallback;

    case "Critical bottlenecks":
    case "Board health overview":
      return String(view.bottlenecksCount);

    case "Revenue pipeline value":
    case "Pipeline value":
      return view.totalPipelineValue > 0 ? fmtMoneyCompact(view.totalPipelineValue) : fallback;

    case "Jobs completed this week":
    case "Installs completed":
    case "Funded this week":
    case "New deals this week":
      return String(view.wonThisWeek);

    case "Cancellation rate":
      return view.lostLast30d + view.wonThisWeek > 0
        ? view.cancellationRate30d + "%"
        : fallback;

    case "Avg days to install":
    case "Avg days per stage":
      return view.endToEndDays > 0 ? view.endToEndDays + "d (approx)" : fallback;

    case "Overdue activities":        return String(view.activitiesOverdue);

    case "Welcome calls due today":
    case "Thank you calls due":
    case "Welcome calls due":
    case "Welcome calls completed":
    case "Welcome calls pending":
      return view.callsDueToday + " calls today";

    // App-internal aggregates over the resolver/config itself.
    // Computed from KPI_INIT — bounded, predictable, no Pipedrive call needed.
    case "KPI coverage rate":         return kpiCoverageRate();
    case "Unmapped KPI tags":         return String(unmappedKpiCount());
    case "M1/M2/M3 invoice status":   return m1m2m3Summary(view);

    // Cycle 5 — time-window aggregates from pullPipedrive
    case "Installs completed yesterday":  return String(view.installsCompletedYesterday);
    case "Installs scheduled this week":  return String(view.installsScheduledThisWeek);
    case "Permits submitted this week":   return String(view.permitsSubmittedThisWeek);
    case "Sent to permitting today":      return String(view.sentToPermittingToday);
    case "NMA submitted this week":       return String(view.nmaSubmittedThisWeek);
    case "Service requests today":        return String(view.serviceRequestsToday);
    case "Technicians scheduled today":   return String(view.techniciansScheduledToday);
    case "Inspections scheduled today":   return String(view.inspectionsScheduledToday);

    default: return null;
  }
}

// ─── Main entry point ────────────────────────────────────────
export function resolveKpi(
  name: string,
  tag: KpiTag | undefined,
  view: PipelineView,
): string {
  const fallback = tag?.fallback || "—";

  // 1. Whole-pipeline aggregates take precedence — name-keyed, no source config
  const aggregate = tryNamedAggregate(name, view, fallback);
  if (aggregate !== null) return aggregate;

  // 2. Source-driven resolution
  if (!tag || !tag.sources || tag.sources.length === 0) return fallback;

  let total = 0;
  let anyMapped = false;
  const firstField = tag.sources[0].field;

  for (const src of tag.sources) {
    const board = view.boards[src.board];
    if (!board) continue;
    let v: number | null = null;
    if (src.scope === "board") {
      v = extractFromBoard(board, src.field);
    } else if (src.scope === "stage" && src.stage) {
      const stage = board.stages[src.stage];
      if (stage) v = extractFromStage(stage, src.field);
    }
    if (v != null) {
      total += v;
      anyMapped = true;
    }
  }
  if (!anyMapped) return fallback;

  // 3. Format per field type
  if (firstField === "deal.value") return fmtMoneyCompact(total);
  if (firstField === "stage.avg_age_days" || firstField === "calc.days_in_stage") {
    return (total / tag.sources.length).toFixed(1) + "d";
  }
  if (firstField === "stage.rotten_flag" || firstField === "calc.is_rotten") {
    return total > 0 ? "Yes" : "No";
  }
  return String(Math.round(total));
}
