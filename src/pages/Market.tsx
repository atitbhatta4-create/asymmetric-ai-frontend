import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../lib/api";
import useIsMobile from "../hooks/useIsMobile";

// ── Supported pairs (OKX always available on backend) ──────────────────────
const ALL_PAIRS = [
  "BTCUSDT","ETHUSDT","SOLUSDT","XRPUSDT","BNBUSDT",
  "DOGEUSDT","ADAUSDT","AVAXUSDT","LINKUSDT","MATICUSDT",
  "DOTUSDT","LTCUSDT","UNIUSDT","ATOMUSDT","NEARUSDT",
  "APTUSDT","ARBUSDT","OPUSDT","INJUSDT","SUIUSDT",
];

type Ticker = {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
};

type Tab = "all" | "hot" | "favorites";

// ── Helpers ─────────────────────────────────────────────────────────────────
function base(symbol: string) { return symbol.replace("USDT", ""); }

function logoUrl(symbol: string) {
  return `https://assets.coincap.io/assets/icons/${base(symbol).toLowerCase()}@2x.png`;
}

function fmtPrice(n: number) {
  if (!n) return "—";
  if (n >= 1000) return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1)    return n.toFixed(4);
  return n.toFixed(6);
}
function fmtVol(n: number) {
  if (!n) return "—";
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000)         return (n / 1_000).toFixed(1) + "K";
  return n.toFixed(2);
}

const FAV_KEY = "asym:market:favorites";
function loadFavs(): string[] {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch { return []; }
}
function saveFavs(f: string[]) { localStorage.setItem(FAV_KEY, JSON.stringify(f)); }

