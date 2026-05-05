import React, { useEffect, useRef, useState } from "react";
import * as api from "../lib/api";
import { useNavigate, useParams } from "react-router-dom";

// ── styles ────────────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: "rgba(13,22,44,.72)", border: "1px solid rgba(255,255,255,.10)",
  borderRadius: 18, padding: 14, boxShadow: "0 18px 45px rgba(0,0,0,.55)", backdropFilter: "blur(10px)",
};
const btn: React.CSSProperties = {
  padding: "9px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,.10)",
  background: "rgba(255,255,255,.04)", color: "white", fontWeight: 900, cursor: "pointer", fontSize: 12,
};
const goodBtn: React.CSSProperties = { ...btn, border: "1px solid rgba(0,255,209,.35)", background: "rgba(0,255,209,.10)", color: "rgba(0,255,209,.95)" };
const dangerBtn: React.CSSProperties = { ...btn, border: "1px solid rgba(255,80,120,.35)", background: "rgba(255,80,120,.10)" };
const TH: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,.08)", fontSize: 11, opacity: 0.7, textAlign: "left" };
const TD: React.CSSProperties = { padding: "8px 10px", fontSize: 12 };
const GN = "rgba(0,255,209,.95)", RD = "rgba(255,80,120,.90)";
const TABS = ["TRADES", "AI LOG", "PORTFOLIO", "ACCOUNT STATUS", "ADMIN NOTES"] as const;
type Tab = typeof TABS[number];

