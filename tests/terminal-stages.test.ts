import { describe, it, expect } from "vitest";
import { terminalStageIds } from "../shared/domain/terminal-stages.js";

// Terminal (completed) stages must drop out of "active jobs". This mirrors the solar pipeline's
// single source of truth. Names below include the real CRM drift (trailing spaces, lowercase) on
// purpose — matching must be trim + case-insensitive.

const pipelines = [
  { id: 1, name: "Customer Service" },
  { id: 2, name: "Funding" },
  { id: 3, name: "R&R " },                                // trailing space
  { id: 4, name: "California" },
  { id: 5, name: "Completed Meter Board" },
  { id: 6, name: "Cancellations" },
  { id: 7, name: "Warranty Board" },
  { id: 8, name: "New Sale Board" },                      // active board, no terminal stages
  { id: 9, name: "Work Completed Not US customer " },     // whole board terminal (subcontract)
];
const stages = [
  { id: 47, name: "Welcome Call Complete", pipeline_id: 1 },
  { id: 48, name: "Ready for Welcome Call", pipeline_id: 1 },          // active
  { id: 168, name: "Thank You Call - Install Complete ", pipeline_id: 1 },
  { id: 222, name: "M1 invoice needed", pipeline_id: 2 },              // active AR
  { id: 223, name: "M1 invoice sent", pipeline_id: 2 },
  { id: 225, name: "M2 invoice sent", pipeline_id: 2 },
  { id: 283, name: "M3 invoice sent", pipeline_id: 2 },
  { id: 276, name: "Job complete ", pipeline_id: 3 },                  // lowercase c + trailing space
  { id: 270, name: "Reengineering ", pipeline_id: 3 },                 // active
  { id: 295, name: "PTO", pipeline_id: 4 },
  { id: 290, name: "Install Completed", pipeline_id: 4 },              // active (NOT the terminal PTO)
  { id: 171, name: "Activation Approved/PTO Paid", pipeline_id: 5 },
  { id: 321, name: "Post-PTO Work Completed", pipeline_id: 5 },
  { id: 320, name: "Activation Package Submitted", pipeline_id: 5 },   // active
  { id: 99, name: "Cancellation Processed", pipeline_id: 6 },
  { id: 95, name: "New Cancelation", pipeline_id: 6 },                 // active (still cancelling)
  { id: 170, name: "Job Completed", pipeline_id: 7 },
  { id: 500, name: "New deal", pipeline_id: 8 },                       // active board
  { id: 600, name: "anything", pipeline_id: 9 },                      // whole-board terminal
  { id: 601, name: "whatever else", pipeline_id: 9 },
];

describe("terminalStageIds", () => {
  const ids = terminalStageIds(pipelines, stages);

  it("flags exactly the 11 named terminal (board, stage) pairs", () => {
    for (const id of [47, 168, 223, 225, 283, 276, 295, 171, 321, 99, 170]) {
      expect(ids.has(id), `stage ${id} should be terminal`).toBe(true);
    }
  });

  it("keeps sibling non-terminal stages active", () => {
    for (const id of [48, 222, 270, 290, 320, 95, 500]) {
      expect(ids.has(id), `stage ${id} should stay active`).toBe(false);
    }
  });

  it("treats 'Work Completed Not US customer' as a whole terminal board", () => {
    expect(ids.has(600)).toBe(true);
    expect(ids.has(601)).toBe(true);
  });

  it("matches despite case + trailing-space drift", () => {
    expect(ids.has(276)).toBe(true);  // "Job complete " (lowercase, trailing space)
    expect(ids.has(168)).toBe(true);  // trailing space
    expect(ids.has(223)).toBe(true);  // lowercase "invoice sent"
  });
});
