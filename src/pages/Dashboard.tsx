// src/pages/Dashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css";
import { api } from "../lib/api";
import useIsMobile from "../hooks/useIsMobile";

type RiskMode = "ULTRA_SAFE" | "SAFE" | "NORMAL" | "MINI_ASYM" | "AGGRESSIVE";
type Side = "LONG" | "SHORT";
type TradeStyle = "SCALP" | "DAY_TRADE" | "SWING";

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
  entry_price?: number;
  current_price?: number;
  equity_after?: number;
  hard_floor?: number;
  reason?: string | null;
};

type ExchangeStatus = {
  connected: boolean;
  exchange: "binance" | "okx" | null;
  api_key_masked: string | null;
  created_at: string | null;
};

type AutoStatus = {
  ok: boolean;
  running: boolean;
  symbol?: string | null;
  tf?: string | null;
  interval_sec?: number | null;
  mode?: RiskMode | null;
  side?: Side | null;
  last_signal?: string | null;
  blocked_reason?: string | null;

  max_trades_per_day?: number | null;
  trades_today?: number | null;
  stop_after_bad_trades?: number | null;
  bad_trades_today?: number | null;
  reset_in_sec?: number | null;

  duration_days?: number | null;
  end_at?: string | null;
  trend_filter?: boolean | null;
  chop_min_sep_pct?: number | null;
  trade_style?: string | null;
  market_grade?: string | null;

  last_run_at?: string | null;
  last_trade_at?: string | null;
};

type AutoHistoryEvent = { t: string; msg: string };

