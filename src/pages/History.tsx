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
  equity_after?: number;
  reason?: string | null;
};

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

type TradesOut = { trades: Trade[] };

async function apiGet<T>(path: string): Promise<T> {
  return (await api.apiRequest(path, { method: "GET" })) as T;
}

function fmtMoney(n: number) {
  if (!isFinite(n)) return "-";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function fmtNum(n: number, dp = 2) {
  const x = Number(n);
  if (!isFinite(x)) return "-";
  return x.toFixed(dp);
}

function timeLabel(t: Trade) {
  return ((t.time || t.created_at) || "-").toString();
}

function parseTradeTime(t: Trade): Date | null {
  const s = ((t.time || t.created_at) || "").trim();
  if (!s) return null;
  const iso = s.includes("T") ? s : s.replace(" ", "T");
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  if (isNaN(d.getTime())) return null;
  return d;
}

function toDateInputValue(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function History() {
  const nav = useNavigate();
  const isMobile = useIsMobile();

  const [tab, setTab] = useState<"trades" | "ailog">("trades");

  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  const [q, setQ] = useState("");
  const [mode, setMode] = useState<RiskMode | "ALL">("ALL");
  const [side, setSide] = useState<Side | "ALL">("ALL");

  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Trade | null>(null);

  // AI Sessions log
  const [aiSessions, setAiSessions] = useState<AiSession[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [expandedSession, setExpandedSession] = useState<number | null>(null);

  const load = async () => {
    try {
      setErr("");
      setLoading(true);

      const out = await apiGet<TradesOut>("/trades?limit=2000");
      const list = out.trades ?? [];
      setTrades(list);

      if (list.length) {
        const times = list.map(parseTradeTime).filter(Boolean) as Date[];
        if (times.length) {
          const minT = new Date(Math.min(...times.map((d) => d.getTime())));
          const maxT = new Date(Math.max(...times.map((d) => d.getTime())));
          if (!fromDate) setFromDate(toDateInputValue(minT));
          if (!toDate) setToDate(toDateInputValue(maxT));
        }
      }
    } catch (e: any) {
      setErr(e?.message || "Failed to load trades");
    } finally {
      setLoading(false);
    }
  };

  const loadAiSessions = async () => {
    try {
      setAiLoading(true);
      const r = await apiGet<{ ok: boolean; sessions: AiSession[] }>("/auto/sessions?limit=30&log_limit=1000");
      setAiSessions(r.sessions ?? []);
    } catch {
      setAiSessions([]);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadAiSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toUpperCase();
    const from = fromDate ? new Date(fromDate + "T00:00:00Z") : null;
    const to = toDate ? new Date(toDate + "T23:59:59Z") : null;

    return trades.filter((t) => {
      const sym = (t.symbol || "").toUpperCase();
      const okQ = !query || sym.includes(query);
      const okMode = mode === "ALL" ? true : (t.mode || "MINI_ASYM") === mode;
      const okSide = side === "ALL" ? true : t.side === side;

      const dt = parseTradeTime(t);
      const okFrom = !from || (dt && dt.getTime() >= from.getTime());
      const okTo = !to || (dt && dt.getTime() <= to.getTime());

      return okQ && okMode && okSide && okFrom && okTo;
    });
  }, [trades, q, mode, side, fromDate, toDate]);

  const openReason = (t: Trade) => {
    setActive(t);
    setOpen(true);
  };

  const tabBtn = (id: "trades" | "ailog", label: string) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: isMobile ? "6px 14px" : "8px 20px",
        borderRadius: 10,
        border: tab === id ? "1.5px solid rgba(0,255,224,0.5)" : "1px solid rgba(255,255,255,0.10)",
        background: tab === id ? "rgba(0,255,224,0.09)" : "rgba(255,255,255,0.03)",
        color: tab === id ? "#00ffe0" : "rgba(255,255,255,0.7)",
        fontWeight: 900,
        fontSize: isMobile ? 11 : 13,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "end", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: isMobile ? 15 : 26, fontWeight: 950 }}>History</div>
          {!isMobile && (
            <div style={{ opacity: 0.7, marginTop: 6 }}>
              Full history (persistent). Filter by date. Click a row to view reason.
            </div>
          )}
        </div>

        <button
          onClick={tab === "trades" ? load : loadAiSessions}
          style={{
            borderRadius: isMobile ? 10 : 14,
            border: "1px solid rgba(0,255,224,0.22)",
            background: "rgba(0,255,224,0.10)",
            color: "white",
            padding: isMobile ? "5px 9px" : "10px 14px",
            fontWeight: 950,
            cursor: "pointer",
            height: isMobile ? 30 : 42,
            fontSize: isMobile ? 11 : 14,
          }}
        >
          {(tab === "trades" ? loading : aiLoading) ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        {tabBtn("trades", "Trade History")}
        {tabBtn("ailog", "AI Log")}
      </div>

      {/* ── TRADES TAB ── */}
      {tab === "trades" && <>

      {/* Filters */}
      <div
        style={{
          marginTop: isMobile ? 8 : 14,
          borderRadius: isMobile ? 12 : 18,
          padding: isMobile ? 8 : 14,
          background: "rgba(9, 15, 30, 0.92)",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 200px 200px 160px 160px",
          gap: isMobile ? 6 : 10,
        }}
      >
        <div>
          <div style={{ fontSize: isMobile ? 10 : 12, opacity: 0.75 }}>Search symbol</div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
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
          <div style={{ fontSize: isMobile ? 10 : 12, opacity: 0.75 }}>Mode</div>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
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
            <option value="ALL">All</option>
            <option value="ULTRA_SAFE">ULTRA SAFE</option>
            <option value="SAFE">SAFE</option>
            <option value="NORMAL">NORMAL</option>
            <option value="MINI_ASYM">MINI-ASYM</option>
            <option value="AGGRESSIVE">AGGRESSIVE</option>
          </select>
        </div>

        <div>
          <div style={{ fontSize: isMobile ? 10 : 12, opacity: 0.75 }}>Side</div>
          <select
            value={side}
            onChange={(e) => setSide(e.target.value as any)}
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
            <option value="ALL">All</option>
            <option value="LONG">LONG</option>
            <option value="SHORT">SHORT</option>
          </select>
        </div>

        <div>
          <div style={{ fontSize: isMobile ? 10 : 12, opacity: 0.75 }}>From</div>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
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
          <div style={{ fontSize: isMobile ? 10 : 12, opacity: 0.75 }}>To</div>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
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

      {err ? (
        <div style={{ marginTop: 12, background: "rgba(220,38,38,0.12)", border: "1px solid rgba(248,113,113,0.55)", color: "#fecaca", padding: 12, borderRadius: 14, whiteSpace: "pre-wrap" }}>
          <b>Error:</b> {err}
        </div>
      ) : null}

      {/* ── AI LOG TAB ── */}
      {tab === "ailog" && (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          {aiLoading && <div style={{ opacity: 0.6, fontSize: 13 }}>Loading sessions…</div>}
          {!aiLoading && aiSessions.length === 0 && (
            <div style={{ opacity: 0.6, fontSize: 13, padding: 16, borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(9,15,30,0.9)" }}>
              No AI sessions found yet. Start the AI from the Dashboard to begin recording logs.
            </div>
          )}
          {aiSessions.map((sess) => {
            const isOpen = expandedSession === sess.id;
            const isActive = !sess.ended_at;
            const style = (sess.trade_style || "").replace("_", " ");
            const modeLabel = sess.mode === "MINI_ASYM" ? "Mini-Asym" : (sess.mode || "").replace("_", " ");
            return (
              <div key={sess.id} style={{ borderRadius: 14, border: `1px solid ${isActive ? "rgba(0,255,224,0.25)" : "rgba(255,255,255,0.08)"}`, background: "rgba(9,15,30,0.92)", overflow: "hidden" }}>
                {/* Session header */}
                <div
                  onClick={() => setExpandedSession(isOpen ? null : sess.id)}
                  style={{ padding: isMobile ? "10px 12px" : "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}
                >
                  <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: isMobile ? "6px 14px" : "4px 20px", alignItems: "center" }}>
                    {isActive && (
                      <span style={{ fontSize: 9, fontWeight: 900, background: "rgba(0,255,224,0.15)", color: "#00ffe0", border: "1px solid rgba(0,255,224,0.3)", borderRadius: 999, padding: "2px 8px", letterSpacing: 1 }}>LIVE</span>
                    )}
                    <span style={{ fontWeight: 950, fontSize: isMobile ? 13 : 15 }}>{sess.symbol}</span>
                    <span style={{ fontSize: 11, opacity: 0.65 }}>{modeLabel} · {style}</span>
                    <span style={{ fontSize: 11, opacity: 0.5 }}>{sess.started_at}</span>
                    {sess.ended_at && <span style={{ fontSize: 11, opacity: 0.5 }}>→ {sess.ended_at}</span>}
                    <span style={{ fontSize: 11, opacity: 0.55 }}>{sess.events.length} entries</span>
                    {sess.stop_reason && !isActive && (
                      <span style={{ fontSize: 10, color: "#94a3b8", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sess.stop_reason}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 18, opacity: 0.5, userSelect: "none" }}>{isOpen ? "▲" : "▼"}</span>
                </div>

                {/* Log entries */}
                {isOpen && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", maxHeight: 420, overflowY: "auto", padding: "8px 0" }}>
                    {sess.events.length === 0 ? (
                      <div style={{ padding: "10px 16px", opacity: 0.5, fontSize: 12 }}>No log entries.</div>
                    ) : sess.events.map((ev, i) => {
                      const isBlocked = ev.msg.startsWith("Blocked") || ev.msg.startsWith("BLOCKED");
                      const isTrade = ev.msg.startsWith("REAL") || ev.msg.startsWith("Opened") || ev.msg.startsWith("Closed") || ev.msg.startsWith("Grade A");
                      const isSystem = ev.msg.startsWith("AI started") || ev.msg.startsWith("AI resumed") || ev.msg.startsWith("Daily counters") || ev.msg.startsWith("Stopped");
                      return (
                        <div key={i} style={{ padding: isMobile ? "4px 12px" : "4px 16px", display: "flex", gap: 10, borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.03)" }}>
                          <span style={{ fontSize: 10, opacity: 0.4, whiteSpace: "nowrap", paddingTop: 2, minWidth: isMobile ? 60 : 130 }}>{isMobile ? ev.t.slice(11, 16) : ev.t}</span>
                          <span style={{
                            fontSize: 11,
                            color: isTrade ? "#00ffe0" : isBlocked ? "#ff5078" : isSystem ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.85)",
                            lineHeight: 1.45,
                          }}>{ev.msg}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div
        style={{
          marginTop: 14,
          borderRadius: 18,
          padding: 0,
          overflow: "hidden",
          background: "rgba(9, 15, 30, 0.92)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ padding: 14, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontWeight: 950 }}>
            Trades: {filtered.length}
            <span style={{ opacity: 0.65, fontWeight: 700 }}>{loading ? " • loading…" : ""}</span>
          </div>
        </div>

        {isMobile ? (
          /* Mobile: card list */
          <div style={{ padding: "0 0 8px" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 16, opacity: 0.7 }}>No trades in this range.</div>
            ) : (
              filtered.slice(0, 500).map((t, i) => (
                <div
                  key={t.id ?? i}
                  onClick={() => openReason(t)}
                  style={{
                    padding: "8px 10px",
                    borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.06)",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                    <button
                      onClick={(ev) => { ev.stopPropagation(); nav(`/market/${encodeURIComponent(t.symbol)}`); }}
                      style={{ border: "1px solid rgba(0,255,224,0.22)", background: "rgba(0,255,224,0.08)", color: "white", padding: "3px 7px", borderRadius: 999, cursor: "pointer", fontWeight: 900, fontSize: 11 }}
                    >
                      {t.symbol}
                    </button>
                    <span style={{ fontWeight: 900, fontSize: 11, color: t.side === "LONG" ? "#00ffe0" : "#ff5078" }}>{t.side}</span>
                    <span style={{ fontWeight: 950, fontSize: 11 }}>${fmtMoney(Number(t.equity_after ?? 0))}</span>
                  </div>
                  <div style={{ marginTop: 3, fontSize: 9, opacity: 0.5, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span>{timeLabel(t)}</span>
                    <span>{(t.mode || "MINI_ASYM").replace("_", " ")}</span>
                    <span>Lev {fmtNum(Number(t.leverage ?? 0), 0)}×</span>
                    <span>SL {fmtNum(Number(t.sl ?? 0), 2)}</span>
                    <span>TP {fmtNum(Number(t.tp ?? 0), 2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Desktop: full table */
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", opacity: 0.8 }}>
                  <th style={{ padding: 12 }}>Time</th>
                  <th style={{ padding: 12 }}>Symbol</th>
                  <th style={{ padding: 12 }}>Side</th>
                  <th className="hist-mode-col" style={{ padding: 12 }}>Mode</th>
                  <th style={{ padding: 12 }}>Size</th>
                  <th style={{ padding: 12 }}>SL</th>
                  <th style={{ padding: 12 }}>TP</th>
                  <th style={{ padding: 12 }}>Lev</th>
                  <th style={{ padding: 12 }}>Equity</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: 16, opacity: 0.7 }}>
                      No trades in this range.
                    </td>
                  </tr>
                ) : (
                  filtered.slice(0, 500).map((t, i) => (
                    <tr
                      key={t.id ?? i}
                      onClick={() => openReason(t)}
                      title="Click to view reason"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: 12, opacity: 0.9 }}>{timeLabel(t)}</td>
                      <td style={{ padding: 12 }}>
                        <button
                          onClick={(ev) => { ev.stopPropagation(); nav(`/market/${encodeURIComponent(t.symbol)}`); }}
                          style={{ border: "1px solid rgba(0,255,224,0.22)", background: "rgba(0,255,224,0.08)", color: "white", padding: "6px 10px", borderRadius: 999, cursor: "pointer", fontWeight: 900 }}
                          title="Open chart"
                        >
                          {t.symbol}
                        </button>
                      </td>
                      <td style={{ padding: 12, fontWeight: 900, color: t.side === "LONG" ? "#00ffe0" : "#ff5078" }}>{t.side}</td>
                      <td className="hist-mode-col" style={{ padding: 12, opacity: 0.9 }}>{(t.mode || "MINI_ASYM").replace("_", " ")}</td>
                      <td style={{ padding: 12 }}>{fmtNum(Number(t.size ?? 0), 2)}</td>
                      <td style={{ padding: 12 }}>{fmtNum(Number(t.sl ?? 0), 2)}</td>
                      <td style={{ padding: 12 }}>{fmtNum(Number(t.tp ?? 0), 2)}</td>
                      <td style={{ padding: 12 }}>{fmtNum(Number(t.leverage ?? 0), 2)}</td>
                      <td style={{ padding: 12, fontWeight: 950 }}>${fmtMoney(Number(t.equity_after ?? 0))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      </> /* end trades tab */}

      {/* Modal */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "grid",
            placeItems: "center",
            zIndex: 50,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(860px, 96vw)",
              borderRadius: 18,
              padding: 16,
              background: "rgba(9, 15, 30, 0.98)",
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow: "0 20px 80px rgba(0,0,0,0.55)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 950, fontSize: 18 }}>Trade Reason</div>
                <div style={{ opacity: 0.7, marginTop: 4 }}>
                  {active ? `${active.symbol} • ${active.side} • ${(active.mode || "MINI_ASYM").replace("_", " ")}` : ""}
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
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
              {active?.reason?.trim() ? active.reason.trim() : "No reason available."}
            </pre>

            <div style={{ marginTop: 10, opacity: 0.65, fontSize: 12 }}>
              Note: Reason is stored per trade (persistent), so it opens instantly.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
