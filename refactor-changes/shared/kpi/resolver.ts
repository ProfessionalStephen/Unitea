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
import type { PipelineView, NormStage, NormBoard } from "./view";

// ─── Formatters ──────────────────────────────────────────────
export function fmtMoneyCompact(n: number): string {
  if (!n || isNaN(n)) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
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
    case "Total active jobs":         return String(view.totalActiveJobs);
    case "End-to-end pipeline days":  return view.endToEndDays > 0 ? view.endToEndDays + "d" : fallback;
    case "Critical bottlenecks":      return String(view.bottlenecksCount);

    case "Revenue pipeline value":
    case "Pipeline value":
    case "Funding pipeline value":
      return view.totalPipelineValue > 0 ? fmtMoneyCompact(view.totalPipelineValue) : fallback;

    case "Jobs completed this week":
    case "Installs completed":
    case "Funded this week":
      return String(view.wonThisWeek);

    case "Cancellation rate":
      return view.lostLast30d + view.wonThisWeek > 0
        ? view.cancellationRate30d + "%"
        : fallback;

    case "Avg days to install":
      return view.endToEndDays > 0 ? view.endToEndDays + "d (approx)" : fallback;

    case "Overdue activities":        return String(view.activitiesOverdue);

    case "Welcome calls due today":
    case "Thank you calls due":
    case "Welcome calls due":
    case "Welcome calls completed":
    case "Welcome calls pending":
      return view.callsDueToday + " calls today";

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
