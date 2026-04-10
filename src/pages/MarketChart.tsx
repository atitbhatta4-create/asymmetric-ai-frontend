import React, { useEffect, useRef, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { createChart, ColorType } from "lightweight-charts";
import * as api from "../lib/api";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

type KlineRow = {
  t: number; // timestamp ms or seconds from backend
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type PriceResponse = { symbol: string; price: number | string };
type ChartType = "line" | "candle";

const card: React.CSSProperties = {
  background: "rgba(9, 15, 30, 0.96)",
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 0 30px rgba(0,0,0,0.6)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "white",
};

const btn = (active: boolean): React.CSSProperties => ({
  borderRadius: 999,
  border: active
    ? "1px solid rgba(0,255,224,0.35)"
    : "1px solid rgba(255,255,255,0.10)",
  background: active ? "rgba(0,255,224,0.10)" : "rgba(255,255,255,0.04)",
  color: "white",
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 900,
});

const formatNumber = (n: number | null | undefined, digits = 2) => {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return Number(n).toFixed(digits);
};

// Convert to seconds for lightweight-charts (it needs Unix seconds)
const toSec = (t: number) =>
  t > 1_000_000_000_000 ? Math.floor(t / 1000) : t;

// Convert to ms for Chart.js labels
const toMs = (t: number) =>
  t < 1_000_000_000_000 ? t * 1000 : t;

export default function MarketChart() {
  const nav = useNavigate();
  const { symbol: symParam } = useParams();
  const symbol = (symParam || "BTCUSDT").toUpperCase();

  const [tf, setTf] = useState<"15m" | "1h" | "4h" | "1d">("1h");
  const [chartType, setChartType] = useState<ChartType>("candle");
  const [price, setPrice] = useState<number | null>(null);
  const [klines, setKlines] = useState<KlineRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [exchange, setExchange] = useState<string>("okx");

  // Ref for candlestick chart container
  const candleRef = useRef<HTMLDivElement>(null);

  // Fetch the user's connected exchange once on mount
  useEffect(() => {
    api.apiRequest("/exchange/status", { method: "GET" })
      .then((res: any) => {
        if (res?.connected && res?.exchange) {
          setExchange(res.exchange.toLowerCase());
        }
      })
      .catch(() => {});
  }, []);

  const loadPrice = async () => {
    const out = (await api.apiRequest(
      `/price/${symbol}?exchange=${encodeURIComponent(exchange)}`,
      { method: "GET" }
    )) as PriceResponse;
    const p = typeof out.price === "string" ? Number(out.price) : out.price;
    setPrice(Number.isNaN(p) ? null : p);
  };

  const loadKlines = async () => {
    const path = `/klines/${symbol}?tf=${encodeURIComponent(tf)}&limit=200&exchange=${encodeURIComponent(exchange)}`;
    const out = (await api.apiRequest(path, { method: "GET" })) as {
      symbol: string;
      tf: string;
      klines: KlineRow[];
    };
    setKlines(Array.isArray(out.klines) ? out.klines : []);
  };

  const refreshAll = async () => {
    setErr(null);
    setLoading(true);
    try {
      await Promise.all([loadPrice(), loadKlines()]);
    } catch (e: any) {
      setErr(e?.message || "Failed to load chart data");
      setKlines([]);
      setPrice(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
    const id = setInterval(() => loadPrice().catch(() => {}), 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, tf, exchange]);

  // ── Candlestick chart (lightweight-charts) ──────────────────────────────
  useEffect(() => {
    if (chartType !== "candle" || !candleRef.current || klines.length === 0) return;

    const container = candleRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 460,
      layout: {
        background: { type: ColorType.Solid, color: "rgba(9,15,30,0)" },
        textColor: "#9ca3af",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(75,85,99,0.18)" },
        horzLines: { color: "rgba(75,85,99,0.18)" },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: "rgba(75,85,99,0.25)" },
      timeScale: {
        borderColor: "rgba(75,85,99,0.25)",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#00ff9d",
      downColor: "#ff5078",
      borderUpColor: "#00ff9d",
      borderDownColor: "#ff5078",
      wickUpColor: "#00ff9d",
      wickDownColor: "#ff5078",
    });

    const data = klines.map((k) => ({
      time: toSec(k.t) as any,
      open: Number(k.open),
      high: Number(k.high),
      low: Number(k.low),
      close: Number(k.close),
    }));

    candleSeries.setData(data);
    chart.timeScale().fitContent();

    // Resize observer
    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: container.clientWidth });
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [klines, chartType]);

  // ── Line chart (Chart.js) ───────────────────────────────────────────────
  const chartData = useMemo<ChartData<"line", number[], string>>(() => ({
    labels: klines.map((k) => new Date(toMs(k.t)).toLocaleString()),
    datasets: [
      {
        label: `${symbol} Close`,
        data: klines.map((k) => Number(k.close)),
        tension: 0.25,
        pointRadius: 0,
        borderWidth: 2,
        borderColor: "#00ffe0",
        backgroundColor: "rgba(0,255,224,0.12)",
        fill: false,
      },
    ],
  }), [klines, symbol]);

  const chartOptions = useMemo<ChartOptions<"line">>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { labels: { color: "#e5e7eb" } },
      tooltip: { enabled: true },
    },
    scales: {
      x: { ticks: { color: "#9ca3af", maxTicksLimit: 8 }, grid: { color: "rgba(75,85,99,0.18)" } },
      y: { ticks: { color: "#9ca3af" }, grid: { color: "rgba(75,85,99,0.18)" } },
    },
  }), []);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 950 }}>{symbol}</div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>
            Live price: <b>${formatNumber(price, 2)}</b>&nbsp;·&nbsp;
            <span style={{ textTransform: "uppercase", color: "#00ffe0" }}>{exchange}</span>
          </div>
        </div>
        <button
          onClick={() => nav("/market")}
          style={{
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.04)",
            color: "white",
            padding: "10px 14px",
            cursor: "pointer",
            fontWeight: 900,
          }}
        >
          ← Back
        </button>
      </div>

      <div style={card}>
        {/* Controls row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {/* Timeframe buttons */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(["15m", "1h", "4h", "1d"] as const).map((t) => (
              <button key={t} onClick={() => setTf(t)} style={btn(tf === t)}>
                {t}
              </button>
            ))}
          </div>

          {/* Chart type toggle + Refresh */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", borderRadius: 999, overflow: "hidden", border: "1px solid rgba(255,255,255,0.10)" }}>
              <button
                onClick={() => setChartType("candle")}
                style={{
                  padding: "8px 14px",
                  fontWeight: 900,
                  cursor: "pointer",
                  border: "none",
                  background: chartType === "candle" ? "rgba(0,255,224,0.15)" : "rgba(255,255,255,0.04)",
                  color: chartType === "candle" ? "#00ffe0" : "rgba(255,255,255,0.65)",
                  fontSize: 13,
                }}
              >
                Candles
              </button>
              <button
                onClick={() => setChartType("line")}
                style={{
                  padding: "8px 14px",
                  fontWeight: 900,
                  cursor: "pointer",
                  border: "none",
                  borderLeft: "1px solid rgba(255,255,255,0.10)",
                  background: chartType === "line" ? "rgba(0,255,224,0.15)" : "rgba(255,255,255,0.04)",
                  color: chartType === "line" ? "#00ffe0" : "rgba(255,255,255,0.65)",
                  fontSize: 13,
                }}
              >
                Line
              </button>
            </div>

            <button
              onClick={refreshAll}
              style={{
                borderRadius: 999,
                border: "none",
                padding: "10px 16px",
                fontWeight: 950,
                cursor: "pointer",
                background: "linear-gradient(90deg,#00ff9d,#00ffe0)",
                color: "#021018",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>
        </div>

        {/* Error */}
        {err && (
          <div style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(248,113,113,0.5)",
            background: "rgba(220,38,38,0.10)",
            color: "#fecaca",
          }}>
            <b>Chart error:</b> {err}
          </div>
        )}

        {/* Chart area */}
        <div style={{ marginTop: 12, height: 460, position: "relative" }}>
          {loading ? (
            <div style={{ opacity: 0.75, paddingTop: 20 }}>Loading chart…</div>
          ) : klines.length === 0 ? (
            <div style={{ opacity: 0.75, paddingTop: 20 }}>No data available.</div>
          ) : chartType === "candle" ? (
            <div ref={candleRef} style={{ width: "100%", height: "100%" }} />
          ) : (
            <Line data={chartData} options={chartOptions} />
          )}
        </div>
      </div>
    </div>
  );
}
