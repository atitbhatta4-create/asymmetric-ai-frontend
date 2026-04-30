import React, { useEffect, useState } from "react";
import * as api from "../lib/api";
import useIsMobile from "../hooks/useIsMobile";

// ── types ────────────────────────────────────────────────────────────────────
type MonthlyPnl  = { month: string; pnl: number; trades: number; wins: number };
type SessionData = { trades: number; wins: number; pnl: number; win_rate: number; pnl_history: number[] };
type SymbolData  = { symbol: string; trades: number; wins: number; pnl: number; win_rate: number };
type ModeData    = { mode: string;   trades: number; wins: number; pnl: number; win_rate: number };
type StyleData   = { style: string;  trades: number; wins: number; pnl: number; win_rate: number; avg_hold: string };
type TradeRec    = { time: string; side: string; symbol: string; mode: string; unreal_pnl_percent: number; unreal_pnl_value: number; entry_price: number; current_price: number; reason?: string | null; sl: number; tp: number; leverage: number };

type Stats = {
  empty?: boolean;
  summary: {
    total_pnl: number; total_trades: number; win_rate: number;
    avg_rr: number; best_month: MonthlyPnl | null; worst_month: MonthlyPnl | null;
    current_streak: { type: "W" | "L"; count: number };
    max_drawdown: number; health_score: number; consistency_score: number;
  };
  equity_curve:         Array<{ time: string; equity: number }>;
  drawdown_curve:       Array<{ time: string; dd: number }>;
  monthly_pnl:          MonthlyPnl[];
  session_distribution: Record<string, SessionData>;
  grade_distribution:   Record<string, number>;
  symbol_breakdown:     SymbolData[];
  mode_breakdown:       ModeData[];
  style_breakdown:      StyleData[];
  time_heatmap:         Record<number, { wins: number; losses: number }>;
  best_trade:           TradeRec;
  worst_trade:          TradeRec;
  ai_summary:           string;
  mistake_detection:    string[];
  ratios:               { sharpe: number; sortino: number; calmar: number };
  most_traded_symbol:   string;
};

// ── palette ──────────────────────────────────────────────────────────────────
const T  = "rgba(255,255,255,.92)";
const M  = "rgba(255,255,255,.55)";
const S  = "rgba(255,255,255,.30)";
const GN = "rgba(0,255,209,.95)";
const RD = "rgba(255,80,120,.90)";
const YL = "rgba(251,191,36,.9)";
const CARD    = "rgba(13,22,44,.72)";
const BORDER  = "rgba(255,255,255,.10)";
const BORDER2 = "rgba(255,255,255,.06)";

// ── helpers ───────────────────────────────────────────────────────────────────
const f2    = (n: number) => isFinite(n) ? n.toFixed(2) : "-";
const dollar = (n: number) => `${n >= 0 ? "+" : "-"}$${Math.abs(n).toFixed(2)}`;
const clr   = (n: number) => n >= 0 ? GN : RD;
const card  = (s?: React.CSSProperties): React.CSSProperties =>
  ({ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, backdropFilter: "blur(10px)", ...s });
const Head  = ({ label }: { label: string }) => (
  <div style={{ padding: "10px 14px 8px", borderBottom: `1px solid ${BORDER2}` }}>
    <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase", color: M }}>{label}</div>
  </div>
);

// ── reason parser ─────────────────────────────────────────────────────────────
function parseReason(reason: string | null | undefined) {
  const lines = (reason || "").split("\n").map(l => l.trim()).filter(Boolean);
  const get   = (prefix: string) => lines.find(l => l.startsWith(prefix))?.slice(prefix.length).trim() ?? "";
  const grade = lines.find(l => l.startsWith("Grade")) ?? "";
  return {
    styleLine: lines[0] ?? "",
    grade,
    isGradeA:  grade.includes("Grade A"),
    isT1:      grade.includes("T1"),
    isT2:      grade.includes("T2"),
    signal:    get("Signal"),
    outcome:   get("Outcome"),
    sltp:      lines.find(l => l.startsWith("SL (")) ?? "",
    trailing:  get("Trailing:"),
    volAdj:    get("Vol adj:"),
    size:      get("Size:"),
  };
}

