// ─────────────────────────────────────────────────────────────
// SHARED DOMAIN — KPI CONFIGURATIONS
// Default mappings for named KPIs. These define how a KPI name
// resolves to one or more Pipedrive data points.
//
// Frontend uses KPI_INIT as the initial state of useState(...) —
// users can edit mappings in the KpiMapping UI. Cron uses these
// same defaults at email-send time (UI edits don't persist yet).
//
// Whole-pipeline aggregates (e.g. "Total active jobs") need NO
// sources — the resolver handles them by name. KPIs that map to a
// specific board/stage need sources[] populated.
// ─────────────────────────────────────────────────────────────

import type { KpiTag, PdField } from "./types";

// Canonical KPI defaults — union of frontend & cron previous versions
export const KPI_INIT: KpiTag[] = [
  // Whole-pipeline aggregates — no source config needed
  { id: "k1",  name: "Total active jobs",        sources: [], fallback: "N/A", testResult: null },
  { id: "k2",  name: "Jobs completed this week", sources: [], fallback: "N/A", testResult: null },
  { id: "k3",  name: "Critical bottlenecks",     sources: [], fallback: "0",   testResult: null },
  { id: "k4",  name: "Revenue pipeline value",   sources: [], fallback: "N/A", testResult: null },
  { id: "k9",  name: "End-to-end pipeline days", sources: [], fallback: "N/A", testResult: null },
  { id: "k10", name: "Cancellation rate",        sources: [], fallback: "N/A", testResult: null },
  // Stage-bound mappings
  { id: "k5",  name: "Ready for engineering",    sources: [{ board: "Engineering", scope: "stage", stage: "Ready for Engineering", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k6",  name: "Installs scheduled today", sources: [{ board: "Scheduling/Coordinating", scope: "stage", stage: "Installation Scheduled", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k7",  name: "Service tickets open",     sources: [{ board: "Service", scope: "board", stage: null, field: "pipeline.deal_count" }], fallback: "0", testResult: null },
  { id: "k8",  name: "M1 invoices needed",       sources: [{ board: "Funding", scope: "stage", stage: "M1 Invoice needed", field: "stage.deal_count" }], fallback: "0", testResult: null },
];

// Pipedrive field schema — drives the dropdown in KpiMapping UI.
// `n` = technical id used in KpiSource.field. `d` = human description. `r` = return type label.
export const PD_FIELDS_FLAT: PdField[] = [
  { n: "deal.title",              d: "Name/title of the deal",          r: "String" },
  { n: "deal.status",             d: "open/won/lost/deleted",            r: "Enum" },
  { n: "deal.value",              d: "Monetary value",                    r: "Currency" },
  { n: "deal.add_time",           d: "When deal was created",             r: "Datetime" },
  { n: "deal.stage_change_time",  d: "When deal last moved stages",       r: "Datetime" },
  { n: "deal.rotten_time",        d: "When deal entered rotten status",   r: "Datetime" },
  { n: "deal.owner_name",         d: "Assigned user name",                r: "String" },
  { n: "deal.person_name",        d: "Contact person name",               r: "String" },
  { n: "activity.type",           d: "Type: call, email, meeting, task",  r: "Enum" },
  { n: "activity.due_date",       d: "When activity is due",              r: "Date" },
  { n: "activity.done",           d: "Whether completed",                  r: "Boolean" },
  { n: "activity.overdue",        d: "Past due and not done",              r: "Boolean" },
  { n: "person.name",             d: "Full name of contact",               r: "String" },
  { n: "person.phone",            d: "Phone number(s)",                    r: "Array" },
  { n: "person.email",            d: "Email address(es)",                  r: "Array" },
  { n: "person.address",          d: "Home/install address",               r: "String" },
  { n: "pipeline.deal_count",     d: "Total deals in pipeline",            r: "Integer" },
  { n: "stage.deal_count",        d: "Deals in stage",                     r: "Integer" },
  { n: "stage.avg_age_days",      d: "Avg days deals spend in stage",      r: "Float" },
  { n: "stage.rotten_flag",       d: "Stage has rotten deals",             r: "Boolean" },
  { n: "calc.days_in_stage",      d: "Days since deal entered current stage", r: "Integer" },
  { n: "calc.is_rotten",          d: "True if past rotting threshold",     r: "Boolean" },
  { n: "calc.stuck_count",        d: "Deals past rotting threshold",       r: "Integer" },
  { n: "calc.completion_rate",    d: "Won deals / total deals",            r: "Percentage" },
  { n: "calc.board_health_score", d: "Composite health score 0-100",       r: "Integer" },
];
