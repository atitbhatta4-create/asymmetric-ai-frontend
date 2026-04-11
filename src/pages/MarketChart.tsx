import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createChart, ColorType } from "lightweight-charts";
import * as api from "../lib/api";
import useIsMobile from "../hooks/useIsMobile";

type KlineRow = { t: number; open: number; high: number; low: number; close: number; volume: number };
type Ticker   = { price: number; change24h: number; high24h: number; low24h: number; volume24h: number };
type OBLevel  = { price: number; size: number };
type Trade    = { price: number; size: number; side: "BUY" | "SELL"; ts: number };
type TF       = "15m" | "1h" | "4h" | "1d";
type RightTab = "orderbook" | "trades";

const TFS: TF[] = ["15m", "1h", "4h", "1d"];
const toSec = (t: number) => (t > 1_000_000_000_000 ? Math.floor(t / 1000) : t);

function fmtPrice(n: number) {
  if (!n) return "—";
  if (n >= 1000) return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1)    return n.toFixed(4);
  return n.toFixed(6);
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
  return `https://assets.coincap.io/assets/icons/${symbol.replace("USDT", "").toLowerCase()}@2x.png`;
}

const OB_ROWS = 14;

export default function MarketChart() {
  const nav = useNavigate();
  const { symbol: symParam } = useParams();
  const symbol = (symParam || "BTCUSDT").toUpperCase();
  const base   = symbol.replace("USDT", "");

  const [tf, setTf]           = useState<TF>("1h");
  const [rightTab, setRightTab] = useState<RightTab>("orderbook");
  const [ticker, setTicker]   = useState<Ticker | null>(null);
  const [asks, setAsks]       = useState<OBLevel[]>([]);
  const [bids, setBids]       = useState<OBLevel[]>([]);
  const [trades, setTrades]   = useState<Trade[]>([]);
  const [klines, setKlines]   = useState<KlineRow[]>([]);
  const [loading, setLoading] = useState(true);

  const isMobile  = useIsMobile();
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
      const r = await api.apiRequest(`/market/trades/${symbol}?limit=25`, { method: "GET" }) as { trades: Trade[] };
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

  // ── Order book display data ───────────────────────────────────────────────
  const displayAsks = [...asks].reverse().slice(0, OB_ROWS); // lowest ask nearest mid
  const displayBids = bids.slice(0, OB_ROWS);                // highest bid nearest mid
  const totalBid = displayBids.reduce((s, b) => s + b.size, 0);
  const totalAsk = displayAsks.reduce((s, a) => s + a.size, 0);
  const total    = totalBid + totalAsk || 1;
  const bidPct   = (totalBid / total) * 100;
  const maxBidSize = Math.max(...displayBids.map((b) => b.size), 0.0001);
  const maxAskSize = Math.max(...displayAsks.map((a) => a.size), 0.0001);
  const positive   = (ticker?.change24h ?? 0) >= 0;
  const spread     = asks[0] && bids[0] ? asks[0].price - bids[0].price : null;

  const rightTabStyle = (t: RightTab): React.CSSProperties => ({
    flex: 1, padding: "9px 0", fontWeight: 800, fontSize: 12,
    cursor: "pointer", border: "none",
    borderBottom: rightTab === t ? "2px solid #00ffe0" : "2px solid transparent",
    background: "transparent",
    color: rightTab === t ? "#00ffe0" : "rgba(255,255,255,0.45)",
  });

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
          <img src={logoUrl(symbol)} alt={base} width={34} height={34}
            style={{ borderRadius: "50%" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div>
            <div style={{ fontWeight: 950, fontSize: 18 }}>
              {base}<span style={{ opacity: 0.4, fontWeight: 600, fontSize: 14 }}>/USDT</span>
            </div>
            <div style={{ fontSize: 11, opacity: 0.4 }}>OKX · Perpetual</div>
          </div>
        </div>

        {/* Live price */}
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
          <div>
            <div style={{ opacity: 0.4, fontSize: 10, marginBottom: 1 }}>24h High</div>
            <div style={{ fontWeight: 800, color: "#00ff9d" }}>${fmtPrice(ticker?.high24h ?? 0)}</div>
          </div>
          <div>
            <div style={{ opacity: 0.4, fontSize: 10, marginBottom: 1 }}>24h Low</div>
            <div style={{ fontWeight: 800, color: "#ff5078" }}>${fmtPrice(ticker?.low24h ?? 0)}</div>
          </div>
          <div>
            <div style={{ opacity: 0.4, fontSize: 10, marginBottom: 1 }}>24h Volume</div>
            <div style={{ fontWeight: 800 }}>{fmtVol(ticker?.volume24h ?? 0)} USDT</div>
          </div>
        </div>
      </div>

      {/* ── Main: chart left + right panel (stacks on mobile) ─────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 300px",
        gap: 12, alignItems: "start",
      }}>

        {/* Left: TF + chart */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {TFS.map((t) => (
              <button key={t} onClick={() => setTf(t)} style={{
                padding: "6px 16px", borderRadius: 8, fontWeight: 800, fontSize: 12, cursor: "pointer",
                background: tf === t ? "rgba(0,255,224,0.12)" : "rgba(255,255,255,0.04)",
                border: tf === t ? "1px solid rgba(0,255,224,0.3)" : "1px solid rgba(255,255,255,0.07)",
                color: tf === t ? "#00ffe0" : "rgba(255,255,255,0.55)",
              }}>{t}</button>
            ))}
          </div>
          <div style={{
            background: "rgba(9,15,30,0.92)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16,
            height: isMobile ? 280 : "calc(100vh - 220px)",
            minHeight: isMobile ? 280 : 480,
            overflow: "hidden",
          }}>
            {loading && klines.length === 0
              ? <div style={{ padding: 24, opacity: 0.4 }}>Loading chart…</div>
              : <div ref={candleRef} style={{ width: "100%", height: "100%" }} />
            }
          </div>
        </div>

        {/* Right: tabbed panel */}
        <div style={{
          background: "rgba(9,15,30,0.92)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, overflow: "hidden",
        }}>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <button style={rightTabStyle("orderbook")} onClick={() => setRightTab("orderbook")}>Order Book</button>
            <button style={rightTabStyle("trades")} onClick={() => setRightTab("trades")}>Recent Trades</button>
          </div>

          {/* ── ORDER BOOK TAB ── */}
          {rightTab === "orderbook" && (
            <div>
              {/* Buy/Sell pressure bar — right below tabs */}
              {totalBid + totalAsk > 0 && (
                <div style={{ padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: "#00ff9d", fontWeight: 800 }}>B {bidPct.toFixed(1)}%</span>
                    <span style={{ color: "#ff5078", fontWeight: 800 }}>A {(100 - bidPct).toFixed(1)}%</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 999, background: "rgba(255,80,120,0.35)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${bidPct}%`,
                      background: "#00ff9d", borderRadius: 999,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                </div>
              )}

              {/* Column headers */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                padding: "6px 14px", fontSize: 10, opacity: 0.4, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: 0.5,
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}>
                <span>Qty ({base})</span>
                <span style={{ textAlign: "center" }}>Price (USDT)</span>
                <span style={{ textAlign: "right" }}>Qty ({base})</span>
              </div>

              {/* Rows: bid (left green) | price | ask (right red) */}
              {Array.from({ length: OB_ROWS }).map((_, i) => {
                const bid = displayBids[i];
                const ask = displayAsks[i];
                const bidBarPct = bid ? Math.min(100, (bid.size / maxBidSize) * 80) : 0;
                const askBarPct = ask ? Math.min(100, (ask.size / maxAskSize) * 80) : 0;
                return (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                    alignItems: "center", minHeight: 26,
                    borderBottom: "1px solid rgba(255,255,255,0.025)",
                    fontSize: 11, fontFamily: "monospace",
                  }}>
                    {/* Bid qty — green bar from right */}
                    <div style={{ position: "relative", padding: "3px 10px", overflow: "hidden" }}>
                      {bid && <>
                        <div style={{
                          position: "absolute", right: 0, top: 0, bottom: 0,
                          width: `${bidBarPct}%`, background: "rgba(0,255,157,0.13)",
                          transition: "width 0.4s ease",
                        }} />
                        <span style={{ position: "relative", color: "#00ff9d", fontWeight: 700 }}>
                          {bid.size.toFixed(3)}
                        </span>
                      </>}
                    </div>

                    {/* Prices centered */}
                    <div style={{ textAlign: "center", padding: "2px 2px", display: "flex", flexDirection: "column", gap: 1 }}>
                      {ask && <span style={{ color: "#ff5078", fontWeight: 800, fontSize: 10 }}>{fmtPrice(ask.price)}</span>}
                      {bid && <span style={{ color: "#00ff9d", fontWeight: 800, fontSize: 10 }}>{fmtPrice(bid.price)}</span>}
                    </div>

                    {/* Ask qty — red bar from left */}
                    <div style={{ position: "relative", padding: "3px 10px", overflow: "hidden", textAlign: "right" }}>
                      {ask && <>
                        <div style={{
                          position: "absolute", left: 0, top: 0, bottom: 0,
                          width: `${askBarPct}%`, background: "rgba(255,80,120,0.13)",
                          transition: "width 0.4s ease",
                        }} />
                        <span style={{ position: "relative", color: "#ff5078", fontWeight: 700 }}>
                          {ask.size.toFixed(3)}
                        </span>
                      </>}
                    </div>
                  </div>
                );
              })}

              {/* Spread + mid price */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                padding: "8px 14px", borderTop: "1px solid rgba(255,255,255,0.06)",
                fontSize: 11,
              }}>
                <span style={{ opacity: 0.4, fontSize: 10 }}>
                  Spread<br />
                  <span style={{ color: "white", opacity: 0.7 }}>
                    {spread != null ? `$${spread.toFixed(2)}` : "—"}
                  </span>
                </span>
                <span style={{ textAlign: "center", fontWeight: 900, fontSize: 13, color: positive ? "#00ff9d" : "#ff5078", fontFamily: "monospace" }}>
                  ${fmtPrice(ticker?.price ?? 0)}
                </span>
                <span style={{ textAlign: "right", opacity: 0.4, fontSize: 10 }}>
                  Spread %<br />
                  <span style={{ color: "white", opacity: 0.7 }}>
                    {spread != null && bids[0] ? `${((spread / bids[0].price) * 100).toFixed(4)}%` : "—"}
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* ── RECENT TRADES TAB ── */}
          {rightTab === "trades" && (
            <div>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                padding: "7px 14px", fontSize: 10, opacity: 0.4, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: 0.5,
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}>
                <span>Price</span>
                <span style={{ textAlign: "center" }}>Size ({base})</span>
                <span style={{ textAlign: "right" }}>Time</span>
              </div>
              <div style={{ overflowY: "auto", maxHeight: 480 }}>
                {trades.map((t, i) => {
                  const buy = t.side === "BUY";
                  return (
                    <div key={i} style={{
                      display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                      padding: "5px 14px", fontSize: 11, fontFamily: "monospace",
                      borderBottom: "1px solid rgba(255,255,255,0.025)",
                    }}>
                      <span style={{ color: buy ? "#00ff9d" : "#ff5078", fontWeight: 700 }}>
                        {fmtPrice(t.price)}
                      </span>
                      <span style={{ textAlign: "center", opacity: 0.6 }}>{t.size.toFixed(4)}</span>
                      <span style={{ textAlign: "right", opacity: 0.35, fontSize: 10 }}>{fmtTime(t.ts)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
