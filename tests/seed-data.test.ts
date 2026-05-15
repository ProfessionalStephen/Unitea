import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ─────────────────────────────────────────────────────────────
// Cycle 2 — AUDIT_INIT and RALPH_INIT defaults
// Bug: hardcoded fake "history" rows w/ May 2026 timestamps appear
// in the Audit + RALPH admin tabs on first load, presented to the
// user as if they were real prior activity.
//
// Contract: both initial state arrays must be empty. Real entries
// are added via addAudit() and the RALPH form at runtime.
// ─────────────────────────────────────────────────────────────

const appSrc = readFileSync(resolve(__dirname, "../src/App.tsx"), "utf8");

describe("seed data — no fake rows shown to admins", () => {
  it("AUDIT_INIT is declared as an empty array", () => {
    // Match `const AUDIT_INIT...=[...]` where `...` doesn't contain a `{`
    // (a `{` would mean object rows are present).
    expect(appSrc).toMatch(/const\s+AUDIT_INIT\b[^=]*=\s*\[\s*\]/);
    expect(appSrc).not.toMatch(/AUDIT_INIT[^=]*=\s*\[\s*\{/);
  });

  it("RALPH_INIT is declared as an empty array", () => {
    expect(appSrc).toMatch(/const\s+RALPH_INIT\b[^=]*=\s*\[\s*\]/);
    expect(appSrc).not.toMatch(/RALPH_INIT[^=]*=\s*\[\s*\{/);
  });

  it("no leftover REPS placeholder name array", () => {
    expect(appSrc).not.toMatch(/const\s+REPS\s*=/);
    expect(appSrc).not.toMatch(/"Sarah M\."/);
  });

  it("no May 2026 fake timestamps", () => {
    // Catch any leftover hand-crafted seed timestamps from AUDIT/RALPH defaults
    expect(appSrc).not.toMatch(/"2026-05-0[789]/);
  });
});
