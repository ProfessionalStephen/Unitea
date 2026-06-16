// KPI targets + direction-of-good, for period-over-period deltas and goal lines.
// `betterWhen` is domain-correct (cancellations/lost/aging are better LOWER); `target` values are
// editable DEFAULTS — adjust them in the dashboard (Reports → Edit targets, persisted per browser).
// Keys match the snapshot-compare metric keys in shared/history/compare.ts (SnapshotLike).

export type Better = "higher" | "lower" | "neutral";
export interface KpiTarget {
  target: number | null;
  betterWhen: Better;
}

export const KPI_TARGETS: Record<string, KpiTarget> = {
  totalActiveJobs:           { target: null, betterWhen: "neutral" },
  wonThisWeek:               { target: 10,   betterWhen: "higher" },
  wonLast30d:                { target: 40,   betterWhen: "higher" },
  lostLast30d:               { target: 15,   betterWhen: "lower" },
  cancellationRate30d:       { target: 15,   betterWhen: "lower" },
  endToEndDays:              { target: 90,   betterWhen: "lower" },
  activitiesOverdue:         { target: 0,    betterWhen: "lower" },
  callsDueToday:             { target: null, betterWhen: "neutral" },
  installsScheduledThisWeek: { target: 8,    betterWhen: "higher" },
  permitsSubmittedThisWeek:  { target: 8,    betterWhen: "higher" },
  nmaSubmittedThisWeek:      { target: 5,    betterWhen: "higher" },
};

// Which metrics get a delta card (density cap ~8 — the rest stay in Intelligence → History).
export const DELTA_CARD_KEYS = [
  "totalActiveJobs", "wonThisWeek", "wonLast30d", "lostLast30d",
  "cancellationRate30d", "endToEndDays", "activitiesOverdue", "installsScheduledThisWeek",
];

// Goal line for the cancellations-per-month trend chart (editable default).
export const CANCELLATIONS_PER_MONTH_TARGET = 45;