// ── SVG: equity curve ─────────────────────────────────────────────────────────
function EquityCurve({ data }: { data: Array<{ equity: number }> }) {
  if (data.length < 2) return null;
  const W = 400, H = 130, P = 8;
  const vals = data.map(d => d.equity);
  const min = Math.min(...vals), max = Math.max(...vals), range = max - min || 1;
  const tx = (i: number) => P + (i / (vals.length - 1)) * (W - P * 2);
  const ty = (v: number) => H - P - ((v - min) / range) * (H - P * 2);
  const pts  = vals.map((v, i) => `${tx(i).toFixed(1)},${ty(v).toFixed(1)}`).join(" ");
  const fill = `M${tx(0).toFixed(1)},${(H-P).toFixed(1)} L${pts} L${tx(vals.length-1).toFixed(1)},${(H-P).toFixed(1)} Z`;
  const color = vals[vals.length-1] >= vals[0] ? "#00ffd1" : "#ff5078";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%" }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="eq-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".28" />
          <stop offset="100%" stopColor={color} stopOpacity=".02" />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#eq-g)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

// ── SVG: drawdown curve + protection tier lines ───────────────────────────────
const DD_TIERS = [
  { pct: -4,  label: "-4%",  color: "rgba(251,191,36,.55)" },
  { pct: -7,  label: "-7%",  color: "rgba(255,140,60,.60)" },
  { pct: -10, label: "-10%", color: "rgba(255,80,120,.65)" },
  { pct: -15, label: "-15%", color: "rgba(255,30,80,.80)"  },
];

function DrawdownCurve({ data }: { data: Array<{ dd: number }> }) {
  if (data.length < 2) return null;
  const W = 400, H = 120, P = 8;
  const vals = data.map(d => d.dd);
  const floor = Math.min(-15.5, Math.min(...vals) * 1.1);
  if (Math.min(...vals) >= 0) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: GN, fontSize: 12 }}>
      No drawdown — perfect run
    </div>
  );
  const ty = (v: number) => P + (v / floor) * (H - P * 2);
  const tx = (i: number) => P + (i / (vals.length - 1)) * (W - P * 2);
  const pts  = vals.map((v, i) => `${tx(i).toFixed(1)},${ty(v).toFixed(1)}`).join(" ");
  const fill = `M${tx(0).toFixed(1)},${P} L${pts} L${tx(vals.length-1).toFixed(1)},${P} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%" }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="dd-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff5078" stopOpacity=".03" />
          <stop offset="100%" stopColor="#ff5078" stopOpacity=".35" />
        </linearGradient>
      </defs>
      <line x1={P} y1={P} x2={W-P} y2={P} stroke="rgba(255,255,255,.12)" strokeWidth="1" />
      {DD_TIERS.map(t => {
        const y = ty(t.pct);
        if (y < P || y > H - P) return null;
        return (
          <g key={t.pct}>
            <line x1={P} y1={y} x2={W-P} y2={y} stroke={t.color} strokeWidth="1" strokeDasharray="4 3" />
            <text x={W - P - 2} y={y - 2} textAnchor="end" fontSize="7" fill={t.color}>{t.label}</text>
          </g>
        );
      })}
      <path d={fill} fill="url(#dd-g)" />
      <polyline points={pts} fill="none" stroke="#ff5078" strokeWidth="1.8" />
    </svg>
  );
}

// ── SVG: monthly bars ─────────────────────────────────────────────────────────
function MonthlyBars({ data }: { data: MonthlyPnl[] }) {
  if (!data.length) return null;
  const W = 500, H = 90, P = 8;
  const maxAbs = Math.max(...data.map(d => Math.abs(d.pnl)), 0.01);
  const bw = Math.max(4, (W - P * 2) / data.length - 2);
  const midY = H / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%" }} preserveAspectRatio="none">
      <line x1={P} y1={midY} x2={W-P} y2={midY} stroke="rgba(255,255,255,.10)" strokeWidth="1" />
      {data.map((d, i) => {
        const x  = P + i * ((W - P * 2) / data.length);
        const bh = (Math.abs(d.pnl) / maxAbs) * (H / 2 - P);
        const y  = d.pnl >= 0 ? midY - bh : midY;
        return <rect key={i} x={x} y={y} width={bw} height={Math.max(1, bh)}
          fill={d.pnl >= 0 ? "#00ffd1" : "#ff5078"} opacity=".82" rx="2" />;
      })}
    </svg>
  );
}

// ── SVG: win rate ring ────────────────────────────────────────────────────────
function WinRing({ wins, losses, rate }: { wins: number; losses: number; rate: number }) {
  const r = 36, cx = 50, cy = 52, circ = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,80,120,.20)" strokeWidth="11" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#00ffd1" strokeWidth="11"
        strokeDasharray={`${(rate / 100) * circ} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy-7}  textAnchor="middle" fill="white"  fontSize="19" fontWeight="900">{rate}%</text>
      <text x={cx} y={cy+8}  textAnchor="middle" fill={M}      fontSize="8.5" fontWeight="800">WIN RATE</text>
      <text x={cx} y={cy+20} textAnchor="middle" fill={S}      fontSize="8">{wins}W / {losses}L</text>
    </svg>
  );
}

