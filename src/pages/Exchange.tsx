import React, { useEffect, useState } from "react";
import { api } from "../api";

type Status = {
  connected: boolean;
  exchange: "binance" | "okx" | null;
  api_key_masked: string | null;
  created_at: string | null;
};

type TestOut = {
  ok: boolean;
  canTrade?: boolean;
  accountType?: string;
  balances_count?: number;
  note?: string;
};

type BalanceOut = {
  ok: boolean;
  balances: { asset: string; free: string; locked: string }[];
  note?: string;
};

function isNotFound(err: any) {
  const msg = String(err?.message || "");
  return msg.includes("404") || msg.toLowerCase().includes("not found");
}

export default function Exchange() {
  const [status, setStatus] = useState<Status | null>(null);

  const [exchange, setExchange] = useState<"binance" | "okx">("binance");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [passphrase, setPassphrase] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [testRes, setTestRes] = useState<TestOut | null>(null);
  const [balances, setBalances] = useState<BalanceOut | null>(null);

  const load = async () => {
    try {
      setErr(null);
      const s = await api<Status>("/exchange/status");
      setStatus(s);
    } catch (e: any) {
      setErr(e?.message || "Failed to load exchange status");
      setStatus({ connected: false, exchange: null, api_key_masked: null, created_at: null });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const connect = async () => {
    setLoading(true);
    setErr(null);
    setOk(null);
    setTestRes(null);
    setBalances(null);
    try {
      await api("/exchange/connect", {
        method: "POST",
        body: JSON.stringify({
          exchange,
          api_key: apiKey,
          api_secret: apiSecret,
          passphrase: exchange === "okx" ? passphrase : undefined,
        }),
      });
      setOk("Connected successfully.");
      setApiKey("");
      setApiSecret("");
      setPassphrase("");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Connect failed");
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    setLoading(true);
    setErr(null);
    setOk(null);
    setTestRes(null);
    setBalances(null);
    try {
      await api("/exchange/disconnect", { method: "POST" });
      setOk("Disconnected.");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Disconnect failed");
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setErr(null);
    setOk(null);
    try {
      const out = await api<TestOut>("/exchange/test");
      setTestRes(out);
      setOk(out?.note ? out.note : "Exchange test OK.");
    } catch (e: any) {
      if (isNotFound(e)) {
        setErr("Backend missing /exchange/test endpoint. Add it in main.py (I’ll give you the code).");
      } else {
        setErr(e?.message || "Test failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchBalances = async () => {
    setLoading(true);
    setErr(null);
    setOk(null);
    try {
      const out = await api<BalanceOut>("/exchange/balance");
      setBalances(out);
      setOk(out?.note ? out.note : "Balances fetched.");
    } catch (e: any) {
      if (isNotFound(e)) {
        setErr("Backend missing /exchange/balance endpoint. Add it in main.py (I’ll give you the code).");
      } else {
        setErr(e?.message || "Balance fetch failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ fontSize: 26, fontWeight: 950 }}>Exchange</div>
      <div style={{ opacity: 0.7, marginTop: 6 }}>
        Demo connection: saved in SQLite. (Real launch: encrypt keys + permissions.)
      </div>

      <div
        style={{
          marginTop: 14,
          borderRadius: 18,
          padding: 16,
          background: "rgba(9, 15, 30, 0.92)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ fontWeight: 900, letterSpacing: 0.6, fontSize: 12, opacity: 0.8 }}>STATUS</div>

        {err && (
          <div
            style={{
              marginTop: 12,
              background: "rgba(220,38,38,0.12)",
              border: "1px solid rgba(248,113,113,0.55)",
              color: "#fecaca",
              padding: 10,
              borderRadius: 14,
              whiteSpace: "pre-wrap",
            }}
          >
            <b>Error:</b> {err}
          </div>
        )}

        {ok && (
          <div
            style={{
              marginTop: 12,
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.35)",
              color: "#bbf7d0",
              padding: 10,
              borderRadius: 14,
            }}
          >
            {ok}
          </div>
        )}

        {status ? (
          <div style={{ marginTop: 10 }}>
            <div>
              Connected:{" "}
              <b style={{ color: status.connected ? "#00ffe0" : "#ff5078" }}>{status.connected ? "YES" : "NO"}</b>
            </div>

            {status.connected && (
              <>
                <div style={{ marginTop: 6 }}>
                  Exchange: <b>{status.exchange}</b>
                </div>
                <div style={{ marginTop: 6 }}>
                  API Key: <b>{status.api_key_masked}</b>
                </div>
                <div style={{ marginTop: 6, opacity: 0.75 }}>Connected at: {status.created_at}</div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                  <button
                    onClick={testConnection}
                    disabled={loading}
                    style={{
                      borderRadius: 14,
                      border: "1px solid rgba(0,255,224,0.22)",
                      background: "rgba(0,255,224,0.10)",
                      color: "white",
                      padding: "10px 14px",
                      fontWeight: 950,
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? "Working…" : "Test Connection"}
                  </button>

                  <button
                    onClick={fetchBalances}
                    disabled={loading}
                    style={{
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(255,255,255,0.04)",
                      color: "white",
                      padding: "10px 14px",
                      fontWeight: 950,
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? "Working…" : "Fetch Balances"}
                  </button>

                  <button
                    onClick={disconnect}
                    disabled={loading}
                    style={{
                      borderRadius: 14,
                      border: "1px solid rgba(255,80,120,0.35)",
                      background: "rgba(255,80,120,0.12)",
                      color: "white",
                      padding: "10px 14px",
                      fontWeight: 950,
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? "Working…" : "Disconnect"}
                  </button>
                </div>

                {testRes && (
                  <div
                    style={{
                      marginTop: 12,
                      borderRadius: 14,
                      padding: 12,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(15,23,42,0.65)",
                      fontSize: 13,
                      opacity: 0.95,
                    }}
                  >
                    <div style={{ fontWeight: 950, marginBottom: 6 }}>Test Result</div>
                    <div>ok: {String(testRes.ok)}</div>
                    <div>canTrade: {String(testRes.canTrade)}</div>
                    <div>accountType: {String(testRes.accountType)}</div>
                    <div>balances_count: {String(testRes.balances_count)}</div>
                  </div>
                )}

                {balances && (
                  <div
                    style={{
                      marginTop: 12,
                      borderRadius: 14,
                      padding: 12,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(15,23,42,0.65)",
                      fontSize: 13,
                      opacity: 0.95,
                    }}
                  >
                    <div style={{ fontWeight: 950, marginBottom: 6 }}>Balances</div>
                    {balances.balances.length === 0 ? (
                      <div style={{ opacity: 0.75 }}>No balances returned.</div>
                    ) : (
                      <div style={{ display: "grid", gap: 6 }}>
                        {balances.balances.map((b) => (
                          <div
                            key={b.asset}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              border: "1px solid rgba(255,255,255,0.06)",
                              borderRadius: 12,
                              padding: "8px 10px",
                            }}
                          >
                            <b>{b.asset}</b>
                            <span style={{ opacity: 0.9 }}>
                              free: {b.free} • locked: {b.locked}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div style={{ marginTop: 10, opacity: 0.75 }}>Loading…</div>
        )}
      </div>

      {!status?.connected && (
        <div
          style={{
            marginTop: 14,
            borderRadius: 18,
            padding: 16,
            background: "rgba(9, 15, 30, 0.92)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ fontWeight: 900, letterSpacing: 0.6, fontSize: 12, opacity: 0.8 }}>CONNECT</div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Exchange</div>
            <select
              value={exchange}
              onChange={(e) => setExchange(e.target.value as any)}
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
              <option value="binance">Binance</option>
              <option value="okx">OKX</option>
            </select>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, opacity: 0.75 }}>API Key</div>
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
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

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, opacity: 0.75 }}>API Secret</div>
            <input
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
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

          {exchange === "okx" && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, opacity: 0.75 }}>Passphrase (OKX)</div>
              <input
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
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
          )}

          <button
            onClick={connect}
            disabled={loading}
            style={{
              marginTop: 14,
              width: "100%",
              borderRadius: 14,
              border: "none",
              padding: "12px 14px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 950,
              background: "linear-gradient(90deg,#00ff9d,#00ffe0)",
              color: "#021018",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Connecting…" : "Connect"}
          </button>

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.65 }}>
            ⚠️ Demo only. Real version will encrypt keys + add permissions check.
          </div>
        </div>
      )}
    </div>
  );
}