// ── Component ────────────────────────────────────────────────────────────────
export default function Market() {
  const nav      = useNavigate();
  const isMobile = useIsMobile();

  const [tickers, setTickers]     = useState<Ticker[]>([]);
  const [query, setQuery]         = useState("");
  const [tab, setTab]             = useState<Tab>("all");
  const [loading, setLoading]     = useState(true);
  const [favorites, setFavorites] = useState<string[]>(loadFavs);
  const [exchange, setExchange]   = useState("okx");

  // Detect user's connected exchange (for display label only — OKX data always used)
  useEffect(() => {
    api.apiRequest("/exchange/status", { method: "GET" })
      .then((r: any) => { if (r?.connected && r?.exchange) setExchange(r.exchange.toLowerCase()); })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await api.apiRequest(
        `/market/tickers?symbols=${ALL_PAIRS.join(",")}`,
        { method: "GET" }
      ) as { tickers: Ticker[] };
      setTickers(res.tickers || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const id = setInterval(load, 8000); return () => clearInterval(id); }, [load]);

  const toggleFav = (sym: string) => {
    setFavorites((prev) => {
      const next = prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym];
      saveFavs(next);
      return next;
    });
  };

  // Sort + filter
  const sorted = [...tickers].sort((a, b) =>
    tab === "hot" ? Math.abs(b.change24h) - Math.abs(a.change24h) : b.volume24h - a.volume24h
  );
  const filtered = sorted.filter((t) => {
    if (tab === "favorites" && !favorites.includes(t.symbol)) return false;
    if (query.trim()) return t.symbol.includes(query.trim().toUpperCase());
    return true;
  });

  const topMovers = [...tickers]
    .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
    .slice(0, 4);

  return (
    <div style={{ color: "white" }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: isMobile ? 12 : 16 }}>
        <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 950 }}>Market</div>
        <div style={{ fontSize: isMobile ? 11 : 12, opacity: 0.5, marginTop: 2 }}>
          Prices via OKX · connected exchange: <span style={{ color: "#00ffe0", textTransform: "uppercase" }}>{exchange}</span>
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ position: "relative", marginBottom: 14 }}>
        <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search BTC, ETH, SOL..."
          style={{
            width: "100%", padding: "11px 14px 11px 38px",
            borderRadius: 12, border: "1px solid rgba(148,163,184,0.2)",
            background: "rgba(15,23,42,0.85)", color: "white",
            fontSize: 14, outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 0 }}>
        {(["all", "hot", "favorites"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 16px", fontWeight: 800, fontSize: 13, cursor: "pointer",
            background: "transparent", border: "none",
            borderBottom: tab === t ? "2px solid #00ffe0" : "2px solid transparent",
            color: tab === t ? "#00ffe0" : "rgba(255,255,255,0.5)",
            textTransform: "capitalize", marginBottom: -1,
          }}>
            {t === "favorites" ? "★ Favorites" : t === "hot" ? "🔥 Hot" : "All Markets"}
          </button>
        ))}
      </div>

      {/* ── Hot movers strip (only on All tab) ── */}
      {tab === "all" && !query && topMovers.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14, overflowX: "auto" }}>
          {topMovers.map((t) => {
            const pos = t.change24h >= 0;
            return (
              <button key={t.symbol} onClick={() => nav(`/market/${t.symbol}`)} style={{
                display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
                background: "rgba(9,15,30,0.92)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, padding: "8px 14px", cursor: "pointer", color: "white",
              }}>
                <img src={logoUrl(t.symbol)} alt="" width={20} height={20}
                  style={{ borderRadius: "50%" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <span style={{ fontWeight: 900, fontSize: 13 }}>{base(t.symbol)}</span>
                <span style={{ color: pos ? "#00ff9d" : "#ff5078", fontWeight: 800, fontSize: 12 }}>
                  {pos ? "+" : ""}{t.change24h.toFixed(2)}%
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Table ── */}
      <div style={{ background: "rgba(9,15,30,0.92)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
        {/* Table header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "32px 1fr 1fr 1fr" : "32px 2fr 1.4fr 1fr 1.3fr 100px",
          padding: "10px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          fontSize: 11, fontWeight: 900, opacity: 0.45, textTransform: "uppercase", letterSpacing: 0.8,
          alignItems: "center",
        }}>
          <span></span>
          <span>Pair</span>
          <span style={{ textAlign: "right" }}>Price</span>
          <span style={{ textAlign: "right" }}>24h %</span>
          {!isMobile && <span style={{ textAlign: "right" }}>Volume</span>}
          {!isMobile && <span style={{ textAlign: "right" }}>Action</span>}
        </div>

        {loading && tickers.length === 0 ? (
          <div style={{ padding: "40px 20px", opacity: 0.4, textAlign: "center" }}>Loading market data…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "40px 20px", opacity: 0.4, textAlign: "center" }}>
            {tab === "favorites" ? "No favorites yet — click ★ to add" : `No results for "${query}"`}
          </div>
        ) : filtered.map((t, i) => {
          const pos = t.change24h >= 0;
          const isFav = favorites.includes(t.symbol);
          return (
            <div
              key={t.symbol}
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "32px 1fr 1fr 1fr" : "32px 2fr 1.4fr 1fr 1.3fr 100px",
                padding: "12px 16px", alignItems: "center",
                borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.035)" : "none",
                cursor: "pointer", transition: "background 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              onClick={() => nav(`/market/${t.symbol}`)}
            >
              {/* Star */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleFav(t.symbol); }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 14,
                  color: isFav ? "#ffa032" : "rgba(255,255,255,0.2)" }}
              >
                {isFav ? "★" : "☆"}
              </button>

              {/* Pair + logo */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, flexShrink: 0 }}>
                  <img
                    src={logoUrl(t.symbol)} alt={base(t.symbol)} width={32} height={32}
                    style={{ borderRadius: "50%", display: "block" }}
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = "none";
                      const fb = el.nextElementSibling as HTMLElement | null;
                      if (fb) fb.style.display = "flex";
                    }}
                  />
                  <div style={{
                    display: "none", width: 32, height: 32, borderRadius: "50%",
                    background: "rgba(0,255,224,0.12)", border: "1px solid rgba(0,255,224,0.2)",
                    alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 900, color: "#00ffe0",
                  }}>
                    {base(t.symbol).slice(0, 3)}
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 14 }}>
                    {base(t.symbol)}<span style={{ opacity: 0.4, fontWeight: 600, fontSize: 12 }}>/USDT</span>
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.4, marginTop: 1 }}>
                    H: {fmtPrice(t.high24h)} · L: {fmtPrice(t.low24h)}
                  </div>
                </div>
              </div>

              {/* Price */}
              <div style={{ textAlign: "right", fontWeight: 900, fontSize: 14, fontFamily: "monospace" }}>
                ${fmtPrice(t.price)}
              </div>

              {/* Change */}
              <div style={{ textAlign: "right" }}>
                <span style={{
                  display: "inline-block", padding: "3px 8px", borderRadius: 6,
                  fontWeight: 800, fontSize: 12,
                  background: pos ? "rgba(0,255,157,0.10)" : "rgba(255,80,120,0.10)",
                  color: pos ? "#00ff9d" : "#ff5078",
                }}>
                  {pos ? "+" : ""}{t.change24h.toFixed(2)}%
                </span>
              </div>

              {/* Volume — desktop only */}
              {!isMobile && (
                <div style={{ textAlign: "right", fontSize: 12, opacity: 0.6, fontFamily: "monospace" }}>
                  {fmtVol(t.volume24h)}
                </div>
              )}

              {/* Trade button — desktop only */}
              {!isMobile && (
                <div style={{ textAlign: "right" }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); nav(`/market/${t.symbol}`); }}
                    style={{
                      padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 800,
                      cursor: "pointer", border: "1px solid rgba(0,255,224,0.3)",
                      background: "rgba(0,255,224,0.08)", color: "#00ffe0",
                    }}
                  >
                    Chart
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
