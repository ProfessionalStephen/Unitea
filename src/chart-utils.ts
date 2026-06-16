// Shared chart constants/types/helpers — kept separate from charts.tsx so that file only exports
// components (satisfies react-refresh/only-export-components).

export interface ChartTheme {
  text: string;
  textMuted: string;
  border: string;
}
export interface Datum {
  label: string;
  value: number;
  color?: string;
}
export type NumFormat = "int" | "pct" | "days" | "money";

// Brand-aligned categorical palette (see C in App.tsx). Meaning over rainbow: callers pass
// explicit colors for semantic series; otherwise we cycle this neutral-leaning set.
export const CHART_COLORS = [
  "#185fa5", "#0f6e56", "#F28F1D", "#a32d2d", "#1d9e75",
  "#7c5cbf", "#ba7517", "#3b7fc4", "#9a5bb0", "#888780",
];

export function fmtNum(v: number, format: NumFormat = "int"): string {
  if (v == null || Number.isNaN(v)) return "-";
  if (format === "pct") return (Math.round(v * 10) / 10) + "%";
  if (format === "days") return (Math.round(v * 10) / 10) + "d";
  if (format === "money") {
    const a = Math.abs(v);
    if (a >= 1e6) return "$" + (v / 1e6).toFixed(1) + "M";
    if (a >= 1e3) return "$" + Math.round(v / 1e3) + "k";
    return "$" + Math.round(v);
  }
  return Math.round(v).toLocaleString();
}

export function truncLabel(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
