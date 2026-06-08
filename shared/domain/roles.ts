// ─────────────────────────────────────────────────────────────
// SHARED DOMAIN — ROLES, PERMISSIONS, ADMIN
// Roles define what KPIs each team member sees and which boards
// drive their briefing. Permissions gate UI features.
//
// Adding a role:
//   1. Define entry in RT below (color, boards, region, nested, kpis)
//   2. (optional) add to PERMISSIONS for any features they should access
//
// Adding a permission: add to PERMISSIONS map; reference via canAccess()
// ─────────────────────────────────────────────────────────────

import type { RoleConfig, Permission } from "./types.js";
import { BOARDS } from "./boards.js";

// Role badge color tokens — keep in sync with C constant in frontend
const COLOR = {
  amber: "#F59E0B",
  blue: "#1D6FB5",
  purple: "#A855F7",
};

// Admin emails — see Setup, Send, Audit, RALPH tabs in frontend.
// Non-admins see only Team, Boards, Intelligence, Preview.
export const ADMIN_EMAILS = ["stephen@unicityhome.com", "aparis@unicitysolar.com"];

export const PERMISSIONS: Record<Permission, string[]> = {
  repData: ["Owner", "COO", "VP of Operations", "President of Sales", "AI Engineer", "AI Back-End Developer"],
  nestedEmail: ["Owner", "COO", "VP of Operations", "President of Sales", "Director of Finance", "AI Engineer", "AI Back-End Developer", "Warehouse Manager"],
  boardEdit: ["AI Engineer", "AI Back-End Developer"],
  auditAccess: ["AI Engineer", "AI Back-End Developer"],
  analyticsDeep: ["Owner", "COO", "VP of Operations", "President of Sales", "Director of Finance", "AI Engineer", "AI Back-End Developer"],
};

export function canAccess(role: string, feature: Permission): boolean {
  return (PERMISSIONS[feature] || []).indexOf(role) >= 0;
}

