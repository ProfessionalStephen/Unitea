import { describe, it, expect } from "vitest";
import { classifyDeals } from "../scripts/pipedrive-classify-deals.js";
import type { Deal } from "../scripts/_lib/pipedrive-admin.js";

// ─────────────────────────────────────────────────────────────
// classifyDeals tests
//
// Deals come from the 2 currently-active Pipedrive pipelines.
// Need to suggest where each belongs among the 17 BOARDS.
//
// High-confidence signals: title keywords, current stage name
// Low-confidence: no clear signal → flagged for human review.
// ─────────────────────────────────────────────────────────────

const sampleBoards = {
  Engineering: {
    region: "FL",
    stages: ["Ready for Engineering", "Revisions", "Quality Control"],
    rotting: {},
  },
  Permitting: {
    region: "FL",
    stages: ["Ready for Permitting", "Permit Submitted", "Permit Approved"],
    rotting: {},
  },
  "Net Metering": {
    region: "FL",
    stages: ["Ready for New Meter App", "NMA submitted to Utility"],
    rotting: {},
  },
  Service: {
    region: "FL",
    stages: ["Service Needed", "Service Scheduled", "Work Completed"],
    rotting: {},
  },
};

function deal(id: number, title: string, stageId = 0, pipelineId = 1): Deal {
  return { id, title, pipelineId, stageId };
}

describe("classifyDeals", () => {
  it("returns empty plan for empty input", () => {
    const plan = classifyDeals([], sampleBoards);
    expect(plan.proposals).toEqual([]);
    expect(plan.needsReview).toEqual([]);
  });

  it("classifies deal with 'permit' in title to Permitting with high confidence", () => {
    const deals = [deal(1, "Smith permit submission ready")];
    const plan = classifyDeals(deals, sampleBoards);

    expect(plan.proposals).toHaveLength(1);
    const p = plan.proposals[0];
    expect(p.proposedBoard).toBe("Permitting");
    expect(p.confidence).toBe("high");
  });

  it("classifies deal with 'service' or 'warranty' in title to Service board", () => {
    const deals = [
      deal(2, "Roof leak service call"),
      deal(3, "Warranty inspection for panels"),
    ];
    const plan = classifyDeals(deals, sampleBoards);

    expect(plan.proposals[0].proposedBoard).toBe("Service");
    expect(plan.proposals[1].proposedBoard).toBe("Service");
  });

  it("flags deals with no obvious keyword for human review (needsReview)", () => {
    const deals = [deal(4, "Customer follow-up call")];
    const plan = classifyDeals(deals, sampleBoards);

    expect(plan.proposals[0].confidence).toBe("low");
    expect(plan.needsReview).toContain(plan.proposals[0]);
  });

  it("includes a reason explaining the classification (for review)", () => {
    const deals = [deal(5, "Engineering revisions needed")];
    const plan = classifyDeals(deals, sampleBoards);

    expect(plan.proposals[0].reason).toMatch(/engineering/i);
  });

  it("preserves original deal id and title in each proposal", () => {
    const deals = [deal(99, "NMA submitted to FPL")];
    const plan = classifyDeals(deals, sampleBoards);

    expect(plan.proposals[0].dealId).toBe(99);
    expect(plan.proposals[0].dealTitle).toBe("NMA submitted to FPL");
    expect(plan.proposals[0].proposedBoard).toBe("Net Metering");
  });

  it("populates needsReview only with confidence != high", () => {
    const deals = [
      deal(10, "Permit Submitted today"), // high
      deal(11, "Something miscellaneous"), // low
    ];
    const plan = classifyDeals(deals, sampleBoards);

    expect(plan.needsReview).toHaveLength(1);
    expect(plan.needsReview[0].dealId).toBe(11);
  });
});
