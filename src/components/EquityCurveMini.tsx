import React, { useMemo, useRef, useState } from "react";

type Props = {
  series: number[];
  className?: string;
};

function fmt(n: number) {
  if (!isFinite(n)) return "-";
  // keep it clean for equity
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function EquityCurveMini({ series, className }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);

  const data = useMemo(() => {
    const s = (series || []).filter((x) => isFinite(x));
    return s.length ? s : [1000];
  }, [series]);

  // Viewbox (fixed), responsive through width/height:100%
  const W = 760;
  const H = 320;
  const padL = 52;
  const padR = 16;
  const padT = 14;
  const padB = 28;

  const { min, max, pts, pathD, areaD, yAt, idxAtX, labels } = useMemo(() => {
    const mn = Math.min(...data);
    const mx = Math.max(...data);

    // add a little padding so it doesn't stick to edges
    const spanRaw = Math.max(1e-6, mx - mn);
    const pad = spanRaw * 0.12;
    const minV = mn - pad;
    const maxV = mx + pad;
    const span = Math.max(1e-6, maxV - minV);

    const innerW = W - padL - padR;
    const innerH = H - padT - padB;

    const xStep = innerW / Math.max(1, data.length - 1);

    const points = data.map((v, i) => {
      const x = padL + i * xStep;
      const y = padT + innerH * (1 - (v - minV) / span);
      return { x, y, v };
    });

    // Smooth curve with quadratic bezier
    const smoothPath = () => {
      if (points.length <= 1) return `M ${points[0].x} ${points[0].y}`;
      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const cur = points[i];
        const midX = (prev.x + cur.x) / 2;
        d += ` Q ${midX} ${prev.y} ${cur.x} ${cur.y}`;
      }
      return d;
    };

    const lineD = smoothPath();

    const lastX = points[points.length - 1].x;
    const baseY = H - padB;
    const area = `${lineD} L ${lastX} ${baseY} L ${points[0].x} ${baseY} Z`;

    const yValueAt = (x: number) => {
      // clamp index by x to nearest point
      const i = Math.round((x - padL) / xStep);
      const idx = Math.max(0, Math.min(points.length - 1, i));
      return { idx, ...points[idx] };
    };

    const idxAt = (x: number) => {
      const i = Math.round((x - padL) / xStep);
      return Math.max(0, Math.min(points.length - 1, i));
    };

    const mid = (minV + maxV) / 2;

    return {
      min: minV,
      max: maxV,
      pts: points,
      pathD: lineD,
      areaD: area,
      yAt: yValueAt,
      idxAtX: idxAt,
      labels: {
        min: minV,
        mid,
        max: maxV,
      },
    };
  }, [data]);

  const last = data[data.length - 1];
  const start = data[0];
  const delta = last - start;
  const pct = (delta / (start || 1)) * 100;

  const onMove = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const x = padL + xPct * (W - padL - padR);
    setHoverX(Math.max(padL, Math.min(W - padR, x)));
  };

  const onLeave = () => setHoverX(null);

  const hover = hoverX != null ? yAt(hoverX) : null;

  // Grid
  const gridY = 5; // horizontal lines
  const gridX = 6; // vertical lines

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 14,
        background: "rgba(0,0,0,.18)",
        border: "1px solid rgba(255,255,255,.07)",
        overflow: "hidden",
        position: "relative",
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="none">
        <defs>
          <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,255,209,0.28)" />
            <stop offset="100%" stopColor="rgba(0,255,209,0.00)" />
          </linearGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="2.2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid */}
        <g>
          {Array.from({ length: gridY }).map((_, i) => {
            const y = padT + ((H - padT - padB) * i) / (gridY - 1);
            return <line key={i} x1={padL} x2={W - padR} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
          })}
          {Array.from({ length: gridX }).map((_, i) => {
            const x = padL + ((W - padL - padR) * i) / (gridX - 1);
            return <line key={i} y1={padT} y2={H - padB} x1={x} x2={x} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />;
          })}
        </g>

        {/* Y-axis labels */}
        <g fontSize="12" fill="rgba(255,255,255,0.55)" fontWeight="800">
          <text x={10} y={padT + 12}>{fmt(labels.max)}</text>
          <text x={10} y={padT + (H - padT - padB) / 2 + 4}>{fmt(labels.mid)}</text>
          <text x={10} y={H - padB - 6}>{fmt(labels.min)}</text>
        </g>

        {/* Area */}
        <path d={areaD} fill="url(#eqFill)" />

        {/* Line (glow + main) */}
        <path d={pathD} fill="none" stroke="rgba(0,255,209,0.32)" strokeWidth="7" filter="url(#glow)" />
        <path d={pathD} fill="none" stroke="rgba(0,255,209,0.95)" strokeWidth="3.2" />

        {/* Last point marker */}
        {pts.length > 0 && (
          <>
            <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="6" fill="rgba(0,255,209,0.95)" />
            <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="10" fill="rgba(0,255,209,0.10)" />
          </>
        )}

        {/* Hover crosshair + tooltip */}
        {hover && (
          <>
            <line x1={hover.x} x2={hover.x} y1={padT} y2={H - padB} stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
            <circle cx={hover.x} cy={hover.y} r="5" fill="rgba(255,255,255,0.92)" />
            <circle cx={hover.x} cy={hover.y} r="9" fill="rgba(255,255,255,0.10)" />

            {/* Tooltip box */}
            <g>
              <rect
                x={Math.min(W - 220, hover.x + 10)}
                y={Math.max(padT + 6, hover.y - 34)}
                width="210"
                height="28"
                rx="10"
                fill="rgba(9, 15, 30, 0.92)"
                stroke="rgba(255,255,255,0.12)"
              />
              <text
                x={Math.min(W - 220, hover.x + 10) + 10}
                y={Math.max(padT + 6, hover.y - 34) + 18}
                fontSize="12"
                fill="rgba(255,255,255,0.85)"
                fontWeight="900"
              >
                Equity: {fmt(hover.v)} • point #{hover.idx + 1}
              </text>
            </g>
          </>
        )}
      </svg>

      {/* Small top overlay like market header */}
      <div
        style={{
          position: "absolute",
          left: 12,
          top: 10,
          display: "flex",
          gap: 10,
          alignItems: "center",
          fontWeight: 900,
          fontSize: 12,
          color: "rgba(255,255,255,0.75)",
          pointerEvents: "none",
        }}
      >
        <span style={{ color: "rgba(0,255,209,0.95)" }}>Equity</span>
        <span>•</span>
        <span style={{ color: "rgba(255,255,255,0.9)" }}>${fmt(last)}</span>
        <span
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.10)",
            background: delta >= 0 ? "rgba(0,255,209,0.12)" : "rgba(255,80,120,0.12)",
            color: delta >= 0 ? "rgba(0,255,209,0.95)" : "rgba(255,80,120,0.95)",
          }}
        >
          {delta >= 0 ? "+" : ""}
          {fmt(delta)} ({pct >= 0 ? "+" : ""}
          {pct.toFixed(2)}%)
        </span>
      </div>
    </div>
  );
}
