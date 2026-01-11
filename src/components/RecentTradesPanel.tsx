// frontend/src/components/RecentTradesPanel.tsx

import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTrades = async () => {
    try {
      setError(null);
      const data = await apiFetch("/trades");
      setTrades(data);
    } catch (err) {
      console.error(err);
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
      <h2 className="text-sm font-semibold mb-2">RECENT TRADES</h2>

      {loading && <div className="text-xs text-slate-400">Loading…</div>}
      {error && <div className="text-xs text-red-400">{error}</div>}

      {!loading && !error && trades.length === 0 && (
        <div className="text-xs text-slate-400">No trades yet</div>
      )}

      {trades.length > 0 && (
        <table className="text-xs mt-2">
          <tbody>
            {trades.map((t) => (
              <tr key={t.id}>
                <td>{t.symbol}</td>
                <td className={t.side === "LONG" ? "text-green-400" : "text-red-400"}>
                  {t.side}
                </td>
                <td>{t.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RecentTradesPanel;
