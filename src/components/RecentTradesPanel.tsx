// frontend/src/components/RecentTradesPanel.tsx
// FULL, SIMPLE, SELF-CONTAINED VERSION
// - no type imports
// - calls http://127.0.0.1:8000/trades directly

import React, { useEffect, useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

// Local Trade type for this component only
type Trade = {
  id: number;
  symbol: string;
  side: string;
  size_pct: number;
  sl_pct: number;
  tp_pct: number;
  leverage: number;
  price: number;
  equity: number;
  created_at: string | null;
};

const RecentTradesPanel: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadTrades = async () => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE_URL}/trades`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to fetch trades");
      }
      const data = await res.json();
      setTrades(data);
    } catch (err: any) {
      console.error("Failed to load trades:", err);
      setError("Failed to load trades");
    } finally {
      setLoading(false);
    }
  };

  // Load once on mount + refresh every 3 seconds
  useEffect(() => {
    loadTrades();
    const id = setInterval(loadTrades, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-[#021024] rounded-2xl p-4 text-slate-100 flex flex-col h-full">
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-sm font-semibold tracking-wide">
          RECENT TRADES
        </h2>
        <span className="text-xs text-slate-400">
          Trades: {trades.length}
        </span>
      </div>

      {loading && trades.length === 0 && (
        <div className="text-xs text-slate-400 mt-3">
          Loading trades…
        </div>
      )}

      {error && (
        <div className="text-xs text-red-400 mt-2">
          {error}
        </div>
      )}

      {!loading && !error && trades.length === 0 && (
        <div className="text-xs text-slate-400 mt-3">
          No trades yet — place a test trade above.
        </div>
      )}

      {trades.length > 0 && (
        <div className="mt-3 overflow-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead className="text-[10px] uppercase text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-1 pr-2">Time</th>
                <th className="py-1 pr-2">Symbol</th>
                <th className="py-1 pr-2">Side</th>
                <th className="py-1 pr-2">Size%</th>
                <th className="py-1 pr-2">SL%</th>
                <th className="py-1 pr-2">TP%</th>
                <th className="py-1 pr-2">Lev</th>
                <th className="py-1 pr-2">Price</th>
                <th className="py-1 pr-2">Equity</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => {
                const d = t.created_at ? new Date(t.created_at) : null;
                const timeStr = d
                  ? d.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "-";

                return (
                  <tr
                    key={t.id}
                    className="border-b border-slate-800 last:border-b-0"
                  >
                    <td className="py-1 pr-2 whitespace-nowrap">
                      {timeStr}
                    </td>
                    <td className="py-1 pr-2">{t.symbol}</td>
                    <td className="py-1 pr-2">
                      <span
                        className={
                          t.side === "LONG"
                            ? "text-emerald-400 font-semibold"
                            : "text-red-400 font-semibold"
                        }
                      >
                        {t.side}
                      </span>
                    </td>
                    <td className="py-1 pr-2">{t.size_pct.toFixed(2)}%</td>
                    <td className="py-1 pr-2">{t.sl_pct.toFixed(2)}%</td>
                    <td className="py-1 pr-2">{t.tp_pct.toFixed(2)}%</td>
                    <td className="py-1 pr-2">{t.leverage.toFixed(1)}x</td>
                    <td className="py-1 pr-2">
                      {t.price.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-1 pr-2">
                      {t.equity.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecentTradesPanel;
