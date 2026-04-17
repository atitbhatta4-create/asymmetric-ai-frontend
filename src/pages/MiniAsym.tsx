// src/pages/MiniAsym.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../lib/api";
import useIsMobile from "../hooks/useIsMobile";

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
  const isMobile = useIsMobile();

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
    signal_score?: number;
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
    <div style={{ maxWidth: 1100, width: "100%", overflowX: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 950 }}>Mini-Asym</div>
            <div style={{ padding: "4px 10px", borderRadius: 999, fontSize: 10, fontWeight: 900, letterSpacing: 1, background: "rgba(0,255,224,0.10)", border: "1px solid rgba(0,255,224,0.22)", color: "#00ffe0" }}>
              RISK ENGINE
            </div>
          </div>
          {!isMobile && (
            <div style={{ opacity: 0.5, marginTop: 4, fontSize: 13 }}>
              4-layer signal analysis · live drawdown protection · trade discipline AI
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => nav("/history")} style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)", color: "white", padding: "9px 12px", fontWeight: 800, cursor: "pointer", fontSize: 13 }}>
            History
          </button>
          <button onClick={() => nav(`/market/${encodeURIComponent(symbol.toUpperCase().trim())}`)} style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)", color: "white", padding: "9px 12px", fontWeight: 800, cursor: "pointer", fontSize: 13 }}>
            Chart
          </button>
        </div>
      </div>

      {/* Status banner */}
      <div style={{
        marginTop: 10, padding: isMobile ? "10px 14px" : "12px 18px", borderRadius: 16,
        border: `1px solid ${badge.br}`, background: badge.bg,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: badge.br, boxShadow: `0 0 8px ${badge.br}`, flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 950, fontSize: 14 }}>{badge.text}</div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{miniAsymState.action}</div>
        </div>
      </div>

      {/* Top stats */}
      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
        {/* Equity card */}
        <div style={{ borderRadius: 16, padding: isMobile ? "12px 14px" : "16px 18px", background: "rgba(9,15,30,0.92)", border: "1px solid rgba(255,255,255,0.08)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 80% 20%, rgba(0,255,157,0.07), transparent 60%)", pointerEvents: "none" }} />
          <div style={{ fontSize: 10, fontWeight: 900, opacity: 0.5, letterSpacing: 1, textTransform: "uppercase" }}>Account Equity</div>
          <div style={{ fontSize: isMobile ? 26 : 34, fontWeight: 950, marginTop: 4, color: "#f1f5f9" }}>${fmtMoney(equity)}</div>
          <div style={{ fontSize: 11, opacity: 0.45, marginTop: 3 }}>
            Floor: ${fmtMoney(equity * 0.85)} · Peak protected
          </div>
        </div>

        {/* Live price card */}
        <div style={{ borderRadius: 16, padding: isMobile ? "12px 14px" : "16px 18px", background: "rgba(9,15,30,0.92)", border: "1px solid rgba(255,255,255,0.08)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 20% 80%, rgba(0,210,255,0.06), transparent 60%)", pointerEvents: "none" }} />
          <div style={{ fontSize: 10, fontWeight: 900, opacity: 0.5, letterSpacing: 1, textTransform: "uppercase" }}>Live Price</div>
          <div style={{ fontSize: isMobile ? 26 : 34, fontWeight: 950, marginTop: 4, color: "#f1f5f9" }}>${fmtMoney(livePrice)}</div>
          <div style={{ fontSize: 11, opacity: 0.45, marginTop: 3 }}>
            {symbol.toUpperCase().trim()} · refreshes every 5s
          </div>
        </div>
      </div>

      {/* Today Summary + Risk Meter */}
      <div
        style={{
          marginTop: 10,
          borderRadius: 16,
          padding: isMobile ? 10 : 14,
          background: "rgba(9, 15, 30, 0.92)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ fontWeight: 950, fontSize: isMobile ? 13 : 15, marginBottom: 8 }}>Today’s Risk Summary</div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)", gap: 10 }}>
          <div
            style={{
              padding: isMobile ? 8 : 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(15,23,42,0.55)",
            }}
          >
            <div style={{ fontSize: isMobile ? 10 : 11, opacity: 0.7, fontWeight: 900 }}>Trades</div>
            <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 950, marginTop: 4 }}>
              {today.tradesUsed}/{MAX_TRADES_PER_DAY}
            </div>
          </div>

          <div
            style={{
              padding: isMobile ? 8 : 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(15,23,42,0.55)",
            }}
          >
            <div style={{ fontSize: isMobile ? 10 : 11, opacity: 0.7, fontWeight: 900 }}>PnL</div>
            <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 950, marginTop: 4 }}>{fmtNum(today.pnlPct, 2)}%</div>
          </div>

          <div
            style={{
              padding: isMobile ? 8 : 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(15,23,42,0.55)",
            }}
          >
            <div style={{ fontSize: isMobile ? 10 : 11, opacity: 0.7, fontWeight: 900 }}>Loss limit</div>
            <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 950, marginTop: 4 }}>{DAILY_LOSS_LIMIT_PCT}%</div>
          </div>

          <div
            style={{
              padding: isMobile ? 8 : 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(15,23,42,0.55)",
            }}
          >
            <div style={{ fontSize: isMobile ? 10 : 11, opacity: 0.7, fontWeight: 900 }}>Target</div>
            <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 950, marginTop: 4 }}>{DAILY_PROFIT_TARGET_PCT}%</div>
          </div>

          <div
            style={{
              padding: isMobile ? 8 : 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(15,23,42,0.55)",
            }}
          >
            <div style={{ fontSize: isMobile ? 10 : 11, opacity: 0.7, fontWeight: 900 }}>Losses</div>
            <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 950, marginTop: 4 }}>
              {today.consecLoss}/{MAX_CONSEC_LOSSES}
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
      {signalData?.running && (() => {
        const score = signalData.signal_score ?? 0;
        const isGradeA = score >= 0.78;
        const isGradeB = score >= 0.65 && score < 0.78;
        const gradeColor = isGradeA ? "#00ff9d" : isGradeB ? "#ffa032" : "#ff5078";
        const gradeLabel = isGradeA ? "A" : isGradeB ? "B" : "C";
        const gradeBg = isGradeA ? "rgba(0,255,157,0.12)" : isGradeB ? "rgba(255,160,50,0.12)" : "rgba(255,80,120,0.12)";
        const gradeBorder = isGradeA ? "rgba(0,255,157,0.30)" : isGradeB ? "rgba(255,160,50,0.30)" : "rgba(255,80,120,0.30)";

        const LAYER_META: Record<string, { icon: string; label: string; weight: string; desc: (l: any) => string }> = {
          regime:    { icon: "⚡", label: "Regime",    weight: "25%", desc: (l) => `ADX ${l.adx ?? "—"} · ATR ${l.atr_pct ?? "—"}% · ${l.ok ? "Trending" : "Choppy"}` },
          direction: { icon: "🧭", label: "Direction", weight: "30%", desc: (l) => `${l.htf_trend ?? "—"} trend · EMA ${l.ema9_momentum ?? "—"} · Spread ${l.ema_spread ?? "—"}` },
          entry:     { icon: "🎯", label: "Entry",     weight: "30%", desc: (l) => `${l.price_vs_ema21_pct ?? "—"}% from EMA21 · RSI ${l.rsi ?? "—"} · ${l.candle_pattern ?? "—"}` },
          momentum:  { icon: "🌊", label: "Momentum",  weight: "15%", desc: (l) => `Vol ${l.volume_ratio ?? "—"}× avg · ${l.candles_n ?? "—"} candle(s) aligned` },
        };

        return (
          <div style={{ marginTop: 10, borderRadius: 16, background: "rgba(9,15,30,0.92)", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>

            {/* Header */}
            <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 950, fontSize: 15 }}>Mini-Asym Signal Engine</div>
                {!isMobile && <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>4-layer live analysis · updates every 5s</div>}
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                {/* Symbol */}
                <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.7 }}>{signalData.symbol}</div>

                {/* Side badge */}
                <div style={{
                  padding: "5px 12px", borderRadius: 999, fontWeight: 900, fontSize: 13,
                  background: signalData.side === "LONG" ? "rgba(0,255,157,0.15)" : "rgba(255,80,120,0.15)",
                  border: `1px solid ${signalData.side === "LONG" ? "rgba(0,255,157,0.35)" : "rgba(255,80,120,0.35)"}`,
                  color: signalData.side === "LONG" ? "#00ff9d" : "#ff5078",
                }}>
                  {signalData.side === "LONG" ? "▲ LONG" : "▼ SHORT"}
                </div>

                {/* Grade badge */}
                <div style={{ padding: "5px 14px", borderRadius: 999, fontWeight: 950, fontSize: 14, background: gradeBg, border: `1px solid ${gradeBorder}`, color: gradeColor }}>
                  Grade {gradeLabel} · {(score * 100).toFixed(0)}%
                </div>

                {/* Adaptive strictness */}
                {signalData.mode === "MINI_ASYM" && typeof signalData.adaptive_strictness === "number" && signalData.adaptive_strictness !== 1.0 && (
                  <div style={{ fontSize: 12, opacity: 0.6, padding: "4px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)" }}>
                    Strictness {signalData.adaptive_strictness.toFixed(2)}×
                  </div>
                )}
              </div>
            </div>

            {/* Score bar */}
            <div style={{ padding: "12px 18px 0", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 12, opacity: 0.55, minWidth: 80 }}>Signal score</div>
              <div style={{ flex: 1, height: 6, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, score * 100)}%`, borderRadius: 99, background: `linear-gradient(90deg, ${gradeColor}, ${gradeColor}aa)`, transition: "width 0.6s ease" }} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, color: gradeColor, minWidth: 36 }}>{(score * 100).toFixed(0)}%</div>
            </div>

            {/* Pending trade */}
            {signalData.pending_trade && (
              <div style={{ margin: "12px 18px 0", padding: "10px 14px", borderRadius: 12, background: "rgba(255,200,0,0.08)", border: "1px solid rgba(255,200,0,0.25)", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ffd700", boxShadow: "0 0 8px #ffd700", flexShrink: 0 }} />
                <div style={{ fontSize: 13, fontWeight: 900 }}>
                  Trade open @ ${signalData.pending_trade.entry_price?.toFixed(2)} · {signalData.pending_trade.side} · awaiting next candle close
                </div>
              </div>
            )}

            {/* Blocked */}
            {signalData.blocked && !signalData.pending_trade && (
              <div style={{ margin: "12px 18px 0", padding: "10px 14px", borderRadius: 12, background: "rgba(220,38,38,0.08)", border: "1px solid rgba(248,113,113,0.25)", fontSize: 12, color: "#fca5a5", lineHeight: 1.5 }}>
                <b style={{ color: "#ff5078" }}>Blocked — </b>{signalData.blocked.replace(/^BLOCKED \([^)]+\):\s*/, "")}
              </div>
            )}

            {/* 4 layers */}
            {signalData.breakdown && (
              <div style={{ padding: 14, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 10 }}>
                {(["regime", "direction", "entry", "momentum"] as const).map((key) => {
                  const l = signalData.breakdown![key];
                  if (!l) return null;
                  const ok = !!l.ok;
                  const layerScore = typeof l.score === "number" ? l.score : (ok ? 0.8 : 0.2);
                  const meta = LAYER_META[key];
                  const barColor = ok ? "#00ff9d" : "#ff5078";

                  return (
                    <div key={key} style={{
                      borderRadius: 14, padding: "12px 14px",
                      background: ok ? "rgba(0,255,157,0.04)" : "rgba(255,80,120,0.04)",
                      border: `1px solid ${ok ? "rgba(0,255,157,0.15)" : "rgba(255,80,120,0.15)"}`,
                    }}>
                      {/* Layer title row */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 15 }}>{meta.icon}</span>
                          <span style={{ fontWeight: 950, fontSize: 13 }}>{meta.label}</span>
                          <span style={{ fontSize: 10, opacity: 0.45, fontWeight: 700 }}>({meta.weight})</span>
                        </div>
                        <div style={{
                          fontSize: 11, fontWeight: 900, padding: "3px 9px", borderRadius: 999,
                          background: ok ? "rgba(0,255,157,0.15)" : "rgba(255,80,120,0.15)",
                          color: ok ? "#00ff9d" : "#ff5078",
                          border: `1px solid ${ok ? "rgba(0,255,157,0.25)" : "rgba(255,80,120,0.25)"}`,
                        }}>
                          {ok ? "✓ PASS" : "✗ FAIL"}
                        </div>
                      </div>

                      {/* Score bar */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <div style={{ flex: 1, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.07)" }}>
                          <div style={{ height: "100%", width: `${Math.min(100, layerScore * 100)}%`, borderRadius: 99, background: barColor, opacity: 0.85, transition: "width 0.5s ease" }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: barColor, minWidth: 28, textAlign: "right" }}>{(layerScore * 100).toFixed(0)}%</span>
                      </div>

                      {/* Detail line */}
                      <div style={{ fontSize: 11, color: ok ? "rgba(255,255,255,0.55)" : "#fca5a5", lineHeight: 1.5 }}>
                        {ok ? meta.desc(l) : (l.reason || "—")}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Session quality footer */}
            {signalData.breakdown?.session && (
              <div style={{ padding: "10px 18px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 16, fontSize: 12, opacity: 0.55 }}>
                <span>Session: <b style={{ opacity: 1, color: "white" }}>{signalData.breakdown.session.label}</b></span>
                <span>Quality: <b style={{ opacity: 1, color: "white" }}>{((signalData.breakdown.session.quality ?? 1) * 100).toFixed(0)}%</b></span>
                <span>Raw score: <b style={{ opacity: 1, color: "white" }}>{((signalData.breakdown.session.raw_score ?? 0) * 100).toFixed(0)}%</b></span>
              </div>
            )}
          </div>
        );
      })()}

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

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
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

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10 }}>
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
