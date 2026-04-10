// src/pages/MiniAsym.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../lib/api";

type RiskMode = "ULTRA_SAFE" | "SAFE" | "NORMAL" | "MINI_ASYM" | "AGGRESSIVE";
type Side = "LONG" | "SHORT";

type Trade = {
  id?: number;
  time?: string;
  created_at?: string;
  symbol: string;
  side: Side;
  mode?: RiskMode;
  size?: number;
  sl?: number;
  tp?: number;
  leverage?: number;
  unreal_pnl_value?: number;
  unreal_pnl_percent?: number;
  equity_after?: number;
  reason?: string | null;
};

type RiskPreviewOut = {
  allowed: boolean;
  reason?: string;
  computed?: {
    symbol: string;
    side: Side;
    mode: RiskMode;
    size: number;
    sl: number;
    tp: number;
    leverage: number;
  };
};

async function apiGet<T>(path: string): Promise<T> {
  return (await api.apiRequest(path, { method: "GET" })) as T;
}

async function apiPost<T>(path: string, body?: any): Promise<T> {
  return (await api.apiRequest(path, { method: "POST", body: body ?? {} })) as T;
}

function fmtNum(n: number, dp = 2) {
  const x = Number(n);
  if (!isFinite(x)) return "-";
  return x.toFixed(dp);
}

function fmtMoney(n: number) {
  const x = Number(n);
  if (!isFinite(x)) return "-";
  return x.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function presetForMode(mode: RiskMode) {
  switch (mode) {
    case "ULTRA_SAFE":
      return { size: 0.3, sl: 0.35, tp: 0.6, leverage: 2 };
    case "SAFE":
      return { size: 0.45, sl: 0.45, tp: 0.8, leverage: 3 };
    case "NORMAL":
      return { size: 0.6, sl: 0.55, tp: 1.0, leverage: 5 };
    case "MINI_ASYM":
      return { size: 0.65, sl: 0.55, tp: 1.1, leverage: 6 };
    case "AGGRESSIVE":
      return { size: 0.85, sl: 0.7, tp: 1.5, leverage: 8 };
    default:
      return { size: 0.45, sl: 0.45, tp: 0.8, leverage: 3 };
  }
}

function parseTradeTime(t: Trade): Date | null {
  const s = (((t.time || t.created_at) || "") + "").trim();
  if (!s) return null;

  // backend sends "YYYY-MM-DD HH:mm:ss" (UTC). Convert to ISO-ish.
  const iso = s.includes("T") ? s : s.replace(" ", "T");
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  if (isNaN(d.getTime())) return null;
  return d;
}

function startOfTodayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
}

