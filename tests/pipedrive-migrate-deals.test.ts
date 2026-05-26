import { describe, it, expect } from "vitest";
import { runMigration } from "../scripts/pipedrive-migrate-deals.js";
import type { PipedriveAdmin, Pipeline, Stage, Deal } from "../scripts/_lib/pipedrive-admin.js";
import type { ClassificationPlan } from "../scripts/pipedrive-classify-deals.js";

// ─────────────────────────────────────────────────────────────
// pipedrive-migrate-deals tests
// ─────────────────────────────────────────────────────────────

function makeMockAdmin(
  pipelines: Pipeline[],
  stagesByPipeline: Record<number, Stage[]>,
  initialDeals: Deal[],
): PipedriveAdmin & { _moves: Array<{ dealId: number; pipelineId: number; stageId: number }> } {
  const state = {
    deals: new Map<number, Deal>(initialDeals.map((d) => [d.id, { ...d }])),
    moves: [] as Array<{ dealId: number; pipelineId: number; stageId: number }>,
  };

  return {
    _moves: state.moves,
    async listPipelines() {
      return [...pipelines];
    },
    async createPipeline() {
      throw new Error("createPipeline not expected during migration");
    },
    async listStages(pipelineId: number) {
      return [...(stagesByPipeline[pipelineId] ?? [])];
    },
    async createStage() {
      throw new Error("createStage not expected during migration");
    },
    async listDeals() {
      return [...state.deals.values()];
    },
    async updateDeal(dealId: number, patch: { pipelineId?: number; stageId?: number }) {
      const current = state.deals.get(dealId);
      if (!current) throw new Error(`deal ${dealId} not found`);
      const samePipeline = patch.pipelineId === undefined || patch.pipelineId === current.pipelineId;
      const sameStage = patch.stageId === undefined || patch.stageId === current.stageId;
      if (samePipeline && sameStage) return false;

      if (patch.pipelineId !== undefined) current.pipelineId = patch.pipelineId;
      if (patch.stageId !== undefined) current.stageId = patch.stageId;
      state.deals.set(dealId, current);
      state.moves.push({
        dealId,
        pipelineId: current.pipelineId,
        stageId: current.stageId,
      });
      return true;
    },
  };
}

