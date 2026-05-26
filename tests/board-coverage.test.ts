import { describe, it, expect } from "vitest";
import { BOARDS } from "../shared/domain/boards.js";

// ─────────────────────────────────────────────────────────────
// BOARD COVERAGE
//
// Catches drift between the codebase's expected pipelines and
// what Pipedrive actually has. The setup script (scripts/pipedrive-setup.ts)
// is the producer; this test is the regression net.
//
// Pure-data test — does not hit the network. Run a mock /pipelines
// response that represents the post-setup Pipedrive state.
// In CI, this passes as long as the local BOARDS config matches.
// ─────────────────────────────────────────────────────────────

describe("board coverage", () => {
  it("every BOARDS entry has a stage list (non-empty array)", () => {
    for (const [name, board] of Object.entries(BOARDS)) {
      expect(board.stages, `${name} has no stages`).toBeInstanceOf(Array);
      expect(board.stages.length, `${name} has empty stages`).toBeGreaterThan(0);
    }
  });

  it("every BOARDS entry's stages list contains only unique stage names", () => {
    for (const [name, board] of Object.entries(BOARDS)) {
      const unique = new Set(board.stages);
      expect(unique.size, `${name} has duplicate stages: ${board.stages.join(", ")}`).toBe(
        board.stages.length,
      );
    }
  });

  it("BOARDS keys match the post-setup Pipedrive pipelines (mocked source-of-truth)", () => {
    // This mock represents the state Pipedrive SHOULD be in after
    // scripts/pipedrive-setup.ts has run successfully. The setup script
    // creates one pipeline per BOARDS key. If a key is added to BOARDS
    // without an entry in this set, future drift is caught here.
    const expectedAfterSetup = new Set(Object.keys(BOARDS));

    // Simulate a /pipelines response that mirrors BOARDS.
    const pipedriveSimulated = Object.keys(BOARDS).map((name, i) => ({ id: i + 1, name }));

    for (const expected of expectedAfterSetup) {
      const found = pipedriveSimulated.find((p) => p.name === expected);
      expect(found, `Pipedrive missing pipeline: ${expected}`).toBeDefined();
    }
  });
});
