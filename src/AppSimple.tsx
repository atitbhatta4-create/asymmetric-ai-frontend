// src/AppSimple.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { useNavigate } from "react-router-dom";
import { api } from "./api";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

type Side = "LONG" | "SHORT";
type RiskMode = "ULTRA_SAFE" | "SAFE" | "NORMAL" | "MINI_ASYM" | "AGGRESSIVE";

interface Trade {
  time: string;
  side: Side;
  symbol: string;
  mode: RiskMode;
  size: number;
  sl: number;
  tp: number;
  leverage: number;
  entry_price: number;
  current_price: number;
  unreal_pnl_percent: number;
  unreal_pnl_value: number;
  equity_after: number;
}

interface TradesResponse {
  trades: Trade[];
}

interface BalanceResponse {
  total: number;
  equity_after_last_trade: number;
  last_trade: string | null;
}

interface PriceResponse {
  symbol: string;
  price: number;
}

interface RiskPreviewResp {
  allowed: boolean;
  reason: string;
  computed: {
    mode: RiskMode;
    symbol: string;
    side: Side;
    size: number;
    sl: number;
    tp: number;
    leverage: number;
  };
}

const formatNumber = (n: number | null | undefined, digits = 2) => {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "-";
  return Number(n).toFixed(digits);
};

const DEFAULT_TOP = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT"];

export default function AppSimple() {
  const nav = useNavigate();

  const [activeSymbol, setActiveSymbol] = useState("BTCUSDT");
  const [side, setSide] = useState<Side>("LONG");
  const [mode, setMode] = useState<RiskMode>("SAFE");

  const [size, setSize] = useState(1);
  const [sl, setSl] = useState(0.5);
  const [tp, setTp] = useState(1.5);
  const [leverage, setLeverage] = useState(6);

  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [topPrices, setTopPrices] = useState<Record<string, number | null>>({});

  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => setBalance(await api("/balance"));
  const fetchTrades = async () => setTrades((await api<TradesResponse>("/trades")).trades || []);
  const fetchPrice = async (s: string) => (await api<PriceResponse>(`/price/${s}`)).price;

  const refreshLivePrice = async () => {
    try {
      setLivePrice(await fetchPrice(activeSymbol));
    } catch {
      setLivePrice(null);
    }
  };

  const refreshTopPrices = async () => {
    const next: Record<string, number | null> = {};
    await Promise.all(
      DEFAULT_TOP.map(async (s) => {
        try {
          next[s] = await fetchPrice(s);
        } catch {
          next[s] = null;
        }
      })
    );
    setTopPrices(next);
  };

  const applyModeFromRiskEngine = async (newMode: RiskMode) => {
    setError(null);

    const out = await api<RiskPreviewResp>("/risk/preview", {
      method: "POST",
      body: JSON.stringify({ symbol: activeSymbol, side, mode: newMode, size, sl, tp, leverage }),
    });

    if (!out.allowed) {
      setError(out.reason);
      return;
    }

    setMode(newMode);
    setSize(out.computed.size);
    setSl(out.computed.sl);
    setTp(out.computed.tp);
    setLeverage(out.computed.leverage);
  };

  const placeTrade = async () => {
    setPlacing(true);
    setError(null);
    try {
      await api("/trade", {
        method: "POST",
        body: JSON.stringify({ symbol: activeSymbol, side, mode, size, sl, tp, leverage }),
      });
      await Promise.all([fetchBalance(), fetchTrades(), refreshLivePrice(), refreshTopPrices()]);
    } catch (e: any) {
      setError(e?.message || "Trade failed");
    } finally {
      setPlacing(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchTrades();
    refreshLivePrice();
    refreshTopPrices();

    const id = setInterval(() => {
      refreshLivePrice();
      refreshTopPrices();
      fetchTrades();
    }, 5000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSymbol]);

  const chartData = useMemo(
    () => ({
      labels: trades.map((t) => t.time),
      datasets: [
        {
          label: "Equity",
          data: trades.map((t) => t.equity_after),
          tension: 0.35,
        },
      ],
    }),
    [trades]
  );

  return (
    <div style={{ padding: 16 }}>
      <h2>Dashboard</h2>

      <button onClick={() => nav("/market")}>Open Market</button>

      <h3>Top Coins</h3>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {DEFAULT_TOP.map((s) => (
          <button key={s} onClick={() => setActiveSymbol(s)}>
            {s}: ${formatNumber(topPrices[s])}
          </button>
        ))}
      </div>

      <h3>Execute Trade</h3>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(["ULTRA_SAFE", "SAFE", "NORMAL", "MINI_ASYM", "AGGRESSIVE"] as RiskMode[]).map((m) => (
          <button key={m} onClick={() => applyModeFromRiskEngine(m)}>
            {m}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 10 }}>
        <button onClick={() => setSide("LONG")}>LONG</button>
        <button onClick={() => setSide("SHORT")}>SHORT</button>
      </div>

      <div style={{ marginTop: 10 }}>
        <button disabled={placing} onClick={placeTrade}>
          {placing ? "Placing..." : "Place Trade"}
        </button>
      </div>

      {error && <div style={{ color: "tomato", marginTop: 10 }}>{error}</div>}

      <h3>Live Price</h3>
      ${formatNumber(livePrice)}

      <h3>Equity Curve</h3>
      {trades.length > 0 ? <Line data={chartData} /> : <div>No trades yet</div>}
    </div>
  );
}
