import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../lib/api";

type PriceResponse = { symbol: string; price: number };

const card: React.CSSProperties = {
  background: "rgba(9, 15, 30, 0.96)",
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 0 30px rgba(0,0,0,0.6)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "white",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(148,163,184,0.45)",
  background: "rgba(15,23,42,0.85)",
  color: "white",
  outline: "none",
};

const formatNumber = (n: number | null | undefined, digits = 2) => {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return Number(n).toFixed(digits);
};

const DEFAULT_MARKET = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "XRPUSDT",
  "BNBUSDT",
  "DOGEUSDT",
  "ADAUSDT",
  "AVAXUSDT",
  "LINKUSDT",
  "MATICUSDT",
];

export default function Market() {
  const nav = useNavigate();
  const [query, setQuery] = useState("BTC");
  const [prices, setPrices] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(false);

  const allSymbols = useMemo(() => DEFAULT_MARKET, []);

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return allSymbols;
    return allSymbols.filter((s) => s.includes(q));
  }, [query, allSymbols]);

  const loadPrice = async (s: string) => {
    const out = (await api.apiRequest(`/price/${s}`, { method: "GET" })) as PriceResponse;
    return out.price;
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const next: Record<string, number | null> = {};
      await Promise.all(
        filtered.map(async (s) => {
          try {
            next[s] = await loadPrice(s);
          } catch {
            next[s] = null;
          }
        })
      );
      setPrices((prev) => ({ ...prev, ...next }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(() => refresh(), 6000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 950 }}>Market</div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>
            Search a coin → click it → open Binance-style chart
          </div>
        </div>

        <button
          onClick={() => refresh()}
          style={{
            borderRadius: 14,
            border: "none",
            padding: "10px 16px",
            fontWeight: 950,
            cursor: "pointer",
            background: "linear-gradient(90deg,#00ff9d,#00ffe0)",
            color: "#021018",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div style={card}>
        <div style={{ fontSize: 12, opacity: 0.75 }}>Search symbol</div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type BTC, ETH, SOL..."
          style={{ ...inputStyle, marginTop: 8 }}
        />

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          {filtered.length === 0 ? (
            <div style={{ opacity: 0.7 }}>No results.</div>
          ) : (
            filtered.map((s) => (
              <button
                key={s}
                onClick={() => nav(`/market/${s}`)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  padding: 14,
                  cursor: "pointer",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 950 }}>{s}</div>
                  <div style={{ fontSize: 12, opacity: 0.65 }}>Tap to open chart</div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 950 }}>
                    {prices[s] == null ? "—" : `$${formatNumber(prices[s], 2)}`}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.55 }}>Auto refresh</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
