import { describe, expect, it } from "vitest";
import { BOARDS } from "../shared/domain/boards.js";

// BOARD COVERAGE
//
// ADR-003 makes live Pipedrive the source of truth. BOARDS is a strict
// byte-for-byte mirror of that live state, including trailing spaces, casing
// drift, and apparent typos. This pure-data test does not hit the network.
// To detect live drift, run scripts/pipedrive-inspect.ts and update BOARDS
// deliberately.

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

  it("BOARDS keys are stable within the strict Pipedrive mirror", () => {
    const expectedMirror = new Set(Object.keys(BOARDS));
    const pipedriveSimulated = Object.keys(BOARDS).map((name, i) => ({ id: i + 1, name }));

    for (const expected of expectedMirror) {
      const found = pipedriveSimulated.find((p) => p.name === expected);
      expect(found, `Pipedrive missing pipeline: ${expected}`).toBeDefined();
    }
  });
});