function fmtMoney(n: number) {
  if (!isFinite(n)) return "-";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function presetForMode(mode: RiskMode) {
  switch (mode) {
    case "ULTRA_SAFE":
      return { size: 0.3, sl: 0.35, tp: 0.6, leverage: 2, maxTrades: 1 };
    case "SAFE":
      return { size: 0.45, sl: 0.45, tp: 0.8, leverage: 3, maxTrades: 2 };
    case "NORMAL":
      return { size: 0.6, sl: 0.55, tp: 1.0, leverage: 5, maxTrades: 3 };
    case "MINI_ASYM":
      return { size: 0.65, sl: 0.55, tp: 1.1, leverage: 6, maxTrades: 3 };
    case "AGGRESSIVE":
      return { size: 0.85, sl: 0.7, tp: 1.5, leverage: 8, maxTrades: 5 };
    default:
      return { size: 0.45, sl: 0.45, tp: 0.8, leverage: 3, maxTrades: 2 };
  }
}

function secToHMS(s: number | null | undefined) {
  if (!s || s <= 0) return "-";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = Math.floor(s % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${ss}s`;
  return `${ss}s`;
}

/** Equity curve with trailing hard-floor dotted overlay */
function EquityCurveChart({
  series,
  floorSeries = [],
  height = 210,
}: {
  series: number[];
  floorSeries?: number[];
  height?: number;
}) {
  const start = series.length ? series[0] : 1000;
  const last = series.length ? series[series.length - 1] : start;
  const delta = last - start;
  const pct = start !== 0 ? (delta / start) * 100 : 0;
  const up = delta >= 0;

  const W = 640;
  const H = 260;
  const padL = 44;
  const padR = 18;
  const padT = 16;
  const padB = 26;

  const eqLine  = up ? "rgba(255,80,120,0.95)"  : "rgba(255,80,120,0.95)";
  const eqGlow  = up ? "rgba(255,80,120,0.28)"  : "rgba(255,80,120,0.22)";
  const fillTop = up ? "rgba(255,80,120,0.14)"  : "rgba(255,80,120,0.10)";
  const fillBot = "rgba(255,80,120,0.00)";

  const data = series.length ? series : [start];
  const allVals = [...data, ...(floorSeries.length ? floorSeries : [])];
  const minRaw = Math.min(...allVals);
  const maxRaw = Math.max(...allVals);

  const pad = Math.max(0.35, Math.abs(maxRaw - minRaw) * 0.18);
  const min = minRaw - pad;
  const max = maxRaw + pad;
  const span = Math.max(1e-9, max - min);

  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const xStep = innerW / Math.max(1, data.length - 1);

  const toY = (v: number) => padT + innerH * (1 - (v - min) / span);

  const pts = data.map((v, i) => ({ x: padL + i * xStep, y: toY(v), v }));

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) d += ` L ${pts[i].x} ${pts[i].y}`;
  const area = `${d} L ${padL + innerW} ${padT + innerH} L ${padL} ${padT + innerH} Z`;

  // Floor dotted path — step function: each point holds its value until next
  let floorD = "";
  if (floorSeries.length >= 2) {
    const fxStep = innerW / Math.max(1, floorSeries.length - 1);
    floorSeries.forEach((fv, i) => {
      const fx = padL + i * fxStep;
      const fy = toY(fv);
      if (i === 0) {
        floorD = `M ${fx} ${fy}`;
      } else {
        floorD += ` L ${fx} ${toY(floorSeries[i - 1])} L ${fx} ${fy}`;
      }
    });
  }

  const ticks = 4;
  const tickVals = Array.from({ length: ticks + 1 }).map((_, i) =>
    max - (i / ticks) * (max - min)
  );

  const yStart = toY(start);
  const lastPt = pts[pts.length - 1];
  const lastLabelY = Math.max(padT + 6, Math.min(lastPt.y - 14, padT + innerH - 28));

  const badgeBorder = up ? "rgba(0,255,209,.32)" : "rgba(255,80,120,.32)";
  const badgeBg    = up ? "rgba(0,255,209,.10)" : "rgba(255,80,120,.10)";

  return (
    <div style={{ padding: "12px 14px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 900 }}>
          Start: ${fmtMoney(start)} — Last: ${fmtMoney(last)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {floorSeries.length >= 2 && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(0,255,209,0.75)", fontWeight: 800 }}>
              <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="rgba(0,255,209,0.75)" strokeWidth="2" strokeDasharray="4 3" /></svg>
              floor
            </div>
          )}
          <div style={{ padding: "6px 10px", borderRadius: 999, border: `1px solid ${badgeBorder}`, background: badgeBg, fontWeight: 950, fontSize: 12, whiteSpace: "nowrap" }}>
            {up ? "+" : ""}{fmtMoney(delta)} ({up ? "+" : ""}{pct.toFixed(2)}%)
          </div>
        </div>
      </div>

      <div style={{ height, width: "100%", borderRadius: 14, background: "linear-gradient(180deg, rgba(0,0,0,.22), rgba(0,0,0,.10))", border: "1px solid rgba(255,255,255,.07)", overflow: "hidden" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillTop} />
              <stop offset="100%" stopColor={fillBot} />
            </linearGradient>
            <filter id="eqGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {tickVals.map((_, i) => {
            const y = padT + (innerH * i) / ticks;
            return <line key={i} x1={padL} x2={padL + innerW} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
          })}

          {tickVals.map((v, i) => {
            const y = padT + (innerH * i) / ticks;
            return <text key={`t${i}`} x={padL - 10} y={y + 4} textAnchor="end" fontSize="12" fill="rgba(255,255,255,0.55)" fontWeight="800">{fmtMoney(v)}</text>;
          })}

          <line x1={padL} x2={padL + innerW} y1={yStart} y2={yStart} stroke="rgba(255,255,255,0.12)" strokeDasharray="6 6" strokeWidth="1" />

          {/* floor trailing line — teal dotted step */}
          {floorD && (
            <path d={floorD} fill="none" stroke="rgba(0,255,209,0.70)" strokeWidth="2" strokeDasharray="6 4" />
          )}

          {/* equity area + line — pink */}
          <path d={area} fill="url(#eqFill)" />
          <path d={d} fill="none" stroke={eqGlow} strokeWidth="7" filter="url(#eqGlow)" />
          <path d={d} fill="none" stroke={eqLine} strokeWidth="3.2" />

          <circle cx={lastPt.x} cy={lastPt.y} r={5.5} fill={eqLine} />
          <circle cx={lastPt.x} cy={lastPt.y} r={9} fill="rgba(255,255,255,0.06)" />

          <rect x={W - padR - 154} y={lastLabelY} width="146" height="26" rx="10" fill="rgba(9,15,30,0.92)" stroke="rgba(255,255,255,0.12)" />
          <text x={W - padR - 81} y={lastLabelY + 17} textAnchor="middle" fontSize="12" fill="rgba(255,255,255,0.88)" fontWeight="950">
            last: {fmtMoney(last)}
          </text>
        </svg>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const nav = useNavigate();
  const isMobile = useIsMobile();

  const topCoins = useMemo(
    () => ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "BNBUSDT"],
    []
  );

  const [activeSymbol, setActiveSymbol] = useState("BTCUSDT");
  const [symbolInput, setSymbolInput] = useState("BTCUSDT");

  const [mode, setMode] = useState<RiskMode>("MINI_ASYM");

  // Auto AI settings
  const [tradeStyle, setTradeStyle] = useState<TradeStyle>("DAY_TRADE");

  // Option B controls
  const [maxTradesPerDay, setMaxTradesPerDay] = useState<number>(3); // 0 = unlimited
  const [durationDays, setDurationDays] = useState<number>(0); // 0 = unlimited
  const [stopAfterBadTrades, setStopAfterBadTrades] = useState<number>(2);
  const [trendFilter, setTrendFilter] = useState<boolean>(true);
  const [chopMinSepPct, setChopMinSepPct] = useState<number>(0.005); // 0.5%

  const [autoStatus, setAutoStatus] = useState<AutoStatus | null>(null);
  const [autoHistory, setAutoHistory] = useState<AutoHistoryEvent[]>([]);
  const [aiLogOpen, setAiLogOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);

  const [equity, setEquity] = useState(NaN);
  const [displayName, setDisplayName] = useState("");
  const [isRealTrading, setIsRealTrading] = useState(false);
  const [liveSymbol, setLiveSymbol] = useState("BTCUSDT");
  const [livePrice, setLivePrice] = useState(0);

  const [topPrices, setTopPrices] = useState<Record<string, number>>({});
  const [trades, setTrades] = useState<Trade[]>([]);
  const [equitySeries, setEquitySeries] = useState<number[]>([]);
  const [floorSeries, setFloorSeries] = useState<number[]>([]);
  const [floorStats, setFloorStats] = useState<{
    peak: number; floor: number; locked: number; distance: number; distancePct: number; ath: number;
  } | null>(null);

  const [error, setError] = useState("");

  const [exStatus, setExStatus] = useState<ExchangeStatus | null>(null);

  const [reasonOpen, setReasonOpen] = useState(false);
  const [reasonText, setReasonText] = useState<string>("");

  // -------------------------
  // API helpers (with 401 redirect)
  // -------------------------
  async function apiGet<T>(path: string): Promise<T> {
    try {
      return (await api(path, { method: "GET" })) as T;
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
        nav("/login");
      }
      throw e;
    }
  }

  async function apiPost<T>(path: string, body?: any): Promise<T> {
    try {
      return (await api(path, {
        method: "POST",
        body: body ?? {},  // apiRequest handles JSON.stringify — don't double-stringify
      })) as T;
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
        nav("/login");
      }
      throw e;
    }
  }

  async function loadExchangeStatus() {
    try {
      const s = await apiGet<ExchangeStatus>("/exchange/status");
      setExStatus(s);
    } catch {
      setExStatus({
        connected: false,
        exchange: null,
        api_key_masked: null,
        created_at: null,
      });
    }
  }

  async function loadAutoStatus() {
    try {
      const st = await apiGet<AutoStatus>("/auto/status");
      setAutoStatus(st);
    } catch {
      setAutoStatus({ ok: true, running: false });
    }
  }

  async function loadAutoHistory() {
    try {
      const r = await apiGet<{ ok: boolean; session_id?: number | null; events: AutoHistoryEvent[] }>(
        "/auto/history?limit=60"
      );
      const newSid = r.session_id ?? null;
      setCurrentSessionId(prev => {
        if (prev !== null && newSid !== null && newSid !== prev) {
          // New session started — clear log before loading new one
          setAutoHistory([]);
        }
        return newSid;
      });
      setAutoHistory(r.events ?? []);
    } catch {
      setAutoHistory([]);
    }
  }

  // mode -> preset (sets default max trades/day)
  useEffect(() => {
    setMaxTradesPerDay(presetForMode(mode).maxTrades);
  }, [mode]);

  // initial load
  useEffect(() => {
    (async () => {
      try {
        setError("");
        try {
          const cfg = await apiGet<{ real_trading?: boolean }>("/config");
          setIsRealTrading(!!cfg.real_trading);
        } catch {}
        try {
          const prof = await apiGet<{ display_name?: string }>("/profile");
          setDisplayName(prof.display_name || "");
        } catch {}
        await loadExchangeStatus();
        await loadAutoStatus();

        const bal = await apiGet<{
          total?: number; start_equity?: number;
          peak_equity?: number; hard_floor?: number;
          locked_profit?: number; distance_to_floor?: number;
          distance_pct?: number; all_time_high?: number;
        }>("/balance");
        const eq0 = Number(bal.total ?? NaN);
        setEquity(eq0);
        setFloorStats({
          peak: Number(bal.peak_equity ?? eq0),
          floor: Number(bal.hard_floor ?? eq0 * 0.85),
          locked: Number(bal.locked_profit ?? 0),
          distance: Number(bal.distance_to_floor ?? 0),
          distancePct: Number(bal.distance_pct ?? 0),
          ath: Number(bal.all_time_high ?? eq0),
        });

        const t = await apiGet<{ trades?: Trade[] }>(
          "/trades?current_session=true&limit=50"
        );
        const list = (t.trades ?? []).slice();
        setTrades(list);

        // Build equity + floor series from oldest → newest
        const startEq = Number(bal.start_equity ?? NaN);
        const startFloor = Number(bal.hard_floor ?? startEq * 0.85);
        const curve: number[] = [startEq];
        const fCurve: number[] = [startFloor];
        for (const tr of list.slice().reverse()) {
          const v = Number(tr.equity_after);
          if (isFinite(v)) curve.push(v);
          const f = Number(tr.hard_floor);
          fCurve.push(isFinite(f) && f > 0 ? f : fCurve[fCurve.length - 1]);
        }
        setEquitySeries(curve.length ? curve : [startEq]);
        setFloorSeries(fCurve);

        await loadAutoHistory();
      } catch (e: any) {
        setError(
          `Please login again and refresh.${e?.message ? ` (${e.message})` : ""}`
        );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll auto status + history
  useEffect(() => {
    const id = setInterval(() => {
      loadAutoStatus();
      loadAutoHistory();
    }, 3000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Top coins prices
  useEffect(() => {
    let alive = true;
    const run = async () => {
      const updates: Record<string, number> = {};
      for (const sym of topCoins) {
        try {
          const r = await apiGet<{ price?: number }>(`/price/${sym}`);
          updates[sym] = Number(r.price ?? 0);
        } catch {}
      }
      if (!alive) return;
      setTopPrices((p) => ({ ...p, ...updates }));
    };
    run();
    const id = setInterval(run, 7000);
    return () => {
      alive = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topCoins]);

  // Live symbol price
  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        const r = await apiGet<{ price?: number }>(`/price/${liveSymbol}`);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveSymbol]);

  const selectTopCoin = (sym: string) => {
    const s = sym.toUpperCase().trim();
    setActiveSymbol(s);
    setSymbolInput(s);
    setLiveSymbol(s);
  };

  async function refreshTradesAndEquity() {
    const bal = await apiGet<{
      total?: number; start_equity?: number;
      peak_equity?: number; hard_floor?: number;
      locked_profit?: number; distance_to_floor?: number;
      distance_pct?: number; all_time_high?: number;
    }>("/balance");
    const refreshedEq = Number(bal.total ?? 1000);
    setEquity(refreshedEq);
    setFloorStats({
      peak: Number(bal.peak_equity ?? refreshedEq),
      floor: Number(bal.hard_floor ?? refreshedEq * 0.85),
      locked: Number(bal.locked_profit ?? 0),
      distance: Number(bal.distance_to_floor ?? 0),
      distancePct: Number(bal.distance_pct ?? 0),
      ath: Number(bal.all_time_high ?? refreshedEq),
    });

    const t = await apiGet<{ trades?: Trade[] }>(
      "/trades?current_session=true&limit=50"
    );
    const list = (t.trades ?? []).slice();
    setTrades(list);

    const startEq = Number(bal.start_equity ?? 1000);
    const startFloor = Number(bal.hard_floor ?? startEq * 0.85);
    const curve: number[] = [startEq];
    const fCurve: number[] = [startFloor];
    for (const tr of list.slice().reverse()) {
      const v = Number(tr.equity_after);
      if (isFinite(v)) curve.push(v);
      const f = Number(tr.hard_floor);
      fCurve.push(isFinite(f) && f > 0 ? f : fCurve[fCurve.length - 1]);
    }
    setEquitySeries(curve.length ? curve : [startEq]);
    setFloorSeries(fCurve);

    await loadExchangeStatus();
    await loadAutoStatus();
    await loadAutoHistory();
  }

  const connected = !!exStatus?.connected;
  const aiRunning = !!autoStatus?.running;

  async function startAI() {
    try {
      setError("");

      const symbol = (symbolInput || activeSymbol).toUpperCase().trim();
      if (!symbol.endsWith("USDT"))
        throw new Error("Use Binance symbol like BTCUSDT / ETHUSDT / SOLUSDT");

      const st = exStatus ?? (await apiGet<ExchangeStatus>("/exchange/status"));
      if (!st.connected) {
        setError("Connect exchange first (go to Exchange tab).");
        return;
      }

      if (aiRunning) {
        setError("AI is already running.");
        return;
      }

      await apiPost("/auto/start", {
        symbol,
        trade_style: tradeStyle,
        mode,
        max_trades_per_day: Number(maxTradesPerDay),
        stop_after_bad_trades: Number(stopAfterBadTrades),
        duration_days: Number(durationDays),
        trend_filter: !!trendFilter,
        chop_min_sep_pct: Number(chopMinSepPct),
      });

      await loadAutoStatus();
      await loadAutoHistory();

      setTimeout(() => refreshTradesAndEquity(), 1200);
    } catch (e: any) {
      setError(e?.message || "Start AI failed");
    }
  }

  async function stopAI() {
    try {
      setError("");
      await apiPost("/auto/stop");
      await loadAutoStatus();
      await loadAutoHistory();
    } catch (e: any) {
      setError(e?.message || "Stop AI failed");
    }
  }

  async function resetSandbox() {
    try {
      setError("");
      await apiPost("/reset");
      await refreshTradesAndEquity();
    } catch (e: any) {
      setError(e?.message || "Reset failed");
    }
  }

  const aiTitle = autoStatus?.blocked_reason || "";
  const aiLine = useMemo(() => {
    if (!aiRunning) return "AI: STOPPED";

    const modeTxt = autoStatus?.mode ? `${autoStatus.mode}` : "";
    const sig = autoStatus?.last_signal
      ? `signal ${autoStatus.last_signal}`
      : "";
    const blocked = autoStatus?.blocked_reason
      ? ` • BLOCKED: ${autoStatus.blocked_reason}`
      : "";

    const tradesToday = `${autoStatus?.trades_today ?? 0}/${
      autoStatus?.max_trades_per_day ?? "-"
    }`;
    const badToday = `${autoStatus?.bad_trades_today ?? 0}/${
      autoStatus?.stop_after_bad_trades ?? "-"
    }`;

    const resetIn = secToHMS(autoStatus?.reset_in_sec ?? null);
    const dur =
      autoStatus?.duration_days && autoStatus.duration_days > 0
        ? `ends ${autoStatus.duration_days}d`
        : "unlimited";

    const styleTxt = autoStatus?.trade_style ? ` ${autoStatus.trade_style}` : "";
    const gradeTxt = autoStatus?.market_grade && autoStatus.market_grade !== "-" ? ` Grade ${autoStatus.market_grade}` : "";

    return `AI RUNNING (${autoStatus?.side || "-"}) • ${modeTxt}${styleTxt}${gradeTxt} • ${sig}${blocked} • trades ${tradesToday} • bad ${badToday} • reset ${resetIn} • ${dur}`;
  }, [aiRunning, autoStatus]);

  return (
    <div className="dash">
      <div className="container">
        <div className="header">
          <div className="brand">
            <div className="brandName">Asymmetric AI</div>
            {displayName && (
              <div className="brandSub">
                Welcome back, {displayName} {isRealTrading ? "· Live Trading" : "· Demo"}
              </div>
            )}
          </div>

          <div className="coinsRow">
            {topCoins.map((c) => (
              <button
                key={c}
                className={`coinChip ${activeSymbol === c ? "active" : ""}`}
                onClick={() => selectTopCoin(c)}
                type="button"
              >
                <div className="coinSym">{c.replace("USDT", "")}</div>
                <div className="coinPx">${fmtMoney(topPrices[c] ?? 0)}</div>
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            marginTop: 10,
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
            fontSize: isMobile ? 11 : 13,
          }}
        >
          <div
            style={{
              padding: isMobile ? "6px 10px" : "8px 12px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.10)",
              background: connected ? "rgba(0,255,224,0.10)" : "rgba(255,80,120,0.10)",
              fontWeight: 900,
            }}
          >
            Exchange:{" "}
            {connected ? (
              <><span style={{ opacity: 0.9 }}>{exStatus?.exchange}</span></>
            ) : (
              "Not Connected"
            )}
          </div>

          {!connected && (
            <button
              onClick={() => nav("/exchange")}
              style={{
                borderRadius: 12,
                border: "1px solid rgba(0,255,224,0.22)",
                background: "rgba(0,255,224,0.10)",
                color: "white",
                padding: isMobile ? "6px 10px" : "10px 12px",
                fontWeight: 950,
                cursor: "pointer",
                fontSize: isMobile ? 11 : 13,
              }}
            >
              Connect Exchange
            </button>
          )}

          <div
            style={{
              padding: isMobile ? "6px 10px" : "8px 12px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.10)",
              background: aiRunning ? "rgba(0,255,224,0.10)" : "rgba(255,255,255,0.04)",
              fontWeight: 950,
              maxWidth: "100%",
              fontSize: isMobile ? 10 : 12,
              wordBreak: "break-word",
            }}
            title={aiTitle}
          >
            {aiLine}
          </div>

          <button
            type="button"
            onClick={() => setAiLogOpen(true)}
            style={{
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
              color: "white",
              padding: isMobile ? "6px 10px" : "10px 12px",
              fontWeight: 900,
              cursor: "pointer",
              fontSize: isMobile ? 11 : 13,
            }}
          >
            AI Log
          </button>
        </div>

        <div className="mainGrid">
          {/* LEFT: TRADE PANEL */}
          <section className="card exec">

            {/* 1 ── Risk Mode */}
            <div className="cardHead" style={{ marginBottom: 10 }}>
              <div className="title">TRADE PANEL</div>
            </div>
            <div className="modes">
              {(["ULTRA_SAFE", "SAFE", "NORMAL", "MINI_ASYM", "AGGRESSIVE"] as RiskMode[]).map((m) => (
                <button key={m} className={`pill ${mode === m ? "active" : ""}`} onClick={() => setMode(m)} type="button">
                  {m === "MINI_ASYM" ? "Mini-Asym" : m.replace("_", " ")}
                </button>
              ))}
            </div>

            {/* 2 ── Symbol */}
            <div className="formRow" style={{ marginTop: 12 }}>
              <label>Symbol</label>
              <div className="rowInline">
                <input className="input" value={symbolInput}
                  onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
                  placeholder="BTCUSDT" />
                <button className="ghost" type="button"
                  onClick={() => setLiveSymbol((symbolInput || activeSymbol).toUpperCase().trim())}>
                  Track
                </button>
                <button className="ghost" type="button"
                  onClick={() => nav(`/market/${encodeURIComponent((symbolInput || activeSymbol).toUpperCase().trim())}`)}>
                  Chart
                </button>
              </div>
            </div>

            {/* 3 ── Trading Style */}
            <div style={{ marginTop: isMobile ? 10 : 14 }}>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", opacity: 0.4, marginBottom: 6 }}>Trading Style (AI)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: isMobile ? 6 : 8 }}>
                {([
                  { id: "SCALP",     tf: "15m", sl: "0.8×ATR", tp: "1.6×ATR", freq: "~4–6/day" },
                  { id: "DAY_TRADE", tf: "1h",  sl: "1.0×ATR", tp: "2.0×ATR", freq: "~2–4/day" },
                  { id: "SWING",     tf: "4h",  sl: "1.5×ATR", tp: "3.0×ATR", freq: "~1–2/day" },
                ] as { id: TradeStyle; tf: string; sl: string; tp: string; freq: string }[]).map((s) => {
                  const active = tradeStyle === s.id;
                  return (
                    <button key={s.id} type="button" onClick={() => setTradeStyle(s.id)} style={{
                      padding: isMobile ? "7px 8px" : "10px 10px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                      border: active ? "1.5px solid rgba(0,255,224,0.55)" : "1px solid rgba(255,255,255,0.08)",
                      background: active ? "rgba(0,255,224,0.09)" : "rgba(255,255,255,0.03)",
                      color: "white", transition: "all 0.14s",
                    }}>
                      <div style={{ fontWeight: 900, fontSize: isMobile ? 11 : 13, color: active ? "#00ffe0" : "rgba(255,255,255,0.9)" }}>{s.id.replace("_", " ")}</div>
                      <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>{s.tf} · {s.freq}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4 ── Duration + Size config */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: 8, marginTop: isMobile ? 10 : 14 }}>
              <div className="field">
                <label>Duration (days)</label>
                <input className="input" type="number" min={0} max={365} step={1}
                  value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))} />
              </div>
              <div className="field">
                <label>Max trades/day</label>
                <input className="input" type="number" min={0} max={20} step={1}
                  value={maxTradesPerDay} onChange={(e) => setMaxTradesPerDay(Number(e.target.value))} />
              </div>
              <div className="field">
                <label>Stop after bad</label>
                <input className="input" type="number" min={0} max={10} step={1}
                  value={stopAfterBadTrades} onChange={(e) => setStopAfterBadTrades(Number(e.target.value))} />
              </div>
              <div className="field" style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
                  <input type="checkbox" checked={trendFilter} onChange={(e) => setTrendFilter(e.target.checked)} />
                  <span style={{ fontSize: 11 }}>Trend filter<br /><span style={{ opacity: 0.45 }}>EMA50/200</span></span>
                </label>
              </div>
            </div>

            {/* 5 ── AI status strip (visible only when running) */}
            {aiRunning && autoStatus && (
              <div style={{
                marginTop: 12,
                padding: "10px 12px",
                borderRadius: 10,
                background: "rgba(0,255,224,0.05)",
                border: "1px solid rgba(0,255,224,0.15)",
                display: "flex", flexWrap: "wrap", gap: "10px 18px",
              }}>
                {[
                  { label: "Symbol",  val: autoStatus.symbol ?? "—" },
                  { label: "Style",   val: (autoStatus.trade_style ?? "—").replace("_", " ") },
                  { label: "Mode",    val: autoStatus.mode === "MINI_ASYM" ? "Mini-Asym" : (autoStatus.mode ?? "—").replace("_", " ") },
                  { label: "Grade",   val: autoStatus.market_grade && autoStatus.market_grade !== "-" ? autoStatus.market_grade : "—" },
                  { label: "Signal",  val: autoStatus.last_signal ?? "—" },
                  { label: "Trades",  val: `${autoStatus.trades_today ?? 0} / ${autoStatus.max_trades_per_day || "∞"}` },
                  ...(autoStatus.blocked_reason ? [{ label: "Blocked", val: autoStatus.blocked_reason }] : []),
                ].map(({ label, val }) => (
                  <div key={label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", opacity: 0.4 }}>{label}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: label === "Blocked" ? "#ff5078" : label === "Grade" && val !== "—" ? "#00ffe0" : "rgba(255,255,255,0.85)",
                      maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{val}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 6 ── Actions */}
            <div className="actions" style={{ gap: 8, marginTop: isMobile ? 8 : 12 }}>
              <button className="primary" type="button" onClick={startAI} disabled={!connected || aiRunning}>
                {aiRunning ? "AI Running" : "Start AI"}
              </button>
              <button className="danger" type="button" onClick={stopAI} disabled={!aiRunning}>Stop AI</button>
              <button className="danger" type="button" onClick={resetSandbox}
                style={{ background: "transparent", border: "1px solid rgba(255,80,120,0.3)" }}>
                Reset
              </button>
              <button className="ghost" type="button" onClick={() => nav("/miniasym")} style={{ borderRadius: 14 }}>
                Mini-Asym Panel
              </button>
            </div>

            {error ? <div className="error">{error}</div> : null}
          </section>

          {/* RIGHT: STATS + EQUITY CURVE */}
          <div className="rightCol">
            <section className="card stat">
              <div className="cardHead">
                <div className="title">EQUITY</div>
                <div className="hint">{isRealTrading ? "Live exchange balance (USDT)" : "Session equity (sandbox)"}</div>
              </div>
              <div className="big">${fmtMoney(equity)}</div>
            </section>

            <section className="card stat">
              <div className="cardHead">
                <div className="title">LIVE PRICE</div>
                <div className="hint">Symbol: {liveSymbol} — refresh 5s</div>
              </div>
              <div className="big">${fmtMoney(livePrice)}</div>
            </section>

            <section className="card">
              <div className="cardHead">
                <div className="title">EQUITY CURVE</div>
                <div className="hint">Pink = equity · Teal dotted = floor</div>
              </div>
              <EquityCurveChart series={equitySeries} floorSeries={floorSeries} height={220} />
            </section>
          </div>
        </div>

        {/* BOTTOM: RECENT TRADES ONLY */}
        <section className="card">
          <div className="cardHead">
            <div className="title">RECENT TRADES</div>
            <div className="hint">{trades.length} total (current session)</div>
          </div>

          {isMobile ? (
            <div style={{ padding: "8px 12px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
              {trades.length === 0 ? (
                <div style={{ opacity: 0.55, fontSize: 12, padding: "10px 0" }}>No trades in this session (try Start AI).</div>
              ) : trades.slice(0, 8).map((t, i) => {
                const isWin = (t.equity_after ?? 0) > 0;
                return (
                  <div key={t.id ?? i} style={{
                    borderRadius: 12, padding: "9px 12px",
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${t.side === "LONG" ? "rgba(0,255,209,0.15)" : "rgba(255,80,120,0.15)"}`,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div>
                      <span style={{ fontWeight: 950, fontSize: 13, color: t.side === "LONG" ? "#00ffd1" : "#ff5078" }}>{t.side}</span>
                      <span style={{ fontSize: 12, opacity: 0.75, marginLeft: 8 }}>{t.symbol}</span>
                      <div style={{ fontSize: 10, opacity: 0.5, marginTop: 2 }}>{((t.time || t.created_at) ?? "").toString().slice(0, 16)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 950, fontSize: 13 }}>${fmtMoney(Number(t.equity_after ?? 0))}</div>
                      <div style={{ fontSize: 10, opacity: 0.6 }}>Lev {Number(t.leverage ?? 0).toFixed(1)}x</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th><th>Symbol</th><th>Side</th><th>Mode</th>
                    <th>Size</th><th>SL</th><th>TP</th><th>Lev</th><th>Equity</th><th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.length === 0 ? (
                    <tr><td colSpan={10} className="empty">No trades in this session (try Start AI).</td></tr>
                  ) : trades.slice(0, 12).map((t, i) => {
                    const when = ((t.time || t.created_at) ?? "-").toString();
                    const shortReason = (t.reason || "").split("\n").slice(0, 2).join(" • ").slice(0, 90) || "-";
                    return (
                      <tr key={t.id ?? i}>
                        <td>{when}</td><td>{t.symbol}</td>
                        <td className={t.side === "LONG" ? "good" : "bad"}>{t.side}</td>
                        <td>{t.mode || "-"}</td>
                        <td>{Number(t.size ?? 0).toFixed(2)}</td>
                        <td>{Number(t.sl ?? 0).toFixed(2)}</td>
                        <td>{Number(t.tp ?? 0).toFixed(2)}</td>
                        <td>{Number(t.leverage ?? 0).toFixed(1)}</td>
                        <td>${fmtMoney(Number(t.equity_after ?? 0))}</td>
                        <td>
                          {t.reason ? (
                            <button type="button" onClick={() => { setReasonText(t.reason || ""); setReasonOpen(true); }}
                              style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)", color: "white", padding: "8px 10px", cursor: "pointer", fontWeight: 850, maxWidth: 260 }}
                              title="View full reason">{shortReason}</button>
                          ) : <span style={{ opacity: 0.7 }}>-</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* AI Log modal */}
        {aiLogOpen && (
          <div
            onClick={() => setAiLogOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              display: "grid",
              placeItems: "center",
              padding: 18,
              zIndex: 70,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 920,
                maxWidth: "100%",
                borderRadius: 18,
                padding: 16,
                background: "rgba(9, 15, 30, 0.98)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 950 }}>
                  AI Status Log (last 60)
                </div>
                <button
                  onClick={() => setAiLogOpen(false)}
                  style={{
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.04)",
                    color: "white",
                    padding: "8px 10px",
                    cursor: "pointer",
                    fontWeight: 900,
                  }}
                >
                  Close
                </button>
              </div>

              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                If you see "Blocked: CHOP_FILTER / TREND_FILTER" it means AI is
                protecting you (Option B).
              </div>

              <pre
                style={{
                  marginTop: 12,
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.35,
                  fontSize: 13,
                  opacity: 0.95,
                  background: "rgba(15,23,42,0.65)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  padding: 12,
                  borderRadius: 14,
                  maxHeight: "60vh",
                  overflow: "auto",
                }}
              >
                {(autoHistory || []).map((e) => `${e.t}  ${e.msg}`).join("\n")}
              </pre>
            </div>
          </div>
        )}

        {/* Trade reason modal */}
        {reasonOpen && (
          <div
            onClick={() => setReasonOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              display: "grid",
              placeItems: "center",
              padding: 18,
              zIndex: 60,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 860,
                maxWidth: "100%",
                borderRadius: 18,
                padding: 16,
                background: "rgba(9, 15, 30, 0.98)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 950 }}>Trade Reason</div>
                <button
                  onClick={() => setReasonOpen(false)}
                  style={{
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.04)",
                    color: "white",
                    padding: "8px 10px",
                    cursor: "pointer",
                    fontWeight: 900,
                  }}
                >
                  Close
                </button>
              </div>

              <pre
                style={{
                  marginTop: 12,
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.35,
                  fontSize: 13,
                  opacity: 0.95,
                  background: "rgba(15,23,42,0.65)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  padding: 12,
                  borderRadius: 14,
                  maxHeight: "60vh",
                  overflow: "auto",
                }}
              >
                {reasonText}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
