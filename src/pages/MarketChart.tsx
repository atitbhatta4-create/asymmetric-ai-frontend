import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createChart, ColorType } from "lightweight-charts";
import * as api from "../lib/api";

type KlineRow = { t: number; open: number; high: number; low: number; close: number; volume: number };
type Ticker   = { price: number; change24h: number; high24h: number; low24h: number; volume24h: number };
type OBLevel  = { price: number; size: number };
type Trade    = { price: number; size: number; side: "BUY" | "SELL"; ts: number };
type TF = "15m" | "1h" | "4h" | "1d";

const TFS: TF[] = ["15m", "1h", "4h", "1d"];
const toSec = (t: number) => (t > 1_000_000_000_000 ? Math.floor(t / 1000) : t);

function fmtPrice(n: number, decimals?: number) {
  if (!n) return "—";
  const d = decimals ?? (n >= 1000 ? 2 : n >= 1 ? 4 : 6);
  if (n >= 1000) return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
  return n.toFixed(d);
}
function fmtVol(n: number) {
  if (!n) return "—";
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000)         return (n / 1_000).toFixed(1) + "K";
  return n.toFixed(2);
}
function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function logoUrl(symbol: string) {
  return `https://assets.coincap.io/assets/icons/${symbol.replace("USDT","").toLowerCase()}@2x.png`;
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

  // ── Fetchers ──────────────────────────────────────────────────────────────
  const loadTicker = useCallback(async () => {
    try {
      const r = await api.apiRequest(`/market/ticker/${symbol}`, { method: "GET" }) as Ticker;
      setTicker(r);
    } catch {}
  }, [symbol]);

  const loadOrderbook = useCallback(async () => {
    try {
      const r = await api.apiRequest(`/market/orderbook/${symbol}?depth=20`, { method: "GET" }) as { asks: OBLevel[]; bids: OBLevel[] };
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

  useEffect(() => {
    setLoading(true);
    Promise.all([loadTicker(), loadOrderbook(), loadTrades(), loadKlines()]).finally(() => setLoading(false));
  }, [symbol, tf]);

  useEffect(() => {
    const fast = setInterval(() => { loadTicker(); loadOrderbook(); loadTrades(); }, 3000);
    const slow = setInterval(() => loadKlines(), 30000);
    return () => { clearInterval(fast); clearInterval(slow); };
  }, [loadTicker, loadOrderbook, loadTrades, loadKlines]);

  // ── Candlestick chart ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!candleRef.current || klines.length === 0) return;
    const container = candleRef.current;
    const chart = createChart(container, {
      width: container.clientWidth, height: container.clientHeight,
      layout: { background: { type: ColorType.Solid, color: "rgba(9,15,30,0)" }, textColor: "#9ca3af", attributionLogo: false },
      grid: { vertLines: { color: "rgba(75,85,99,0.13)" }, horzLines: { color: "rgba(75,85,99,0.13)" } },
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
      open: +k.open, high: +k.high, low: +k.low, close: +k.close,
    })));
    chart.timeScale().fitContent();
    const ro = new ResizeObserver(() => chart.applyOptions({ width: container.clientWidth }));
    ro.observe(container);
    return () => { ro.disconnect(); chart.remove(); };
  }, [klines]);

  // ── Order book calculations ───────────────────────────────────────────────
  const OB_ROWS = 12;
  const displayAsks = [...asks].reverse().slice(0, OB_ROWS); // lowest ask nearest to mid
  const displayBids = bids.slice(0, OB_ROWS);                // highest bid nearest to mid

  // Total cumulative size for percentage bar width
  const maxAskSize = displayAsks.reduce((s, a) => s + a.size, 0) || 1;
  const maxBidSize = displayBids.reduce((s, b) => s + b.size, 0) || 1;

  const positive = (ticker?.change24h ?? 0) >= 0;

  return (
    <div style={{ color: "white", display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <button onClick={() => nav("/market")} style={{
          borderRadius: 10, border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.04)", color: "white",
          padding: "7px 13px", cursor: "pointer", fontWeight: 800, fontSize: 13,
        }}>← Back</button>

        {/* Coin identity */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={logoUrl(symbol)} alt={base} width={36} height={36}
            style={{ borderRadius: "50%" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div>
            <div style={{ fontWeight: 950, fontSize: 18 }}>
              {base}<span style={{ opacity: 0.4, fontWeight: 600, fontSize: 14 }}>/USDT</span>
            </div>
            <div style={{ fontSize: 11, opacity: 0.45 }}>OKX · Perpetual</div>
          </div>
        </div>

        {/* Price + change */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontSize: 26, fontWeight: 900, fontFamily: "monospace", color: positive ? "#00ff9d" : "#ff5078" }}>
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

        {/* 24h stats */}
        <div style={{ display: "flex", gap: 24, fontSize: 12 }}>
          <div><div style={{ opacity: 0.4, fontSize: 10, marginBottom: 1 }}>24h High</div>
            <div style={{ fontWeight: 800, color: "#00ff9d" }}>${fmtPrice(ticker?.high24h ?? 0)}</div></div>
          <div><div style={{ opacity: 0.4, fontSize: 10, marginBottom: 1 }}>24h Low</div>
            <div style={{ fontWeight: 800, color: "#ff5078" }}>${fmtPrice(ticker?.low24h ?? 0)}</div></div>
          <div><div style={{ opacity: 0.4, fontSize: 10, marginBottom: 1 }}>24h Volume</div>
            <div style={{ fontWeight: 800 }}>{fmtVol(ticker?.volume24h ?? 0)} USDT</div></div>
        </div>
      </div>

      {/* ── TF selector ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 6 }}>
        {TFS.map((t) => (
          <button key={t} onClick={() => setTf(t)} style={{
            padding: "6px 16px", borderRadius: 8, fontWeight: 800, fontSize: 12,
            cursor: "pointer",
            background: tf === t ? "rgba(0,255,224,0.12)" : "rgba(255,255,255,0.04)",
            border: tf === t ? "1px solid rgba(0,255,224,0.3)" : "1px solid rgba(255,255,255,0.07)",
            color: tf === t ? "#00ffe0" : "rgba(255,255,255,0.55)",
          }}>{t}</button>
        ))}
      </div>

      {/* ── Candlestick chart ───────────────────────────────────────────────── */}
      <div style={{
        background: "rgba(9,15,30,0.92)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16, height: 420, overflow: "hidden", position: "relative",
      }}>
        {loading && klines.length === 0
          ? <div style={{ padding: 24, opacity: 0.4 }}>Loading chart…</div>
          : <div ref={candleRef} style={{ width: "100%", height: "100%" }} />
        }
      </div>

      {/* ── Order Book + Recent Trades ──────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 12 }}>

        {/* ── Bybit-style Order Book ── */}
        <div style={{ background: "rgba(9,15,30,0.92)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>

          {/* Header */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 900, fontSize: 13 }}>Order Book</span>
            <span style={{ fontSize: 11, opacity: 0.4 }}>Depth · real-time</span>
          </div>

          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "6px 16px", fontSize: 10, opacity: 0.4, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
            <span>Qty ({base})</span>
            <span style={{ textAlign: "center" }}>Price (USDT)</span>
            <span style={{ textAlign: "right" }}>Qty ({base})</span>
          </div>

          {/* Order book rows — bids left, asks right */}
          <div>
            {Array.from({ length: OB_ROWS }).map((_, i) => {
              const bid = displayBids[i];
              const ask = displayAsks[i];
              const bidPct = bid ? Math.min(100, (bid.size / maxBidSize) * 100) : 0;
              const askPct = ask ? Math.min(100, (ask.size / maxAskSize) * 100) : 0;

              return (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                  alignItems: "center", fontSize: 12, fontFamily: "monospace",
                  borderBottom: "1px solid rgba(255,255,255,0.025)",
                  minHeight: 28,
                }}>
                  {/* Bid (buy) side — green bar from right */}
                  <div style={{ position: "relative", padding: "4px 16px", overflow: "hidden" }}>
                    {bid && (
                      <>
                        <div style={{
                          position: "absolute", right: 0, top: 0, bottom: 0,
                          width: `${bidPct}%`, background: "rgba(0,255,157,0.12)",
                          transition: "width 0.4s ease",
                        }} />
                        <span style={{ position: "relative", color: "#00ff9d", fontWeight: 700 }}>
                          {bid.size.toFixed(4)}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Mid price (show both ask and bid price centered) */}
                  <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 1, padding: "2px 4px" }}>
                    {ask && (
                      <span style={{ color: "#ff5078", fontWeight: 800, fontSize: 11 }}>
                        {fmtPrice(ask.price)}
                      </span>
                    )}
                    {bid && (
                      <span style={{ color: "#00ff9d", fontWeight: 800, fontSize: 11 }}>
                        {fmtPrice(bid.price)}
                      </span>
                    )}
                  </div>

                  {/* Ask (sell) side — red bar from left */}
                  <div style={{ position: "relative", padding: "4px 16px", overflow: "hidden", textAlign: "right" }}>
                    {ask && (
                      <>
                        <div style={{
                          position: "absolute", left: 0, top: 0, bottom: 0,
                          width: `${askPct}%`, background: "rgba(255,80,120,0.12)",
                          transition: "width 0.4s ease",
                        }} />
                        <span style={{ position: "relative", color: "#ff5078", fontWeight: 700 }}>
                          {ask.size.toFixed(4)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Spread row */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
            padding: "8px 16px", borderTop: "1px solid rgba(255,255,255,0.06)",
            fontSize: 12,
          }}>
            <span style={{ opacity: 0.45 }}>
              Spread: {asks[0] && bids[0] ? `$${(asks[0].price - bids[0].price).toFixed(2)}` : "—"}
            </span>
            <span style={{ textAlign: "center", fontWeight: 900, fontSize: 14, color: positive ? "#00ff9d" : "#ff5078", fontFamily: "monospace" }}>
              ${fmtPrice(ticker?.price ?? 0)}
            </span>
            <span style={{ textAlign: "right", opacity: 0.45 }}>
              {asks[0] && bids[0] ? `${(((asks[0].price - bids[0].price) / bids[0].price) * 100).toFixed(4)}%` : ""}
            </span>
          </div>

          {/* Buy/Sell pressure bar */}
          {bids.length > 0 && asks.length > 0 && (() => {
            const totalBid = displayBids.reduce((s, b) => s + b.size, 0);
            const totalAsk = displayAsks.reduce((s, a) => s + a.size, 0);
            const total = totalBid + totalAsk || 1;
            const bidPct = (totalBid / total) * 100;
            return (
              <div style={{ padding: "8px 16px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 5, opacity: 0.65 }}>
                  <span style={{ color: "#00ff9d", fontWeight: 800 }}>B {bidPct.toFixed(1)}%</span>
                  <span style={{ color: "#ff5078", fontWeight: 800 }}>A {(100 - bidPct).toFixed(1)}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: "rgba(255,80,120,0.4)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${bidPct}%`, background: "#00ff9d", borderRadius: 999, transition: "width 0.5s ease" }} />
                </div>
              </div>
            );
          })()}
        </div>

        {/* ── Recent Trades ── */}
        <div style={{ background: "rgba(9,15,30,0.92)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontWeight: 900, fontSize: 13 }}>
            Recent Trades
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "6px 14px", fontSize: 10, opacity: 0.4, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <span>Price</span>
            <span style={{ textAlign: "center" }}>Size</span>
            <span style={{ textAlign: "right" }}>Time</span>
          </div>
          <div style={{ overflowY: "auto", maxHeight: 360 }}>
            {trades.map((t, i) => {
              const buy = t.side === "BUY";
              return (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                  padding: "5px 14px", fontSize: 12, fontFamily: "monospace",
                  borderBottom: "1px solid rgba(255,255,255,0.025)",
                }}>
                  <span style={{ color: buy ? "#00ff9d" : "#ff5078", fontWeight: 700 }}>
                    {fmtPrice(t.price)}
                  </span>
                  <span style={{ textAlign: "center", opacity: 0.65 }}>{t.size.toFixed(4)}</span>
                  <span style={{ textAlign: "right", opacity: 0.35, fontSize: 10 }}>{fmtTime(t.ts)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
