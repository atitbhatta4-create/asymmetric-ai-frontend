import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

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

type TradesOut = { trades: Trade[] };

async function apiGet<T>(path: string): Promise<T> {
  return (await api(path, { method: "GET" })) as T;
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

  const load = async () => {
    try {
      setErr("");
      setLoading(true);

      // ✅ History = ALL trades ever
      const out = await apiGet<TradesOut>("/trades?limit=2000");
      const list = out.trades ?? [];
      setTrades(list);

      // auto-set date range if empty
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

  useEffect(() => {
    load();
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

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 950 }}>History</div>
          <div style={{ opacity: 0.7, marginTop: 6 }}>
            Full history (persistent). Filter by date. Click a row to view reason. Click symbol to open chart.
          </div>
        </div>

        <button
          onClick={load}
          style={{
            borderRadius: 14,
            border: "1px solid rgba(0,255,224,0.22)",
            background: "rgba(0,255,224,0.10)",
            color: "white",
            padding: "10px 14px",
            fontWeight: 950,
            cursor: "pointer",
            height: 42,
          }}
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* Filters */}
      <div
        style={{
          marginTop: 14,
          borderRadius: 18,
          padding: 14,
          background: "rgba(9, 15, 30, 0.92)",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "grid",
          gridTemplateColumns: "1fr 220px 220px 180px 180px",
          gap: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>Search symbol</div>
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
          <div style={{ fontSize: 12, opacity: 0.75 }}>Mode</div>
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
          <div style={{ fontSize: 12, opacity: 0.75 }}>Side</div>
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
          <div style={{ fontSize: 12, opacity: 0.75 }}>From</div>
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
          <div style={{ fontSize: 12, opacity: 0.75 }}>To</div>
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
        <div
          style={{
            marginTop: 12,
            background: "rgba(220,38,38,0.12)",
            border: "1px solid rgba(248,113,113,0.55)",
            color: "#fecaca",
            padding: 12,
            borderRadius: 14,
            whiteSpace: "pre-wrap",
          }}
        >
          <b>Error:</b> {err}
        </div>
      ) : null}

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

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", opacity: 0.8 }}>
                <th style={{ padding: 12 }}>Time</th>
                <th style={{ padding: 12 }}>Symbol</th>
                <th style={{ padding: 12 }}>Side</th>
                <th style={{ padding: 12 }}>Mode</th>
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
                    style={{
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: 12, opacity: 0.9 }}>{timeLabel(t)}</td>

                    <td style={{ padding: 12 }}>
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          nav(`/market/${encodeURIComponent(t.symbol)}`);
                        }}
                        style={{
                          border: "1px solid rgba(0,255,224,0.22)",
                          background: "rgba(0,255,224,0.08)",
                          color: "white",
                          padding: "6px 10px",
                          borderRadius: 999,
                          cursor: "pointer",
                          fontWeight: 900,
                        }}
                        title="Open chart"
                      >
                        {t.symbol}
                      </button>
                    </td>

                    <td style={{ padding: 12, fontWeight: 900, color: t.side === "LONG" ? "#00ffe0" : "#ff5078" }}>
                      {t.side}
                    </td>

                    <td style={{ padding: 12, opacity: 0.9 }}>{(t.mode || "MINI_ASYM").replace("_", " ")}</td>
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
      </div>

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
