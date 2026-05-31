import React, { useEffect, useRef, useState } from "react";
import * as api from "../lib/api";
import { useNavigate } from "react-router-dom";

type AdminStatus = {
  ok: boolean;
  admin: string;
  signup_enabled: boolean;
  seat_capacity: number;
  seats_used: number;
  seats_remaining: number;
};

type UserRow = {
  email: string;
  created_at: string;
  equity: number;
  session_id: number;
  exchange_connected: boolean;
  trades_count: number;
  ai_running: boolean;
  today_pnl: number;
  win_rate: number;
  last_active: string | null;
  open_positions: number;
};

const cardStyle: React.CSSProperties = {
  background: "rgba(13,22,44,.72)",
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: 18,
  padding: 14,
  boxShadow: "0 18px 45px rgba(0,0,0,.55)",
  backdropFilter: "blur(10px)",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 220,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,.10)",
  background: "rgba(0,0,0,.22)",
  color: "white",
  outline: "none",
  fontWeight: 800,
};

const selectStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,.10)",
  background: "rgba(0,0,0,.22)",
  color: "white",
  outline: "none",
  fontWeight: 800,
  cursor: "pointer",
};

const btnStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,.10)",
  background: "rgba(255,255,255,.04)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};

const goodBtn: React.CSSProperties = {
  ...btnStyle,
  border: "1px solid rgba(0,255,209,.35)",
  background: "rgba(0,255,209,.10)",
  color: "rgba(0,255,209,.95)",
};

const dangerBtn: React.CSSProperties = {
  ...btnStyle,
  border: "1px solid rgba(255,80,120,.35)",
  background: "rgba(255,80,120,.10)",
};

const th: React.CSSProperties = { padding: 10, borderBottom: "1px solid rgba(255,255,255,.08)" };
const td: React.CSSProperties = { padding: 10, fontSize: 12, opacity: 0.9 };

// ── Equity curve SVG ──────────────────────────────────────────────────────────
function EquityCurveBt({ points }: { points: { ts: number; equity: number }[] }) {
  if (points.length < 2) return null;
  const W = 600, H = 110;
  const xs = points.map((p) => p.ts);
  const ys = points.map((p) => p.equity);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const toX = (t: number) => ((t - minX) / rangeX) * W;
  const toY = (e: number) => H - 8 - ((e - minY) / rangeY) * (H - 16);
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.ts).toFixed(1)},${toY(p.equity).toFixed(1)}`)
    .join(" ");
  const isUp = points[points.length - 1].equity >= points[0].equity;
  const colour = isUp ? "#00ffd1" : "#ff5078";
  // Filled area
  const area =
    d +
    ` L${toX(xs[xs.length - 1]).toFixed(1)},${H} L${toX(xs[0]).toFixed(1)},${H} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="btGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colour} stopOpacity={0.25} />
          <stop offset="100%" stopColor={colour} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#btGrad)" />
      <path d={d} fill="none" stroke={colour} strokeWidth={1.8} />
    </svg>
  );
}