// ── SVG: sparkline (cumulative P&L) ──────────────────────────────────────────
function Sparkline({ values }: { values: number[] }) {
  if (!values || values.length < 2) return <span style={{ color: S, fontSize: 9 }}>—</span>;
  const W = 72, H = 22, P = 2;
  const cum = values.reduce<number[]>((acc, v) => [...acc, (acc[acc.length-1] ?? 0) + v], []);
  const min = Math.min(...cum), max = Math.max(...cum), range = max - min || 1;
  const tx  = (i: number) => P + (i / (cum.length - 1)) * (W - P * 2);
  const ty  = (v: number) => H - P - ((v - min) / range) * (H - P * 2);
  const pts = cum.map((v, i) => `${tx(i).toFixed(1)},${ty(v).toFixed(1)}`).join(" ");
  const color = cum[cum.length-1] >= 0 ? "#00ffd1" : "#ff5078";
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ── score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ score, label, color }: { score: number; label: string; color: string }) {
  const tag = score >= 75 ? "Excellent" : score >= 55 ? "Good" : score >= 35 ? "Fair" : "Needs work";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 900, color: M, letterSpacing: ".06em", textTransform: "uppercase" }}>{label}</span>
        <span style={{ fontSize: 24, fontWeight: 900, color }}>{score}</span>
      </div>
      <div style={{ height: 7, background: "rgba(255,255,255,.08)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 4 }} />
      </div>
      <div style={{ marginTop: 5, fontSize: 10, color: S }}>{tag}</div>
    </div>
  );
}

