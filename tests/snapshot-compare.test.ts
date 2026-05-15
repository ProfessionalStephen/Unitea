import { describe, it, expect } from "vitest";
import { compareSnapshots, baselineDateForRange, type SnapshotLike } from "../shared/history/compare";

// ─────────────────────────────────────────────────────────────
// Cycle 7 — RANGES → snapshot diff
//
// Range pills in the History tab were dead UI: button toggled state
// that was never read. Fix is a pure compareSnapshots(current, baseline)
// that emits a labeled delta for each aggregate. The History tab
// fetches the right baseline by date, calls this, and renders rows.
// ─────────────────────────────────────────────────────────────

const today: SnapshotLike = {
  date: "2026-05-14",
  totalActiveJobs: 120,
  totalPipelineValue: 1_500_000,
  endToEndDays: 90,
  wonThisWeek: 5,
  lostLast30d: 4,
  cancellationRate30d: 18.0,
  activitiesOverdue: 6,
  callsDueToday: 4,
};

const weekAgo: SnapshotLike = {
  date: "2026-05-07",
  totalActiveJobs: 100,
  totalPipelineValue: 1_300_000,
  endToEndDays: 85,
  wonThisWeek: 3,
  lostLast30d: 5,
  cancellationRate30d: 22.0,
  activitiesOverdue: 8,
  callsDueToday: 2,
};

describe("Cycle 7 — compareSnapshots emits per-metric deltas", () => {
  it("computes absolute and percentage delta for totalActiveJobs", () => {
    const diff = compareSnapshots(today, weekAgo);
    const row = diff.find((r) => r.key === "totalActiveJobs");
    expect(row, "totalActiveJobs row").toBeDefined();
    expect(row!.current).toBe(120);
    expect(row!.baseline).toBe(100);
    expect(row!.delta).toBe(20);
    expect(row!.pct).toBe(20.0); // (20/100)*100
    expect(row!.direction).toBe("up");
  });

  it("formats pipeline value delta in dollars", () => {
    const diff = compareSnapshots(today, weekAgo);
    const row = diff.find((r) => r.key === "totalPipelineValue");
    expect(row!.delta).toBe(200_000);
    expect(row!.format).toBe("money");
  });

  it("reports down direction when current is below baseline", () => {
    const diff = compareSnapshots(today, weekAgo);
    const row = diff.find((r) => r.key === "lostLast30d");
    expect(row!.direction).toBe("down");
    expect(row!.delta).toBe(-1);
  });

  it("returns null pct when baseline is 0 (no divide-by-zero)", () => {
    const empty: SnapshotLike = { ...weekAgo, totalActiveJobs: 0 };
    const diff = compareSnapshots(today, empty);
    const row = diff.find((r) => r.key === "totalActiveJobs");
    expect(row!.pct).toBeNull();
  });

  it("returns flat direction when current === baseline", () => {
    const same = { ...today };
    const diff = compareSnapshots(today, same);
    expect(diff.every((r) => r.direction === "flat")).toBe(true);
  });
});

describe("baselineDateForRange — picks the correct baseline date", () => {
  it("Week over week → 7 days before anchor", () => {
    expect(baselineDateForRange("Week over week", "2026-05-14")).toBe("2026-05-07");
  });

  it("Month over month → 30 days before anchor", () => {
    expect(baselineDateForRange("Month over month", "2026-05-14")).toBe("2026-04-14");
  });

  it("Quarter over quarter → 90 days before anchor", () => {
    expect(baselineDateForRange("Quarter over quarter", "2026-05-14")).toBe("2026-02-13");
  });

  it("Year over year → 365 days before anchor", () => {
    expect(baselineDateForRange("Year over year", "2026-05-14")).toBe("2025-05-14");
  });
});