export default function Admin() {
  const nav = useNavigate();

  const [activeTab, setActiveTab] = useState<"users" | "analytics" | "backtester">("users");
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [signupEnabled, setSignupEnabled] = useState(true);
  const [seatCapacity, setSeatCapacity] = useState(50);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [userQ, setUserQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Analytics state
  const [analyticsOverview, setAnalyticsOverview]       = useState<any>(null);
  const [analyticsWinRates, setAnalyticsWinRates]       = useState<any>(null);
  const [analyticsByCoin, setAnalyticsByCoin]           = useState<any>(null);
  const [analyticsSignalTrend, setAnalyticsSignalTrend] = useState<any>(null);
  const [analyticsBySession, setAnalyticsBySession]     = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading]         = useState(false);

  // Backtester state
  const [btSymbol,   setBtSymbol]   = useState("ETHUSDT");
  const [btSymbols,  setBtSymbols]  = useState<string[]>([]);
  const [btMode,     setBtMode]     = useState("MINI_ASYM");
  const [btStyle,    setBtStyle]    = useState("DAY_TRADE");
  const [btExchange, setBtExchange] = useState("bybit");
  const [btFrom,     setBtFrom]     = useState("2024-01-01");
  const [btTo,       setBtTo]       = useState("2025-12-31");
  const [btEquity,   setBtEquity]   = useState(1000);
  const [btRunId,    setBtRunId]    = useState<string | null>(null);
  const [btRunStatus, setBtRunStatus] = useState("");
  const [btProgress,  setBtProgress]  = useState(0);
  const [btResults,   setBtResults]   = useState<any>(null);
  const [btRunError,  setBtRunError]  = useState<string | null>(null);
  const [btLoading,   setBtLoading]   = useState(false);
  const [btHistory,   setBtHistory]   = useState<any[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Admin data ──────────────────────────────────────────────────────────────
  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    const [ov, wr, bc, st, bs] = await Promise.allSettled([
      api.apiRequest("/analytics/overview",   { method: "GET" }),
      api.apiRequest("/analytics/win-rates",  { method: "GET" }),
      api.apiRequest("/analytics/by-coin",    { method: "GET" }),
      api.apiRequest("/analytics/by-regime",  { method: "GET" }),
      api.apiRequest("/analytics/by-session", { method: "GET" }),
    ]);
    if (ov.status === "fulfilled") setAnalyticsOverview(ov.value);
    if (wr.status === "fulfilled") setAnalyticsWinRates(wr.value);
    if (bc.status === "fulfilled") setAnalyticsByCoin(bc.value);
    if (st.status === "fulfilled") setAnalyticsSignalTrend(st.value);
    if (bs.status === "fulfilled") setAnalyticsBySession(bs.value);
    const errs = [ov, wr, bc, st, bs]
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map((r) => r.reason?.message || "Unknown error");
    if (errs.length > 0) setErr(`Analytics: ${errs.join(" | ")}`);
    setAnalyticsLoading(false);
  };

  const load = async () => {
    setErr(null); setMsg(null);
    try {
      const s = (await api.apiRequest("/admin/status", { method: "GET" })) as AdminStatus;
      setStatus(s);
      const settings = (await api.apiRequest("/admin/settings", { method: "GET" })) as {
        signup_enabled: boolean; seat_capacity: number;
      };
      setSignupEnabled(settings.signup_enabled);
      setSeatCapacity(settings.seat_capacity);
      const u = (await api.apiRequest("/admin/users?limit=200", { method: "GET" })) as {
        ok: boolean; users: UserRow[];
      };
      setUsers(u.users || []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load admin data");
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const saveSettings = async () => {
    setErr(null); setMsg(null);
    try {
      await api.apiRequest("/admin/settings", {
        method: "POST",
        body: { signup_enabled: signupEnabled, seat_capacity: seatCapacity },
      });
      setMsg("Saved ✅");
      await load();
    } catch (e: any) { setErr(e?.message || "Save failed"); }
  };

  const refreshUsers = async () => {
    setErr(null); setMsg(null);
    try {
      const url = `/admin/users?limit=500${userQ.trim() ? `&q=${encodeURIComponent(userQ.trim())}` : ""}`;
      const u = (await api.apiRequest(url, { method: "GET" })) as { ok: boolean; users: UserRow[] };
      setUsers(u.users || []);
    } catch (e: any) { setErr(e?.message || "Users load failed"); }
  };

  const stopAllAI = async () => {
    if (!confirm("Stop ALL running AI for ALL users?")) return;
    setErr(null); setMsg(null);
    try {
      const out = (await api.apiRequest("/admin/stop-all-ai", { method: "POST" })) as {
        ok: boolean; stopped_ai_for: string[];
      };
      setMsg(`Stopped AI for ${out.stopped_ai_for.length} user(s) ✅`);
      await load();
    } catch (e: any) { setErr(e?.message || "Stop all AI failed"); }
  };

  const resetUser = async (email: string) => {
    if (!confirm(`Reset user sandbox?\n${email}`)) return;
    setErr(null); setMsg(null);
    try {
      await api.apiRequest(`/admin/reset-user?email=${encodeURIComponent(email)}`, { method: "POST" });
      setMsg(`User reset: ${email} ✅`);
      await load();
    } catch (e: any) { setErr(e?.message || "Reset failed"); }
  };

  const openUser = (email: string) => nav(`/admin/user/${encodeURIComponent(email)}`);

  // ── Backtester ──────────────────────────────────────────────────────────────
  const loadBtHistory = async () => {
    try {
      const [h, s] = await Promise.allSettled([
        api.apiRequest("/backtest/history?limit=10", { method: "GET" }),
        api.apiRequest("/market/symbols?exchange=okx", { method: "GET" }),
      ]);
      if (h.status === "fulfilled") setBtHistory(Array.isArray(h.value) ? h.value : []);
      if (s.status === "fulfilled") {
        const list: string[] = Array.isArray(s.value?.symbols) ? s.value.symbols : [];
        if (list.length > 0) setBtSymbols(list);
      }
    } catch { /* ignore */ }
  };

  const pollRun = (runId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const r = await api.apiRequest(`/backtest/results/${runId}`, { method: "GET" });
        setBtRunStatus(r.status);
        setBtProgress(r.progress ?? 0);
        if (r.status === "done") {
          setBtResults(r.results);
          setBtRunError(null);
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setBtLoading(false);
          loadBtHistory();
        } else if (r.status === "error") {
          setBtRunError(r.error || "Backtest failed");
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setBtLoading(false);
        }
      } catch { /* network blip — keep polling */ }
    }, 3000);
  };

  const runBacktest = async () => {
    setBtRunError(null); setBtResults(null);
    setBtRunStatus("starting"); setBtProgress(0); setBtLoading(true);
    try {
      const r = await api.apiRequest("/backtest/run", {
        method: "POST",
        body: {
          symbol: btSymbol.trim().toUpperCase(),
          mode: btMode, style: btStyle, exchange: btExchange,
          date_from: btFrom, date_to: btTo, start_equity: Number(btEquity),
        },
      });
      setBtRunId(r.run_id);
      pollRun(r.run_id);
    } catch (e: any) {
      setBtRunError(e?.message || "Failed to start backtest");
      setBtLoading(false); setBtRunStatus("");
    }
  };

  const loadHistoryRun = async (runId: string) => {
    try {
      const r = await api.apiRequest(`/backtest/results/${runId}`, { method: "GET" });
      if (r.results) { setBtResults(r.results); setBtRunId(runId); setBtRunStatus("done"); }
    } catch { /* ignore */ }
  };

  const statusLabel: Record<string, string> = {
    fetching: "Fetching candles from OKX…",
    running:  "Running simulation…",
    done:     "Complete",
    error:    "Error",
    pending:  "Queued…",
    starting: "Starting…",
  };

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: 8 }}>
        {(["users", "analytics", "backtester"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              if (tab === "analytics") loadAnalytics();
              if (tab === "backtester") loadBtHistory();
            }}
            style={{
              padding: "9px 18px", borderRadius: 12, fontWeight: 900, cursor: "pointer",
              fontSize: 13, border: "none",
              background: activeTab === tab ? "rgba(0,255,224,0.15)" : "rgba(255,255,255,0.05)",
              color: activeTab === tab ? "#00ffe0" : "rgba(255,255,255,0.7)",
              borderBottom: activeTab === tab ? "2px solid #00ffe0" : "2px solid transparent",
            }}
          >
            {tab === "users" ? "Users" : tab === "analytics" ? "Analytics" : "Backtester"}
          </button>
        ))}
      </div>

      {/* ── HEADER CARD (always visible) ───────────────────────────────────── */}
      <div style={cardStyle}>
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase" }}>
          Admin Control Room (Private)
        </div>
        <div style={{ marginTop: 8, opacity: 0.75, fontSize: 12 }}>
          Seats + Signup control + user monitoring. Users never see this page.
        </div>
        {err && <div style={{ marginTop: 10, color: "tomato", fontWeight: 800 }}>{err}</div>}
        {msg && <div style={{ marginTop: 10, color: "rgba(0,255,209,.95)", fontWeight: 800 }}>{msg}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
          <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(255,255,255,.08)", background: "rgba(0,0,0,.20)" }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Seats</div>
            <div style={{ fontSize: 24, fontWeight: 950 }}>
              {status ? `${status.seats_used}/${status.seat_capacity}` : "-"}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Remaining: {status ? status.seats_remaining : "-"}</div>
          </div>
          <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(255,255,255,.08)", background: "rgba(0,0,0,.20)" }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Signup</div>
            <div style={{ fontSize: 24, fontWeight: 950 }}>{status ? (status.signup_enabled ? "ON" : "OFF") : "-"}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Admin controlled</div>
          </div>
          <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(255,255,255,.08)", background: "rgba(0,0,0,.20)" }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Actions</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
              <button onClick={load} style={btnStyle}>Refresh</button>
              <button onClick={stopAllAI} style={dangerBtn}>Stop ALL AI</button>
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
              Logged in admin: <b>{status?.admin || "-"}</b>
            </div>
          </div>
        </div>
      </div>

      {/* ── SETTINGS (users tab only) ────────────────────────────────────────── */}
      {activeTab === "users" && (
        <div style={cardStyle}>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase" }}>Settings</div>
          <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="checkbox" checked={signupEnabled} onChange={(e) => setSignupEnabled(e.target.checked)} />
              <span style={{ fontWeight: 900 }}>Signup Enabled</span>
            </label>
            <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ opacity: 0.75 }}>Seat Capacity</span>
              <input value={seatCapacity} onChange={(e) => setSeatCapacity(Number(e.target.value || 0))}
                type="number" min={1} style={{ width: 140, ...inputStyle }} />
              <button onClick={saveSettings} style={goodBtn}>Save</button>
            </div>
          </div>
          <div style={{ marginTop: 12, opacity: 0.7, fontSize: 12 }}>
            If seats are full, signup is blocked even if signup toggle is ON.
          </div>
        </div>
      )}

      {/* ── USERS TABLE ─────────────────────────────────────────────────────── */}
      {activeTab === "users" && (
        <div style={cardStyle}>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase" }}>
            Users (click to open details)
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <input value={userQ} onChange={(e) => setUserQ(e.target.value)} placeholder="Search email…" style={inputStyle} />
            <button onClick={refreshUsers} style={btnStyle}>Search</button>
          </div>
          <div style={{ marginTop: 12, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
              <thead>
                <tr style={{ textAlign: "left", fontSize: 11, opacity: 0.7 }}>
                  <th style={th}>AI</th><th style={th}>Email</th><th style={th}>Created</th>
                  <th style={th}>Equity <span style={{ fontWeight: 400, opacity: 0.45, fontSize: 10 }}>(last sync)</span></th>
                  <th style={th}>Today PnL</th><th style={th}>Trades</th><th style={th}>Win%</th>
                  <th style={th}>Open</th><th style={th}>Last Active</th><th style={th}>Exchange</th><th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.email} style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                    <td style={{ ...td, textAlign: "center" }}>
                      <div style={{ width: 9, height: 9, borderRadius: "50%", background: u.ai_running ? "rgba(0,255,209,.9)" : "rgba(255,80,120,.6)", display: "inline-block" }} title={u.ai_running ? "AI Running" : "AI Off"} />
                    </td>
                    <td style={{ ...td, fontWeight: 950 }}>
                      <span onClick={() => openUser(u.email)} style={{ cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>{u.email}</span>
                    </td>
                    <td style={{ ...td, fontSize: 11, opacity: 0.7 }}>{String(u.created_at).slice(0, 10)}</td>
                    <td style={{ ...td, fontWeight: 900 }}>{u.exchange_connected ? `$${Number(u.equity).toFixed(2)}` : "$0.00"}</td>
                    <td style={{ ...td, fontWeight: 900, color: Number(u.today_pnl) >= 0 ? "rgba(0,255,209,.9)" : "rgba(255,80,120,.9)" }}>
                      {Number(u.today_pnl) >= 0 ? "+" : ""}${Number(u.today_pnl).toFixed(2)}
                    </td>
                    <td style={td}>{u.trades_count}</td>
                    <td style={{ ...td, color: Number(u.win_rate) >= 50 ? "rgba(0,255,209,.9)" : "rgba(255,80,120,.9)", fontWeight: 900 }}>{u.win_rate}%</td>
                    <td style={td}>{u.open_positions || 0}</td>
                    <td style={{ ...td, fontSize: 11, opacity: 0.6 }}>{u.last_active ? String(u.last_active).slice(0, 16) : "-"}</td>
                    <td style={td}>{u.exchange_connected ? "✓" : "—"}</td>
                    <td style={{ ...td, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button onClick={() => openUser(u.email)} style={btnStyle}>Open</button>
                      <button onClick={() => resetUser(u.email)} style={goodBtn}>Reset</button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td style={{ padding: 14, opacity: 0.7 }} colSpan={11}>No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ANALYTICS TAB ───────────────────────────────────────────────────── */}
      {activeTab === "analytics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 950 }}>Live Analytics</div>
            <button onClick={loadAnalytics} disabled={analyticsLoading} style={btnStyle}>
              {analyticsLoading ? "Loading…" : "Refresh"}
            </button>
          </div>

          {analyticsOverview && (
            <div style={cardStyle}>
              <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.5, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Overall Performance</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
                {[
                  ["Total Trades",   analyticsOverview.total_trades],
                  ["Win Rate",       `${analyticsOverview.combined_win_rate}%`],
                  ["Avg Win",        `$${analyticsOverview.avg_win}`],
                  ["Avg Loss",       `$${analyticsOverview.avg_loss}`],
                  ["Total PnL",      `$${analyticsOverview.total_pnl}`],
                  ["Live Running",   analyticsOverview.live_running],
                  ["Total Accounts", analyticsOverview.total_accounts],
                ].map(([label, val]) => (
                  <div key={String(label)} style={{ background: "rgba(0,0,0,.25)", borderRadius: 12, padding: "10px 14px" }}>
                    <div style={{ fontSize: 10, opacity: 0.5, letterSpacing: 0.8, textTransform: "uppercase" }}>{label}</div>
                    <div style={{ fontWeight: 950, fontSize: 18, marginTop: 2 }}>{val ?? "-"}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.6 }}>
                Best account: <b>{analyticsOverview.best_account || "-"}</b> (${analyticsOverview.best_account_pnl ?? 0}) &nbsp;|&nbsp;
                Worst: <b>{analyticsOverview.worst_account || "-"}</b> (${analyticsOverview.worst_account_pnl ?? 0})
              </div>
            </div>
          )}

          {analyticsWinRates && (
            <div style={cardStyle}>
              <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.5, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Win Rate by Condition</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                  { title: "By Grade",      data: analyticsWinRates.by_grade },
                  { title: "By Score Band", data: analyticsWinRates.by_score },
                  { title: "By Leverage",   data: analyticsWinRates.by_leverage },
                ].map(({ title, data }) => (
                  <div key={title}>
                    <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.55, marginBottom: 6 }}>{title}</div>
                    {Object.entries(data || {}).map(([key, stats]: [string, any]) => (
                      <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 12 }}>
                        <span style={{ opacity: 0.8 }}>{key}</span>
                        <span style={{ fontWeight: 900, color: stats.win_rate >= 52 ? "#00ffd1" : "#ff5078" }}>
                          {stats.total > 0 ? `${stats.win_rate}% (${stats.total})` : "No data"}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {analyticsSignalTrend?.signal_trend?.length > 0 && (
            <div style={cardStyle}>
              <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.5, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Signal Quality Trend (last 30 days)</div>
              <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 80, overflowX: "auto" }}>
                {analyticsSignalTrend.signal_trend.map((d: any) => {
                  const h = Math.round((d.avg_score / 1.0) * 80);
                  return (
                    <div key={d.day} title={`${d.day}: avg score ${d.avg_score} (${d.count} trades)`}
                      style={{ flex: "0 0 18px", height: h, background: "rgba(0,255,224,0.55)", borderRadius: "3px 3px 0 0", minHeight: 2 }} />
                  );
                })}
              </div>
              <div style={{ fontSize: 11, opacity: 0.45, marginTop: 4 }}>Each bar = 1 day. Height = avg signal score.</div>
            </div>
          )}

          {analyticsByCoin?.by_coin && Object.keys(analyticsByCoin.by_coin).length > 0 && (
            <div style={cardStyle}>
              <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.5, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Coin Performance</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr>{["Symbol", "Trades", "Win Rate", "Avg Win", "Avg Loss", "Total PnL"].map(h => (
                      <th key={h} style={{ ...th, textAlign: "left", fontSize: 11 }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {Object.entries(analyticsByCoin.by_coin).map(([sym, s]: [string, any]) => (
                      <tr key={sym}>
                        <td style={td}><b>{sym}</b></td>
                        <td style={td}>{s.total}</td>
                        <td style={{ ...td, color: s.win_rate >= 52 ? "#00ffd1" : "#ff5078", fontWeight: 900 }}>{s.win_rate}%</td>
                        <td style={{ ...td, color: "#00ffd1" }}>${s.avg_win}</td>
                        <td style={{ ...td, color: "#ff5078" }}>${s.avg_loss}</td>
                        <td style={{ ...td, color: s.total_pnl >= 0 ? "#00ffd1" : "#ff5078", fontWeight: 900 }}>${s.total_pnl}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {analyticsBySession?.monthly_returns?.length > 0 && (
            <div style={cardStyle}>
              <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.5, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Monthly Returns (last 6 months)</div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 100 }}>
                {analyticsBySession.monthly_returns.map((m: any) => {
                  const maxAbs = Math.max(...analyticsBySession.monthly_returns.map((x: any) => Math.abs(x.pnl)), 1);
                  const h = Math.round((Math.abs(m.pnl) / maxAbs) * 90);
                  const isPos = m.pnl >= 0;
                  return (
                    <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ fontSize: 11, fontWeight: 900, color: isPos ? "#00ffd1" : "#ff5078" }}>${m.pnl > 0 ? "+" : ""}{m.pnl}</div>
                      <div style={{ width: "100%", height: h, background: isPos ? "rgba(0,255,209,0.55)" : "rgba(255,80,120,0.55)", borderRadius: "4px 4px 0 0", minHeight: 2 }} />
                      <div style={{ fontSize: 10, opacity: 0.5 }}>{m.month.slice(5)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!analyticsOverview && !analyticsLoading && (
            <div style={{ ...cardStyle, textAlign: "center", opacity: 0.6, padding: 32 }}>
              Click "Refresh" to load analytics data.
            </div>
          )}
        </div>
      )}

      {/* ── BACKTESTER TAB ──────────────────────────────────────────────────── */}
      {activeTab === "backtester" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Config form */}
          <div style={cardStyle}>
            <div style={{ fontSize: 13, fontWeight: 950, marginBottom: 14 }}>Historical Simulation</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, opacity: 0.55, marginBottom: 4 }}>
                  Symbol {btSymbols.length > 0 && <span style={{ opacity: 0.45 }}>({btSymbols.length} pairs)</span>}
                </div>
                <input
                  list="bt-symbols-list"
                  value={btSymbol}
                  onChange={e => setBtSymbol(e.target.value.toUpperCase().trim())}
                  placeholder="Type to search…"
                  style={{ ...inputStyle, minWidth: "unset", width: "100%" }}
                />
                <datalist id="bt-symbols-list">
                  {btSymbols.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>
              <div>
                <div style={{ fontSize: 11, opacity: 0.55, marginBottom: 4 }}>Mode</div>
                <select value={btMode} onChange={e => setBtMode(e.target.value)} style={{ ...selectStyle, width: "100%" }}>
                  {["ULTRA_SAFE","SAFE","NORMAL","MINI_ASYM","AGGRESSIVE"].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, opacity: 0.55, marginBottom: 4 }}>Style</div>
                <select value={btStyle} onChange={e => setBtStyle(e.target.value)} style={{ ...selectStyle, width: "100%" }}>
                  {["SCALP","DAY_TRADE","SWING"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, opacity: 0.55, marginBottom: 4 }}>Exchange (fees)</div>
                <select value={btExchange} onChange={e => setBtExchange(e.target.value)} style={{ ...selectStyle, width: "100%" }}>
                  {["bybit","okx","binance"].map(x => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, opacity: 0.55, marginBottom: 4 }}>From</div>
                <input type="date" value={btFrom} onChange={e => setBtFrom(e.target.value)}
                  style={{ ...inputStyle, minWidth: "unset", width: "100%" }} />
              </div>
              <div>
                <div style={{ fontSize: 11, opacity: 0.55, marginBottom: 4 }}>To</div>
                <input type="date" value={btTo} onChange={e => setBtTo(e.target.value)}
                  style={{ ...inputStyle, minWidth: "unset", width: "100%" }} />
              </div>
              <div>
                <div style={{ fontSize: 11, opacity: 0.55, marginBottom: 4 }}>Start Equity ($)</div>
                <input type="number" value={btEquity} onChange={e => setBtEquity(Number(e.target.value))}
                  min={100} style={{ ...inputStyle, minWidth: "unset", width: "100%" }} />
              </div>
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
              <button onClick={runBacktest} disabled={btLoading} style={{ ...goodBtn, padding: "11px 28px", fontSize: 14 }}>
                {btLoading ? "Running…" : "Run Backtest"}
              </button>
              {btRunError && <span style={{ color: "tomato", fontSize: 12, fontWeight: 800 }}>{btRunError}</span>}
              <span style={{ fontSize: 11, opacity: 0.5, marginLeft: "auto" }}>
                Data from OKX (same source as live engine). Candles cached after first fetch.
              </span>
            </div>
          </div>

          {/* Progress bar */}
          {btLoading && btRunStatus && (
            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 900 }}>{statusLabel[btRunStatus] || btRunStatus}</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: "#00ffd1" }}>{btProgress}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 4, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${btProgress}%`, background: "linear-gradient(90deg,#00ffd1,#00aaff)", borderRadius: 4, transition: "width .4s ease" }} />
              </div>
              <div style={{ marginTop: 6, fontSize: 11, opacity: 0.5 }}>
                Run ID: {btRunId}
              </div>
            </div>
          )}

          {/* Results */}
          {btResults && (
            <>
              {/* Key stats */}
              <div style={cardStyle}>
                <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.5, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
                  Simulation Results
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
                  {[
                    ["Total Trades",  btResults.total_trades],
                    ["Win Rate",      `${btResults.win_rate}%`],
                    ["Return",        <span style={{ color: btResults.total_return_pct >= 0 ? "#00ffd1" : "#ff5078", fontWeight: 950 }}>{btResults.total_return_pct >= 0 ? "+" : ""}{btResults.total_return_pct}%</span>],
                    ["Final Equity",  `$${btResults.final_equity?.toFixed(2)}`],
                    ["Max Drawdown",  <span style={{ color: "#ff5078" }}>-{btResults.max_drawdown_pct}%</span>],
                    ["Sharpe Ratio",  btResults.sharpe_ratio],
                    ["Avg Win",       `+${btResults.avg_win_pct}%`],
                    ["Avg Loss",      <span style={{ color: "#ff5078" }}>{btResults.avg_loss_pct}%</span>],
                    ["Reward/Risk",   `${btResults.reward_risk}×`],
                    ["Buy & Hold",    <span style={{ color: btResults.buy_hold_return_pct >= 0 ? "#00ffd1" : "#ff5078" }}>{btResults.buy_hold_return_pct >= 0 ? "+" : ""}{btResults.buy_hold_return_pct}%</span>],
                  ].map(([label, val]) => (
                    <div key={String(label)} style={{ background: "rgba(0,0,0,.25)", borderRadius: 12, padding: "10px 14px" }}>
                      <div style={{ fontSize: 10, opacity: 0.5, letterSpacing: 0.8, textTransform: "uppercase" }}>{label}</div>
                      <div style={{ fontWeight: 950, fontSize: 17, marginTop: 3 }}>{val ?? "-"}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, fontSize: 11, opacity: 0.4 }}>
                  Wins: {btResults.win_count} &nbsp;|&nbsp; Losses: {btResults.loss_count} &nbsp;|&nbsp;
                  Candles: {btResults.sim_candles_used?.toLocaleString()}
                </div>
              </div>

              {/* Equity curve */}
              {btResults.equity_curve?.length >= 2 && (
                <div style={cardStyle}>
                  <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.5, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
                    Equity Curve
                  </div>
                  <EquityCurveBt points={btResults.equity_curve} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, opacity: 0.5, marginTop: 4 }}>
                    <span>${btResults.equity_curve[0]?.equity?.toFixed(2)}</span>
                    <span>${btResults.final_equity?.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Monthly returns chart */}
              {btResults.monthly_returns?.length > 0 && (
                <div style={cardStyle}>
                  <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.5, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
                    Monthly Returns
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 110, overflowX: "auto" }}>
                    {btResults.monthly_returns.map((m: any) => {
                      const maxAbs = Math.max(...btResults.monthly_returns.map((x: any) => Math.abs(x.return_pct)), 0.1);
                      const h = Math.max(4, Math.round((Math.abs(m.return_pct) / maxAbs) * 90));
                      const isPos = m.return_pct >= 0;
                      return (
                        <div key={m.month} style={{ flex: "0 0 42px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}
                          title={`${m.month}: ${m.return_pct >= 0 ? "+" : ""}${m.return_pct}% (${m.trades} trades)`}>
                          <div style={{ fontSize: 10, fontWeight: 900, color: isPos ? "#00ffd1" : "#ff5078" }}>
                            {isPos ? "+" : ""}{m.return_pct}%
                          </div>
                          <div style={{ width: "100%", height: h, background: isPos ? "rgba(0,255,209,.6)" : "rgba(255,80,120,.6)", borderRadius: "3px 3px 0 0" }} />
                          <div style={{ fontSize: 9, opacity: 0.5, whiteSpace: "nowrap" }}>{m.month.slice(2)}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.4, marginTop: 6 }}>
                    Hover bar for details. Each bar = 1 calendar month.
                  </div>
                </div>
              )}
            </>
          )}

          {/* Run history */}
          {btHistory.length > 0 && (
            <div style={cardStyle}>
              <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.5, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
                Recent Runs
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ fontSize: 11, opacity: 0.6, textAlign: "left" }}>
                      {["Symbol","Mode","Style","Exchange","Period","Status","Started",""].map(h => (
                        <th key={h} style={th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {btHistory.map((r) => (
                      <tr key={r.run_id} style={{ borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                        <td style={{ ...td, fontWeight: 900 }}>{r.symbol}</td>
                        <td style={td}>{r.mode}</td>
                        <td style={td}>{r.style}</td>
                        <td style={td}>{r.exchange}</td>
                        <td style={{ ...td, fontSize: 11, opacity: 0.7 }}>{r.date_from} → {r.date_to}</td>
                        <td style={{ ...td, color: r.status === "done" ? "#00ffd1" : r.status === "error" ? "#ff5078" : "#ffe066", fontWeight: 900 }}>
                          {r.status}
                        </td>
                        <td style={{ ...td, fontSize: 11, opacity: 0.6 }}>{String(r.created_at).slice(0, 16)}</td>
                        <td style={td}>
                          {r.status === "done" && (
                            <button onClick={() => loadHistoryRun(r.run_id)} style={btnStyle}>
                              View
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!btLoading && !btResults && btHistory.length === 0 && (
            <div style={{ ...cardStyle, textAlign: "center", opacity: 0.55, padding: 40 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
              <div style={{ fontSize: 14, fontWeight: 900 }}>No backtests yet</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>
                Configure a symbol, mode, style and date range above, then click Run Backtest.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