// ── mini SVG equity curve ─────────────────────────────────────────────────────
function MiniEquity({ data }: { data: { equity: number }[] }) {
  if (data.length < 2) return <div style={{ color: "rgba(255,255,255,.4)", fontSize: 11 }}>No equity data</div>;
  const W = 400, H = 120, P = 8;
  const vals = data.map(d => d.equity);
  const mn = Math.min(...vals), mx = Math.max(...vals), rng = mx - mn || 1;
  const tx = (i: number) => P + (i / (vals.length - 1)) * (W - P * 2);
  const ty = (v: number) => H - P - ((v - mn) / rng) * (H - P * 2);
  const pts = vals.map((v, i) => `${tx(i).toFixed(1)},${ty(v).toFixed(1)}`).join(" ");
  const fill = `M${tx(0).toFixed(1)},${H - P} L${pts} L${tx(vals.length - 1).toFixed(1)},${H - P} Z`;
  const color = vals[vals.length - 1] >= vals[0] ? GN : RD;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 120 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="au-eq-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".28" />
          <stop offset="100%" stopColor={color} stopOpacity=".02" />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#au-eq-g)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}

// ── parse label / grade from reason ──────────────────────────────────────────
function parseLabel(reason: string | null): string {
  if (!reason) return "";
  const m = reason.match(/Grade\s+([AB])\s*(?:—\s*(T[12]))?/);
  return m?.[2] || "";
}
function parseGrade(reason: string | null, stored?: string): string {
  if (stored === "A" || stored === "B") return stored;
  if (!reason) return "A";
  return reason.includes("Grade B") ? "B" : "A";
}

// ── CSV export ────────────────────────────────────────────────────────────────
function exportCSV(trades: any[], email: string) {
  const headers = ["Time", "Symbol", "Side", "Mode", "Label", "Grade", "Entry", "Exit", "PnL%", "PnL$", "Equity After"];
  const rows = trades.map(t => [
    t.time, t.symbol, t.side, t.mode,
    parseLabel(t.reason), parseGrade(t.reason, t.grade),
    Number(t.entry_price).toFixed(4), Number(t.current_price).toFixed(4),
    Number(t.unreal_pnl_percent).toFixed(3), Number(t.unreal_pnl_value).toFixed(2),
    Number(t.equity_after).toFixed(2),
  ]);
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `trades_${email}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

// ── AI log session card ───────────────────────────────────────────────────────
type AiSession = {
  id: number;
  symbol: string;
  mode: string;
  trade_style: string;
  started_at: string;
  ended_at: string | null;
  stop_reason: string | null;
  events: { t: string; msg: string }[];
};

function AiLogSession({ session, isActive }: { session: AiSession; isActive: boolean }) {
  const [expanded, setExpanded] = useState(isActive);
  const [filter, setFilter] = useState("");

  const filtered = filter
    ? session.events.filter(e => e.t.includes(filter) || e.msg.toLowerCase().includes(filter.toLowerCase()))
    : session.events;

  return (
    <div style={card}>
      <div onClick={() => setExpanded(o => !o)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12, userSelect: "none" }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", flexShrink: 0, background: isActive ? GN : "rgba(255,80,120,.7)" }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 950 }}>{session.symbol}</span>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: "rgba(0,255,209,.10)", color: GN, fontWeight: 800 }}>{session.mode}</span>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.7)", fontWeight: 800 }}>{session.trade_style.replace("_", " ")}</span>
            {isActive && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 8, background: "rgba(0,255,209,.15)", color: GN, fontWeight: 900 }}>LIVE</span>}
            <span style={{ fontSize: 10, opacity: 0.45, marginLeft: "auto" }}>{session.events.length} entries</span>
          </div>
          <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4, display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span>Started: <b style={{ color: "rgba(255,255,255,.85)" }}>{session.started_at}</b></span>
            {session.ended_at
              ? <span>Ended: <b style={{ color: RD }}>{session.ended_at}</b></span>
              : <span style={{ color: GN }}>Still running…</span>
            }
            {session.stop_reason && !isActive && (
              <span>Reason: <b style={{ color: "rgba(255,180,60,.9)" }}>{session.stop_reason.slice(0, 60)}</b></span>
            )}
          </div>
        </div>
        <span style={{ fontSize: 16, opacity: 0.4, transform: expanded ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▼</span>
      </div>

      {expanded && (
        <>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Filter by date or keyword…"
              style={{ flex: 1, padding: "7px 11px", borderRadius: 10, border: "1px solid rgba(255,255,255,.10)", background: "rgba(0,0,0,.22)", color: "white", fontSize: 12 }}
            />
          </div>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 1, maxHeight: 480, overflowY: "auto" }}>
            {filtered.length === 0 && <div style={{ opacity: 0.5, fontSize: 13, padding: 10 }}>No entries match filter.</div>}
            {filtered.map((e, i) => {
              const isStart = e.msg === "AI started.";
              const isStop = e.msg.toLowerCase().includes("stop") || e.msg.toLowerCase().includes("pausing") || e.msg.toLowerCase().includes("floor hit");
              const isTrade = e.msg.toLowerCase().includes("trade closed") || e.msg.toLowerCase().includes("tp_hit") || e.msg.toLowerCase().includes("sl_hit");
              return (
                <div key={i} style={{
                  display: "flex", gap: 10, padding: "5px 8px", borderRadius: 8,
                  background: isStart ? "rgba(0,255,209,.06)" : isStop ? "rgba(255,80,120,.06)" : isTrade ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.18)",
                  borderLeft: isStart ? `2px solid ${GN}` : isStop ? `2px solid ${RD}` : isTrade ? "2px solid rgba(255,255,255,.2)" : "2px solid transparent",
                  fontFamily: "monospace",
                }}>
                  <span style={{ fontSize: 10, opacity: 0.45, whiteSpace: "nowrap", flexShrink: 0 }}>{e.t}</span>
                  <span style={{ fontSize: 11, color: isStart ? GN : isStop ? RD : "rgba(255,255,255,.85)", lineHeight: 1.5 }}>{e.msg}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export default function AdminUser() {
  const nav = useNavigate();
  const { email } = useParams();
  const decodedEmail = decodeURIComponent(email || "");

  const [tab, setTab] = useState<Tab>("TRADES");
  const [data, setData] = useState<any>(null);
  const [sessions, setSessions] = useState<AiSession[]>([]);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [notesInfo, setNotesInfo] = useState<{ updated_at: string | null; updated_by: string | null }>({ updated_at: null, updated_by: null });
  const [expandedTrade, setExpandedTrade] = useState<number | null>(null);
  const [notesSaving, setNotesSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const logTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const logAccess = async (t: Tab) => {
    api.apiRequest(`/admin/log-access?user_email=${encodeURIComponent(decodedEmail)}&tab=${encodeURIComponent(t)}`, { method: "POST" }).catch(() => {});
  };

  const loadBase = async () => {
    try {
      const d = await api.apiRequest(`/admin/user/${encodeURIComponent(decodedEmail)}?trades_limit=200`, { method: "GET" });
      setData(d);
    } catch (e: any) { setErr(e?.message || "Failed to load user"); }
  };

  const loadLog = async () => {
    try {
      const r = await api.apiRequest(`/admin/user/${encodeURIComponent(decodedEmail)}/log?limit=200`, { method: "GET" });
      setSessions(r.sessions || []);
    } catch { setSessions([]); }
  };

  const loadPortfolio = async () => {
    if (portfolio) return;
    try {
      const r = await api.apiRequest(`/admin/user/${encodeURIComponent(decodedEmail)}/portfolio`, { method: "GET" });
      setPortfolio(r);
    } catch (e: any) { setErr(e?.message || "Portfolio load failed"); }
  };

  const loadNotes = async () => {
    try {
      const r = await api.apiRequest(`/admin/user/${encodeURIComponent(decodedEmail)}/notes`, { method: "GET" });
      setNotes(r.notes || "");
      setNotesInfo({ updated_at: r.updated_at, updated_by: r.updated_by });
    } catch { setNotes(""); }
  };

  useEffect(() => {
    loadBase();
    logAccess("TRADES");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decodedEmail]);

  const switchTab = (t: Tab) => {
    setTab(t);
    logAccess(t);
    if (t === "AI LOG") {
      loadLog();
      if (logTimer.current) clearInterval(logTimer.current);
      logTimer.current = setInterval(loadLog, 30000);
    } else {
      if (logTimer.current) { clearInterval(logTimer.current); logTimer.current = null; }
      if (t === "PORTFOLIO") loadPortfolio();
      if (t === "ADMIN NOTES") loadNotes();
    }
  };

  useEffect(() => () => { if (logTimer.current) clearInterval(logTimer.current); }, []);

  const saveNotes = async () => {
    setNotesSaving(true);
    try {
      await api.apiRequest(`/admin/user/${encodeURIComponent(decodedEmail)}/notes`, { method: "POST", body: { notes } });
      setMsg("Notes saved ✅");
      await loadNotes();
    } catch (e: any) { setErr(e?.message || "Save failed"); }
    finally { setNotesSaving(false); }
  };

  const resetUser = async () => {
    if (!confirm(`Reset sandbox for:\n${decodedEmail}?`)) return;
    try {
      await api.apiRequest(`/admin/reset-user?email=${encodeURIComponent(decodedEmail)}`, { method: "POST" });
      setMsg("User reset ✅"); await loadBase();
    } catch (e: any) { setErr(e?.message || "Reset failed"); }
  };

  const ai = data?.ai?.status;
  const state = data?.state;
  const trades: any[] = data?.trades?.recent || [];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
      {/* top bar */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => nav("/admin")} style={btn}>← Back</button>
        <button onClick={loadBase} style={btn}>Refresh</button>
        <button onClick={resetUser} style={goodBtn}>Reset User</button>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: data?.ai?.running ? GN : "rgba(255,80,120,.7)" }} />
          <span style={{ fontSize: 12, opacity: 0.8 }}>{data?.ai?.running ? "AI Running" : "AI Off"}</span>
        </div>
      </div>

      {err && <div style={{ color: "tomato", fontWeight: 900, fontSize: 13 }}>{err}</div>}
      {msg && <div style={{ color: GN, fontWeight: 900, fontSize: 13 }}>{msg}</div>}

      {/* user header */}
      <div style={{ ...card, paddingBottom: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 950 }}>{decodedEmail}</div>
        <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>
          Joined: <b>{data?.user?.created_at || "-"}</b> &nbsp;·&nbsp;
          Exchange: <b>{data?.exchange?.connected ? (data.exchange.exchange || "Connected") : "Not connected"}</b>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 12 }}>
          {[
            { label: "Equity", val: `$${Number(state?.equity || 0).toFixed(2)}` },
            { label: "Total Trades", val: data?.trades?.count ?? "-" },
            { label: "Mode", val: ai?.mode || "-" },
            { label: "Style", val: ai?.trade_style?.replace("_", " ") || "-" },
          ].map(({ label, val }) => (
            <div key={label} style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,.08)", background: "rgba(0,0,0,.18)" }}>
              <div style={{ fontSize: 11, opacity: 0.6 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 950 }}>{val}</div>
            </div>
          ))}
        </div>

        {/* tabs */}
        <div style={{ display: "flex", gap: 4, marginTop: 16, borderBottom: "1px solid rgba(255,255,255,.08)", flexWrap: "wrap" }}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              style={{
                padding: "8px 14px", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 900,
                borderRadius: "10px 10px 0 0",
                background: tab === t ? "rgba(0,255,209,.13)" : "transparent",
                color: tab === t ? GN : "rgba(255,255,255,.55)",
                borderBottom: tab === t ? `2px solid ${GN}` : "2px solid transparent",
              }}
            >{t}</button>
          ))}
        </div>
      </div>

      {/* ─── TAB 1: TRADES ─────────────────────────────────────────────────── */}
      {tab === "TRADES" && (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.7, letterSpacing: ".1em", textTransform: "uppercase" }}>
              Trades · {data?.trades?.count ?? 0} total · showing {trades.length}
            </div>
            <button onClick={() => exportCSV(trades, decodedEmail)} style={goodBtn}>CSV Export</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr>
                  {["Time", "Symbol", "Side", "Label", "Grade", "Mode", "Entry $", "Exit $", "PnL %", "PnL $", "Equity"].map(h => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map((t: any, i: number) => {
                  const label = parseLabel(t.reason);
                  const grade = parseGrade(t.reason, t.grade);
                  const pnlPos = Number(t.unreal_pnl_value) >= 0;
                  const expanded = expandedTrade === i;
                  return (
                    <React.Fragment key={t.id ?? i}>
                      <tr
                        onClick={() => setExpandedTrade(expanded ? null : i)}
                        style={{ borderBottom: "1px solid rgba(255,255,255,.06)", cursor: "pointer", background: expanded ? "rgba(0,255,209,.04)" : "transparent" }}
                      >
                        <td style={{ ...TD, fontSize: 11, opacity: 0.7 }}>{String(t.time).slice(0, 16)}</td>
                        <td style={{ ...TD, fontWeight: 900 }}>{t.symbol}</td>
                        <td style={{ ...TD, color: t.side === "LONG" ? GN : RD, fontWeight: 900 }}>{t.side}</td>
                        <td style={{ ...TD }}>
                          {label ? <span style={{ padding: "2px 7px", borderRadius: 6, fontSize: 10, background: label === "T1" ? "rgba(0,255,209,.18)" : "rgba(180,100,255,.18)", color: label === "T1" ? GN : "#c084fc", fontWeight: 900 }}>{label}</span> : <span style={{ opacity: 0.3 }}>—</span>}
                        </td>
                        <td style={{ ...TD }}>
                          <span style={{ padding: "2px 7px", borderRadius: 6, fontSize: 10, background: grade === "A" ? "rgba(0,255,209,.15)" : "rgba(251,191,36,.15)", color: grade === "A" ? GN : "#fbbf24", fontWeight: 900 }}>
                            {grade}
                          </span>
                        </td>
                        <td style={{ ...TD, fontSize: 11 }}>{t.mode}</td>
                        <td style={{ ...TD }}>${Number(t.entry_price).toFixed(4)}</td>
                        <td style={{ ...TD }}>${Number(t.current_price).toFixed(4)}</td>
                        <td style={{ ...TD, fontWeight: 900, color: pnlPos ? GN : RD }}>{Number(t.unreal_pnl_percent).toFixed(3)}%</td>
                        <td style={{ ...TD, fontWeight: 900, color: pnlPos ? GN : RD }}>{pnlPos ? "+" : ""}${Number(t.unreal_pnl_value).toFixed(2)}</td>
                        <td style={{ ...TD }}>${Number(t.equity_after).toFixed(2)}</td>
                      </tr>
                      {expanded && t.reason && (
                        <tr>
                          <td colSpan={11} style={{ padding: "10px 14px", background: "rgba(0,0,0,.22)", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
                            <pre style={{ margin: 0, fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,.75)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{t.reason}</pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {trades.length === 0 && (
                  <tr><td colSpan={11} style={{ padding: 18, opacity: 0.5, fontSize: 13 }}>No trades yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 2: AI LOG ─────────────────────────────────────────────────── */}
      {tab === "AI LOG" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, opacity: 0.5 }}>{sessions.length} session{sessions.length !== 1 ? "s" : ""} · auto-refresh 30s</div>
            <button onClick={loadLog} style={btn}>Refresh</button>
          </div>
          {sessions.length === 0 && (
            <div style={{ ...card, opacity: 0.6, textAlign: "center", padding: 24 }}>No AI sessions recorded yet.</div>
          )}
          {sessions.map((sess, i) => (
            <AiLogSession
              key={sess.id}
              session={sess}
              isActive={i === 0 && !sess.ended_at}
            />
          ))}
        </div>
      )}

      {/* ─── TAB 3: PORTFOLIO ──────────────────────────────────────────────── */}
      {tab === "PORTFOLIO" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {!portfolio && <div style={{ ...card, opacity: 0.6 }}>Loading portfolio…</div>}
          {portfolio?.empty && <div style={{ ...card, opacity: 0.6 }}>No trades — portfolio empty.</div>}
          {portfolio && !portfolio.empty && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {[
                  { label: "Total PnL", val: `${portfolio.total_pnl >= 0 ? "+" : ""}$${Number(portfolio.total_pnl).toFixed(2)}`, pos: portfolio.total_pnl >= 0 },
                  { label: "Win Rate", val: `${portfolio.win_rate}%`, pos: portfolio.win_rate >= 50 },
                  { label: "Max Drawdown", val: `${portfolio.max_drawdown_pct}%`, pos: false },
                  { label: "Total Trades", val: portfolio.total_trades, pos: true },
                ].map(({ label, val, pos }) => (
                  <div key={label} style={{ ...card }}>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 950, color: pos ? GN : RD }}>{val}</div>
                  </div>
                ))}
              </div>

              <div style={card}>
                <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 8 }}>Equity Curve</div>
                <MiniEquity data={portfolio.eq_curve || []} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={card}>
                  <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.6, marginBottom: 10 }}>Monthly P&L</div>
                  {(portfolio.monthly_pnl || []).map((m: any) => (
                    <div key={m.month} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,.05)", fontSize: 12 }}>
                      <span style={{ opacity: 0.75 }}>{m.month}</span>
                      <span style={{ fontWeight: 900, color: m.pnl >= 0 ? GN : RD }}>{m.pnl >= 0 ? "+" : ""}${Number(m.pnl).toFixed(2)}</span>
                    </div>
                  ))}
                  {(portfolio.monthly_pnl || []).length === 0 && <div style={{ opacity: 0.5, fontSize: 12 }}>No monthly data.</div>}
                </div>
                <div style={card}>
                  <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.6, marginBottom: 10 }}>Best & Worst Trades</div>
                  {portfolio.best_trade && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10, opacity: 0.5 }}>BEST</div>
                      <div style={{ fontSize: 16, fontWeight: 950, color: GN }}>+${Number(portfolio.best_trade.pnl).toFixed(2)}</div>
                      <div style={{ fontSize: 11, opacity: 0.7 }}>{portfolio.best_trade.symbol} · {String(portfolio.best_trade.time).slice(0, 16)}</div>
                    </div>
                  )}
                  {portfolio.worst_trade && (
                    <div>
                      <div style={{ fontSize: 10, opacity: 0.5 }}>WORST</div>
                      <div style={{ fontSize: 16, fontWeight: 950, color: RD }}>${Number(portfolio.worst_trade.pnl).toFixed(2)}</div>
                      <div style={{ fontSize: 11, opacity: 0.7 }}>{portfolio.worst_trade.symbol} · {String(portfolio.worst_trade.time).slice(0, 16)}</div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── TAB 4: ACCOUNT STATUS ─────────────────────────────────────────── */}
      {tab === "ACCOUNT STATUS" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={card}>
              <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.6, marginBottom: 12, letterSpacing: ".08em", textTransform: "uppercase" }}>Account</div>
              {[
                ["Equity", `$${Number(state?.equity || 0).toFixed(2)}`],
                ["Session ID", state?.session_id ?? "-"],
                ["Exchange", data?.exchange?.connected ? (data.exchange.exchange || "Connected") : "Not connected"],
                ["Connected At", data?.exchange?.connected_at || "-"],
                ["Joined", data?.user?.created_at || "-"],
              ].map(([k, v]) => <StatusRow key={k} k={String(k)} v={String(v)} />)}
            </div>
            <div style={card}>
              <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.6, marginBottom: 12, letterSpacing: ".08em", textTransform: "uppercase" }}>AI Status</div>
              {ai ? (
                <>
                  {[
                    ["Running", data?.ai?.running ? "YES" : "NO"],
                    ["Symbol", ai.symbol],
                    ["Mode", ai.mode],
                    ["Style", ai.trade_style?.replace("_", " ")],
                    ["Market Grade", ai.market_grade || "-"],
                    ["Signal Score", ai.signal_score != null ? Number(ai.signal_score).toFixed(3) : "-"],
                    ["Adaptive Strictness", Number(ai.adaptive_strictness || 1).toFixed(2)],
                  ].map(([k, v]) => <StatusRow key={k} k={String(k)} v={String(v)} />)}
                </>
              ) : (
                <div style={{ opacity: 0.5, fontSize: 12 }}>AI is not currently running.</div>
              )}
            </div>
          </div>

          {ai && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={card}>
                <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.6, marginBottom: 12, letterSpacing: ".08em", textTransform: "uppercase" }}>Session Limits</div>
                {[
                  ["Trades Today", `${ai.trades_today} / ${ai.max_trades_per_day}`],
                  ["Bad Trades Today", `${ai.bad_trades_today} / ${ai.stop_after_bad_trades}`],
                  ["Session Ends", ai.end_at || "No limit"],
                  ["Trend Filter", ai.trend_filter ? "ON" : "OFF"],
                  ["Last Signal", ai.last_signal || "-"],
                  ["Last Run", ai.last_run_at || "-"],
                  ["Last Trade", ai.last_trade_at || "-"],
                ].map(([k, v]) => <StatusRow key={k} k={String(k)} v={String(v)} />)}
              </div>
              <div style={card}>
                <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.6, marginBottom: 12, letterSpacing: ".08em", textTransform: "uppercase" }}>Open Positions</div>
                {(ai.pending_trades || []).length === 0
                  ? <div style={{ opacity: 0.5, fontSize: 12 }}>No open positions.</div>
                  : (ai.pending_trades || []).map((pt: any, i: number) => (
                    <div key={i} style={{ padding: "8px 10px", marginBottom: 6, borderRadius: 10, background: "rgba(0,0,0,.20)", border: "1px solid rgba(255,255,255,.07)", fontSize: 12 }}>
                      <div style={{ fontWeight: 900 }}>{pt.label || "T1"} · {pt.side} · {pt.symbol}</div>
                      <div style={{ opacity: 0.6, fontSize: 11 }}>Entry: ${Number(pt.entry_price || 0).toFixed(4)} · Grade: {pt.grade || "-"}</div>
                    </div>
                  ))}
                {ai.blocked_reason && (
                  <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 10, background: "rgba(255,80,120,.08)", border: "1px solid rgba(255,80,120,.25)", fontSize: 12, color: RD }}>
                    Blocked: {ai.blocked_reason}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 5: ADMIN NOTES ────────────────────────────────────────────── */}
      {tab === "ADMIN NOTES" && (
        <div style={card}>
          <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.7, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 4 }}>Admin Notes</div>
          <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 12 }}>
            Only visible to admins. Never shown to user.
            {notesInfo.updated_at && ` Last saved by ${notesInfo.updated_by} at ${notesInfo.updated_at}.`}
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={12}
            placeholder={"Examples:\n  'Beta tester — joined April 2026'\n  'Reported bug with SL — fixed May 3'\n  'Potential Pro tier upgrade candidate'"}
            style={{
              width: "100%", boxSizing: "border-box", padding: "12px 14px",
              borderRadius: 12, border: "1px solid rgba(255,255,255,.12)",
              background: "rgba(0,0,0,.28)", color: "white", fontSize: 13, lineHeight: 1.7,
              resize: "vertical", fontFamily: "inherit",
            }}
          />
          <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
            <button onClick={saveNotes} disabled={notesSaving} style={goodBtn}>
              {notesSaving ? "Saving…" : "Save Notes"}
            </button>
            <button onClick={loadNotes} style={btn}>Revert</button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusRow({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,.05)", fontSize: 12 }}>
      <span style={{ opacity: 0.6 }}>{k}</span>
      <span style={{ fontWeight: 900, maxWidth: "55%", textAlign: "right", wordBreak: "break-all" }}>{v}</span>
    </div>
  );
}
