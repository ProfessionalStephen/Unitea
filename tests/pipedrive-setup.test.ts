import { describe, it, expect } from "vitest";
import { runSetup } from "../scripts/pipedrive-setup.js";
import type { PipedriveAdmin, Pipeline, Stage } from "../scripts/_lib/pipedrive-admin.js";

// ─────────────────────────────────────────────────────────────
// pipedrive-setup tests
//
// Verifies the setup orchestration:
//   - creates pipelines for BOARDS entries that don't exist
//   - skips pipelines that already exist
//   - creates stages in BOARDS[name].stages order
//   - idempotent: re-running with same state is a no-op
// ─────────────────────────────────────────────────────────────

function makeMockAdmin(initialPipelines: Pipeline[] = []): PipedriveAdmin & {
  _state: {
    pipelines: Pipeline[];
    stages: Map<number, Stage[]>; // pipelineId -> stages
    pipelineCreates: string[];
    stageCreates: Array<{ pipelineId: number; name: string; orderNr: number }>;
  };
} {
  const state = {
    pipelines: [...initialPipelines],
    stages: new Map<number, Stage[]>(),
    pipelineCreates: [] as string[],
    stageCreates: [] as Array<{ pipelineId: number; name: string; orderNr: number }>,
  };
  let nextId = 1000;

  return {
    _state: state,
    async listPipelines() {
      return [...state.pipelines];
    },
    async createPipeline(name: string) {
      const existing = state.pipelines.find((p) => p.name === name);
      if (existing) return existing.id;
      const id = nextId++;
      state.pipelines.push({ id, name });
      state.pipelineCreates.push(name);
      return id;
    },
    async listStages(pipelineId: number) {
      return [...(state.stages.get(pipelineId) ?? [])];
    },
    async createStage(pipelineId: number, name: string, orderNr: number) {
      const existing = (state.stages.get(pipelineId) ?? []).find((s) => s.name === name);
      if (existing) return existing.id;
      const id = nextId++;
      const list = state.stages.get(pipelineId) ?? [];
      list.push({ id, name, orderNr });
      state.stages.set(pipelineId, list);
      state.stageCreates.push({ pipelineId, name, orderNr });
      return id;
    },
    async listDeals() {
      return [];
    },
    async updateDeal() {
      return false;
    },
  };
}

describe("pipedrive-setup", () => {
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
  };

  it("creates pipelines for every board not in Pipedrive", async () => {
    const admin = makeMockAdmin([]); // empty Pipedrive
    const summary = await runSetup(admin, sampleBoards);

    expect(admin._state.pipelineCreates).toEqual(["Engineering", "Permitting"]);
    expect(summary.pipelinesCreated).toEqual(["Engineering", "Permitting"]);
    expect(summary.pipelinesSkipped).toEqual([]);
  });

  it("skips pipelines that already exist", async () => {
    const admin = makeMockAdmin([{ id: 1, name: "Engineering" }]);
    const summary = await runSetup(admin, sampleBoards);

    expect(admin._state.pipelineCreates).toEqual(["Permitting"]);
    expect(summary.pipelinesCreated).toEqual(["Permitting"]);
    expect(summary.pipelinesSkipped).toEqual(["Engineering"]);
  });

  it("creates each board's stages in BOARDS order", async () => {
    const admin = makeMockAdmin([]);
    await runSetup(admin, sampleBoards);

    const engineeringId = admin._state.pipelines.find((p) => p.name === "Engineering")!.id;
    const engineeringStages = admin._state.stages.get(engineeringId)!;
    expect(engineeringStages.map((s) => s.name)).toEqual([
      "Ready for Engineering",
      "Revisions",
      "Quality Control",
    ]);
    expect(engineeringStages.map((s) => s.orderNr)).toEqual([0, 1, 2]);
  });

  it("is idempotent — re-running creates nothing", async () => {
    const admin = makeMockAdmin([]);
    await runSetup(admin, sampleBoards);
    // Reset call tracking
    admin._state.pipelineCreates = [];
    admin._state.stageCreates = [];

    const summary = await runSetup(admin, sampleBoards);
    expect(admin._state.pipelineCreates).toEqual([]);
    expect(admin._state.stageCreates).toEqual([]);
    expect(summary.pipelinesCreated).toEqual([]);
    expect(summary.stagesCreated).toEqual([]);
  });

  it("adds missing stages to an already-existing pipeline (partial state)", async () => {
    const admin = makeMockAdmin([{ id: 50, name: "Engineering" }]);
    // Pre-seed one stage
    admin._state.stages.set(50, [{ id: 500, name: "Ready for Engineering", orderNr: 0 }]);

    await runSetup(admin, sampleBoards);

    const eStages = admin._state.stages.get(50)!.map((s) => s.name);
    expect(eStages).toContain("Ready for Engineering");
    expect(eStages).toContain("Revisions");
    expect(eStages).toContain("Quality Control");
  });
});
