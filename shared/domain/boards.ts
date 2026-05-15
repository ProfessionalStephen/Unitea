// ─────────────────────────────────────────────────────────────
// SHARED DOMAIN — BOARDS
// Canonical pipeline schema. Pipedrive pipeline names MUST match
// these keys for KPI resolution and board health to work.
//
// Each board has:
//   - region: which install region the board belongs to
//   - stages: ordered list of stage names
//   - rotting: per-stage day threshold; a deal past this is "stuck"
// ─────────────────────────────────────────────────────────────

import type { BoardConfig } from "./types";

export const BOARDS: Record<string, BoardConfig> = {
  "Customer Service": { region: "FL", stages: ["Ready for Welcome Call", "Job on hold", "Welcome Call Complete", "Thank You Call - Install Complete"], rotting: { "Ready for Welcome Call": 1, "Job on hold": 1 } },
  "New Sale": { region: "FL", stages: ["Brand New Deal", "Missing NTP", "Missing Site Survey Items", "Site Survey Scheduled", "Job on hold", "Sent to Engineering"], rotting: { "Brand New Deal": 1, "Missing NTP": 1, "Missing Site Survey Items": 1, "Site Survey Scheduled": 1, "Job on hold": 1, "Sent to Engineering": 1 } },
  "Engineering": { region: "FL", stages: ["Ready for Engineering", "Revisions", "Needs Clarification", "Quality Control", "Post Install Revisions", "Waiting on Engineers", "Sent to Permitting"], rotting: { "Ready for Engineering": 1, "Needs Clarification": 1, "Post Install Revisions": 1, "Waiting on Engineers": 1, "Sent to Permitting": 1 } },
  "Permitting": { region: "FL", stages: ["Ready for Permitting", "On Hold/Missing Items", "Needs PP Plan Review", "Permit Submitted - Meter Pre-Approval", "Permit Submitted", "Revisions", "Hopeful Check for NTP", "Permit Approved"], rotting: { "On Hold/Missing Items": 2, "Permit Submitted - Meter Pre-Approval": 5, "Permit Submitted": 10 } },
  "Utility Disco": { region: "FL", stages: ["MPU and Shut off needed", "Pending confirmation", "Permit has been requested", "Permit approved ready to schedule", "Scheduled Disco", "Scheduled Inspection", "Commission", "Done"], rotting: {} },
  "R&R": { region: "FL", stages: ["R&R requested/Docs", "On Hold", "Reengineering", "Repermitting", "Ready for uninstall", "Uninstall Scheduled", "Ready for Reinstall", "Reinstall Scheduled", "Ready for inspection", "Inspection Scheduled", "Job complete"], rotting: {} },
  "Scheduling/Coordinating": { region: "FL", stages: ["Ready to Schedule Florida", "Pending HOA Approvals", "On hold missing items", "Job on hold pending Roof", "Installation Scheduled", "Material Ordered", "Install not completed", "Installation Completed", "Paid"], rotting: { "Ready to Schedule Florida": 2, "Pending HOA Approvals": 2, "Job on hold pending Roof": 14, "Installation Scheduled": 1, "Material Ordered": 3, "Install not completed": 1 } },
  "California": { region: "CA", stages: ["Brand New Deal", "SS Scheduled", "Engineering", "Permitting", "Ready to Schedule", "Ready for Material Order", "Install Scheduled", "Install Completed", "Funded", "Inspections", "Utility Disconnect Needed", "Net Metering", "PTO", "Rep trying to save"], rotting: { "SS Scheduled": 1, "Engineering": 1, "Permitting": 1, "Ready to Schedule": 1, "Ready for Material Order": 1, "Install Scheduled": 1 } },
  "Inspection": { region: "FL", stages: ["Inspection Ready to Schedule", "Insp Needs Tech", "Need affidavit", "Pend Utility/Elec", "Need to Sched with BD", "Scheduled with PP", "Inspection Scheduled", "Waiting on Revision", "Failed Inspection", "Pend COC", "COC Uploaded", "Inspection Passed"], rotting: { "Inspection Ready to Schedule": 2, "Need affidavit": 3, "Pend Utility/Elec": 7, "Inspection Scheduled": 5 } },
  "Net Metering": { region: "FL", stages: ["Ready for New Meter App", "Missing Tier 2/Bill/Placard", "NMA sent to Customer", "NMA submitted to Utility", "Transformer Upgrade", "Rejections", "Pending meter swap", "Meter Installed"], rotting: { "Ready for New Meter App": 1, "Missing Tier 2/Bill/Placard": 1, "NMA sent to Customer": 1, "NMA submitted to Utility": 5, "Transformer Upgrade": 7, "Rejections": 1, "Pending meter swap": 7 } },
  "Service": { region: "FL", stages: ["Service Needed", "Panels Warranty", "Follow Up", "Monitoring", "Roof Leak", "Added to WIW", "Service Scheduled", "Work Completed"], rotting: { "Service Needed": 1, "Panels Warranty": 5, "Follow Up": 1, "Monitoring": 1, "Roof Leak": 2, "Added to WIW": 5, "Service Scheduled": 2 } },
  "Cancellations": { region: "FL", stages: ["Rep trying to save", "On Hold SR Request", "New Cancellation", "Ready for Retention", "Cancelled before Engineering", "Cancelled after Engineering", "Cancellation Processed"], rotting: { "On Hold SR Request": 30 } },
  "Funding": { region: "FL", stages: ["M1 Invoice needed", "M1 added to prep sheet", "M1 invoice sent", "M2 invoice needed", "M2 prepped", "M2 invoice sent", "M3 invoice needed", "M3 prepped", "M3 invoice sent"], rotting: { "M1 Invoice needed": 1, "M2 invoice needed": 2 } },
  "System Monitoring": { region: "FL", stages: ["Needs Array Built", "Array Built"], rotting: {} },
  "Warranty": { region: "FL", stages: ["Warranty Needed", "Job Completed"], rotting: {} },
  "Completed Meter": { region: "FL", stages: ["PTO Call Completed", "PTO Submitted", "PTO Paid", "Post-PTO Work Completed"], rotting: {} },
  "Work Completed Not US Customer": { region: "FL", stages: ["Work Completed Not US Customer"], rotting: {} },
};

export const INDUSTRY_BENCHMARK_DAYS = 120;
