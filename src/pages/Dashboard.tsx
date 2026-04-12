// src/pages/Dashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css";
import { api } from "../lib/api";

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

/** Small “market-like” equity curve (fills the whole card) */
function EquityCurveChart({
  series,
  height = 210,
}: {
  series: number[];
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

  const line = up ? "rgba(0,255,209,0.95)" : "rgba(255,80,120,0.95)";
  const glow = up ? "rgba(0,255,209,0.30)" : "rgba(255,80,120,0.28)";
  const fillTop = up ? "rgba(0,255,209,0.22)" : "rgba(255,80,120,0.18)";
  const fillBot = up ? "rgba(0,255,209,0.00)" : "rgba(255,80,120,0.00)";

  const data = series.length ? series : [start];
  const minRaw = Math.min(...data);
  const maxRaw = Math.max(...data);

  // Keep a little breathing room so it doesn’t look “flat”
  const pad = Math.max(0.35, Math.abs(maxRaw - minRaw) * 0.18);
  const min = minRaw - pad;
  const max = maxRaw + pad;
  const span = Math.max(1e-9, max - min);

  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const xStep = innerW / Math.max(1, data.length - 1);

  const pts = data.map((v, i) => {
    const x = padL + i * xStep;
    const y = padT + innerH * (1 - (v - min) / span);
    return { x, y, v };
  });

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) d += ` L ${pts[i].x} ${pts[i].y}`;

  // Area path
  const area = `${d} L ${padL + innerW} ${padT + innerH} L ${padL} ${padT + innerH} Z`;

  // y-axis ticks (4)
  const ticks = 4;
  const tickVals = Array.from({ length: ticks + 1 }).map((_, i) => {
    const t = i / ticks;
    return max - t * (max - min);
  });

  // baseline at start
  const yStart = padT + innerH * (1 - (start - min) / span);
  const lastPt = pts[pts.length - 1];
  const lastLabelY = Math.max(
    padT + 6,
    Math.min(lastPt.y - 14, padT + innerH - 28)
  );

  const badgeBorder = up ? "rgba(0,255,209,.32)" : "rgba(255,80,120,.32)";
  const badgeBg = up ? "rgba(0,255,209,.10)" : "rgba(255,80,120,.10)";

  return (
    <div style={{ padding: "12px 14px 14px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 900 }}>
          Start: ${fmtMoney(start)} — Last: ${fmtMoney(last)}
        </div>

        <div
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            border: `1px solid ${badgeBorder}`,
            background: badgeBg,
            fontWeight: 950,
            fontSize: 12,
            whiteSpace: "nowrap",
          }}
        >
          {up ? "+" : ""}
          {fmtMoney(delta)} ({up ? "+" : ""}
          {pct.toFixed(2)}%)
        </div>
      </div>

      <div
        style={{
          height,
          width: "100%",
          borderRadius: 14,
          background:
            "linear-gradient(180deg, rgba(0,0,0,.22), rgba(0,0,0,.10))",
          border: "1px solid rgba(255,255,255,.07)",
          overflow: "hidden",
        }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillTop} />
              <stop offset="100%" stopColor={fillBot} />
            </linearGradient>
            <filter id="eqGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* grid */}
          {tickVals.map((_, i) => {
            const y = padT + (innerH * i) / ticks;
            return (
              <line
                key={i}
                x1={padL}
                x2={padL + innerW}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
              />
            );
          })}

          {/* y labels */}
          {tickVals.map((v, i) => {
            const y = padT + (innerH * i) / ticks;
            return (
              <text
                key={`t${i}`}
                x={padL - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="12"
                fill="rgba(255,255,255,0.55)"
                fontWeight="800"
              >
                {fmtMoney(v)}
              </text>
            );
          })}

          {/* baseline */}
          <line
            x1={padL}
            x2={padL + innerW}
            y1={yStart}
            y2={yStart}
            stroke="rgba(255,255,255,0.12)"
            strokeDasharray="6 6"
            strokeWidth="1"
          />

          {/* area + line */}
          <path d={area} fill="url(#eqFill)" />
          <path
            d={d}
            fill="none"
            stroke={glow}
            strokeWidth="7"
            filter="url(#eqGlow)"
          />
          <path d={d} fill="none" stroke={line} strokeWidth="3.2" />

          {/* last point */}
          <circle cx={lastPt.x} cy={lastPt.y} r={5.5} fill={line} />
          <circle
            cx={lastPt.x}
            cy={lastPt.y}
            r={9}
            fill="rgba(255,255,255,0.06)"
          />

          {/* last label (right) */}
          <rect
            x={W - padR - 154}
            y={lastLabelY}
            width="146"
            height="26"
            rx="10"
            fill="rgba(9, 15, 30, 0.92)"
            stroke="rgba(255,255,255,0.12)"
          />
          <text
            x={W - padR - 81}
            y={lastLabelY + 17}
            textAnchor="middle"
            fontSize="12"
            fill="rgba(255,255,255,0.88)"
            fontWeight="950"
          >
            last: {fmtMoney(last)}
          </text>
        </svg>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const nav = useNavigate();

  const topCoins = useMemo(
    () => ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "BNBUSDT"],
    []
  );

  const [activeSymbol, setActiveSymbol] = useState("BTCUSDT");
  const [symbolInput, setSymbolInput] = useState("BTCUSDT");

  const [mode, setMode] = useState<RiskMode>("MINI_ASYM");
  const [side, setSide] = useState<Side>("LONG");

  const [size, setSize] = useState(0.65);
  const [sl, setSl] = useState(0.55);
  const [tp, setTp] = useState(1.1);
  const [leverage, setLeverage] = useState(6);

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

  const [equity, setEquity] = useState(1000);
  const [liveSymbol, setLiveSymbol] = useState("BTCUSDT");
  const [livePrice, setLivePrice] = useState(0);

  const [topPrices, setTopPrices] = useState<Record<string, number>>({});
  const [trades, setTrades] = useState<Trade[]>([]);
  const [equitySeries, setEquitySeries] = useState<number[]>([1000]);

  const [placing, setPlacing] = useState(false);
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
      const r = await apiGet<{ ok: boolean; events: AutoHistoryEvent[] }>(
        "/auto/history?limit=60"
      );
      setAutoHistory(r.events ?? []);
    } catch {
      setAutoHistory([]);
    }
  }

  // mode -> preset (also sets default max trades/day)
  useEffect(() => {
    const p = presetForMode(mode);
    setSize(p.size);
    setSl(p.sl);
    setTp(p.tp);
    setLeverage(p.leverage);
    setMaxTradesPerDay(p.maxTrades);
  }, [mode]);

  // initial load
  useEffect(() => {
    (async () => {
      try {
        setError("");
        await loadExchangeStatus();
        await loadAutoStatus();

        const bal = await apiGet<{ total?: number }>("/balance");
        const eq0 = Number(bal.total ?? 1000);
        setEquity(eq0);

        const t = await apiGet<{ trades?: Trade[] }>(
          "/trades?current_session=true&limit=50"
        );
        const list = (t.trades ?? []).slice();
        setTrades(list);

        // Build curve from oldest -> newest
        const startEq = 1000;
        const curve: number[] = [startEq];
        for (const tr of list.slice().reverse()) {
          const v = Number(tr.equity_after);
          if (isFinite(v)) curve.push(v);
        }
        setEquitySeries(curve.length ? curve : [startEq]);

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
    const bal = await apiGet<{ total?: number }>("/balance");
    setEquity(Number(bal.total ?? 1000));

    const t = await apiGet<{ trades?: Trade[] }>(
      "/trades?current_session=true&limit=50"
    );
    const list = (t.trades ?? []).slice();
    setTrades(list);

    const startEq = 1000;
    const curve: number[] = [startEq];
    for (const tr of list.slice().reverse()) {
      const v = Number(tr.equity_after);
      if (isFinite(v)) curve.push(v);
    }
    setEquitySeries(curve.length ? curve : [startEq]);

    await loadExchangeStatus();
    await loadAutoStatus();
    await loadAutoHistory();
  }

  const connected = !!exStatus?.connected;
  const aiRunning = !!autoStatus?.running;

  async function placeTrade() {
    try {
      setError("");
      setPlacing(true);

      if (aiRunning) {
        setPlacing(false);
        setError("Manual trading is disabled while AI is running.");
        return;
      }

      const st = exStatus ?? (await apiGet<ExchangeStatus>("/exchange/status"));
      if (!st.connected) {
        setPlacing(false);
        setError("Connect exchange first (go to Exchange tab).");
        return;
      }

      const symbol = (symbolInput || activeSymbol).toUpperCase().trim();
      if (!symbol.endsWith("USDT"))
        throw new Error("Use Binance symbol like BTCUSDT / ETHUSDT / SOLUSDT");

      const payload = { symbol, side, mode, size, sl, tp, leverage };
      await apiPost("/trade", payload);
      await refreshTradesAndEquity();
      setPlacing(false);
    } catch (e: any) {
      setPlacing(false);
      setError(e?.message || "Trade failed");
    }
  }

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
            <div className="brandSub">
              Mini-Asym demo — accuracy-first automated trading (Option B)
            </div>
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
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.10)",
              background: connected
                ? "rgba(0,255,224,0.10)"
                : "rgba(255,80,120,0.10)",
              fontWeight: 900,
            }}
          >
            Exchange:{" "}
            {connected ? (
              <>
                Connected (
                <span style={{ opacity: 0.9 }}>{exStatus?.exchange}</span>){" "}
                <span style={{ opacity: 0.7 }}>
                  • {exStatus?.api_key_masked}
                </span>
              </>
            ) : (
              "Not Connected"
            )}
          </div>

          {!connected && (
            <button
              onClick={() => nav("/exchange")}
              style={{
                borderRadius: 14,
                border: "1px solid rgba(0,255,224,0.22)",
                background: "rgba(0,255,224,0.10)",
                color: "white",
                padding: "10px 12px",
                fontWeight: 950,
                cursor: "pointer",
              }}
            >
              Connect Exchange First
            </button>
          )}

          <div
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.10)",
              background: aiRunning
                ? "rgba(0,255,224,0.10)"
                : "rgba(255,255,255,0.04)",
              fontWeight: 950,
              maxWidth: "100%",
            }}
            title={aiTitle}
          >
            {aiLine}
          </div>

          <button
            type="button"
            onClick={() => setAiLogOpen(true)}
            style={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
              color: "white",
              padding: "10px 12px",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            AI Log
          </button>
        </div>

        <div className="mainGrid">
          {/* LEFT: EXECUTE TRADE */}
          <section className="card exec">
            <div className="cardHead">
              <div className="title">EXECUTE TRADE</div>
              <div className="hint">
                Sandbox only — manual disabled while AI runs
              </div>
            </div>

            <div className="modes">
              {(
                ["ULTRA_SAFE", "SAFE", "NORMAL", "MINI_ASYM", "AGGRESSIVE"] as RiskMode[]
              ).map((m) => (
                <button
                  key={m}
                  className={`pill ${mode === m ? "active" : ""}`}
                  onClick={() => setMode(m)}
                  type="button"
                >
                  {m === "MINI_ASYM" ? "Mini-Asym" : m.replace("_", " ")}
                </button>
              ))}
            </div>

            <div className="formRow">
              <label>Symbol</label>
              <div className="rowInline">
                <input
                  className="input"
                  value={symbolInput}
                  onChange={(e) =>
                    setSymbolInput(e.target.value.toUpperCase())
                  }
                  placeholder="BTCUSDT"
                />
                <button
                  className="ghost"
                  type="button"
                  onClick={() =>
                    setLiveSymbol(
                      (symbolInput || activeSymbol).toUpperCase().trim()
                    )
                  }
                >
                  Track
                </button>
                <button
                  className="ghost"
                  type="button"
                  onClick={() =>
                    nav(
                      `/market/${encodeURIComponent(
                        (symbolInput || activeSymbol).toUpperCase().trim()
                      )}`
                    )
                  }
                >
                  Chart
                </button>
              </div>
            </div>

            <div className="grid4">
              <div className="field">
                <label>Size %</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                />
              </div>
              <div className="field">
                <label>SL %</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={sl}
                  onChange={(e) => setSl(Number(e.target.value))}
                />
              </div>
              <div className="field">
                <label>TP %</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={tp}
                  onChange={(e) => setTp(Number(e.target.value))}
                />
              </div>
              <div className="field">
                <label>Leverage</label>
                <input
                  className="input"
                  type="number"
                  step="1"
                  value={leverage}
                  onChange={(e) => setLeverage(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Trading Style Cards */}
            <div style={{ marginTop: 12, marginBottom: 4 }}>
              <label style={{ fontSize: 11, opacity: 0.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1 }}>Trading Style</label>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                {([
                  { id: "SCALP",     tf: "15m", interval: "15m checks", desc: "Quick entries, tight ATR SL/TP" },
                  { id: "DAY_TRADE", tf: "1h",  interval: "1h checks",  desc: "Balanced risk, 1h timeframe" },
                  { id: "SWING",     tf: "4h",  interval: "4h checks",  desc: "Wider ATR, multi-day swings" },
                ] as { id: TradeStyle; tf: string; interval: string; desc: string }[]).map((s) => {
                  const active = tradeStyle === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setTradeStyle(s.id)}
                      style={{
                        flex: 1, padding: "10px 8px", borderRadius: 12, cursor: "pointer",
                        border: active ? "1.5px solid rgba(0,255,224,0.5)" : "1px solid rgba(255,255,255,0.10)",
                        background: active ? "rgba(0,255,224,0.10)" : "rgba(255,255,255,0.04)",
                        color: "white", textAlign: "left",
                      }}
                    >
                      <div style={{ fontWeight: 900, fontSize: 13, color: active ? "#00ffe0" : "white" }}>{s.id}</div>
                      <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>{s.tf} · {s.interval}</div>
                      <div style={{ fontSize: 10, opacity: 0.5, marginTop: 2 }}>{s.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid4" style={{ marginTop: 10 }}>
              <div className="field">
                <label>Duration (days)</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={365}
                  step={1}
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                />
              </div>
              <div className="field">
                <label>Max trades/day (0=∞)</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={20}
                  step={1}
                  value={maxTradesPerDay}
                  onChange={(e) => setMaxTradesPerDay(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid4" style={{ marginTop: 10 }}>
              <div className="field">
                <label>Stop after bad trades</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={10}
                  step={1}
                  value={stopAfterBadTrades}
                  onChange={(e) => setStopAfterBadTrades(Number(e.target.value))}
                />
              </div>
              <div className="field">
                <label>Chop filter min sep %</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={0.2}
                  step={0.001}
                  value={chopMinSepPct}
                  onChange={(e) => setChopMinSepPct(Number(e.target.value))}
                />
              </div>

              <div
                className="field"
                style={{ display: "flex", alignItems: "end", gap: 10 }}
              >
                <label style={{ width: "100%" }}>
                  Trend filter (EMA50/EMA200)
                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <input
                      type="checkbox"
                      checked={trendFilter}
                      onChange={(e) => setTrendFilter(e.target.checked)}
                    />
                    <span style={{ opacity: 0.8, fontSize: 12 }}>
                      ON = fewer, higher quality trades
                    </span>
                  </div>
                </label>
              </div>

              <div className="field">
                <label>AI Trader</label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    className="primary"
                    type="button"
                    onClick={startAI}
                    disabled={!connected || aiRunning}
                  >
                    {aiRunning ? "AI Running" : "Start AI"}
                  </button>
                  <button
                    className="danger"
                    type="button"
                    onClick={stopAI}
                    disabled={!aiRunning}
                  >
                    Stop AI
                  </button>
                </div>
              </div>
            </div>

            <div className="sideRow">
              <button
                className={`sideBtn long ${side === "LONG" ? "active" : ""}`}
                type="button"
                onClick={() => setSide("LONG")}
              >
                LONG
              </button>
              <button
                className={`sideBtn short ${side === "SHORT" ? "active" : ""}`}
                type="button"
                onClick={() => setSide("SHORT")}
              >
                SHORT
              </button>
            </div>

            <div
              className="actions"
              style={{ gap: 10, display: "flex", flexWrap: "wrap" }}
            >
              <button
                className="primary"
                type="button"
                onClick={placeTrade}
                disabled={placing || aiRunning}
              >
                {aiRunning
                  ? "Manual Disabled (AI Running)"
                  : placing
                  ? "Placing…"
                  : "Place Trade"}
              </button>

              <button className="danger" type="button" onClick={resetSandbox}>
                Reset Sandbox
              </button>

              <button
                className="ghost"
                type="button"
                onClick={() => nav("/miniasym")}
                style={{ borderRadius: 14 }}
              >
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
                <div className="hint">Session equity (sandbox)</div>
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
                <div className="hint">Market-style curve (session)</div>
              </div>
              <EquityCurveChart series={equitySeries} height={220} />
            </section>
          </div>
        </div>

        {/* BOTTOM: RECENT TRADES ONLY */}
        <section className="card">
          <div className="cardHead">
            <div className="title">RECENT TRADES</div>
            <div className="hint">{trades.length} total (current session)</div>
          </div>

          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Symbol</th>
                  <th>Side</th>
                  <th>Mode</th>
                  <th>Size</th>
                  <th>SL</th>
                  <th>TP</th>
                  <th>Lev</th>
                  <th>Equity</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {trades.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="empty">
                      No trades in this session (try Start AI).
                    </td>
                  </tr>
                ) : (
                  trades.slice(0, 12).map((t, i) => {
                    const when = ((t.time || t.created_at) ?? "-").toString();
                    const shortReason =
                      (t.reason || "")
                        .split("\n")
                        .slice(0, 2)
                        .join(" • ")
                        .slice(0, 90) || "-";

                    return (
                      <tr key={t.id ?? i}>
                        <td>{when}</td>
                        <td>{t.symbol}</td>
                        <td className={t.side === "LONG" ? "good" : "bad"}>
                          {t.side}
                        </td>
                        <td>{t.mode || "-"}</td>
                        <td>{Number(t.size ?? 0).toFixed(2)}</td>
                        <td>{Number(t.sl ?? 0).toFixed(2)}</td>
                        <td>{Number(t.tp ?? 0).toFixed(2)}</td>
                        <td>{Number(t.leverage ?? 0).toFixed(1)}</td>
                        <td>${fmtMoney(Number(t.equity_after ?? 0))}</td>
                        <td>
                          {t.reason ? (
                            <button
                              type="button"
                              onClick={() => {
                                setReasonText(t.reason || "");
                                setReasonOpen(true);
                              }}
                              style={{
                                borderRadius: 12,
                                border: "1px solid rgba(255,255,255,0.10)",
                                background: "rgba(255,255,255,0.04)",
                                color: "white",
                                padding: "8px 10px",
                                cursor: "pointer",
                                fontWeight: 850,
                                maxWidth: 260,
                              }}
                              title="View full reason"
                            >
                              {shortReason}
                            </button>
                          ) : (
                            <span style={{ opacity: 0.7 }}>-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
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
                If you see “Blocked: CHOP_FILTER / TREND_FILTER” it means AI is
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
