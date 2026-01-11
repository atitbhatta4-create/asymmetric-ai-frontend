// frontend/src/components/RecentTradesPanel.tsx
import React, { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

type TradeRow = {
  id: number;
  time: string;
  symbol: string;
  side: "LONG" | "SHORT";
  mode: string;

  size: number; // percent
  sl: number;   // percent
  tp: number;   // percent
  leverage: number;

  entry_price: number;
  current_price: number;
  unreal_pnl_percent: number;
  unreal_pnl_value: number;

  equity_after: number;
  reason?: string | null;
};

type TradesResponse = {
  trades: TradeRow[];
};

const RecentTradesPanel: React.FC = () => {
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTrades = async () => {
    try {
      setError(null);

      const data = await apiRequest<TradesResponse>("/trades");
      setTrades(data?.trades || []);
    } catch (e: any) {
      console.error("Failed to load trades:", e);
      setError("Failed to load trades");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrades();
    const id = setInterval(loadTrades, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-[#021024] rounded-2xl p-4 text-slate-100 flex flex-col h-full">
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-sm font-semibold tracking-wide">RECENT TRADES</h2>
        <span className="text-xs text-slate-400">Trades: {trades.length}</span>
      </div>

      {loading && trades.length === 0 && (
        <div className="text-xs text-slate-400 mt-3">Loading trades…</div>
      )}

      {error && <div className="text-xs text-red-400 mt-2">{error}</div>}

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
                <th className="py-1 pr-2">Entry</th>
                <th className="py-1 pr-2">PnL%</th>
                <th className="py-1 pr-2">Equity</th>
              </tr>
            </thead>

            <tbody>
              {trades.map((t) => {
                // Your backend stores time as string "YYYY-MM-DD HH:MM:SS"
                const timeStr = t.time
                  ? new Date(t.time.replace(" ", "T") + "Z").toLocaleTimeString(
                      "en-US",
                      { hour: "2-digit", minute: "2-digit", second: "2-digit" }
                    )
                  : "-";

                return (
                  <tr
                    key={t.id}
                    className="border-b border-slate-800 last:border-b-0"
                  >
                    <td className="py-1 pr-2 whitespace-nowrap">{timeStr}</td>
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

                    <td className="py-1 pr-2">{Number(t.size).toFixed(2)}%</td>
                    <td className="py-1 pr-2">{Number(t.sl).toFixed(2)}%</td>
                    <td className="py-1 pr-2">{Number(t.tp).toFixed(2)}%</td>
                    <td className="py-1 pr-2">{Number(t.leverage).toFixed(1)}x</td>

                    <td className="py-1 pr-2">
                      {Number(t.entry_price).toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td className="py-1 pr-2">
                      <span
                        className={
                          Number(t.unreal_pnl_percent) >= 0
                            ? "text-emerald-300"
                            : "text-red-300"
                        }
                      >
                        {Number(t.unreal_pnl_percent).toFixed(2)}%
                      </span>
                    </td>

                    <td className="py-1 pr-2">
                      {Number(t.equity_after).toLocaleString(undefined, {
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
