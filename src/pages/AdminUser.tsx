import React, { useEffect, useState } from "react";
import * as api from "../lib/api";
import { useNavigate, useParams } from "react-router-dom";

const cardStyle: React.CSSProperties = {
  background: "rgba(13,22,44,.72)",
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: 18,
  padding: 14,
  boxShadow: "0 18px 45px rgba(0,0,0,.55)",
  backdropFilter: "blur(10px)",
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

type UserDetailsResp = {
  ok: boolean;
  user: { email: string; created_at: string };
  state: { equity: number; session_id: number };
  exchange: { connected: boolean; exchange: string | null; connected_at: string | null };
  trades: { count: number; recent: any[] };
  ai: { running: boolean; status: any | null };
};

export default function AdminUser() {
  const nav = useNavigate();
  const { email } = useParams();
  const decodedEmail = decodeURIComponent(email || "");

  const [data, setData] = useState<UserDetailsResp | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    setErr(null);
    setMsg(null);
    try {
      const d = (await api.apiRequest(
        `/admin/user/${encodeURIComponent(decodedEmail)}?trades_limit=50`,
        { method: "GET" }
      )) as UserDetailsResp;
      setData(d);
    } catch (e: any) {
      setErr(e?.message || "Failed to load user details");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decodedEmail]);

  const resetUser = async () => {
    if (!confirm(`Reset sandbox for:\n${decodedEmail}?`)) return;
    setErr(null);
    setMsg(null);
    try {
      await api.apiRequest(`/admin/reset-user?email=${encodeURIComponent(decodedEmail)}`, { method: "POST" });
      setMsg("User reset ✅");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Reset failed");
    }
  };

  const stopAllAI = async () => {
    if (!confirm("Stop ALL AI for ALL users?")) return;
    setErr(null);
    setMsg(null);
    try {
      await api.apiRequest("/admin/stop-all-ai", { method: "POST" });
      setMsg("Stopped all AI ✅");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Stop all AI failed");
    }
  };

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={() => nav("/admin")} style={btnStyle}>← Back</button>
        <button onClick={load} style={btnStyle}>Refresh</button>
        <button onClick={resetUser} style={goodBtn}>Reset User</button>
        <button onClick={stopAllAI} style={dangerBtn}>Stop ALL AI</button>
      </div>

      {err && <div style={{ color: "tomato", fontWeight: 900 }}>{err}</div>}
      {msg && <div style={{ color: "rgba(0,255,209,.95)", fontWeight: 900 }}>{msg}</div>}

      <div style={cardStyle}>
        <div style={{ fontSize: 18, fontWeight: 950 }}>User: {decodedEmail}</div>
        <div style={{ opacity: 0.75, fontSize: 12, marginTop: 6 }}>
          Joined: <b>{data?.user.created_at || "-"}</b>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
          <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(255,255,255,.08)", background: "rgba(0,0,0,.18)" }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Equity</div>
            <div style={{ fontSize: 26, fontWeight: 950 }}>${Number(data?.state.equity || 0).toFixed(2)}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Session ID: {data?.state.session_id ?? "-"}</div>
          </div>

          <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(255,255,255,.08)", background: "rgba(0,0,0,.18)" }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Exchange</div>
            <div style={{ fontSize: 18, fontWeight: 950 }}>
              {data?.exchange.connected ? `Connected (${data.exchange.exchange || "-"})` : "Not connected"}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Connected at: {data?.exchange.connected_at || "-"}</div>
          </div>

          <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(255,255,255,.08)", background: "rgba(0,0,0,.18)" }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Auto AI</div>
            <div style={{ fontSize: 18, fontWeight: 950 }}>{data?.ai.running ? "RUNNING" : "OFF"}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              {data?.ai.status?.blocked_reason ? `Blocked: ${data.ai.status.blocked_reason}` : ""}
            </div>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase" }}>
          Trades (recent 50) • Total: {data?.trades.count ?? "-"}
        </div>

        <div style={{ marginTop: 12, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
            <thead>
              <tr style={{ textAlign: "left", fontSize: 11, opacity: 0.7 }}>
                <th style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,.08)" }}>Time</th>
                <th style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,.08)" }}>Symbol</th>
                <th style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,.08)" }}>Side</th>
                <th style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,.08)" }}>Mode</th>
                <th style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,.08)" }}>Lev</th>
                <th style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,.08)" }}>PnL%</th>
                <th style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,.08)" }}>Equity</th>
              </tr>
            </thead>
            <tbody>
              {(data?.trades.recent || []).map((t: any) => (
                <tr key={t.id} style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                  <td style={{ padding: 10, fontSize: 12, opacity: 0.9 }}>{t.time}</td>
                  <td style={{ padding: 10, fontSize: 12, opacity: 0.9 }}>{t.symbol}</td>
                  <td style={{ padding: 10, fontSize: 12, opacity: 0.9 }}>{t.side}</td>
                  <td style={{ padding: 10, fontSize: 12, opacity: 0.9 }}>{t.mode}</td>
                  <td style={{ padding: 10, fontSize: 12, opacity: 0.9 }}>{Number(t.leverage).toFixed(1)}</td>
                  <td
                    style={{
                      padding: 10,
                      fontSize: 12,
                      fontWeight: 950,
                      color: Number(t.unreal_pnl_percent) >= 0 ? "rgba(0,255,209,.95)" : "rgba(255,80,120,.90)",
                    }}
                  >
                    {Number(t.unreal_pnl_percent).toFixed(3)}%
                  </td>
                  <td style={{ padding: 10, fontSize: 12, opacity: 0.9 }}>${Number(t.equity_after).toFixed(2)}</td>
                </tr>
              ))}
              {(data?.trades.recent || []).length === 0 && (
                <tr>
                  <td style={{ padding: 14, opacity: 0.7 }} colSpan={7}>No trades yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
