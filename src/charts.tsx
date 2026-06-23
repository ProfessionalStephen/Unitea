// Zero-dependency SVG chart kit, themed via the app's `th` tokens.
// Scalable (viewBox + width:100%), accessible (role="img" + <title> tooltips), dark/light aware.
// Kept dependency-free on purpose to match this repo's minimal-deps philosophy.
// Shared constants/types/helpers live in ./chart-utils so this file only exports components.

import { useState } from "react";
import { CHART_COLORS, fmtNum, truncLabel } from "./chart-utils";
import type { ChartTheme, Datum, NumFormat } from "./chart-utils";

// ---------- Horizontal bar chart (best for category comparisons w/ long labels) ----------
export function BarChart(props: {
  data: Datum[];
  th: ChartTheme;
  format?: NumFormat;
  color?: string;
  labelChars?: number;
  onBarClick?: (label: string) => void;
}) {
  const { data, th, format = "int", color = CHART_COLORS[0], labelChars = 22, onBarClick } = props;
  const VBW = 600;
  const rowH = 30, padT = 8, padB = 8, labelW = 168, valW = 52;
  const H = Math.max(1, data.length) * rowH + padT + padB;
  const max = Math.max(...data.map((d) => d.value), 1);
  const barX0 = labelW;
  const barMax = VBW - labelW - valW;
  return (
    <svg viewBox={`0 0 ${VBW} ${H}`} width="100%" height={H} role="img"
      aria-label={"Bar chart: " + data.map((d) => d.label + " " + fmtNum(d.value, format)).join(", ")}>
      {data.map((d, i) => {
        const y = padT + i * rowH;
        const w = Math.max(2, (d.value / max) * barMax);
        return (
          <g key={d.label + i} onClick={onBarClick ? () => onBarClick(d.label) : undefined} style={onBarClick ? { cursor: "pointer" } : undefined}>
            <text x={labelW - 8} y={y + rowH / 2} textAnchor="end" dominantBaseline="middle"
              fontSize={12} fill={th.textMuted}>{truncLabel(d.label, labelChars)}
              <title>{d.tip || d.label}</title>
            </text>
            <rect x={barX0} y={y + 5} width={w} height={rowH - 12} rx={3} fill={d.color || color}>
              <title>{d.tip || `${d.label}: ${fmtNum(d.value, format)}`}</title>
            </rect>
            <text x={barX0 + w + 6} y={y + rowH / 2} dominantBaseline="middle"
              fontSize={11.5} fill={th.text}>{fmtNum(d.value, format)}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------- Line / area chart (best for trends over time) ----------
export function LineChart(props: {
  data: Datum[];
  th: ChartTheme;
  format?: NumFormat;
  color?: string;
  area?: boolean;
  height?: number;
  goal?: number;
  goalColor?: string;
}) {
  const { data, th, format = "int", color = CHART_COLORS[0], area = true, height = 200, goal, goalColor } = props;
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const VBW = 600, VBH = height;
  const padL = 44, padR = 12, padT = 12, padB = 26;
  const n = data.length;
  const max = Math.max(...data.map((d) => d.value), goal ?? 1, 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const span = max - min || 1;
  const plotW = VBW - padL - padR, plotH = VBH - padT - padB;
  const x = (i: number) => padL + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v: number) => padT + plotH - ((v - min) / span) * plotH;
  const pts = data.map((d, i) => x(i) + "," + y(d.value)).join(" ");
  const areaPath = `M ${x(0)},${padT + plotH} ` + data.map((d, i) => `L ${x(i)},${y(d.value)}`).join(" ") + ` L ${x(n - 1)},${padT + plotH} Z`;
  const gridN = 4;
  const labelEvery = Math.max(1, Math.ceil(n / 8));
  return (
    <svg viewBox={`0 0 ${VBW} ${VBH}`} width="100%" height={VBH} role="img"
      aria-label={"Trend chart of " + n + " points"}>
      {Array.from({ length: gridN + 1 }).map((_, g) => {
        const gv = min + (span * g) / gridN;
        const gy = y(gv);
        return (
          <g key={"g" + g}>
            <line x1={padL} y1={gy} x2={VBW - padR} y2={gy} stroke={th.border} strokeWidth={1} />
            <text x={padL - 6} y={gy} textAnchor="end" dominantBaseline="middle" fontSize={10} fill={th.textMuted}>
              {fmtNum(gv, format)}
            </text>
          </g>
        );
      })}
      {goal != null && goal >= min && goal <= max && (
        <g>
          <line x1={padL} y1={y(goal)} x2={VBW - padR} y2={y(goal)} stroke={goalColor || th.textMuted} strokeWidth={1} strokeDasharray="5 4" />
          <text x={VBW - padR} y={y(goal) - 4} textAnchor="end" fontSize={10} fill={goalColor || th.textMuted}>target {fmtNum(goal, format)}</text>
        </g>
      )}
      {area && n > 1 && <path d={areaPath} fill={color} opacity={0.13} />}
      {n > 1 && <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />}
      {data.map((d, i) => (
        <circle key={"p" + i} cx={x(i)} cy={y(d.value)} r={3.5} fill={color}
          onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)} style={{ cursor: d.tip ? "help" : "default" }}>
          <title>{d.tip || `${d.label}: ${fmtNum(d.value, format)}`}</title>
        </circle>
      ))}
      {hoverIdx != null && data[hoverIdx] && (() => {
        const d = data[hoverIdx];
        const lines = String(d.tip || `${d.label}: ${fmtNum(d.value, format)}`).split("\n").slice(0, 5);
        const bx = Math.min(Math.max(x(hoverIdx) - 88, padL), VBW - 190);
        const by = Math.max(y(d.value) - 22 - lines.length * 15, padT + 2);
        return <g pointerEvents="none">
          <rect x={bx} y={by} width={184} height={lines.length * 15 + 14} rx={7} fill={th.text} opacity={0.94}/>
          {lines.map((line, j) => <text key={j} x={bx + 9} y={by + 18 + j * 15} fontSize={10.5} fill="var(--bg-surface)">{line}</text>)}
        </g>;
      })()}
      {data.map((d, i) => (i % labelEvery === 0 || i === n - 1) ? (
        <text key={"x" + i} x={x(i)} y={VBH - 8} textAnchor="middle" fontSize={10} fill={th.textMuted}>
          {truncLabel(d.label, 7)}
        </text>
      ) : null)}
    </svg>
  );
}

// ---------- Donut chart (single part-to-whole snapshot; legend included) ----------
export function DonutChart(props: {
  data: Datum[];
  th: ChartTheme;
  format?: NumFormat;
  size?: number;
}) {
  const { data, th, format = "int", size = 184 } = props;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = size / 2, cy = size / 2, r = size / 2 - 2, ir = r * 0.6;
  // cumulative sum BEFORE index i — computed functionally (no render-time mutation)
  const before = (i: number) => data.slice(0, i).reduce((s, d) => s + d.value, 0);
  const arc = (frac0: number, frac1: number) => {
    const a0 = frac0 * 2 * Math.PI - Math.PI / 2;
    const a1 = frac1 * 2 * Math.PI - Math.PI / 2;
    const large = frac1 - frac0 > 0.5 ? 1 : 0;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const xi1 = cx + ir * Math.cos(a1), yi1 = cy + ir * Math.sin(a1);
    const xi0 = cx + ir * Math.cos(a0), yi0 = cy + ir * Math.sin(a0);
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} L ${xi1} ${yi1} A ${ir} ${ir} 0 ${large} 0 ${xi0} ${yi0} Z`;
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img"
        aria-label={"Donut: " + data.map((d) => d.label + " " + fmtNum(d.value, format)).join(", ")}>
        {data.map((d, i) => {
          if (d.value <= 0) return null;
          const f0 = before(i) / total;
          const f1 = (before(i) + d.value) / total;
          return (
            <path key={d.label + i} d={arc(f0, f1)} fill={d.color || CHART_COLORS[i % CHART_COLORS.length]}>
              <title>{d.label}: {fmtNum(d.value, format)} ({Math.round((d.value / total) * 100)}%)</title>
            </path>
          );
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={20} fontWeight={600} fill={th.text}>
          {fmtNum(total, format)}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={10} fill={th.textMuted}>total</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 140 }}>
        {data.map((d, i) => (
          <div key={d.label + i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: d.color || CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
            <span style={{ color: th.textMuted, flex: 1 }}>{d.label}</span>
            <span style={{ color: th.text, fontWeight: 500 }}>{fmtNum(d.value, format)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Sparkline (tiny inline trend) ----------
export function Sparkline(props: { data: number[]; color?: string; width?: number; height?: number }) {
  const { data, color = CHART_COLORS[0], width = 90, height = 26 } = props;
  if (data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data), span = max - min || 1;
  const pts = data.map((v, i) =>
    (i / (data.length - 1)) * width + "," + (height - ((v - min) / span) * height)).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
