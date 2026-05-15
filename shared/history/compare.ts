// ─────────────────────────────────────────────────────────────
// SNAPSHOT COMPARE — pure fns for History tab range diffs
//
// Range pill (Week/Month/Quarter/Year over year) → baseline date
// Current snapshot + baseline snapshot → array of typed deltas.
//
// Compare endpoint (api/snapshots/compare) calls these. UI renders
// the resulting rows. No Pipedrive fetch — snapshots only.
// ─────────────────────────────────────────────────────────────

export type SnapshotLike = {
  date: string;
  totalActiveJobs?: number;
  totalPipelineValue?: number;
  endToEndDays?: number;
  wonThisWeek?: number;
  wonThisWeekValue?: number;
  wonLast30d?: number;
  lostLast30d?: number;
  lostLast30dValue?: number;
  cancellationRate30d?: number;
  activitiesDueToday?: number;
  activitiesOverdue?: number;
  callsDueToday?: number;
  installsCompletedYesterday?: number;
  installsScheduledThisWeek?: number;
  permitsSubmittedThisWeek?: number;
  sentToPermittingToday?: number;
  nmaSubmittedThisWeek?: number;
  serviceRequestsToday?: number;
  techniciansScheduledToday?: number;
  inspectionsScheduledToday?: number;
};

export type DiffRow = {
  key: keyof SnapshotLike;
  label: string;
  format: "count" | "money" | "days" | "percent";
  current: number;
  baseline: number;
  delta: number;
  pct: number | null;          // null when baseline is 0
  direction: "up" | "down" | "flat";
};

const SPECS: Array<{ key: keyof SnapshotLike; label: string; format: DiffRow["format"] }> = [
  { key: "totalActiveJobs",     label: "Total active jobs",     format: "count" },
  { key: "totalPipelineValue",  label: "Pipeline value",        format: "money" },
  { key: "endToEndDays",        label: "End-to-end days",       format: "days" },
  { key: "wonThisWeek",         label: "Won this week",         format: "count" },
  { key: "wonLast30d",          label: "Won last 30d",          format: "count" },
  { key: "lostLast30d",         label: "Lost last 30d",         format: "count" },
  { key: "cancellationRate30d", label: "Cancellation rate",     format: "percent" },
  { key: "activitiesOverdue",   label: "Overdue activities",    format: "count" },
  { key: "callsDueToday",       label: "Calls due today",       format: "count" },
  // Time-window aggregates (Cycle 5)
  { key: "installsScheduledThisWeek", label: "Installs scheduled (week)", format: "count" },
  { key: "permitsSubmittedThisWeek",  label: "Permits submitted (week)",  format: "count" },
  { key: "nmaSubmittedThisWeek",      label: "NMA submitted (week)",      format: "count" },
];

export function compareSnapshots(current: SnapshotLike, baseline: SnapshotLike): DiffRow[] {
  return SPECS.map(({ key, label, format }) => {
    const c = Number(current[key] ?? 0);
    const b = Number(baseline[key] ?? 0);
    const delta = c - b;
    const pct = b === 0 ? null : Math.round((delta / b) * 1000) / 10;
    const direction: DiffRow["direction"] = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
    return { key, label, format, current: c, baseline: b, delta, pct, direction };
  });
}

const OFFSETS: Record<string, number> = {
  "Week over week": 7,
  "Month over month": 30,
  "Quarter over quarter": 90,
  "Year over year": 365,
};

// Returns the YMD date N days before `anchorYmd`. Anchor is the current date in ET.
export function baselineDateForRange(range: string, anchorYmd: string): string {
  const offset = OFFSETS[range] ?? 7;
  const [y, m, d] = anchorYmd.split("-").map(Number);
  // Use UTC midday to avoid DST edge cases — we only care about the calendar date.
  const utc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const baseline = new Date(utc.getTime() - offset * 86400000);
  const yy = baseline.getUTCFullYear();
  const mm = String(baseline.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(baseline.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

// Picks the closest snapshot date ≤ target from a sorted-descending list.
// Returns null if no snapshot is on or before target.
export function nearestSnapshotOnOrBefore(target: string, available: string[]): string | null {
  // available expected sorted desc (newest first), like listSnapshots() returns.
  for (const d of available) {
    if (d <= target) return d;
  }
  return null;
}
