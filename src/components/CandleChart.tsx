// frontend/src/components/CandleChart.tsx
import React, { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  type CandlestickData,
  type Time,
} from "lightweight-charts";

interface CandleChartProps {
  symbol: string;
}

const CandleChart: React.FC<CandleChartProps> = ({ symbol }) => {
  const divRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!divRef.current) return;

    const chart = createChart(divRef.current, {
      width: divRef.current.clientWidth,
      height: 230,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(255,255,255,0.9)",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.06)" },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: true },
      crosshair: {
        mode: 0,
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: "#22ff99",
      downColor: "#ff3260",
      borderUpColor: "#22ff99",
      borderDownColor: "#ff3260",
      wickUpColor: "#cccccc",
      wickDownColor: "#cccccc",
    });

    // simple fake candles so we ALWAYS see a chart
    const now = Math.floor(Date.now() / 1000);
    const candles: CandlestickData<Time>[] = [];

    for (let i = 0; i < 40; i++) {
      const t = (now - (40 - i) * 60) as Time;
      const base = 90000;
      const open = base + Math.sin(i / 4) * 250 + (Math.random() - 0.5) * 120;
      const close = open + (Math.random() - 0.5) * 220;
      const high = Math.max(open, close) + Math.random() * 80;
      const low = Math.min(open, close) - Math.random() * 80;

      candles.push({ time: t, open, high, low, close });
    }

    series.setData(candles);

    const onResize = () => {
      if (!divRef.current) return;
      chart.applyOptions({ width: divRef.current.clientWidth });
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      chart.remove();
    };
  }, [symbol]);

  return (
    <div
      ref={divRef}
      style={{
        width: "100%",
        height: "230px", // important, otherwise it can be 0px
      }}
    />
  );
};

export default CandleChart;
