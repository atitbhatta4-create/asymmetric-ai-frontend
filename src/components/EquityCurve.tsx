// src/components/EquityCurve.tsx
import React, { useMemo } from "react";

type Props = {
  series: number[];
  height?: number;
  startLabel?: string;
};

function fmt(n: number) {
  if (!isFinite(n)) return "-";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function EquityCurve({ series, height = 240, startLabel = "Start" }: Props) {
  const { path, area, min, max, last, start, w, h, pad, ticks } = useMemo(() => {
    const data = (series || []).filter((x) => isFinite(x));
    const safe = data.length ? data : [1000];

    const w = 720; // internal svg width (scales responsively)
    const h = height;
    const pad = 22;

    const rawMin = Math.min(...safe);
    const rawMax = Math.max(...safe);

    // add a small padding so tiny moves still look visible
    const span = Math.max(1e-9, rawMax - rawMin);
    const paddedMin = rawMin - span * 0.12;
    const paddedMax = rawMax + span * 0.12;

    const xStep = (w - pad * 2) / Math.max(1, safe.length - 1);

    const pts = safe.map((v, i) => {
      const x = pad + i * xStep;
      const y = pad + (h - pad * 2) * (1 - (v - paddedMin) / Math.max(1e-9, paddedMax - paddedMin));
      return { x, y, v };
    });

    const d = pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
    const a = `${d} L ${w - pad} ${h - pad} L ${pad} ${h - pad} Z`;

    // y-axis ticks (5 lines)
    const tickCount = 5;
    const ticks = Array.from({ length: tickCount }, (_, i) => {
      const t = i / (tickCount - 1);
      const y = pad + (h - pad * 2) * t;
      const v = paddedMax - (paddedMax - paddedMin) * t;
      return { y, v };
    });

    return {
      path: d,
      area: a,
      min: paddedMin,
      max: paddedMax,
      last: safe[safe.length - 1],
      start: safe[0],
      w,
      h,
      pad,
      ticks,
    };
  }, [series, height]);

  const delta = last - start;
  const pct = start ? (delta / start) * 100 : 0;
  const up = delta >= 0;

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          {startLabel}: <b>${fmt(start)}</b>
        </div>
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          Last: <b>${fmt(last)}</b>
        </div>
        <div style={{ fontSize: 13, opacity: 0.9 }}>
          Change:{" "}
          <b style={{ color: up ? "rgba(0,255,209,0.95)" : "rgba(255,80,120,0.95)" }}>
            {up ? "+" : ""}
            ${fmt(delta)} ({up ? "+" : ""}
            {fmt(pct)}%)
          </b>
        </div>
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={height} preserveAspectRatio="none">
        <defs>
          <linearGradient id="eqFill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(0,255,209,0.00)" />
            <stop offset="100%" stopColor="rgba(0,255,209,0.18)" />
          </linearGradient>
        </defs>

        {/* grid */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={pad} x2={w - pad} y1={t.y} y2={t.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <text x={pad} y={t.y - 6} fontSize="12" fill="rgba(255,255,255,0.45)">
              ${fmt(t.v)}
            </text>
          </g>
        ))}

        {/* area */}
        <path d={area} fill="url(#eqFill)" />

        {/* line */}
        <path d={path} fill="none" stroke="rgba(0,255,209,0.95)" strokeWidth="3" />

        {/* start + end dots */}
        <circle cx={pad} cy={ticks[ticks.length - 1].y} r="0" />
      </svg>
    </div>
  );
}
