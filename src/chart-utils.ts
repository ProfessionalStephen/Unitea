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

// Theme-aware signal/series palette. A single hex cannot clear WCAG non-text 3:1 on BOTH the dark
// (#2E3138) and light (#E8E8E8) card surfaces, so colors resolve per theme. These exact values are
// gate-verified (design/reports.*.tokens.json via the Atelier validate-theme oracle): every fill ≥3:1
// as UI, every RAG color ≥3:1 as large text, all roles mutually distinct.
export interface SignalPalette {
  blue: string; red: string; green: string; amber: string;
  teal: string; orange: string; purple: string; neutral: string;
}
const DARK_SIGNALS: SignalPalette = {
  blue: "#5AA2E6", red: "#F26D6D", green: "#34C77A", amber: "#ECA93B",
  teal: "#2BBE94", orange: "#F0922E", purple: "#A98BE0", neutral: "#9A938C",
};
const LIGHT_SIGNALS: SignalPalette = {
  blue: "#185FA5", red: "#B22B2B", green: "#2E7D33", amber: "#8A5A00",
  teal: "#0F6E56", orange: "#B5491A", purple: "#6B4FBB", neutral: "#5F5E5A",
};
export function chartColors(dark: boolean): SignalPalette {
  return dark ? DARK_SIGNALS : LIGHT_SIGNALS;
}

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
