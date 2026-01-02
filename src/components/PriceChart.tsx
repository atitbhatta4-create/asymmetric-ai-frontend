// frontend/src/components/PriceChart.tsx

import React from "react";

export interface PriceChartTrade {
  equity_after: number;
  created_at: string;
}

interface PriceChartProps {
  trades: PriceChartTrade[];
}

/**
 * Simple equity curve:
 * - nice padding
 * - subtle grid lines
 * - works with any number of trades
 */
export const PriceChart: React.FC<PriceChartProps> = ({ trades }) => {
  if (!trades || trades.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
        No trades yet — your equity line will appear here after you start placing trades.
      </div>
    );
  }

  const values = trades.map((t) => t.equity_after);
  const min = Math.min(...values);
  const max = Math.max(...values);

  // add some padding so the line doesn't stick to the edges
  const range = max - min || 1;
  const padding = range * 0.1;
  const yMin = min - padding;
  const yMax = max + padding;

  const n = trades.length;
  const points = trades
    .map((t, idx) => {
      const x =
        n === 1 ? 0 : (idx / (n - 1)) * 100; // 0..100 horizontally
      const norm = (t.equity_after - yMin) / (yMax - yMin); // 0..1
      const y = 100 - norm * 100; // invert for SVG (0 at top)
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full h-full rounded-xl bg-slate-900/60"
    >
      {/* grid lines */}
      {[25, 50, 75].map((y) => (
        <line
          key={y}
          x1={0}
          y1={y}
          x2={100}
          y2={y}
          stroke="rgba(148,163,184,0.25)"
          strokeWidth={0.3}
        />
      ))}

      {/* equity area fill */}
      <polyline
        points={`0,100 ${points} 100,100`}
        fill="rgba(74,222,128,0.08)"
        stroke="none"
      />

      {/* equity line */}
      <polyline
        points={points}
        fill="none"
        stroke="rgb(74,222,128)"
        strokeWidth={1.2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* last point dot */}
      {points && (
        <circle
          cx={100}
          cy={
            (() => {
              const last = trades[trades.length - 1];
              const norm = (last.equity_after - yMin) / (yMax - yMin);
              return 100 - norm * 100;
            })()
          }
          r={1.5}
          fill="rgb(74,222,128)"
        />
      )}
    </svg>
  );
};