export const RT: Record<string, RoleConfig> = {
  "Owner": { color: COLOR.amber, boards: "all", region: "Both", nested: true, kpis: ["Total active jobs", "Jobs completed this week", "Revenue pipeline value", "Critical bottlenecks", "Cancellation rate", "Avg days to install", "End-to-end pipeline days"], sendFreq: "daily" },
  "COO": { color: COLOR.amber, boards: "all", region: "Both", nested: true, kpis: ["Total active jobs", "Jobs completed this week", "Critical bottlenecks", "Avg days per stage", "Cancellation rate", "Pending inspections", "Net metering pending", "Service tickets open"], sendFreq: "daily" },
  "VP of Operations": { color: COLOR.amber, boards: "all", region: "Both", nested: true, kpis: ["Total active jobs", "Jobs completed this week", "Critical bottlenecks", "Avg days per stage", "Cancellation rate", "Pending inspections", "Net metering pending", "Service tickets open"], sendFreq: "daily" },
  "Office Manager": { color: COLOR.blue, boards: "all", region: "Both", nested: false, kpis: ["Welcome calls due today", "Thank you calls due", "Jobs on hold count", "Missing NTP count", "Overdue activities"], sendFreq: "daily" },
  // Office Administrator: original KPIs were all HR/payroll (non-Pipedrive).
  // Substituted with Pipedrive-backed equivalents relevant to the New Sale + Funding boards.
  "Office Administrator": { color: COLOR.blue, boards: ["New Sale Board", "Funding"], region: "Both", nested: false, kpis: ["Funding pipeline value", "M1 invoices needed", "M2 invoices needed", "Missing NTP count", "Cancellations this week"], sendFreq: "daily" },
  "Installation Manager": { color: COLOR.blue, boards: ["Customer Service", "New Sale Board", "Scheduling/Coordinating", "R&R "], region: "FL", nested: false, kpis: ["Installs scheduled today", "Installs completed yesterday", "Material orders pending", "Install not completed", "HOA approvals pending", "R&R jobs active"], sendFreq: "daily" },
  "Warehouse Manager": { color: COLOR.blue, boards: ["Customer Service", "Scheduling/Coordinating", "R&R ", "Inspection", "Net Metering", "Utility Disco "], region: "FL", nested: true, kpis: ["Material orders pending", "Installs scheduled this week", "R&R uninstalls scheduled", "Inspections scheduled", "Net metering pending"], sendFreq: "daily" },
  "Service Manager": { color: COLOR.blue, boards: ["Service Board", "Utility Disco "], region: "FL", nested: false, kpis: ["Service tickets open", "Technicians scheduled today", "MPU jobs active", "Roof leaks open", "Warranty claims active"], sendFreq: "daily" },
  "Service Coordinator": { color: COLOR.blue, boards: ["Service Board"], region: "FL", nested: false, kpis: ["Service requests today", "RMA submissions pending", "Panel warranty claims", "Monitoring alerts"], sendFreq: "daily" },
  "Engineering Coordinator": { color: COLOR.blue, boards: ["Engineering"], region: "FL", nested: false, kpis: ["Ready for engineering", "In revisions", "Needs clarification", "Quality control queue", "Post install revisions", "Waiting on engineers", "Sent to permitting today"], sendFreq: "daily" },
  "Permitting Coordinator": { color: COLOR.blue, boards: ["Permitting"], region: "FL", nested: false, kpis: ["Permits to submit today", "Permits submitted this week", "Permits in revision", "Awaiting approval", "Overdue permits"], sendFreq: "daily" },
  "Scheduling Coordinator": { color: COLOR.blue, boards: ["Scheduling/Coordinating", "R&R ", "Inspection"], region: "FL", nested: false, kpis: ["Installs scheduled this week", "HOA approvals pending", "R&R ready to schedule", "Inspections to schedule", "Material orders pending"], sendFreq: "daily" },
  "Inspection Coordinator": { color: COLOR.blue, boards: ["Inspection"], region: "FL", nested: false, kpis: ["Inspections to schedule", "Inspections scheduled today", "Failed inspections", "Passed inspections", "Pending COC", "Affidavits needed"], sendFreq: "daily" },
  "Net Metering Coordinator": { color: COLOR.blue, boards: ["Net Metering", "Completed Meter Board"], region: "FL", nested: false, kpis: ["NMA applications due", "NMA submitted this week", "Pending meter swaps", "PTO calls due", "Transformer upgrades", "Rejection follow-ups"], sendFreq: "daily" },
  // Receptionist: dropped "Inbound calls today" (telephony) and "Enphase setups due" (Enphase, not PD).
  "Receptionist": { color: COLOR.blue, boards: ["Customer Service", "New Sale Board"], region: "FL", nested: false, kpis: ["Welcome calls pending", "Site capture pending"], sendFreq: "daily" },
  "President of Sales": { color: COLOR.amber, boards: ["New Sale Board", "R&R ", "Scheduling/Coordinating", "Completed Meter Board"], region: "Both", nested: true, kpis: ["New deals this week", "Site surveys scheduled", "Deals sent to engineering", "Installs completed", "Funded this week", "Pipeline value", "Cancellation rate"], sendFreq: "daily" },
  // Sales Relations Manager: dropped "Escalated sales issues" (no PD source).
  "Sales Relations Manager": { color: COLOR.blue, boards: ["New Sale Board", "Cancellations"], region: "Both", nested: false, kpis: ["Total active jobs", "Cancellations this week"], sendFreq: "daily" },
  // Account Manager: dropped "Enerflo sync issues" and "NOC filings pending".
  "Account Manager": { color: COLOR.blue, boards: ["New Sale Board", "Customer Service", "Permitting"], region: "Both", nested: false, kpis: ["Welcome calls due", "Site surveys to schedule", "Permit submitted calls due"], sendFreq: "daily" },
  // After Hours AM: dropped "After hours calls received", "Inbound calls today".
  "After Hours Account Manager": { color: COLOR.blue, boards: ["New Sale Board", "Customer Service"], region: "Both", nested: false, kpis: ["Site surveys scheduled", "Welcome calls completed"], sendFreq: "daily" },
  // Onboarding Coordinator: original KPIs were all HR. Substituted w/ New Sale board equivalents.
  "Onboarding Coordinator": { color: COLOR.blue, boards: ["New Sale Board"], region: "Both", nested: false, kpis: ["New deals this week", "Site surveys scheduled", "Site surveys to schedule", "Missing NTP count", "Deals sent to engineering"], sendFreq: "daily" },
  // Accounting Manager: original KPIs were all Accounting. Substituted w/ Funding board.
  "Accounting Manager": { color: COLOR.blue, boards: ["Funding"], region: "Both", nested: false, kpis: ["Funding pipeline value", "M1 invoices needed", "M2 invoices needed", "M3 invoices needed"], sendFreq: "daily" },
  // Commissions Coordinator: dropped "Commissions to process", "QuotaPath sync issues". "Cancellation impact this week" maps to existing cancellations stage.
  "Commissions Coordinator": { color: COLOR.blue, boards: ["Funding", "Cancellations"], region: "Both", nested: false, kpis: ["Cancellations this week"], sendFreq: "daily" },
  // Director of Finance: dropped "Finance partner issues", "Distributor funding pending".
  "Director of Finance": { color: COLOR.amber, boards: ["Funding"], region: "Both", nested: true, kpis: ["Funding pipeline value", "M1/M2/M3 invoice status"], sendFreq: "daily" },
  // Funding Coordinator: dropped "Lightreach collections due".
  "Funding Coordinator": { color: COLOR.blue, boards: ["Funding", "Completed Meter Board"], region: "Both", nested: false, kpis: ["PTOs to audit today", "NTP tracking active", "M1 invoices needed", "M2 invoices needed", "M3 invoices needed"], sendFreq: "daily" },
  // AI Engineer: dropped "API connection status", "Feedback reports pending", "RALPH loop items".
  // Kept "Board health overview", "KPI coverage rate", "Unmapped KPI tags" — all now resolver-aggregate.
  "AI Engineer": { color: COLOR.purple, boards: "all", region: "Both", nested: true, kpis: ["Total active jobs", "Critical bottlenecks", "Board health overview", "KPI coverage rate", "Unmapped KPI tags"], sendFreq: "daily" },
  // AI Back-End Developer: all original KPIs were internal app-state. Substituted with engineering-quality aggregates.
  "AI Back-End Developer": { color: COLOR.purple, boards: "all", region: "Both", nested: true, kpis: ["Total active jobs", "Critical bottlenecks", "KPI coverage rate", "Unmapped KPI tags"], sendFreq: "daily" },
};

// Boards for a role — "all" expands to every defined board.
export function boardsForRole(role: string): string[] {
  const t = RT[role];
  if (!t) return Object.keys(BOARDS);
  return t.boards === "all" ? Object.keys(BOARDS) : t.boards;
}

// KPI list for a role.
export function kpisForRole(role: string): string[] {
  return RT[role] ? RT[role].kpis : [];
}
