import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

type RiskMode = "ULTRA_SAFE" | "SAFE" | "NORMAL" | "MINI_ASYM" | "AGGRESSIVE";
type Side = "LONG" | "SHORT";

type ExchangeStatus = {
  connected: boolean;
  exchange: "binance" | "okx" | null;
  api_key_masked: string | null;
  created_at: string | null;
};

type BalanceOut = {
  total?: number;
};

type RiskPreviewOut = {
  allowed: boolean;
  reason?: string;
  computed?: {
    mode: RiskMode;
    symbol: string;
    side: Side;
    size: number;
    sl: number;
    tp: number;
    leverage: number;
  };
};

async function apiGet<T>(path: string): Promise<T> {
  return (await api(path, { method: "GET" })) as T;
}
async function apiPost<T>(path: string, body?: any): Promise<T> {
  return (await api(path, { method: "POST", body: JSON.stringify(body ?? {}) })) as T;
}

function fmtMoney(n: number) {
  if (!isFinite(n)) return "-";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

type Props = {
  symbol: string;
  side: Side;
  mode: RiskMode;
  size: number;
  sl: number;
  tp: number;
  leverage: number;
};

export default function MiniAsymPanel(props: Props) {
  const nav = useNavigate();

  const [ex, setEx] = useState<ExchangeStatus | null>(null);
  const [equity, setEquity] = useState<number>(1000);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  const [lastReason, setLastReason] = useState<string>("");
  const [open, setOpen] = useState(false);

  const loadBasics = async () => {
    try {
      setErr("");
      const [st, bal] = await Promise.all([
        apiGet<ExchangeStatus>("/exchange/status"),
        apiGet<BalanceOut>("/balance"),
      ]);
      setEx(st);
      setEquity(Number(bal.total ?? 1000));
    } catch (e: any) {
      setErr(e?.message || "Failed to load panel data");
    }
  };

  useEffect(() => {
    loadBasics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const preview = async () => {
    try {
      setErr("");
      setLoading(true);

      const payload = {
        symbol: props.symbol,
        side: props.side,
        mode: props.mode,
        size: props.size,
        sl: props.sl,
        tp: props.tp,
        leverage: props.leverage,
      };

      const out = await apiPost<RiskPreviewOut>("/risk/preview", payload);
      setLastReason(out.reason || "No reason returned.");
      setOpen(true);
    } catch (e: any) {
      setErr(e?.message || "Preview failed");
    } finally {
      setLoading(false);
    }
  };

  const connected = !!ex?.connected;

  return (
    <div
      style={{
        borderRadius: 18,
        padding: 14,
        background: "rgba(9, 15, 30, 0.92)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 950 }}>Mini-Asym Panel</div>
          <div style={{ opacity: 0.7, fontSize: 12 }}>Risk engine status + last decision</div>
        </div>

        <button
          onClick={loadBasics}
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
          Refresh
        </button>
      </div>

      {err ? (
        <div
          style={{
            marginTop: 10,
            background: "rgba(220,38,38,0.12)",
            border: "1px solid rgba(248,113,113,0.55)",
            color: "#fecaca",
            padding: 10,
            borderRadius: 14,
            whiteSpace: "pre-wrap",
            fontSize: 12,
          }}
        >
          <b>Error:</b> {err}
        </div>
      ) : null}

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        <div
          style={{
            padding: 12,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(15,23,42,0.65)",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, fontSize: 13 }}>
            <div style={{ opacity: 0.7 }}>Exchange</div>
            <div style={{ fontWeight: 900 }}>
              {connected ? `Connected (${ex?.exchange})` : "Not connected"}
            </div>

            <div style={{ opacity: 0.7 }}>Equity</div>
            <div style={{ fontWeight: 900 }}>${fmtMoney(equity)}</div>

            <div style={{ opacity: 0.7 }}>Mode</div>
            <div style={{ fontWeight: 900 }}>{props.mode === "MINI_ASYM" ? "Mini-Asym" : props.mode}</div>

            <div style={{ opacity: 0.7 }}>Symbol</div>
            <div style={{ fontWeight: 900 }}>{props.symbol}</div>

            <div style={{ opacity: 0.7 }}>Computed</div>
            <div style={{ fontWeight: 900, opacity: 0.9 }}>
              Size {props.size}% • SL {props.sl}% • TP {props.tp}% • Lev {props.leverage}x • {props.side}
            </div>
          </div>
        </div>

        <button
          onClick={preview}
          disabled={loading}
          style={{
            width: "100%",
            borderRadius: 14,
            border: "1px solid rgba(0,255,224,0.22)",
            background: "rgba(0,255,224,0.10)",
            color: "white",
            padding: "12px 14px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 950,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Previewing…" : "Preview Decision"}
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button
            onClick={() => nav("/history")}
            style={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
              color: "white",
              padding: "10px 12px",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            Open History
          </button>

          <button
            onClick={() => nav(`/market/${encodeURIComponent(props.symbol)}`)}
            style={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
              color: "white",
              padding: "10px 12px",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            Open Chart
          </button>
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
            zIndex: 80,
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
              <div style={{ fontWeight: 950, fontSize: 18 }}>Decision Reason</div>
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
              {lastReason || "No reason returned."}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