// ── mini bar ──────────────────────────────────────────────────────────────────
function MiniBar({ pct: p, color }: { pct: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,.07)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(100, p)}%`, background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 10, color: M, width: 34, textAlign: "right" }}>{p.toFixed(0)}%</span>
    </div>
  );
}

// ── risk protection layers panel ──────────────────────────────────────────────
function RiskLayers({ maxDrawdown }: { maxDrawdown: number }) {
  const tiers = [
    { label: "Tier 1 — Caution",  thresh: 4,  action: "Size shrinks to 65%",    color: YL },
    { label: "Tier 2 — Reduce",   thresh: 7,  action: "Size shrinks to 40%",    color: "rgba(255,140,60,.9)" },
    { label: "Tier 3 — Recovery", thresh: 10, action: "Size shrinks to 25%",    color: RD },
    { label: "Tier 4 — STOP",     thresh: 15, action: "Engine stops completely", color: "rgba(255,30,80,.95)" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {tiers.map(t => {
        const hit     = maxDrawdown >= t.thresh;
        const partial = !hit && maxDrawdown >= t.thresh * 0.6;
        const pct     = Math.min(100, (maxDrawdown / t.thresh) * 100);
        return (
          <div key={t.thresh}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: hit ? t.color : T }}>{t.label}</span>
              <span style={{ fontSize: 10, color: hit ? t.color : partial ? YL : S }}>
                {hit ? "TRIGGERED" : partial ? "Approaching" : `−${t.thresh}% threshold`}
              </span>
            </div>
            <div style={{ height: 5, background: "rgba(255,255,255,.07)", borderRadius: 3, overflow: "hidden", marginBottom: 3 }}>
              <div style={{ height: "100%", width: `${pct}%`, background: t.color, borderRadius: 3, opacity: hit ? 1 : 0.5 }} />
            </div>
            <div style={{ fontSize: 9, color: S }}>{t.action}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── trade card: best or worst ─────────────────────────────────────────────────
function TradeCard({ trade, isBest }: { trade: TradeRec; isBest: boolean }) {
  const pnlVal = trade.unreal_pnl_value;
  const pnlPct = trade.unreal_pnl_percent;
  const accent = isBest ? GN : RD;
  const p      = parseReason(trade.reason);

  // Outcome label clean-up
  const outcomeType =
    p.outcome.includes("Take profit") ? "Take profit hit" :
    p.outcome.includes("Stop loss")   ? "Stop loss hit"   :
    p.outcome.includes("Trailing")    ? "Trailing stop"   :
    p.outcome.includes("Natural")     ? "Natural close"   : p.outcome;

  // What grade tells us about signal quality
  const gradeNote = p.isGradeA
    ? "Grade A — engine's highest confidence signal (full size)"
    : p.isT1 ? "Grade B T1 — strong signal, 60% size, tighter TP"
    : p.isT2 ? "Grade B T2 — secondary leg, 40% size, moved to breakeven after T1"
    : p.grade;

  // For best trade: why it worked
  // For worst trade: why taken + what failed
  const trailingNote = p.trailing && !p.trailing.includes("not triggered")
    ? p.trailing : null;
  const volNote = p.volAdj && !p.volAdj.startsWith("100%") ? `Vol-adjusted: ${p.volAdj}` : null;

  return (
    <div style={{ ...card(), padding: "16px" }}>
      {/* header */}
      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: ".10em", textTransform: "uppercase", color: M, marginBottom: 8 }}>
        {isBest ? "Best Trade Ever" : "Worst Trade Ever"}
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color: accent }}>{dollar(pnlVal)}</div>
      <div style={{ fontSize: 13, color: accent, marginBottom: 12 }}>
        {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}% leveraged
      </div>

      {/* meta */}
      <div style={{ fontSize: 11, color: M, marginBottom: 12 }}>
        {trade.symbol} · {trade.side} · {trade.mode} · {p.styleLine}
      </div>

      {isBest ? (
        /* ── WHY IT WORKED ── */
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", color: GN, marginBottom: 2 }}>
            Why It Worked
          </div>
          {[
            { icon: "◈", text: gradeNote },
            { icon: "→", text: p.signal  ? `Signal: ${p.signal}` : null },
            { icon: "◉", text: outcomeType },
            { icon: "▲", text: trailingNote ? `Trailing: ${trailingNote}` : null },
            { icon: "⬡", text: p.sltp    ? `Protection: ${p.sltp}` : null },
            { icon: "✦", text: volNote },
          ].filter(r => r.text).map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 8, fontSize: 11, color: T, lineHeight: 1.5 }}>
              <span style={{ color: GN, flexShrink: 0 }}>{r.icon}</span>
              <span>{r.text}</span>
            </div>
          ))}
        </div>
      ) : (
        /* ── WHY TAKEN + WHAT FAILED ── */
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", color: YL, marginBottom: 6 }}>
              Why It Was Taken
            </div>
            {[
              { icon: "◈", text: gradeNote },
              { icon: "→", text: p.signal ? `Signal: ${p.signal}` : null },
              { icon: "⬡", text: p.sltp   ? `Risk set: ${p.sltp}` : null },
            ].filter(r => r.text).map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 8, fontSize: 11, color: T, lineHeight: 1.5, marginBottom: 3 }}>
                <span style={{ color: YL, flexShrink: 0 }}>{r.icon}</span>
                <span>{r.text}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", color: RD, marginBottom: 6 }}>
              What Failed
            </div>
            {[
              { icon: "✕", text: `Outcome: ${outcomeType}` },
              {
                icon: "✕",
                text: outcomeType === "Natural close"
                  ? "Price drifted against position — closed at interval end without hitting SL/TP"
                  : outcomeType === "Stop loss hit"
                  ? "Price moved against entry and hit the ATR-based stop loss"
                  : null,
              },
              { icon: "✕", text: trailingNote ? `Trailing stopped out: ${trailingNote}` : null },
            ].filter(r => r.text).map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 8, fontSize: 11, color: T, lineHeight: 1.5, marginBottom: 3 }}>
                <span style={{ color: RD, flexShrink: 0 }}>{r.icon}</span>
                <span>{r.text}</span>
              </div>
            ))}
            <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 8, background: "rgba(255,80,120,.07)", border: `1px solid rgba(255,80,120,.15)`, fontSize: 10, color: M, lineHeight: 1.5 }}>
              After this loss, Mini-Asym automatically raised signal strictness to reduce trade frequency and protect remaining capital.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function Portfolio() {
  const isMobile = useIsMobile();
  const [stats, setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      setStats(await api.apiRequest<Stats>("/portfolio/stats", { method: "GET" }));
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const pg: React.CSSProperties = {
    minHeight: "100vh", padding: 14, color: T,
    fontFamily: "ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial",
    background: "radial-gradient(900px 600px at 20% -10%,rgba(0,255,209,.07),transparent 55%),radial-gradient(900px 600px at 85% 0%,rgba(120,90,255,.08),transparent 55%),linear-gradient(180deg,#070a14,#0a1022)",
  };

  if (loading) return <div style={{ ...pg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:M }}>Loading portfolio…</div>;
  if (error)   return <div style={{ ...pg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:RD }}>{error}</div>;
  if (!stats || stats.empty) return (
    <div style={{ ...pg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:18, fontWeight:900, marginBottom:8 }}>No trades yet</div>
        <div style={{ fontSize:13, color:M }}>Run the AI or make a manual trade to see your portfolio analytics.</div>
      </div>
    </div>
  );

  const { summary, equity_curve, drawdown_curve, monthly_pnl, session_distribution,
    grade_distribution, symbol_breakdown, mode_breakdown, style_breakdown,
    time_heatmap, best_trade, worst_trade, ai_summary, mistake_detection,
    ratios, most_traded_symbol } = stats;

  const totalWins   = Math.round(summary.total_trades * (summary.win_rate / 100));
  const totalLosses = summary.total_trades - totalWins;
  const G = 12; // grid gap

  // ── streak card note ──────────────────────────────────────────────────────
  const streakSub = summary.current_streak.type === "W"
    ? "consecutive wins — engine confidence rising"
    : `consecutive losses — engine tightening strictness automatically`;

  const summaryCards = [
    { label: "Total P&L",       value: dollar(summary.total_pnl),        sub: `${summary.total_trades} trades`,  color: clr(summary.total_pnl) },
    { label: "Win Rate",        value: `${summary.win_rate}%`,            sub: `${totalWins}W / ${totalLosses}L`, color: summary.win_rate >= 50 ? GN : RD },
    { label: "Avg Risk/Reward", value: `1 : ${f2(summary.avg_rr)}`,      sub: "realized R/R",                    color: summary.avg_rr >= 1.5 ? GN : M },
    { label: "Best Month",      value: summary.best_month ? dollar(summary.best_month.pnl) : "-", sub: summary.best_month?.month ?? "", color: GN },
    {
      label: "Streak",
      value: `${summary.current_streak.count}×${summary.current_streak.type}`,
      sub: streakSub,
      color: summary.current_streak.type === "W" ? GN : RD,
    },
    { label: "Max Drawdown",    value: `-${f2(summary.max_drawdown)}%`,  sub: "from peak equity",                color: summary.max_drawdown < 5 ? GN : summary.max_drawdown < 10 ? YL : RD },
    { label: "Health Score",    value: String(summary.health_score),      sub: summary.health_score >= 70 ? "Strong" : summary.health_score >= 45 ? "Fair" : "Weak", color: summary.health_score >= 70 ? GN : summary.health_score >= 45 ? YL : RD },
  ];

  return (
    <div style={pg}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: G }}>

        {/* ── header ── */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize: isMobile ? 16 : 20, fontWeight:900 }}>Portfolio Analytics</div>
            <div style={{ fontSize: isMobile ? 10 : 11, color:M, marginTop:3 }}>{summary.total_trades} trades · all time</div>
          </div>
          <button onClick={load} style={{ padding: isMobile ? "6px 10px" : "8px 14px", borderRadius:10, border:`1px solid ${BORDER}`, background:"rgba(255,255,255,.04)", color:T, fontSize: isMobile ? 11 : 12, fontWeight:800, cursor:"pointer" }}>
            Refresh
          </button>
        </div>

        {/* ── summary cards (streak card has extended sub text) ── */}
        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(7,1fr)", gap: isMobile ? 8 : G }}>
          {summaryCards.map(c => (
            <div key={c.label} style={{ ...card(), padding: isMobile ? "9px 10px" : "12px 14px" }}>
              <div style={{ fontSize: isMobile ? 8 : 9, fontWeight:900, letterSpacing:".10em", textTransform:"uppercase", color:M, marginBottom: isMobile ? 4 : 6 }}>{c.label}</div>
              <div style={{ fontSize: isMobile ? 14 : 18, fontWeight:900, color:c.color, lineHeight:1.1 }}>{c.value}</div>
              <div style={{ fontSize: isMobile ? 9 : 10, color: c.label === "Streak" && summary.current_streak.type === "L" ? RD : S, marginTop: isMobile ? 3 : 4, lineHeight:1.4 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* ── AI summary banner ── */}
        <div style={{ padding:"12px 16px", borderRadius:12, border:`1px solid rgba(0,255,209,.18)`, background:"rgba(0,255,209,.05)", fontSize:12, color:T, fontWeight:600, lineHeight:1.6 }}>
          <span style={{ color:GN, fontWeight:900, marginRight:8 }}>AI Summary</span>{ai_summary}
        </div>

        {/* ── equity + drawdown (with tier lines) ── */}
        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 8 : G }}>
          <div style={card()}>
            <Head label="Equity Curve — Full History" />
            <div style={{ padding:"10px 14px 14px", height:160 }}><EquityCurve data={equity_curve} /></div>
          </div>
          <div style={card()}>
            <Head label="Drawdown Curve — Risk Protection Tiers" />
            <div style={{ padding:"10px 14px 4px", height:145 }}><DrawdownCurve data={drawdown_curve} /></div>
            <div style={{ padding:"0 14px 10px", fontSize:10, color:RD }}>
              Max drawdown: -{f2(summary.max_drawdown)}% from peak
            </div>
          </div>
        </div>

        {/* ── risk protection layers ── */}
        <div style={card()}>
          <Head label="Risk Protection Layers — Active Capital Guards" />
          <div style={{ padding:"14px 16px" }}>
            <RiskLayers maxDrawdown={summary.max_drawdown} />
            <div style={{ marginTop:12, fontSize:10, color:S, lineHeight:1.6 }}>
              These tiers activate automatically as equity drawdown grows from peak.
              No manual intervention needed — Mini-Asym reduces risk and stops trading to protect your capital.
            </div>
          </div>
        </div>

        {/* ── monthly bars + win ring ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 220px", gap:G }}>
          <div style={card()}>
            <Head label="Monthly P&L" />
            <div style={{ padding:"10px 14px 14px", height:120 }}><MonthlyBars data={monthly_pnl} /></div>
            <div style={{ display:"flex", gap:20, padding:"0 14px 12px", fontSize:11, color:M }}>
              {summary.best_month  && <span>Best: <span style={{ color:GN }}>{summary.best_month.month} ({dollar(summary.best_month.pnl)})</span></span>}
              {summary.worst_month && <span>Worst: <span style={{ color:RD }}>{summary.worst_month.month} ({dollar(summary.worst_month.pnl)})</span></span>}
            </div>
          </div>
          <div style={card()}>
            <Head label="Win / Loss" />
            <div style={{ padding:14, height:130 }}><WinRing wins={totalWins} losses={totalLosses} rate={summary.win_rate} /></div>
          </div>
        </div>

        {/* ── consistency + mistakes + grades + ratios ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:G }}>

          <div style={{ ...card(), padding:"14px 16px", display:"flex", flexDirection:"column", gap:18 }}>
            <ScoreBar score={summary.consistency_score} label="Trade Consistency" color={summary.consistency_score >= 65 ? GN : YL} />
            <ScoreBar score={summary.health_score}      label="Health Score"      color={summary.health_score >= 65 ? GN : YL} />
          </div>

          <div style={card()}>
            <Head label="Mistake Detection" />
            <div style={{ padding:"10px 14px 14px", display:"flex", flexDirection:"column", gap:8 }}>
              {mistake_detection.map((m, i) => (
                <div key={i} style={{ fontSize:11, color:T, lineHeight:1.5, padding:"8px 10px", borderRadius:8, background:"rgba(255,80,120,.07)", border:`1px solid rgba(255,80,120,.15)` }}>
                  {m}
                </div>
              ))}
            </div>
          </div>

          <div style={card()}>
            <Head label="Grade Distribution" />
            <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:10 }}>
              {Object.entries(grade_distribution).map(([g, n]) => (
                <div key={g}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, fontSize:11, fontWeight:800 }}>
                    <span style={{ color: g === "A" ? GN : M }}>Grade {g}</span>
                    <span style={{ color:T }}>{n} trades</span>
                  </div>
                  <MiniBar pct={(n / summary.total_trades) * 100} color={g === "A" ? GN : "rgba(120,90,255,.8)"} />
                </div>
              ))}
              <div style={{ marginTop:4, fontSize:10, color:S }}>Grade A = full size · Grade B = T1+T2 split</div>
            </div>
          </div>

          {/* ratios — calmar note when unreliable */}
          <div style={{ ...card(), padding:"14px 16px" }}>
            <div style={{ fontSize:9, fontWeight:900, letterSpacing:".10em", textTransform:"uppercase", color:M, marginBottom:14 }}>Risk-Adjusted Returns</div>
            {([
              { k: "Sharpe",  v: ratios.sharpe,  tip: "Mean / StdDev (annualised)" },
              { k: "Sortino", v: ratios.sortino, tip: "Mean / Downside deviation" },
              { k: "Calmar",  v: ratios.calmar,  tip: "Annual return / Max drawdown", needsYear: true },
            ] as const).map(r => (
              <div key={r.k} style={{ marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
                  <span style={{ fontSize:11, color:M, fontWeight:800 }}>{r.k}</span>
                  <span style={{ fontSize:18, fontWeight:900, color: r.v > 0 ? GN : r.v < 0 ? RD : M }}>{f2(r.v)}</span>
                </div>
                <div style={{ fontSize:9, color:S }}>{r.tip}</div>
                {"needsYear" in r && r.needsYear && summary.total_trades < 30 && (
                  <div style={{ fontSize:9, color:YL, marginTop:2, lineHeight:1.4 }}>
                    ⚠ Requires ~1 year of data for accuracy — early stage estimate only
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── session performance + sparklines ── */}
        <div style={card()}>
          <Head label="Session Performance + Sparklines" />
          <div style={{ padding:"10px 14px 14px", overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:560 }}>
              <thead>
                <tr>
                  {["Session", "Trades", "Win Rate", "P&L", "Win/Loss", "Cumulative P&L"].map(h => (
                    <th key={h} style={{ textAlign:"left", fontSize:10, color:M, fontWeight:900, padding:"6px 10px", borderBottom:`1px solid ${BORDER2}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(session_distribution).sort((a,b) => b[1].trades - a[1].trades).map(([sess, d]) => (
                  <tr key={sess}>
                    <td style={{ padding:"8px 10px", fontSize:12, fontWeight:800 }}>{sess}</td>
                    <td style={{ padding:"8px 10px", fontSize:12, color:M }}>{d.trades}</td>
                    <td style={{ padding:"8px 10px", fontSize:12, color: d.win_rate >= 55 ? GN : d.win_rate >= 45 ? T : RD }}>{d.win_rate}%</td>
                    <td style={{ padding:"8px 10px", fontSize:12, color:clr(d.pnl) }}>{dollar(d.pnl)}</td>
                    <td style={{ padding:"8px 10px", minWidth:110 }}><MiniBar pct={d.win_rate} color={d.win_rate >= 50 ? GN : RD} /></td>
                    <td style={{ padding:"8px 10px" }}><Sparkline values={d.pnl_history ?? []} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── time heatmap ── */}
        <div style={card()}>
          <Head label="Time of Day Heatmap (Dubai Time)" />
          <div style={{ padding:"12px 14px 16px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(24,1fr)", gap:3, marginBottom:8 }}>
              {Array.from({ length: 24 }, (_, h) => {
                const cell = time_heatmap[h] || { wins:0, losses:0 };
                const tot  = cell.wins + cell.losses;
                const wr   = tot ? cell.wins / tot : 0.5;
                const op   = tot ? Math.min(1, 0.25 + (tot / 6) * 0.75) : 0.08;
                const bg   = tot === 0 ? "rgba(255,255,255,.05)"
                  : wr >= 0.6 ? `rgba(0,255,209,${op})`
                  : wr <= 0.4 ? `rgba(255,80,120,${op})`
                  : `rgba(255,255,255,${op * 0.4})`;
                return (
                  <div key={h} title={`${String(h).padStart(2,"0")}:00 Dubai — ${cell.wins}W / ${cell.losses}L`}
                    style={{ height:40, borderRadius:5, background:bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"default", fontSize:8, color:"rgba(255,255,255,.5)", gap:1 }}>
                    <span style={{ fontWeight:900 }}>{String(h).padStart(2,"0")}</span>
                    {tot > 0 && <span>{cell.wins}/{tot}</span>}
                  </div>
                );
              })}
            </div>
            <div style={{ display:"flex", gap:16, fontSize:10, color:S }}>
              <span><span style={{ color:GN }}>■</span> Win-heavy</span>
              <span><span style={{ color:RD }}>■</span> Loss-heavy</span>
              <span><span style={{ color:"rgba(255,255,255,.3)" }}>■</span> Neutral / no trades</span>
            </div>
          </div>
        </div>

        {/* ── best / worst trade ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:G }}>
          <TradeCard trade={best_trade}  isBest={true}  />
          <TradeCard trade={worst_trade} isBest={false} />
        </div>

        {/* ── breakdowns ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:G }}>

          <div style={card()}>
            <Head label="Symbol Breakdown" />
            <div style={{ padding:"10px 12px 14px" }}>
              {symbol_breakdown.slice(0, 8).map(s => (
                <div key={s.symbol} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:11 }}>
                    <span style={{ fontWeight:900 }}>{s.symbol.replace("USDT","")} <span style={{ color:S, fontWeight:400 }}>({s.trades})</span></span>
                    <span style={{ color:clr(s.pnl) }}>{dollar(s.pnl)}</span>
                  </div>
                  <MiniBar pct={s.win_rate} color={s.win_rate >= 50 ? GN : RD} />
                </div>
              ))}
            </div>
          </div>

          <div style={card()}>
            <Head label="Mode Breakdown" />
            <div style={{ padding:"10px 12px 14px" }}>
              {mode_breakdown.map(m => (
                <div key={m.mode} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:11 }}>
                    <span style={{ fontWeight:900 }}>{m.mode} <span style={{ color:S, fontWeight:400 }}>({m.trades})</span></span>
                    <span style={{ color:clr(m.pnl) }}>{dollar(m.pnl)}</span>
                  </div>
                  <MiniBar pct={m.win_rate} color={m.win_rate >= 50 ? GN : RD} />
                </div>
              ))}
            </div>
          </div>

          {/* style — avg hold made prominent */}
          <div style={card()}>
            <Head label="Style Breakdown" />
            <div style={{ padding:"10px 12px 14px" }}>
              {style_breakdown.map(s => (
                <div key={s.style} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:11 }}>
                    <span style={{ fontWeight:900 }}>{s.style} <span style={{ color:S, fontWeight:400 }}>({s.trades})</span></span>
                    <span style={{ color:clr(s.pnl) }}>{dollar(s.pnl)}</span>
                  </div>
                  <MiniBar pct={s.win_rate} color={s.win_rate >= 50 ? GN : RD} />
                  <div style={{ marginTop:6, display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:9, fontWeight:900, letterSpacing:".06em", textTransform:"uppercase", color:S }}>Avg hold</span>
                    <span style={{ fontSize:12, fontWeight:900, color:GN }}>{s.avg_hold}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── footer stats ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:G }}>
          {[
            { label:"Most Traded",  value:most_traded_symbol.replace("USDT","/USDT"), sub:"by trade count" },
            { label:"Total Trades", value:String(summary.total_trades),               sub:"all time" },
            { label:"Avg R/R",      value:`1 : ${f2(summary.avg_rr)}`,               sub:"realized risk/reward" },
          ].map(c => (
            <div key={c.label} style={{ ...card(), padding:"12px 16px" }}>
              <div style={{ fontSize:9, fontWeight:900, letterSpacing:".10em", textTransform:"uppercase", color:M, marginBottom:6 }}>{c.label}</div>
              <div style={{ fontSize:20, fontWeight:900 }}>{c.value}</div>
              <div style={{ fontSize:10, color:S, marginTop:3 }}>{c.sub}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
