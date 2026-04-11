import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../lib/api";

const PAIRS = [
  "BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "BNBUSDT",
  "DOGEUSDT", "ADAUSDT", "AVAXUSDT", "LINKUSDT", "MATICUSDT",
  "DOTUSDT", "LTCUSDT", "UNIUSDT", "ATOMUSDT", "NEARUSDT",
];

type Ticker = {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
};

function fmtPrice(n: number) {
  if (!n) return "—";
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(4);
  return n.toFixed(6);
}

function fmtVol(n: number) {
  if (!n) return "—";
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(2) + "K";
  return n.toFixed(2);
}

function baseName(symbol: string) {
  return symbol.replace("USDT", "");
}

export default function Market() {
  const nav = useNavigate();
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"volume" | "change" | "price">("volume");

  const load = useCallback(async () => {
    try {
      const res = await api.apiRequest(
        `/market/tickers?symbols=${PAIRS.join(",")}`,
        { method: "GET" }
      ) as { tickers: Ticker[] };
      setTickers(res.tickers || []);
    } catch {
      // keep previous data on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [load]);

  const filtered = tickers
    .filter((t) => t.symbol.includes(query.trim().toUpperCase()))
    .sort((a, b) => {
      if (sortBy === "volume") return b.volume24h - a.volume24h;
      if (sortBy === "change") return Math.abs(b.change24h) - Math.abs(a.change24h);
      return b.price - a.price;
    });

  const topMovers = [...tickers]
    .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
    .slice(0, 3);

  return (
    <div style={{ color: "white", maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 26, fontWeight: 950 }}>Market</div>
        <div style={{ fontSize: 13, opacity: 0.6, marginTop: 2 }}>
          Live prices via OKX · auto-refresh every 8s
        </div>
      </div>

      {/* Hot movers bar */}
      {topMovers.length > 0 && (
        <div style={{
          display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap",
        }}>
          {topMovers.map((t) => (
            <button
              key={t.symbol}
              onClick={() => nav(`/market/${t.symbol}`)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "rgba(9,15,30,0.92)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14, padding: "10px 16px",
                cursor: "pointer", color: "white",
              }}
            >
              <span style={{
                fontSize: 10, fontWeight: 900, padding: "2px 7px",
                borderRadius: 999, background: "rgba(255,160,50,0.18)",
                border: "1px solid rgba(255,160,50,0.35)", color: "#ffa032",
              }}>HOT</span>
              <span style={{ fontWeight: 900 }}>{baseName(t.symbol)}/USDT</span>
              <span style={{ color: t.change24h >= 0 ? "#00ff9d" : "#ff5078", fontWeight: 900, fontSize: 13 }}>
                {t.change24h >= 0 ? "+" : ""}{t.change24h.toFixed(2)}%
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Search + sort */}
      <div style={{
        display: "flex", gap: 10, marginBottom: 14, alignItems: "center", flexWrap: "wrap",
      }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search BTC, ETH, SOL..."
          style={{
            flex: 1, minWidth: 180, padding: "10px 14px",
            borderRadius: 12, border: "1px solid rgba(148,163,184,0.3)",
            background: "rgba(15,23,42,0.85)", color: "white", fontSize: 14, outline: "none",
          }}
        />
        {(["volume", "change", "price"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            style={{
              padding: "8px 14px", borderRadius: 10, fontWeight: 800,
              fontSize: 12, cursor: "pointer",
              background: sortBy === s ? "rgba(0,255,224,0.12)" : "rgba(255,255,255,0.04)",
              border: sortBy === s ? "1px solid rgba(0,255,224,0.3)" : "1px solid rgba(255,255,255,0.08)",
              color: sortBy === s ? "#00ffe0" : "rgba(255,255,255,0.65)",
            }}
          >
            Sort: {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: "rgba(9,15,30,0.92)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 18, overflow: "hidden",
      }}>
        {/* Table header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1.4fr 0.9fr 1.3fr",
          padding: "12px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          fontSize: 11, fontWeight: 900, opacity: 0.5, textTransform: "uppercase", letterSpacing: 1,
        }}>
          <span>Pair</span>
          <span style={{ textAlign: "right" }}>Price</span>
          <span style={{ textAlign: "right" }}>24h Change</span>
          <span style={{ textAlign: "right" }}>24h Volume</span>
        </div>

        {/* Rows */}
        {loading && tickers.length === 0 ? (
          <div style={{ padding: "30px 20px", opacity: 0.5, textAlign: "center" }}>Loading market data…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "30px 20px", opacity: 0.5, textAlign: "center" }}>No results for "{query}"</div>
        ) : (
          filtered.map((t, i) => {
            const isHot = topMovers.some((m) => m.symbol === t.symbol);
            const positive = t.change24h >= 0;
            return (
              <div
                key={t.symbol}
                onClick={() => nav(`/market/${t.symbol}`)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1.4fr 0.9fr 1.3fr",
                  padding: "14px 20px",
                  borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  cursor: "pointer",
                  transition: "background 0.15s",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Pair */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "rgba(0,255,224,0.10)",
                    border: "1px solid rgba(0,255,224,0.18)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 900, color: "#00ffe0", flexShrink: 0,
                  }}>
                    {baseName(t.symbol).slice(0, 3)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                      {baseName(t.symbol)}<span style={{ opacity: 0.45, fontWeight: 600 }}>/USDT</span>
                      {isHot && (
                        <span style={{
                          fontSize: 9, fontWeight: 900, padding: "1px 5px",
                          borderRadius: 999, background: "rgba(255,160,50,0.18)",
                          border: "1px solid rgba(255,160,50,0.3)", color: "#ffa032",
                        }}>HOT</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.45, marginTop: 1 }}>
                      H: ${fmtPrice(t.high24h)} · L: ${fmtPrice(t.low24h)}
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div style={{ textAlign: "right", fontWeight: 900, fontSize: 15, fontFamily: "monospace" }}>
                  ${fmtPrice(t.price)}
                </div>

                {/* Change */}
                <div style={{
                  textAlign: "right", fontWeight: 900, fontSize: 13,
                  color: positive ? "#00ff9d" : "#ff5078",
                }}>
                  <span style={{
                    padding: "3px 8px", borderRadius: 8,
                    background: positive ? "rgba(0,255,157,0.10)" : "rgba(255,80,120,0.10)",
                  }}>
                    {positive ? "+" : ""}{t.change24h.toFixed(2)}%
                  </span>
                </div>

                {/* Volume */}
                <div style={{ textAlign: "right", fontSize: 13, opacity: 0.75, fontFamily: "monospace" }}>
                  {fmtVol(t.volume24h)} USDT
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
