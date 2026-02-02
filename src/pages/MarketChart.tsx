import React, { useEffect, useMemo, useState } from "react";
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
import * as api from "../lib/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

type KlineRow = {
  t: number; // timestamp (ms or seconds depending on backend)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type PriceResponse = { symbol: string; price: number | string };

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

// if backend returns seconds, convert to ms
const toMs = (t: number) => {
  // 10^12 is ~2001 in ms; anything smaller is probably seconds
  return t < 1_000_000_000_000 ? t * 1000 : t;
};

export default function MarketChart() {
  const nav = useNavigate();
  const { symbol: symParam } = useParams();
  const symbol = (symParam || "BTCUSDT").toUpperCase();

  const [tf, setTf] = useState<"15m" | "1h" | "4h" | "1d">("1h");
  const [price, setPrice] = useState<number | null>(null);
  const [klines, setKlines] = useState<KlineRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadPrice = async () => {
    const out = (await api.apiRequest(`/price/${symbol}`, {
      method: "GET",
    })) as PriceResponse;

    const p = typeof out.price === "string" ? Number(out.price) : out.price;
    setPrice(Number.isNaN(p) ? null : p);
  };

  const loadKlines = async () => {
    // expects backend endpoint: GET /klines/{symbol}?tf=1h&limit=200
    const out = (await api.apiRequest(
      `/klines/${symbol}?tf=${encodeURIComponent(tf)}&limit=200`,
      { method: "GET" }
    )) as { symbol: string; tf: string; klines: KlineRow[]; note?: string };

    const rows = Array.isArray(out.klines) ? out.klines : [];
    setKlines(rows);
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

    const id = setInterval(() => {
      loadPrice().catch(() => {});
    }, 5000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, tf]);

  const chartData = useMemo<ChartData<"line", number[], string>>(() => {
    return {
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
    };
  }, [klines, symbol]);

  const chartOptions = useMemo<ChartOptions<"line">>(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { labels: { color: "#e5e7eb" } },
        tooltip: { enabled: true },
      },
      scales: {
        x: {
          ticks: { color: "#9ca3af", maxTicksLimit: 8 },
          grid: { color: "rgba(75,85,99,0.18)" },
        },
        y: {
          ticks: { color: "#9ca3af" },
          grid: { color: "rgba(75,85,99,0.18)" },
        },
      },
    };
  }, []);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 28, fontWeight: 950 }}>{symbol}</div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>
            Live price: <b>${formatNumber(price, 2)}</b> (refresh every 5s)
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {(["15m", "1h", "4h", "1d"] as const).map((t) => (
              <button key={t} onClick={() => setTf(t)} style={btn(tf === t)}>
                {t}
              </button>
            ))}
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

        {err && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(248,113,113,0.5)",
              background: "rgba(220,38,38,0.10)",
              color: "#fecaca",
            }}
          >
            <b>Chart error:</b> {err}
          </div>
        )}

        <div style={{ marginTop: 12, height: 460 }}>
          {loading ? (
            <div style={{ opacity: 0.75 }}>Loading chart…</div>
          ) : klines.length === 0 ? (
            <div style={{ opacity: 0.75 }}>
              No kline data. (Check backend: /klines/{symbol}?tf={tf}&limit=200)
            </div>
          ) : (
            <Line data={chartData} options={chartOptions} />
          )}
        </div>
      </div>
    </div>
  );
}
