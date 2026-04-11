import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createChart, ColorType } from "lightweight-charts";
import * as api from "../lib/api";

type KlineRow = { t: number; open: number; high: number; low: number; close: number; volume: number };
type Ticker   = { price: number; change24h: number; high24h: number; low24h: number; volume24h: number };
type OBLevel  = { price: number; size: number };
type Trade    = { price: number; size: number; side: "BUY" | "SELL"; ts: number };

const TFS = ["15m", "1h", "4h", "1d"] as const;
type TF = typeof TFS[number];

const toSec = (t: number) => (t > 1_000_000_000_000 ? Math.floor(t / 1000) : t);

function fmtPrice(n: number) {
  if (!n) return "—";
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (n >= 1)    return n.toFixed(4);
  return n.toFixed(6);
}
function fmtVol(n: number) {
  if (!n) return "—";
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000)         return (n / 1_000).toFixed(2) + "K";
  return n.toFixed(2);
}
function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function MarketChart() {
  const nav = useNavigate();
  const { symbol: symParam } = useParams();
  const symbol = (symParam || "BTCUSDT").toUpperCase();
  const base   = symbol.replace("USDT", "");

  const [tf, setTf]         = useState<TF>("1h");
  const [ticker, setTicker] = useState<Ticker | null>(null);
  const [asks, setAsks]     = useState<OBLevel[]>([]);
  const [bids, setBids]     = useState<OBLevel[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [klines, setKlines] = useState<KlineRow[]>([]);
  const [loading, setLoading] = useState(true);

  const candleRef = useRef<HTMLDivElement>(null);

  // ── Data fetchers ─────────────────────────────────────────────────────────
  const loadTicker = useCallback(async () => {
    try {
      const r = await api.apiRequest(`/market/ticker/${symbol}`, { method: "GET" }) as Ticker;
      setTicker(r);
    } catch {}
  }, [symbol]);

  const loadOrderbook = useCallback(async () => {
    try {
      const r = await api.apiRequest(`/market/orderbook/${symbol}?depth=15`, { method: "GET" }) as { asks: OBLevel[]; bids: OBLevel[] };
      setAsks(r.asks || []);
      setBids(r.bids || []);
    } catch {}
  }, [symbol]);

  const loadTrades = useCallback(async () => {
    try {
      const r = await api.apiRequest(`/market/trades/${symbol}?limit=20`, { method: "GET" }) as { trades: Trade[] };
      setTrades(r.trades || []);
    } catch {}
  }, [symbol]);

  const loadKlines = useCallback(async () => {
    try {
      const r = await api.apiRequest(`/klines/${symbol}?tf=${tf}&limit=200`, { method: "GET" }) as { klines: KlineRow[] };
      setKlines(Array.isArray(r.klines) ? r.klines : []);
    } catch {}
  }, [symbol, tf]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    Promise.all([loadTicker(), loadOrderbook(), loadTrades(), loadKlines()])
      .finally(() => setLoading(false));
  }, [symbol, tf]);

  // Polling
  useEffect(() => {
    const fast = setInterval(() => { loadTicker(); loadOrderbook(); loadTrades(); }, 4000);
    const slow = setInterval(() => loadKlines(), 30000);
    return () => { clearInterval(fast); clearInterval(slow); };
  }, [loadTicker, loadOrderbook, loadTrades, loadKlines]);

  // ── Candlestick chart ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!candleRef.current || klines.length === 0) return;
    const container = candleRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "rgba(9,15,30,0)" },
        textColor: "#9ca3af",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(75,85,99,0.15)" },
        horzLines: { color: "rgba(75,85,99,0.15)" },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: "rgba(75,85,99,0.25)" },
      timeScale: { borderColor: "rgba(75,85,99,0.25)", timeVisible: true, secondsVisible: false },
    });

    const series = chart.addCandlestickSeries({
      upColor: "#00ff9d", downColor: "#ff5078",
      borderUpColor: "#00ff9d", borderDownColor: "#ff5078",
      wickUpColor: "#00ff9d", wickDownColor: "#ff5078",
    });

    series.setData(klines.map((k) => ({
      time: toSec(k.t) as any,
      open: Number(k.open), high: Number(k.high),
      low: Number(k.low), close: Number(k.close),
    })));
    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => chart.applyOptions({ width: container.clientWidth }));
    ro.observe(container);
    return () => { ro.disconnect(); chart.remove(); };
  }, [klines]);

  // ── Orderbook max size for bar widths ─────────────────────────────────────
  const maxSize = Math.max(...asks.map((a) => a.size), ...bids.map((b) => b.size), 0.0001);
  const positive = (ticker?.change24h ?? 0) >= 0;

  return (
    <div style={{ color: "white", display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <button
          onClick={() => nav("/market")}
          style={{
            borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.04)", color: "white",
            padding: "8px 14px", cursor: "pointer", fontWeight: 900, fontSize: 13,
          }}
        >
          ← Back
        </button>

        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontSize: 22, fontWeight: 950 }}>{base}<span style={{ opacity: 0.45, fontSize: 16 }}>/USDT</span></span>
          <span style={{ fontSize: 22, fontWeight: 900, fontFamily: "monospace", color: positive ? "#00ff9d" : "#ff5078" }}>
            ${fmtPrice(ticker?.price ?? 0)}
          </span>
          <span style={{
            padding: "3px 10px", borderRadius: 8, fontWeight: 900, fontSize: 13,
            background: positive ? "rgba(0,255,157,0.12)" : "rgba(255,80,120,0.12)",
            color: positive ? "#00ff9d" : "#ff5078",
          }}>
            {positive ? "+" : ""}{(ticker?.change24h ?? 0).toFixed(2)}%
          </span>
        </div>

        <div style={{ display: "flex", gap: 20, fontSize: 12, opacity: 0.6, flexWrap: "wrap" }}>
          <span>24h High <b style={{ color: "#00ff9d" }}>${fmtPrice(ticker?.high24h ?? 0)}</b></span>
          <span>24h Low <b style={{ color: "#ff5078" }}>${fmtPrice(ticker?.low24h ?? 0)}</b></span>
          <span>24h Vol <b style={{ color: "white", opacity: 1 }}>{fmtVol(ticker?.volume24h ?? 0)} USDT</b></span>
        </div>
      </div>

      {/* ── Main layout: chart left, orderbook+trades right ─────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 12, flex: 1, minHeight: 0 }}>

        {/* Chart + TF selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* TF buttons */}
          <div style={{ display: "flex", gap: 6 }}>
            {TFS.map((t) => (
              <button key={t} onClick={() => setTf(t)} style={{
                padding: "6px 14px", borderRadius: 8, fontWeight: 800, fontSize: 12,
                cursor: "pointer",
                background: tf === t ? "rgba(0,255,224,0.12)" : "rgba(255,255,255,0.04)",
                border: tf === t ? "1px solid rgba(0,255,224,0.3)" : "1px solid rgba(255,255,255,0.08)",
                color: tf === t ? "#00ffe0" : "rgba(255,255,255,0.65)",
              }}>
                {t}
              </button>
            ))}
          </div>

          {/* Candlestick chart */}
          <div style={{
            background: "rgba(9,15,30,0.92)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, flex: 1, minHeight: 400, overflow: "hidden", position: "relative",
          }}>
            {loading && klines.length === 0 ? (
              <div style={{ padding: 30, opacity: 0.5 }}>Loading chart…</div>
            ) : (
              <div ref={candleRef} style={{ width: "100%", height: "100%" }} />
            )}
          </div>
        </div>

        {/* Right panel: order book + recent trades */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>

          {/* Order book */}
          <div style={{
            background: "rgba(9,15,30,0.92)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, overflow: "hidden", flex: 1,
          }}>
            <div style={{
              padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)",
              fontSize: 12, fontWeight: 900, opacity: 0.7, textTransform: "uppercase", letterSpacing: 1,
            }}>
              Order Book
            </div>

            {/* Column headers */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              padding: "6px 14px", fontSize: 10, opacity: 0.4, fontWeight: 700,
              borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}>
              <span>Price (USDT)</span>
              <span style={{ textAlign: "right" }}>Size</span>
            </div>

            {/* Asks (sell orders) — show reversed so lowest ask is nearest mid */}
            {[...asks].reverse().slice(0, 8).map((a, i) => (
              <div key={i} style={{ position: "relative", padding: "3px 14px" }}>
                <div style={{
                  position: "absolute", right: 0, top: 0, bottom: 0,
                  width: `${Math.min(100, (a.size / maxSize) * 100)}%`,
                  background: "rgba(255,80,120,0.08)",
                }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", position: "relative", fontSize: 12 }}>
                  <span style={{ color: "#ff5078", fontFamily: "monospace", fontWeight: 700 }}>{fmtPrice(a.price)}</span>
                  <span style={{ textAlign: "right", opacity: 0.7, fontFamily: "monospace" }}>{a.size.toFixed(4)}</span>
                </div>
              </div>
            ))}

            {/* Spread / mid price */}
            <div style={{
              padding: "6px 14px", borderTop: "1px solid rgba(255,255,255,0.04)",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              fontSize: 13, fontWeight: 900, color: positive ? "#00ff9d" : "#ff5078",
              fontFamily: "monospace",
            }}>
              ${fmtPrice(ticker?.price ?? 0)}
            </div>

            {/* Bids (buy orders) */}
            {bids.slice(0, 8).map((b, i) => (
              <div key={i} style={{ position: "relative", padding: "3px 14px" }}>
                <div style={{
                  position: "absolute", right: 0, top: 0, bottom: 0,
                  width: `${Math.min(100, (b.size / maxSize) * 100)}%`,
                  background: "rgba(0,255,157,0.08)",
                }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", position: "relative", fontSize: 12 }}>
                  <span style={{ color: "#00ff9d", fontFamily: "monospace", fontWeight: 700 }}>{fmtPrice(b.price)}</span>
                  <span style={{ textAlign: "right", opacity: 0.7, fontFamily: "monospace" }}>{b.size.toFixed(4)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Recent trades */}
          <div style={{
            background: "rgba(9,15,30,0.92)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, overflow: "hidden", maxHeight: 280,
          }}>
            <div style={{
              padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)",
              fontSize: 12, fontWeight: 900, opacity: 0.7, textTransform: "uppercase", letterSpacing: 1,
            }}>
              Recent Trades
            </div>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
              padding: "6px 14px", fontSize: 10, opacity: 0.4, fontWeight: 700,
              borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}>
              <span>Price</span><span style={{ textAlign: "center" }}>Size</span><span style={{ textAlign: "right" }}>Time</span>
            </div>
            <div style={{ overflowY: "auto", maxHeight: 200 }}>
              {trades.map((t, i) => {
                const buy = t.side === "BUY";
                return (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                    padding: "3px 14px", fontSize: 12,
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                  }}>
                    <span style={{ color: buy ? "#00ff9d" : "#ff5078", fontFamily: "monospace", fontWeight: 700 }}>
                      {fmtPrice(t.price)}
                    </span>
                    <span style={{ textAlign: "center", opacity: 0.65, fontFamily: "monospace" }}>{t.size.toFixed(4)}</span>
                    <span style={{ textAlign: "right", opacity: 0.4, fontSize: 10 }}>{fmtTime(t.ts)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
