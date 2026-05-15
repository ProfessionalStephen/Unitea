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

import type { RoleConfig, Permission } from "./types";
import { BOARDS } from "./boards";

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
  "Owner": { color: COLOR.amber, boards: "all", region: "Both", nested: true, kpis: ["Total active jobs", "Jobs completed this week", "Revenue pipeline value", "Critical bottlenecks", "Cancellation rate", "Avg days to install", "Team utilization rate", "End-to-end pipeline days"], sendFreq: "daily" },
  "COO": { color: COLOR.amber, boards: "all", region: "Both", nested: true, kpis: ["Total active jobs", "Jobs completed this week", "Critical bottlenecks", "Avg days per stage", "Cancellation rate", "Pending inspections", "Net metering backlog", "Service tickets open"], sendFreq: "daily" },
  "VP of Operations": { color: COLOR.amber, boards: "all", region: "Both", nested: true, kpis: ["Total active jobs", "Jobs completed this week", "Critical bottlenecks", "Avg days per stage", "Cancellation rate", "Pending inspections", "Net metering backlog", "Service tickets open"], sendFreq: "daily" },
  "Office Manager": { color: COLOR.blue, boards: "all", region: "Both", nested: false, kpis: ["Welcome calls due today", "Thank you calls due", "Jobs on hold count", "Missing NTP count", "Overdue activities", "BBB complaints open"], sendFreq: "daily" },
  "Office Administrator": { color: COLOR.blue, boards: ["New Sale", "Funding"], region: "Both", nested: false, kpis: ["Timesheets pending", "PTO requests", "New hire onboarding", "Payroll items due"], sendFreq: "daily" },
  "Installation Manager": { color: COLOR.blue, boards: ["Customer Service", "New Sale", "Scheduling/Coordinating", "R&R"], region: "FL", nested: false, kpis: ["Installs scheduled today", "Installs completed yesterday", "Material ordered pending", "Install not completed", "HOA approvals pending", "R&R jobs active"], sendFreq: "daily" },
  "Warehouse Manager": { color: COLOR.blue, boards: ["Customer Service", "Scheduling/Coordinating", "R&R", "Inspection", "Net Metering", "Utility Disco"], region: "FL", nested: true, kpis: ["Material orders pending", "Installs scheduled this week", "R&R uninstalls scheduled", "Inspections scheduled", "Net metering pending"], sendFreq: "daily" },
  "Service Manager": { color: COLOR.blue, boards: ["Service", "Utility Disco"], region: "FL", nested: false, kpis: ["Service tickets open", "Technicians scheduled today", "MPU jobs active", "Roof leaks open", "Warranty claims active"], sendFreq: "daily" },
  "Service Coordinator": { color: COLOR.blue, boards: ["Service"], region: "FL", nested: false, kpis: ["Service requests today", "RMA submissions pending", "Panel warranty claims", "Monitoring alerts"], sendFreq: "daily" },
  "Engineering Coordinator": { color: COLOR.blue, boards: ["Engineering"], region: "FL", nested: false, kpis: ["Ready for engineering", "In revisions", "Needs clarification", "Quality control queue", "Post install revisions", "Waiting on engineers", "Sent to permitting today"], sendFreq: "daily" },
  "Permitting Coordinator": { color: COLOR.blue, boards: ["Permitting"], region: "FL", nested: false, kpis: ["Permits to submit today", "Permits submitted this week", "Permits in revision", "Awaiting approval", "Overdue permits"], sendFreq: "daily" },
  "Scheduling Coordinator": { color: COLOR.blue, boards: ["Scheduling/Coordinating", "R&R", "Inspection"], region: "FL", nested: false, kpis: ["Installs scheduled this week", "HOA pending approvals", "R&R ready to schedule", "Inspections to schedule", "Material orders pending"], sendFreq: "daily" },
  "Inspection Coordinator": { color: COLOR.blue, boards: ["Inspection"], region: "FL", nested: false, kpis: ["Inspections to schedule", "Inspections scheduled today", "Failed inspections", "Passed inspections", "Pending COC", "Affidavits needed"], sendFreq: "daily" },
  "Net Metering Coordinator": { color: COLOR.blue, boards: ["Net Metering", "Completed Meter"], region: "FL", nested: false, kpis: ["NMA applications due", "NMA submitted this week", "Pending meter swaps", "PTO calls due", "Transformer upgrades", "Rejection follow-ups"], sendFreq: "daily" },
  "Receptionist": { color: COLOR.blue, boards: ["Customer Service", "New Sale"], region: "FL", nested: false, kpis: ["Inbound calls today", "Welcome calls pending", "Enphase setups due", "Site capture pending"], sendFreq: "daily" },
  "President of Sales": { color: COLOR.amber, boards: ["New Sale", "R&R", "Scheduling/Coordinating", "Completed Meter"], region: "Both", nested: true, kpis: ["New deals this week", "Site surveys scheduled", "Deals sent to engineering", "Installs completed", "Funded this week", "Pipeline value", "Cancellation rate"], sendFreq: "daily" },
  "Sales Relations Manager": { color: COLOR.blue, boards: ["New Sale", "Cancellations"], region: "Both", nested: false, kpis: ["Pipeline deals active", "Escalated sales issues", "Cancellations this week"], sendFreq: "daily" },
  "Account Manager": { color: COLOR.blue, boards: ["New Sale", "Customer Service", "Permitting"], region: "Both", nested: false, kpis: ["Welcome calls due", "NOC filings pending", "Site surveys to schedule", "Permit submitted calls due", "Enerflo sync issues"], sendFreq: "daily" },
  "After Hours Account Manager": { color: COLOR.blue, boards: ["New Sale", "Customer Service"], region: "Both", nested: false, kpis: ["After hours calls received", "Site surveys scheduled", "Welcome calls completed"], sendFreq: "daily" },
  "Onboarding Coordinator": { color: COLOR.blue, boards: ["New Sale"], region: "Both", nested: false, kpis: ["New reps to onboard", "Offboarding pending", "Onboarding completed this week"], sendFreq: "daily" },
  "Accounting Manager": { color: COLOR.blue, boards: ["Funding"], region: "Both", nested: false, kpis: ["AP items due", "AR outstanding", "Reimbursements pending", "Commission discrepancies"], sendFreq: "daily" },
  "Commissions Coordinator": { color: COLOR.blue, boards: ["Funding", "Cancellations"], region: "Both", nested: false, kpis: ["Commissions to process", "QuotaPath sync issues", "Cancellation impact this week"], sendFreq: "daily" },
  "Director of Finance": { color: COLOR.amber, boards: ["Funding"], region: "Both", nested: true, kpis: ["Funding pipeline value", "Finance partner issues", "Distributor funding pending", "M1/M2/M3 invoice status"], sendFreq: "daily" },
  "Funding Coordinator": { color: COLOR.blue, boards: ["Funding", "Completed Meter"], region: "Both", nested: false, kpis: ["PTOs to audit today", "NTP tracking active", "Lightreach collections due", "M1 invoices needed", "M2 invoices needed", "M3 invoices needed"], sendFreq: "daily" },
  "AI Engineer": { color: COLOR.purple, boards: "all", region: "Both", nested: true, kpis: ["Total active jobs", "Critical bottlenecks", "Board health overview", "KPI coverage rate", "Unmapped KPI tags", "API connection status", "Feedback reports pending", "RALPH loop items"], sendFreq: "daily" },
  "AI Back-End Developer": { color: COLOR.purple, boards: "all", region: "Both", nested: true, kpis: ["API health status", "Webhook events today", "Baseline engine status", "Draft vs live status", "Audit log entries today", "Email delivery rate", "RALPH loop items"], sendFreq: "daily" },
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