export default function MiniAsym() {
  const nav = useNavigate();

  // MVP constants (later configurable / pro)
  const DAILY_LOSS_LIMIT_PCT = -4;
  const DAILY_PROFIT_TARGET_PCT = 10;
  const MAX_TRADES_PER_DAY = 3;
  const MAX_CONSEC_LOSSES = 2;

  const [symbol, setSymbol] = useState("BTCUSDT");
  const [side, setSide] = useState<Side>("LONG");
  const [mode, setMode] = useState<RiskMode>("MINI_ASYM");

  const [size, setSize] = useState(0.65);
  const [sl, setSl] = useState(0.55);
  const [tp, setTp] = useState(1.1);
  const [leverage, setLeverage] = useState(6);

  const [equity, setEquity] = useState(1000);
  const [livePrice, setLivePrice] = useState(0);

  const [trades, setTrades] = useState<Trade[]>([]);
  const [lastDecision, setLastDecision] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Live signal breakdown from AI runner
  const [signalData, setSignalData] = useState<{
    running: boolean;
    symbol?: string;
    mode?: string;
    signal?: string;
    side?: string;
    blocked?: string | null;
    adaptive_strictness?: number;
    pending_trade?: { entry_price: number; side: string; open_ts: number } | null;
    breakdown?: Record<string, { ok: boolean; reason?: string; [k: string]: any }>;
  } | null>(null);

  // Update inputs when mode changes
  useEffect(() => {
    const p = presetForMode(mode);
    setSize(p.size);
    setSl(p.sl);
    setTp(p.tp);
    setLeverage(p.leverage);
  }, [mode]);

  async function load() {
    try {
      const b = await apiGet<{ total?: number }>("/balance");
      setEquity(Number(b.total ?? 1000));
    } catch {}

    try {
      const t = await apiGet<{ trades?: Trade[] }>("/trades");
      setTrades((t.trades ?? []).slice());
    } catch {}
  }

  useEffect(() => {
    load();
  }, []);

  // Poll /auto/signal every 5s to show live 4-layer breakdown
  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const r = await apiGet<any>("/auto/signal");
        if (alive) setSignalData(r);
      } catch {}
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // Live price refresh
  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        const r = await apiGet<{ price?: number }>(`/price/${symbol}`);
        if (!alive) return;
        setLivePrice(Number(r.price ?? 0));
      } catch {}
    };

    run();
    const id = setInterval(run, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [symbol]);

  // Today stats
  const today = useMemo(() => {
    const start = startOfTodayUTC();
    const todays = trades
      .map((t) => ({ t, dt: parseTradeTime(t) }))
      .filter((x) => x.dt && x.dt.getTime() >= start.getTime())
      .map((x) => x.t);

    const todaysSorted = todays
      .slice()
      .sort((a, b) => (parseTradeTime(a)?.getTime() ?? 0) - (parseTradeTime(b)?.getTime() ?? 0));

    const eqStart = todaysSorted.length
      ? Number(todaysSorted[0].equity_after ?? 1000) - Number(todaysSorted[0].unreal_pnl_value ?? 0)
      : equity;

    const eqEnd = todaysSorted.length
      ? Number(todaysSorted[todaysSorted.length - 1].equity_after ?? equity)
      : equity;

    const pnlPct = eqStart > 0 ? ((eqEnd - eqStart) / eqStart) * 100 : 0;

    let consecLoss = 0;
    for (let i = todaysSorted.length - 1; i >= 0; i--) {
      const v = Number(todaysSorted[i].unreal_pnl_value ?? 0);
      if (v < 0) consecLoss += 1;
      else break;
    }

    return {
      tradesUsed: todaysSorted.length,
      pnlPct,
      consecLoss,
      todaysTrades: todaysSorted,
      eqStart,
      eqEnd,
    };
  }, [trades, equity]);

  // Status + action line
  const miniAsymState = useMemo(() => {
    const tradesUsed = today.tradesUsed;
    const pnl = today.pnlPct;
    const consec = today.consecLoss;

    let status: "NORMAL" | "RISK_REDUCED" | "PROTECTION_ACTIVE" = "NORMAL";
    let action = "Mini-Asym is monitoring your account. Risk preset is active.";

    if (pnl <= DAILY_LOSS_LIMIT_PCT) {
      status = "PROTECTION_ACTIVE";
      action = `Trading paused due to daily loss limit (${DAILY_LOSS_LIMIT_PCT}%).`;
    } else if (consec >= MAX_CONSEC_LOSSES) {
      status = "PROTECTION_ACTIVE";
      action = `Trading paused due to ${MAX_CONSEC_LOSSES} consecutive losses.`;
    } else if (pnl >= DAILY_PROFIT_TARGET_PCT) {
      status = "PROTECTION_ACTIVE";
      action = `Daily profit target reached (${DAILY_PROFIT_TARGET_PCT}%) — trading paused to protect gains.`;
    } else if (pnl >= 5) {
      status = "RISK_REDUCED";
      action = "Risk reduced because profits exceeded 5% — protecting gains.";
    } else if (tradesUsed >= MAX_TRADES_PER_DAY) {
      status = "PROTECTION_ACTIVE";
      action = `Daily trade limit reached (${MAX_TRADES_PER_DAY}/${MAX_TRADES_PER_DAY}) — trading paused.`;
    }

    let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
    if (status === "PROTECTION_ACTIVE") riskLevel = "HIGH";
    else if (status === "RISK_REDUCED") riskLevel = "MEDIUM";
    else {
      if (consec === 1) riskLevel = "MEDIUM";
      if (pnl < 0) riskLevel = "MEDIUM";
    }

    return { status, action, riskLevel };
  }, [today, DAILY_LOSS_LIMIT_PCT, DAILY_PROFIT_TARGET_PCT, MAX_TRADES_PER_DAY, MAX_CONSEC_LOSSES]);

  const badge = useMemo(() => {
    const s = miniAsymState.status;
    if (s === "NORMAL")
      return { text: "Mini-Asym: Normal", bg: "rgba(0,255,224,0.10)", br: "rgba(0,255,224,0.22)" };
    if (s === "RISK_REDUCED")
      return { text: "Mini-Asym: Risk Reduced", bg: "rgba(255,200,0,0.10)", br: "rgba(255,200,0,0.25)" };
    return { text: "Mini-Asym: Protection Active", bg: "rgba(255,80,120,0.12)", br: "rgba(255,80,120,0.28)" };
  }, [miniAsymState.status]);

  async function previewDecision() {
    try {
      setErr("");
      setLoading(true);

      const s = symbol.toUpperCase().trim();
      if (!s.endsWith("USDT")) throw new Error("Use Binance symbol like BTCUSDT / ETHUSDT / SOLUSDT");

      const payload = { symbol: s, side, mode, size, sl, tp, leverage };

      // NOTE: this endpoint must exist in backend:
      // POST /risk/preview  -> returns { allowed, computed, reason }
      const out = await apiPost<RiskPreviewOut>("/risk/preview", payload);

      setLastDecision(out.reason || "No reason returned.");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Preview failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 950 }}>Mini-Asym Panel</div>
          <div style={{ opacity: 0.7, marginTop: 6 }}>
            Live risk monitor — shows protection status + today summary + what Mini-Asym is doing
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => nav("/history")}
            style={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
              color: "white",
              padding: "10px 14px",
              fontWeight: 950,
              cursor: "pointer",
              height: 42,
            }}
          >
            Open History
          </button>

          <button
            onClick={() => nav(`/market/${encodeURIComponent(symbol.toUpperCase().trim())}`)}
            style={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
              color: "white",
              padding: "10px 14px",
              fontWeight: 950,
              cursor: "pointer",
              height: 42,
            }}
          >
            Open Chart
          </button>
        </div>
      </div>

      {/* Status badge + action line */}
      <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 999,
            border: `1px solid ${badge.br}`,
            background: badge.bg,
            fontWeight: 950,
          }}
        >
          {badge.text}
        </div>

        <div style={{ opacity: 0.9, fontWeight: 800 }}>{miniAsymState.action}</div>
      </div>

      {/* Top stats */}
      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div
          style={{
            borderRadius: 18,
            padding: 14,
            background: "rgba(9, 15, 30, 0.92)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ opacity: 0.7, fontWeight: 900 }}>EQUITY</div>
          <div style={{ fontSize: 34, fontWeight: 950, marginTop: 6 }}>${fmtMoney(equity)}</div>
        </div>

        <div
          style={{
            borderRadius: 18,
            padding: 14,
            background: "rgba(9, 15, 30, 0.92)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ opacity: 0.7, fontWeight: 900 }}>LIVE PRICE</div>
          <div style={{ opacity: 0.7, marginTop: 6 }}>
            Symbol: {symbol.toUpperCase().trim()} • refresh 5s
          </div>
          <div style={{ fontSize: 34, fontWeight: 950, marginTop: 6 }}>${fmtMoney(livePrice)}</div>
        </div>
      </div>

      {/* Today Summary + Risk Meter */}
      <div
        style={{
          marginTop: 14,
          borderRadius: 18,
          padding: 14,
          background: "rgba(9, 15, 30, 0.92)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ fontWeight: 950, marginBottom: 10 }}>Today’s Risk Summary</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
          <div
            style={{
              padding: 12,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(15,23,42,0.55)",
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 900 }}>Trades used</div>
            <div style={{ fontSize: 18, fontWeight: 950, marginTop: 6 }}>
              {today.tradesUsed} / {MAX_TRADES_PER_DAY}
            </div>
          </div>

          <div
            style={{
              padding: 12,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(15,23,42,0.55)",
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 900 }}>Today PnL</div>
            <div style={{ fontSize: 18, fontWeight: 950, marginTop: 6 }}>{fmtNum(today.pnlPct, 2)}%</div>
          </div>

          <div
            style={{
              padding: 12,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(15,23,42,0.55)",
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 900 }}>Daily loss limit</div>
            <div style={{ fontSize: 18, fontWeight: 950, marginTop: 6 }}>{DAILY_LOSS_LIMIT_PCT}%</div>
          </div>

          <div
            style={{
              padding: 12,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(15,23,42,0.55)",
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 900 }}>Profit target</div>
            <div style={{ fontSize: 18, fontWeight: 950, marginTop: 6 }}>{DAILY_PROFIT_TARGET_PCT}%</div>
          </div>

          <div
            style={{
              padding: 12,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(15,23,42,0.55)",
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 900 }}>Consecutive losses</div>
            <div style={{ fontSize: 18, fontWeight: 950, marginTop: 6 }}>
              {today.consecLoss} / {MAX_CONSEC_LOSSES}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontWeight: 900, opacity: 0.8 }}>Risk level:</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {(["LOW", "MEDIUM", "HIGH"] as const).map((lvl) => {
              const active = miniAsymState.riskLevel === lvl;
              return (
                <div
                  key={lvl}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: active ? "rgba(0,255,224,0.10)" : "rgba(255,255,255,0.04)",
                    fontWeight: 950,
                    opacity: active ? 1 : 0.65,
                  }}
                >
                  {lvl}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live 4-Layer Signal Breakdown */}
      {signalData?.running && (
        <div
          style={{
            marginTop: 14,
            borderRadius: 18,
            padding: 14,
            background: "rgba(9, 15, 30, 0.92)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 950 }}>Live Signal — 4-Layer Analysis</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
              <span style={{ opacity: 0.7 }}>{signalData.symbol}</span>
              <span
                style={{
                  padding: "4px 10px", borderRadius: 999, fontWeight: 900,
                  background: signalData.side === "LONG" ? "rgba(0,255,157,0.15)" : "rgba(255,80,120,0.15)",
                  border: signalData.side === "LONG" ? "1px solid rgba(0,255,157,0.3)" : "1px solid rgba(255,80,120,0.3)",
                  color: signalData.side === "LONG" ? "#00ff9d" : "#ff5078",
                }}
              >
                {signalData.side ?? "—"}
              </span>
              {signalData.mode === "MINI_ASYM" && typeof signalData.adaptive_strictness === "number" && (
                <span style={{ opacity: 0.75, fontSize: 12 }}>
                  Strictness: {signalData.adaptive_strictness.toFixed(2)}×
                </span>
              )}
            </div>
          </div>

          {/* Pending trade indicator */}
          {signalData.pending_trade && (
            <div style={{
              marginTop: 10, padding: "8px 12px", borderRadius: 12,
              background: "rgba(255,200,0,0.10)", border: "1px solid rgba(255,200,0,0.25)",
              fontSize: 13, fontWeight: 900,
            }}>
              Trade open @ {signalData.pending_trade.entry_price?.toFixed(2)} ({signalData.pending_trade.side}) — awaiting close price
            </div>
          )}

          {/* Blocked reason */}
          {signalData.blocked && !signalData.pending_trade && (
            <div style={{
              marginTop: 10, padding: "8px 12px", borderRadius: 12,
              background: "rgba(220,38,38,0.10)", border: "1px solid rgba(248,113,113,0.3)",
              fontSize: 12, opacity: 0.9,
            }}>
              {signalData.blocked}
            </div>
          )}

          {/* 4 layers */}
          {signalData.breakdown && Object.keys(signalData.breakdown).length > 0 && (
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {(["regime", "direction", "entry", "momentum"] as const).map((layer) => {
                const l = signalData.breakdown![layer];
                if (!l) return null;
                const ok = l.ok;
                return (
                  <div
                    key={layer}
                    style={{
                      padding: 12, borderRadius: 14,
                      border: ok ? "1px solid rgba(0,255,157,0.20)" : "1px solid rgba(255,80,120,0.20)",
                      background: ok ? "rgba(0,255,157,0.05)" : "rgba(255,80,120,0.05)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 950, fontSize: 12, textTransform: "uppercase", opacity: 0.8 }}>
                        {layer}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 900, padding: "2px 8px", borderRadius: 999,
                        background: ok ? "rgba(0,255,157,0.15)" : "rgba(255,80,120,0.15)",
                        color: ok ? "#00ff9d" : "#ff5078",
                      }}>
                        {ok ? "PASS" : "FAIL"}
                      </span>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75, lineHeight: 1.4 }}>
                      {ok
                        ? layer === "regime"
                          ? `ADX ${l.adx} (min ${l.adx_min}) · ATR ${l.atr_pct}%`
                          : layer === "direction"
                          ? `${l.trend} · ${l.signal}`
                          : layer === "entry"
                          ? `EMA21 dist ${l.price_vs_ema21_pct}% · RSI ${l.rsi}`
                          : `${l.candles_n} candle(s) · vol ${l.volume_ratio}×`
                        : (l.reason || "—")}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Risk Inputs + Preview Reason */}
      <div
        style={{
          marginTop: 14,
          borderRadius: 18,
          padding: 14,
          background: "rgba(9, 15, 30, 0.92)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ fontWeight: 950 }}>Risk Inputs (Preview)</div>

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Symbol</div>
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="BTCUSDT"
              style={{
                width: "100%",
                marginTop: 6,
                padding: 12,
                borderRadius: 14,
                border: "1px solid rgba(148,163,184,0.5)",
                background: "rgba(15,23,42,0.85)",
                color: "white",
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Mode</div>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as RiskMode)}
              style={{
                width: "100%",
                marginTop: 6,
                padding: 12,
                borderRadius: 14,
                border: "1px solid rgba(148,163,184,0.5)",
                background: "rgba(15,23,42,0.85)",
                color: "white",
              }}
            >
              <option value="ULTRA_SAFE">ULTRA SAFE</option>
              <option value="SAFE">SAFE</option>
              <option value="NORMAL">NORMAL</option>
              <option value="MINI_ASYM">MINI-ASYM</option>
              <option value="AGGRESSIVE">AGGRESSIVE</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
          <button
            onClick={() => setSide("LONG")}
            style={{
              flex: 1,
              borderRadius: 14,
              border: side === "LONG" ? "1px solid rgba(0,255,224,0.35)" : "1px solid rgba(255,255,255,0.10)",
              background: side === "LONG" ? "rgba(0,255,224,0.10)" : "rgba(255,255,255,0.04)",
              color: "white",
              padding: "12px 14px",
              fontWeight: 950,
              cursor: "pointer",
            }}
          >
            LONG
          </button>
          <button
            onClick={() => setSide("SHORT")}
            style={{
              flex: 1,
              borderRadius: 14,
              border: side === "SHORT" ? "1px solid rgba(255,80,120,0.35)" : "1px solid rgba(255,255,255,0.10)",
              background: side === "SHORT" ? "rgba(255,80,120,0.10)" : "rgba(255,255,255,0.04)",
              color: "white",
              padding: "12px 14px",
              fontWeight: 950,
              cursor: "pointer",
            }}
          >
            SHORT
          </button>
        </div>

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Size %</div>
            <input
              type="number"
              step="0.01"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                borderRadius: 14,
                border: "1px solid rgba(148,163,184,0.5)",
                background: "rgba(15,23,42,0.85)",
                color: "white",
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>SL %</div>
            <input
              type="number"
              step="0.01"
              value={sl}
              onChange={(e) => setSl(Number(e.target.value))}
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                borderRadius: 14,
                border: "1px solid rgba(148,163,184,0.5)",
                background: "rgba(15,23,42,0.85)",
                color: "white",
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>TP %</div>
            <input
              type="number"
              step="0.01"
              value={tp}
              onChange={(e) => setTp(Number(e.target.value))}
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                borderRadius: 14,
                border: "1px solid rgba(148,163,184,0.5)",
                background: "rgba(15,23,42,0.85)",
                color: "white",
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Leverage</div>
            <input
              type="number"
              step="1"
              value={leverage}
              onChange={(e) => setLeverage(Number(e.target.value))}
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                borderRadius: 14,
                border: "1px solid rgba(148,163,184,0.5)",
                background: "rgba(15,23,42,0.85)",
                color: "white",
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={previewDecision}
            disabled={loading}
            style={{
              borderRadius: 14,
              border: "1px solid rgba(0,255,224,0.22)",
              background: "rgba(0,255,224,0.10)",
              color: "white",
              padding: "10px 14px",
              fontWeight: 950,
              cursor: loading ? "not-allowed" : "pointer",
              height: 42,
            }}
          >
            {loading ? "Previewing…" : "Preview Decision"}
          </button>

          <button
            onClick={load}
            style={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
              color: "white",
              padding: "10px 14px",
              fontWeight: 950,
              cursor: "pointer",
              height: 42,
            }}
          >
            Refresh
          </button>

          {err ? <div style={{ color: "#fecaca", opacity: 0.95 }}>{err}</div> : null}
        </div>

        <div style={{ marginTop: 14, fontWeight: 950 }}>Decision explanation</div>
        <pre
          style={{
            marginTop: 10,
            whiteSpace: "pre-wrap",
            lineHeight: 1.35,
            fontSize: 13,
            opacity: 0.95,
            background: "rgba(15,23,42,0.65)",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: 12,
            borderRadius: 14,
            maxHeight: "55vh",
            overflow: "auto",
          }}
        >
          {lastDecision || "Click “Preview Decision” to generate the risk reason."}
        </pre>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.65 }}>
          If Preview Decision fails: confirm backend has <b>POST /risk/preview</b>.
        </div>
      </div>
    </div>
  );
}