describe("runMigration", () => {
  const pipelines: Pipeline[] = [
    { id: 1, name: "OldPipeline" },
    { id: 10, name: "Engineering" },
    { id: 11, name: "Permitting" },
  ];
  const stages: Record<number, Stage[]> = {
    1: [{ id: 100, name: "Old Stage", orderNr: 0 }],
    10: [
      { id: 200, name: "Ready for Engineering", orderNr: 0 },
      { id: 201, name: "Revisions", orderNr: 1 },
    ],
    11: [
      { id: 300, name: "Ready for Permitting", orderNr: 0 },
      { id: 301, name: "Permit Submitted", orderNr: 1 },
    ],
  };

  function planFrom(
    proposals: Array<Partial<ClassificationPlan["proposals"][0]>>,
  ): ClassificationPlan {
    const full = proposals.map((p, i) => ({
      dealId: p.dealId ?? i + 1,
      dealTitle: p.dealTitle ?? `Deal ${i + 1}`,
      currentPipelineId: p.currentPipelineId ?? 1,
      currentStageId: p.currentStageId ?? 100,
      proposedBoard: p.proposedBoard ?? null,
      proposedStage: p.proposedStage ?? null,
      confidence: p.confidence ?? "high",
      reason: p.reason ?? "test",
    }));
    return {
      proposals: full,
      needsReview: full.filter((p) => p.confidence !== "high"),
      generatedAt: new Date().toISOString(),
    };
  }

  it("applies high-confidence proposals: moves each deal to the proposed pipeline+stage", async () => {
    const initialDeals: Deal[] = [{ id: 1, title: "Engineering needed", pipelineId: 1, stageId: 100 }];
    const admin = makeMockAdmin(pipelines, stages, initialDeals);
    const plan = planFrom([
      {
        dealId: 1,
        proposedBoard: "Engineering",
        proposedStage: "Ready for Engineering",
        confidence: "high",
      },
    ]);

    const summary = await runMigration(admin, plan);
    expect(summary.moved).toHaveLength(1);
    expect(admin._moves).toEqual([{ dealId: 1, pipelineId: 10, stageId: 200 }]);
  });

  it("skips proposals with null proposedBoard (unclassified)", async () => {
    const initialDeals: Deal[] = [{ id: 1, title: "?", pipelineId: 1, stageId: 100 }];
    const admin = makeMockAdmin(pipelines, stages, initialDeals);
    const plan = planFrom([
      { dealId: 1, proposedBoard: null, proposedStage: null, confidence: "low" },
    ]);

    const summary = await runMigration(admin, plan);
    expect(summary.moved).toEqual([]);
    expect(summary.skippedUnclassified).toHaveLength(1);
  });

  it("skips proposals with confidence != 'high' unless force=true", async () => {
    const initialDeals: Deal[] = [{ id: 1, title: "?", pipelineId: 1, stageId: 100 }];
    const admin = makeMockAdmin(pipelines, stages, initialDeals);
    const plan = planFrom([
      {
        dealId: 1,
        proposedBoard: "Engineering",
        proposedStage: "Ready for Engineering",
        confidence: "medium",
      },
    ]);

    const summary = await runMigration(admin, plan);
    expect(summary.moved).toEqual([]);
    expect(summary.skippedLowConfidence).toHaveLength(1);
  });

  it("with force=true, applies medium/low confidence proposals too", async () => {
    const initialDeals: Deal[] = [{ id: 1, title: "x", pipelineId: 1, stageId: 100 }];
    const admin = makeMockAdmin(pipelines, stages, initialDeals);
    const plan = planFrom([
      {
        dealId: 1,
        proposedBoard: "Engineering",
        proposedStage: "Ready for Engineering",
        confidence: "medium",
      },
    ]);

    const summary = await runMigration(admin, plan, { force: true });
    expect(summary.moved).toHaveLength(1);
  });

  it("is idempotent — re-running after success moves nothing", async () => {
    const initialDeals: Deal[] = [{ id: 1, title: "x", pipelineId: 1, stageId: 100 }];
    const admin = makeMockAdmin(pipelines, stages, initialDeals);
    const plan = planFrom([
      {
        dealId: 1,
        proposedBoard: "Engineering",
        proposedStage: "Ready for Engineering",
        confidence: "high",
      },
    ]);

    await runMigration(admin, plan);
    const second = await runMigration(admin, plan);
    expect(second.moved).toEqual([]);
    expect(second.alreadyInPlace).toHaveLength(1);
  });

  it("reports failures when proposed board doesn't exist in Pipedrive", async () => {
    const initialDeals: Deal[] = [{ id: 1, title: "x", pipelineId: 1, stageId: 100 }];
    const admin = makeMockAdmin(pipelines, stages, initialDeals);
    const plan = planFrom([
      {
        dealId: 1,
        proposedBoard: "DoesNotExistInPipedrive",
        proposedStage: "Whatever",
        confidence: "high",
      },
    ]);

    const summary = await runMigration(admin, plan);
    expect(summary.moved).toEqual([]);
    expect(summary.failures).toHaveLength(1);
    expect(summary.failures[0].reason).toMatch(/pipeline/i);
  });

  it("reports failures when proposed stage doesn't exist in the target pipeline", async () => {
    const initialDeals: Deal[] = [{ id: 1, title: "x", pipelineId: 1, stageId: 100 }];
    const admin = makeMockAdmin(pipelines, stages, initialDeals);
    const plan = planFrom([
      {
        dealId: 1,
        proposedBoard: "Engineering",
        proposedStage: "Not A Real Stage",
        confidence: "high",
      },
    ]);

    const summary = await runMigration(admin, plan);
    expect(summary.failures).toHaveLength(1);
    expect(summary.failures[0].reason).toMatch(/stage/i);
  });
});
