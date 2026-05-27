// ─────────────────────────────────────────────────────────────
// SHARED DOMAIN — BOARDS
//
// CRITICAL: every pipeline name and stage name below is a strict
// byte-for-byte mirror of what exists in unicitysolar.pipedrive.com
// as of 2026-05-26. This includes trailing spaces, lowercase letters,
// and apparent typos. THEY ARE INTENTIONAL — do not "clean up"
// without first confirming the Pipedrive UI has been edited to match.
//
// See docs/adr/ADR-003-strict-pipedrive-mirror.md for the decision
// rationale.
//
// Suspicious-looking strings are tagged with [SIC] in a comment.
//
// Each board has:
//   - region: which install region the board belongs to
//   - stages: ordered list of stage names
//   - rotting: per-stage day threshold; a deal past this is "stuck"
// ─────────────────────────────────────────────────────────────

import type { BoardConfig } from "./types.js";

export const BOARDS: Record<string, BoardConfig> = {
  "Customer Service": {
    region: "FL",
    stages: [
      "Ready for Welcome Call",
      "Job on hold",
      "Welcome Call Complete",
      "Thank You Call - Install Complete ", // [SIC] trailing space in PD
    ],
    rotting: { "Ready for Welcome Call": 1, "Job on hold": 1 },
  },

  "New Sale Board": { // [SIC] PD pipeline literally named "New Sale Board"
    region: "FL",
    stages: [
      "Brand new deal", // [SIC] lowercase 'n' and 'd' in PD
      "Missing NTP",
      "Missing Site Survey Items",
      "Site Survey Scheduled",
      "Job on hold",
      "Sent to Engineering",
    ],
    rotting: {
      "Brand new deal": 1,
      "Missing NTP": 1,
      "Missing Site Survey Items": 1,
      "Site Survey Scheduled": 1,
      "Job on hold": 1,
      "Sent to Engineering": 1,
    },
  },

  "Engineering": {
    region: "FL",
    stages: [
      "Ready for Engineering ", // [SIC] trailing space
      "Revisions",
      "Needs Clarification",
      "Quality Control ", // [SIC] trailing space
      "Post Install Revisions",
      "Waiting on Engineers",
      "Sent to Permitting ", // [SIC] trailing space
    ],
    rotting: {
      "Ready for Engineering ": 1,
      "Needs Clarification": 1,
      "Post Install Revisions": 1,
      "Waiting on Engineers": 1,
      "Sent to Permitting ": 1,
    },
  },

  "Permitting": {
    region: "FL",
    stages: [
      "Ready for Permitting",
      "Permit App Drop Off Needed", // added in PD since codebase last synced
      "Needs Install Date/ UB", // added in PD since codebase last synced — note space after slash
      "On Hold/ Missing Items", // [SIC] extra space after slash
      "Needs PP Plan Review St. Pete, Marion, Hernando, Pinellas, Volusia", // PD long-form name
      "Permit Submitted needs Meter Pre-Approval GRU/FPL/Clay Electric", // PD long-form name
      "Permit Submitted",
      "Revisions",
      "Hopeful check for NTP", // [SIC] lowercase 'c'
      "Permit Approved",
    ],
    rotting: {
      "On Hold/ Missing Items": 2,
      "Permit Submitted needs Meter Pre-Approval GRU/FPL/Clay Electric": 5,
      "Permit Submitted": 10,
    },
  },

  "Utility Disco ": { // [SIC] trailing space in PD pipeline name
    region: "FL",
    stages: [
      "MPU and Shut off needed",
      "Pending confirmation",
      "Permit has been requested",
      "Permit approved ready to schedule ", // [SIC] trailing space
      "Scheduled Disco",
      "Scheduled Inspection",
      "Commission",
      "Done ", // [SIC] trailing space
    ],
    rotting: {},
  },

  "R&R ": { // [SIC] trailing space in PD pipeline name
    region: "FL",
    stages: [
      "RandR requested/ Docs", // [SIC] "RandR" not "R&R" in this stage name, plus extra space after slash
      "On Hold ", // [SIC] trailing space
      "Reengineering ", // [SIC] trailing space
      "Repermitting ", // [SIC] trailing space
      "Ready for Uninstall ", // [SIC] trailing space + capital U
      "Uninstall Scheduled ", // [SIC] trailing space
      "Ready for Reinstall ", // [SIC] trailing space
      "Reinstall Scheduled ", // [SIC] trailing space
      "Ready for inspection",
      "Inspection Scheduled",
      "Job complete ", // [SIC] trailing space
    ],
    rotting: {},
  },

  "Scheduling/Coordinating": {
    region: "FL",
    stages: [
      "Ready to Schedule Florida",
      "Pending HOA Approvals",
      "On hold missing items ", // [SIC] trailing space
      "Job on hold pending Roof",
      "Installation Scheduled",
      "Material Ordered",
      "Install not completed",
      "Installation Completed",
      "Paid",
    ],
    rotting: {
      "Ready to Schedule Florida": 2,
      "Pending HOA Approvals": 2,
      "Job on hold pending Roof": 14,
      "Installation Scheduled": 1,
      "Material Ordered": 3,
      "Install not completed": 1,
    },
  },

  "California": {
    region: "CA",
    stages: [
      "Brand new deal", // [SIC] lowercase in PD
      "SS Scheduled",
      "Engineering",
      "Permitting",
      "Ready to Schedule",
      "Ready for Material Order",
      "Install Scheduled",
      "Install Completed",
      "Funded",
      "Inspections",
      "Utility Disconnect Needed",
      "Net Metering",
      "PTO",
      "Rep trying to save",
    ],
    rotting: {
      "SS Scheduled": 1,
      "Engineering": 1,
      "Permitting": 1,
      "Ready to Schedule": 1,
      "Ready for Material Order": 1,
      "Install Scheduled": 1,
    },
  },

  "Inspection": {
    region: "FL",
    stages: [
      "Inspection Ready to Schedule",
      "Insp Needs Tech ", // [SIC] trailing space
      "Need affidavit ", // [SIC] trailing space
      "pend Utility/Elec", // [SIC] lowercase 'p'
      "Need to Sched with BD",
      "Scheduled with PP",
      "Inspection Scheduled",
      "Waiting on Revision",
      "Failed Inspection",
      "Pend COC",
      "COC Uploaded",
      "Inspection Passed ", // [SIC] trailing space
    ],
    rotting: {
      "Inspection Ready to Schedule": 2,
      "Need affidavit ": 3,
      "pend Utility/Elec": 7,
      "Inspection Scheduled": 5,
    },
  },

  "Net Metering": {
    region: "FL",
    stages: [
      "Ready for Net Meter App", // renamed in PD (was "Ready for New Meter App")
      "Missing Tier 2/Bill/Placard/etc", // PD has "/etc" suffix
      "NMA sent to Customer",
      "NMA submitted to Utility",
      "Transformer Upgrade",
      "Rejections",
      "Pending meter swap",
      "Meter Installed",
    ],
    rotting: {
      "Ready for Net Meter App": 1,
      "Missing Tier 2/Bill/Placard/etc": 1,
      "NMA sent to Customer": 1,
      "NMA submitted to Utility": 5,
      "Transformer Upgrade": 7,
      "Rejections": 1,
      "Pending meter swap": 7,
    },
  },

  "Service Board": { // [SIC] PD pipeline literally named "Service Board"
    region: "FL",
    stages: [
      "Service Needed",
      "Urgent (Next Day Service/Follow Up)", // added in PD since codebase last synced
      "Panels Warrantys", // [SIC] PD has the typo "Warrantys" (extra 's')
      "Follow Up",
      "Monitoring",
      "Roof Leak",
      "Added to WIW ", // [SIC] trailing space
      "Service Scheduled",
      "Work Completed",
    ],
    rotting: {
      "Service Needed": 1,
      "Panels Warrantys": 5,
      "Follow Up": 1,
      "Monitoring": 1,
      "Roof Leak": 2,
      "Added to WIW ": 5,
      "Service Scheduled": 2,
    },
  },

  "Cancellations": {
    region: "FL",
    stages: [
      "Rep trying to save",
      "On Hold SR request ", // [SIC] lowercase 'r' + trailing space
      "New Cancelation", // [SIC] PD has the typo "Cancelation" (missing 'l')
      "Ready for Retention",
      "Cancelled before Engineering",
      "Cancelled after Engineering",
      "Cancellation Processed",
    ],
    rotting: { "On Hold SR request ": 30 },
  },

  "Funding": {
    region: "FL",
    stages: [
      "M1 Invoice needed",
      "M1 added to prep sheet",
      "M1 invoice sent",
      "M2 invoice needed",
      "M2 prepped",
      "M2 invoice sent",
      "M3 invoice needed",
      "M3 prepped",
      "M3 invoice sent",
    ],
    rotting: { "M1 Invoice needed": 1, "M2 invoice needed": 2 },
  },

  "System Monitoring": {
    region: "FL",
    stages: ["Needs Array Built", "Array Built"],
    rotting: {},
  },

  "Warranty Board": { // [SIC] PD pipeline literally named "Warranty Board"
    region: "FL",
    stages: ["Warranty Needed", "Job Completed"],
    rotting: {},
  },

  "Completed Meter Board": { // [SIC] PD pipeline literally named "Completed Meter Board"
    region: "FL",
    stages: [
      "PTO Call Completed",
      "Activation Package Submitted", // renamed in PD (was "PTO Submitted")
      "Activation Approved/PTO Paid", // renamed in PD (was "PTO Paid")
      "Post-PTO Work Completed",
    ],
    rotting: {},
  },

  "Work Completed Not US customer ": { // [SIC] lowercase 'c' + trailing space in PD pipeline name
    region: "FL",
    stages: ["Work Completed Not US customer "], // [SIC] same string
    rotting: {},
  },
};

export const INDUSTRY_BENCHMARK_DAYS = 120;
