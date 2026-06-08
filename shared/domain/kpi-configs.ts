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

import type { KpiTag, PdField } from "./types.js";

// Canonical KPI defaults — union of frontend & cron previous versions
//
// IMPORTANT: every name here is also matched against the resolver's
// tryNamedAggregate switch. If a name matches there (e.g. "Total active jobs")
// the aggregate path wins and `sources: []` is the right thing. For source-
// driven KPIs, sources must reference real BOARDS keys and stage names.
export const KPI_INIT: KpiTag[] = [
  // Whole-pipeline aggregates — no source config needed
  { id: "k1",  name: "Total active jobs",        sources: [], fallback: "N/A", testResult: null },
  { id: "k2",  name: "Jobs completed this week", sources: [], fallback: "N/A", testResult: null },
  { id: "k3",  name: "Critical bottlenecks",     sources: [], fallback: "0",   testResult: null },
  { id: "k4",  name: "Revenue pipeline value",   sources: [], fallback: "N/A", testResult: null },
  { id: "k9",  name: "End-to-end pipeline days", sources: [], fallback: "N/A", testResult: null },
  { id: "k10", name: "Cancellation rate",        sources: [], fallback: "N/A", testResult: null },
  { id: "k11", name: "Pipeline value",           sources: [], fallback: "N/A", testResult: null }, // aggregate alias
  { id: "k12", name: "Funding pipeline value",   sources: [{ board: "Funding", scope: "board", stage: null, field: "deal.value" }], fallback: "N/A", testResult: null },
  // Retired aliases handled by KpiCatalog: "Pipeline deals active" -> "Total active jobs",
  // "Net metering backlog" -> "Net metering pending".
  { id: "k15", name: "Net metering pending",     sources: [{ board: "Net Metering", scope: "board", stage: null, field: "pipeline.deal_count" }], fallback: "0", testResult: null },
  { id: "k16", name: "R&R jobs active",          sources: [{ board: "R&R ", scope: "board", stage: null, field: "pipeline.deal_count" }], fallback: "0", testResult: null },
  { id: "k17", name: "Pending inspections",      sources: [{ board: "Inspection", scope: "board", stage: null, field: "pipeline.deal_count" }], fallback: "0", testResult: null },

  // Resolver-backed aggregates and aliases.
  { id: "k200", name: "Avg days to install",      sources: [], fallback: "N/A", testResult: null },
  { id: "k201", name: "Avg days per stage",       sources: [], fallback: "N/A", testResult: null },
  { id: "k202", name: "Welcome calls due today",  sources: [], fallback: "N/A", testResult: null },
  { id: "k203", name: "Thank you calls due",      sources: [], fallback: "N/A", testResult: null },
  { id: "k204", name: "Welcome calls due",        sources: [], fallback: "N/A", testResult: null },
  { id: "k205", name: "Welcome calls completed",  sources: [], fallback: "N/A", testResult: null },
  { id: "k206", name: "Welcome calls pending",    sources: [], fallback: "N/A", testResult: null },
  { id: "k207", name: "Overdue activities",       sources: [], fallback: "N/A", testResult: null },
  { id: "k208", name: "Board health overview",    sources: [], fallback: "N/A", testResult: null },
  { id: "k209", name: "KPI coverage rate",        sources: [], fallback: "N/A", testResult: null },
  { id: "k210", name: "Unmapped KPI tags",        sources: [], fallback: "N/A", testResult: null },
  { id: "k211", name: "M1/M2/M3 invoice status",  sources: [], fallback: "N/A", testResult: null },
  { id: "k212", name: "New deals this week",      sources: [], fallback: "N/A", testResult: null },
  { id: "k213", name: "Installs completed",       sources: [], fallback: "N/A", testResult: null },
  { id: "k214", name: "Funded this week",         sources: [], fallback: "N/A", testResult: null },
  { id: "k215", name: "Installs completed yesterday", sources: [], fallback: "N/A", testResult: null },
  { id: "k216", name: "Installs scheduled this week", sources: [], fallback: "N/A", testResult: null },
  { id: "k217", name: "Permits submitted this week", sources: [], fallback: "N/A", testResult: null },
  { id: "k218", name: "Sent to permitting today", sources: [], fallback: "N/A", testResult: null },
  { id: "k219", name: "NMA submitted this week", sources: [], fallback: "N/A", testResult: null },
  { id: "k220", name: "Service requests today",  sources: [], fallback: "N/A", testResult: null },
  { id: "k221", name: "Technicians scheduled today", sources: [], fallback: "N/A", testResult: null },
  { id: "k222", name: "Inspections scheduled today", sources: [], fallback: "N/A", testResult: null },

  // Stage-bound mappings — Engineering
  { id: "k5",  name: "Ready for engineering",    sources: [{ board: "Engineering", scope: "stage", stage: "Ready for Engineering ", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k20", name: "In revisions",             sources: [{ board: "Engineering", scope: "stage", stage: "Revisions", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k21", name: "Needs clarification",      sources: [{ board: "Engineering", scope: "stage", stage: "Needs Clarification", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k22", name: "Quality control queue",    sources: [{ board: "Engineering", scope: "stage", stage: "Quality Control ", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k23", name: "Post install revisions",   sources: [{ board: "Engineering", scope: "stage", stage: "Post Install Revisions", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k24", name: "Waiting on engineers",     sources: [{ board: "Engineering", scope: "stage", stage: "Waiting on Engineers", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k25", name: "Deals sent to engineering",sources: [{ board: "New Sale Board", scope: "stage", stage: "Sent to Engineering", field: "stage.deal_count" }], fallback: "0", testResult: null },

  // Scheduling/Coordinating
  { id: "k6",  name: "Installs scheduled today", sources: [{ board: "Scheduling/Coordinating", scope: "stage", stage: "Installation Scheduled", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k30", name: "Install not completed",    sources: [{ board: "Scheduling/Coordinating", scope: "stage", stage: "Install not completed", field: "stage.deal_count" }], fallback: "0", testResult: null },
  // Retired alias handled by KpiCatalog: "Material ordered pending" -> "Material orders pending".
  { id: "k32", name: "Material orders pending",  sources: [{ board: "Scheduling/Coordinating", scope: "stage", stage: "Material Ordered", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k33", name: "HOA approvals pending",    sources: [{ board: "Scheduling/Coordinating", scope: "stage", stage: "Pending HOA Approvals", field: "stage.deal_count" }], fallback: "0", testResult: null },
  // Retired alias handled by KpiCatalog: "HOA pending approvals" -> "HOA approvals pending".

  // Service
  { id: "k7",  name: "Service tickets open",     sources: [{ board: "Service Board", scope: "board", stage: null, field: "pipeline.deal_count" }], fallback: "0", testResult: null },
  { id: "k40", name: "Monitoring alerts",        sources: [{ board: "Service Board", scope: "stage", stage: "Monitoring", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k41", name: "Roof leaks open",          sources: [{ board: "Service Board", scope: "stage", stage: "Roof Leak", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k42", name: "Panel warranty claims",    sources: [{ board: "Service Board", scope: "stage", stage: "Panels Warrantys", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k43", name: "Warranty claims active",   sources: [{ board: "Service Board", scope: "stage", stage: "Panels Warrantys", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k44", name: "RMA submissions pending",  sources: [{ board: "Service Board", scope: "stage", stage: "Panels Warrantys", field: "stage.deal_count" }], fallback: "0", testResult: null },

  // Funding (M1 already exists as k8)
  { id: "k8",  name: "M1 invoices needed",       sources: [{ board: "Funding", scope: "stage", stage: "M1 Invoice needed", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k50", name: "M2 invoices needed",       sources: [{ board: "Funding", scope: "stage", stage: "M2 invoice needed", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k51", name: "M3 invoices needed",       sources: [{ board: "Funding", scope: "stage", stage: "M3 invoice needed", field: "stage.deal_count" }], fallback: "0", testResult: null },

  // Permitting
  { id: "k60", name: "Permits to submit today",  sources: [{ board: "Permitting", scope: "stage", stage: "Ready for Permitting", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k61", name: "Permits in revision",      sources: [{ board: "Permitting", scope: "stage", stage: "Revisions", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k62", name: "Awaiting approval",        sources: [{ board: "Permitting", scope: "stage", stage: "Permit Submitted", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k63", name: "Permit submitted calls due", sources: [{ board: "Permitting", scope: "stage", stage: "Permit Submitted", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k64", name: "Overdue permits",          sources: [{ board: "Permitting", scope: "board", stage: null, field: "calc.stuck_count" }], fallback: "0", testResult: null },

  // Inspection
  { id: "k70", name: "Inspections to schedule",  sources: [{ board: "Inspection", scope: "stage", stage: "Inspection Ready to Schedule", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k71", name: "Inspections scheduled",    sources: [{ board: "Inspection", scope: "stage", stage: "Inspection Scheduled", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k72", name: "Affidavits needed",        sources: [{ board: "Inspection", scope: "stage", stage: "Need affidavit ", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k73", name: "Failed inspections",       sources: [{ board: "Inspection", scope: "stage", stage: "Failed Inspection", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k74", name: "Passed inspections",       sources: [{ board: "Inspection", scope: "stage", stage: "Inspection Passed ", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k75", name: "Pending COC",              sources: [{ board: "Inspection", scope: "stage", stage: "Pend COC", field: "stage.deal_count" }], fallback: "0", testResult: null },

  // Net Metering
  { id: "k80", name: "NMA applications due",     sources: [{ board: "Net Metering", scope: "stage", stage: "Ready for Net Meter App", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k81", name: "Pending meter swaps",      sources: [{ board: "Net Metering", scope: "stage", stage: "Pending meter swap", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k82", name: "Transformer upgrades",     sources: [{ board: "Net Metering", scope: "stage", stage: "Transformer Upgrade", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k83", name: "Rejection follow-ups",     sources: [{ board: "Net Metering", scope: "stage", stage: "Rejections", field: "stage.deal_count" }], fallback: "0", testResult: null },

  // Completed Meter / PTO
  { id: "k90", name: "PTOs to audit today",      sources: [{ board: "Completed Meter Board", scope: "stage", stage: "Activation Package Submitted", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k91", name: "PTO calls due",            sources: [{ board: "Completed Meter Board", scope: "stage", stage: "PTO Call Completed", field: "stage.deal_count" }], fallback: "0", testResult: null },

  // New Sale / Customer Service
  { id: "k100", name: "Site surveys scheduled",  sources: [{ board: "New Sale Board", scope: "stage", stage: "Site Survey Scheduled", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k101", name: "Site surveys to schedule",sources: [{ board: "New Sale Board", scope: "stage", stage: "Brand new deal", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k102", name: "Site capture pending",    sources: [{ board: "New Sale Board", scope: "stage", stage: "Missing Site Survey Items", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k103", name: "Missing NTP count",       sources: [{ board: "New Sale Board", scope: "stage", stage: "Missing NTP", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k104", name: "NTP tracking active",     sources: [{ board: "New Sale Board", scope: "stage", stage: "Missing NTP", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k105", name: "Jobs on hold count",      sources: [
    { board: "Customer Service", scope: "stage", stage: "Job on hold", field: "stage.deal_count" },
    { board: "New Sale Board", scope: "stage", stage: "Job on hold", field: "stage.deal_count" },
  ], fallback: "0", testResult: null },

  // R&R extras
  { id: "k110", name: "R&R ready to schedule",   sources: [{ board: "R&R ", scope: "stage", stage: "Ready for Uninstall ", field: "stage.deal_count" }], fallback: "0", testResult: null },
  { id: "k111", name: "R&R uninstalls scheduled",sources: [{ board: "R&R ", scope: "stage", stage: "Uninstall Scheduled ", field: "stage.deal_count" }], fallback: "0", testResult: null },

  // Utility Disco
  { id: "k120", name: "MPU jobs active",         sources: [{ board: "Utility Disco ", scope: "stage", stage: "MPU and Shut off needed", field: "stage.deal_count" }], fallback: "0", testResult: null },

  // Cancellations
  { id: "k130", name: "Cancellations this week", sources: [{ board: "Cancellations", scope: "stage", stage: "New Cancelation", field: "stage.deal_count" }], fallback: "0", testResult: null },
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
