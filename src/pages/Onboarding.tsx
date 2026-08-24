import React, { useState } from "react";
import * as api from "../lib/api";

const STEPS = 6;

const teal  = "#00ffe0";
const dark  = "#050814";
const card  = "rgba(9,15,30,0.97)";
const bdr   = "rgba(255,255,255,0.08)";
const muted = "#94a3b8";
const light = "#f1f5f9";

// ── Shared UI ─────────────────────────────────────────────────────────────────

function ProgressBar({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", gap: 5, marginBottom: 24 }}>
      {Array.from({ length: STEPS }).map((_, i) => (
        <div key={i} style={{
          flex: i === current ? 2 : 1,
          height: 4,
          borderRadius: 2,
          background: i < current ? teal : i === current ? teal : "rgba(255,255,255,0.12)",
          opacity: i < current ? 0.5 : 1,
          transition: "all 0.3s ease",
        }} />
      ))}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "#0f172a",
      border: `1px solid ${bdr}`,
      borderRadius: 14,
      padding: "14px 16px",
      marginBottom: 14,
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontWeight: 800, color: light, marginBottom: 10, fontSize: 13 }}>
      {children}
    </div>
  );
}

function Pill({ children, color = teal }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 20,
      background: `${color}18`,
      border: `1px solid ${color}40`,
      color,
      fontWeight: 800,
      fontSize: 11,
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

function Row({ icon, title, body }: { icon: string; title: string; body: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
      <span style={{ fontSize: 17, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 700, color: light, fontSize: 13, marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 12, color: muted, lineHeight: 1.6 }}>{body}</div>
      </div>
    </div>
  );
}

function NumStep({ n, title, body }: { n: number; title: string; body: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
      <div style={{
        minWidth: 26, height: 26, borderRadius: "50%",
        background: "rgba(0,255,224,0.13)",
        border: "1px solid rgba(0,255,224,0.28)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 900, fontSize: 12, color: teal, flexShrink: 0,
      }}>{n}</div>
      <div>
        <div style={{ fontWeight: 700, color: light, fontSize: 13, marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 12, color: muted, lineHeight: 1.6 }}>{body}</div>
      </div>
    </div>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "rgba(0,255,224,0.06)",
      border: "1px solid rgba(0,255,224,0.18)",
      borderRadius: 12,
      padding: "12px 15px",
      fontSize: 13,
      color: "#a7f3d0",
      lineHeight: 1.65,
      marginBottom: 14,
    }}>
      {children}
    </div>
  );
}

// ── Step 1 — Welcome ──────────────────────────────────────────────────────────

function Step1() {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2.5, color: teal, marginBottom: 10, textTransform: "uppercase" }}>
        Welcome
      </div>
      <div style={{ fontSize: 27, fontWeight: 950, lineHeight: 1.2, marginBottom: 14 }}>
        Meet Asymmetric AI
      </div>

      <div style={{ fontSize: 14, color: muted, lineHeight: 1.75, marginBottom: 20 }}>
        Asymmetric AI is an AI-powered automated trading engine that applies
        <b style={{ color: light }}> institutional-grade signal discipline </b>
        to retail crypto trading — giving everyday traders the kind of systematic,
        rules-based approach used by professional hedge funds.
      </div>

      <Card>
        <CardTitle>The 4-Layer Signal System</CardTitle>
        {[
          ["Layer 1 — Regime", "Is there a genuine trend worth trading? The engine checks ADX strength and ATR volatility. If the market is choppy or flat — it waits."],
          ["Layer 2 — Direction", "Which way is the big money moving? 4-hour EMAs determine whether the trend is bullish or bearish. The engine only trades with the dominant trend."],
          ["Layer 3 — Entry", "Is NOW the right moment? Price must be in a pullback zone, with a qualifying candle pattern (pin bar, engulfing, momentum). RSI must confirm."],
          ["Layer 4 — Momentum", "Is the move actually starting? Volume must be real, and recent candles must confirm the direction. No fake-outs."],
        ].map(([title, body], i) => (
          <div key={i} style={{
            paddingBottom: i < 3 ? 12 : 0,
            marginBottom: i < 3 ? 12 : 0,
            borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none",
          }}>
            <div style={{ fontWeight: 800, color: teal, fontSize: 12, marginBottom: 3 }}>{title}</div>
            <div style={{ fontSize: 12, color: muted, lineHeight: 1.6 }}>{body}</div>
          </div>
        ))}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          ["🔐", "Non-custodial", "Your funds never leave your exchange. We only hold trade permission — not your money."],
          ["🛡️", "Capital first", "The engine is designed to protect capital before seeking gains. Risk limits are enforced on every single trade."],
        ].map(([icon, title, body]) => (
          <div key={title as string} style={{
            background: "#0f172a",
            border: `1px solid ${bdr}`,
            borderRadius: 12,
            padding: "12px 14px",
          }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontWeight: 800, color: light, fontSize: 13, marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 11, color: muted, lineHeight: 1.55 }}>{body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step 2 — Connect Exchange ─────────────────────────────────────────────────

function Step2() {
  const [exchange, setExchange] = useState<"bybit" | "okx" | "binance">("bybit");

  const steps: Record<string, [string, React.ReactNode][]> = {
    bybit: [
      ["Log in to your exchange", <>Go to <b style={{ color: light }}>bybit.com</b> and sign in.</>],
      ["Open API Management", <>Click your profile icon (top right) → <b style={{ color: light }}>API Management</b>.</>],
      ["Create New Key", <>Click <b style={{ color: light }}>"Create New Key"</b> → choose <b style={{ color: light }}>"System-generated API Keys"</b>.</>],
      ["Set permissions", <><Pill>Read</Pill> <Pill>Trade</Pill> — Leave <b style={{ color: "#fca5a5" }}>Withdrawal OFF</b> — never enable it.</>],
      ["Copy your keys", <>Copy the <b style={{ color: light }}>API Key</b> and <b style={{ color: light }}>Secret</b> — Secret is shown once only.</>],
      ["Connect in app", <>Go to the <b style={{ color: light }}>Exchange tab</b> in Asymmetric AI → paste your keys → click Connect.</>],
    ],
    okx: [
      ["Log in to your exchange", <>Go to <b style={{ color: light }}>okx.com</b> and sign in.</>],
      ["Open API", <>Click your profile icon → <b style={{ color: light }}>API</b> from the dropdown.</>],
      ["Create V5 API Key", <>Click <b style={{ color: light }}>"Create V5 API Key"</b>.</>],
      ["Set permissions", <><Pill>Read</Pill> <Pill>Trade</Pill> — Do NOT enable Withdrawal or Transfer.</>],
      ["Set passphrase", <>Create a <b style={{ color: light }}>passphrase</b> — you'll need this along with your key and secret.</>],
      ["Connect in app", <>Go to the <b style={{ color: light }}>Exchange tab</b> → paste API Key, Secret, and Passphrase → Connect.</>],
    ],
    binance: [
      ["Log in to your exchange", <>Go to <b style={{ color: light }}>binance.com</b> and sign in.</>],
      ["Open API Management", <>Click your profile icon → <b style={{ color: light }}>API Management</b>.</>],
      ["Create API", <>Click <b style={{ color: light }}>"Create API"</b> → choose <b style={{ color: light }}>"System generated"</b> → enter a label.</>],
      ["Complete verification", <>Complete the 2FA verification step Binance requires.</>],
      ["Set permissions", <><Pill>Enable Reading</Pill> <Pill>Enable Spot & Margin / Futures Trading</Pill> — Disable everything else especially Withdrawals.</>],
      ["Connect in app", <>Copy <b style={{ color: light }}>API Key</b> and <b style={{ color: light }}>Secret Key</b> → paste into the Exchange tab → Connect.</>],
    ],
  };

  const tabs: { key: "bybit" | "okx" | "binance"; label: string }[] = [
    { key: "bybit", label: "Bybit" },
    { key: "okx", label: "OKX" },
    { key: "binance", label: "Binance" },
  ];

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2.5, color: teal, marginBottom: 10, textTransform: "uppercase" }}>
        Step 2
      </div>
      <div style={{ fontSize: 23, fontWeight: 950, marginBottom: 6 }}>Connect Your Exchange</div>
      <div style={{ fontSize: 13, color: muted, marginBottom: 18, lineHeight: 1.6 }}>
        We support Bybit, OKX, and Binance. Select your exchange below and follow the steps to create a trade-only API key.
      </div>

      {/* Exchange tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {tabs.map(({ key, label }) => (
          <button key={key} type="button" onClick={() => setExchange(key)} style={{
            padding: "8px 16px",
            borderRadius: 10,
            border: exchange === key ? `1px solid ${teal}` : `1px solid ${bdr}`,
            background: exchange === key ? "rgba(0,255,224,0.10)" : "rgba(255,255,255,0.04)",
            color: exchange === key ? teal : muted,
            fontWeight: 800,
            fontSize: 13,
            cursor: "pointer",
          }}>
            {label}
          </button>
        ))}
      </div>

      <Card>
        {steps[exchange].map(([title, body], i) => (
          <div key={i} style={{
            display: "flex", gap: 12, alignItems: "flex-start",
            paddingBottom: i < steps[exchange].length - 1 ? 12 : 0,
            marginBottom: i < steps[exchange].length - 1 ? 12 : 0,
            borderBottom: i < steps[exchange].length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
          }}>
            <div style={{
              minWidth: 22, height: 22, borderRadius: "50%",
              background: "rgba(0,255,224,0.12)", border: "1px solid rgba(0,255,224,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 900, fontSize: 11, color: teal, flexShrink: 0,
            }}>{i + 1}</div>
            <div>
              <div style={{ fontWeight: 700, color: light, fontSize: 13, marginBottom: 2 }}>{title}</div>
              <div style={{ fontSize: 12, color: muted, lineHeight: 1.6 }}>{body}</div>
            </div>
          </div>
        ))}
      </Card>

      <div style={{
        background: "rgba(220,38,38,0.08)",
        border: "1px solid rgba(248,113,113,0.25)",
        borderRadius: 12, padding: "12px 15px",
        fontSize: 12, color: "#fecaca", lineHeight: 1.65,
      }}>
        <b>Security rule:</b> Never enable <b>Withdrawal</b> permission on any API key. Asymmetric AI only needs
        Read + Trade access. Your keys are AES-encrypted in our database — we never store them in plain text.
      </div>
    </div>
  );
}

// ── Step 3 — Mode & Style ─────────────────────────────────────────────────────

function Step3() {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2.5, color: teal, marginBottom: 10, textTransform: "uppercase" }}>
        Step 3
      </div>
      <div style={{ fontSize: 23, fontWeight: 950, marginBottom: 6 }}>Choose Your Mode & Style</div>
      <div style={{ fontSize: 13, color: muted, marginBottom: 16, lineHeight: 1.6 }}>
        Mode controls how big your positions are. Style controls which timeframe the engine trades on. Pick what fits you.
      </div>

      <Card>
        <CardTitle>Which Mode is right for you?</CardTitle>
        {[
          { name: "ULTRA_SAFE", tag: "New to crypto or testing",     size: "30%", lev: "2×", desc: "Smallest size, gentlest risk. Use this for your first week to see how the engine behaves before committing more." },
          { name: "SAFE",       tag: "Cautious, steady growth",      size: "45%", lev: "3×", desc: "Conservative but meaningful. Good balance between protection and results. Great for capital you want to grow carefully." },
          { name: "MINI_ASYM", tag: "★ Flagship — most popular",    size: "65%", lev: "6×", desc: "The signature mode. Designed to balance signal quality, position size, and risk discipline. This is what Asymmetric AI was built around.", flagship: true },
          { name: "NORMAL",     tag: "Balanced exposure",            size: "60%", lev: "5×", desc: "Similar to MINI_ASYM but slightly more conservative on leverage. Good middle ground." },
          { name: "AGGRESSIVE", tag: "Experienced traders only",     size: "85%", lev: "8×", desc: "Maximum exposure. Only use this if you understand leverage risk deeply and have experience with the engine first." },
        ].map(({ name, tag, size, lev, desc, flagship }, i, arr) => (
          <div key={name} style={{
            paddingBottom: i < arr.length - 1 ? 12 : 0,
            marginBottom: i < arr.length - 1 ? 12 : 0,
            borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 900, color: flagship ? teal : light, fontSize: 13 }}>{name}</span>
              <span style={{ fontSize: 11, color: flagship ? "#00ff9d" : muted }}>{tag}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>
                {size} · {lev} lev
              </span>
            </div>
            <div style={{ fontSize: 12, color: muted, lineHeight: 1.55 }}>{desc}</div>
          </div>
        ))}
      </Card>

      <Card>
        <CardTitle>Which Style fits your schedule?</CardTitle>
        {[
          { name: "SCALP",     tf: "15m candles · checks every 15 min", tag: "Active, fast trades",         desc: "Most trades per day. Great if you want to monitor closely. Tighter stop-losses and take-profits." },
          { name: "DAY_TRADE", tf: "1h candles · checks every hour",     tag: "★ Recommended — balanced",   desc: "Best balance between signal quality and trade frequency. The engine checks once per hour and takes clean setups. Ideal for most users.", rec: true },
          { name: "SWING",     tf: "4h candles · checks every 4 hours",  tag: "Set & forget, patient",      desc: "Fewest trades. Wider stops and targets. Ideal if you want to run it in the background and not check constantly." },
        ].map(({ name, tf, tag, desc, rec }, i, arr) => (
          <div key={name} style={{
            paddingBottom: i < arr.length - 1 ? 12 : 0,
            marginBottom: i < arr.length - 1 ? 12 : 0,
            borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <Pill color={rec ? "#00ff9d" : teal}>{name}</Pill>
              <span style={{ fontSize: 11, color: rec ? "#00ff9d" : muted }}>{tag}</span>
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>{tf}</div>
            <div style={{ fontSize: 12, color: muted, lineHeight: 1.55 }}>{desc}</div>
          </div>
        ))}
      </Card>

      <div style={{ fontSize: 12, color: muted, lineHeight: 1.6 }}>
        <b style={{ color: light }}>Don't overthink it.</b> Start with <b style={{ color: teal }}>MINI_ASYM + DAY_TRADE</b> —
        the most tested combination. You can change these any time before starting a new session.
      </div>
    </div>
  );
}

// ── Step 4 — Quick Start ──────────────────────────────────────────────────────

function Step4() {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2.5, color: teal, marginBottom: 10, textTransform: "uppercase" }}>
        Step 4
      </div>
      <div style={{ fontSize: 23, fontWeight: 950, marginBottom: 6 }}>How to Start</div>
      <div style={{ fontSize: 13, color: muted, marginBottom: 18, lineHeight: 1.6 }}>
        Follow these steps on the dashboard the first time. It takes less than 5 minutes.
      </div>

      <Card>
        <NumStep n={1} title="Create your API key and connect your exchange"
          body={<>Follow the steps from <b style={{ color: light }}>Step 2</b> to create a trade-only key on Bybit, OKX, or Binance. Then go to the <b style={{ color: light }}>Exchange tab</b> in Asymmetric AI, paste your keys, and click Connect.</>} />
        <NumStep n={2} title="Fund your exchange account in USDT"
          body={<>Make sure your <b style={{ color: light }}>USDT balance</b> is in the correct account on your exchange — Bybit: <b style={{ color: light }}>Unified Trading Account</b>, OKX: <b style={{ color: light }}>Trading Account</b>, Binance: <b style={{ color: light }}>Futures/Trading Account</b>. The AI reads your USDT balance and sizes all positions from there.</>} />
        <NumStep n={3} title="Choose your coin from the Dashboard"
          body={<>Go to the <b style={{ color: light }}>Dashboard</b> and type any coin you want to trade — <b style={{ color: light }}>BTCUSDT, ETHUSDT, SOLUSDT, NEARUSDT</b>, or any USDT pair your exchange supports. You can change this any time before starting.</>} />
        <NumStep n={4} title="Select your Mode"
          body={<>Pick the Mode that matches your risk preference (from what you learned in Step 3). <span style={{ color: muted }}>ULTRA_SAFE (30% · 2×) · SAFE (45% · 3×) · MINI_ASYM (65% · 6×) · NORMAL (60% · 5×) · AGGRESSIVE (85% · 8×)</span></>} />
        <NumStep n={5} title="Select your Style"
          body={<>Pick the trading timeframe that fits your schedule. <span style={{ color: muted }}>SCALP (15m · every 15 min) · DAY_TRADE (1h · every hour) · SWING (4h · every 4 hours)</span></>} />
        <NumStep n={6} title="Set your Duration (1–30 days)"
          body={<>Choose how many days you want the AI to run. It <b style={{ color: light }}>stops automatically</b> at the end of the duration and emails you to start a new session. You can stop it manually at any time from the dashboard.</>} />
        <NumStep n={7} title="Click Start AI — you're live"
          body={<>The engine will start on the next candle close. It runs silently in the background. You'll receive an email when a trade opens or closes, and you can check the <b style={{ color: light }}>History tab</b> anytime to see what the engine is thinking.</>} />
      </Card>
    </div>
  );
}

// ── Step 5 — How It Works & Protects ─────────────────────────────────────────

function Step5() {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2.5, color: teal, marginBottom: 10, textTransform: "uppercase" }}>
        Step 5
      </div>
      <div style={{ fontSize: 23, fontWeight: 950, marginBottom: 6 }}>How It Works & Protects You</div>
      <div style={{ fontSize: 13, color: muted, marginBottom: 16, lineHeight: 1.6 }}>
        Understanding this will help you trust the engine when it is quiet — and trust it more when it fires.
      </div>

      <Card>
        <CardTitle>Why does it trade less than I expect?</CardTitle>
        <div style={{ fontSize: 13, color: muted, lineHeight: 1.7 }}>
          All 4 signal layers must align simultaneously for a trade to fire. If even one layer is off — the engine waits.
          Most of the time, markets are choppy, trending weakly, or the entry timing is wrong. Waiting is the correct move.
          <br /><br />
          <b style={{ color: light }}>Fewer but higher-probability trades outperform frequent low-quality ones</b> — especially when you factor in exchange fees, slippage, and the compounding effect of protecting capital during bad market conditions.
        </div>
      </Card>

      <Card>
        <CardTitle>Capital Protection Layers</CardTitle>
        <Row icon="🛑" title="Hard Floor — the ultimate stop"
          body={<>If your account drops <b style={{ color: light }}>15% from its highest point</b>, the engine stops completely and emails you. Example: Peak $1,000 → floor = $850. If equity hits $850, AI stops. The floor only ever moves UP — it locks in your gains as your account grows.</>} />
        <Row icon="📉" title="Drawdown Tiers — automatic size reduction"
          body={
            <table style={{ fontSize: 12, borderCollapse: "collapse", width: "100%", marginTop: 4 }}>
              {[
                ["−4% from peak", "Size shrinks to 65%"],
                ["−7% from peak", "Size shrinks to 40%"],
                ["−10% from peak", "Size shrinks to 25% (recovery mode)"],
                ["−15% from peak", "Engine fully stops"],
              ].map(([t, a]) => (
                <tr key={t}><td style={{ padding: "3px 0", color: "#fca5a5", fontWeight: 700, paddingRight: 16 }}>{t}</td><td style={{ color: muted }}>{a}</td></tr>
              ))}
            </table>
          } />
        <Row icon="💰" title="Per-trade risk cap"
          body={<>Max loss per trade is capped at <b style={{ color: light }}>1.5% (SCALP) · 2% (DAY_TRADE) · 3% (SWING)</b> of your equity. One bad trade can never take more than 3% of your account.</>} />
        <Row icon="🔒" title="Profit ratchet — locking in gains"
          body={<>Once your account <b style={{ color: light }}>doubles</b> your starting balance, the hard floor tightens from 15% to 10% from peak — automatically locking in more of your compounded profits as you grow.</>} />
      </Card>

      <Highlight>
        <b>You can disconnect or withdraw anytime.</b> The AI only holds trade permission.
        It cannot move funds off your exchange. Close the API key on your exchange and everything stops instantly.
      </Highlight>
    </div>
  );
}

// ── Step 6 — Ready to Start ───────────────────────────────────────────────────

function Step6({ checked, setChecked }: { checked: boolean; setChecked: (v: boolean) => void }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2.5, color: teal, marginBottom: 10, textTransform: "uppercase" }}>
        Step 6
      </div>
      <div style={{ fontSize: 23, fontWeight: 950, marginBottom: 6 }}>You're Ready</div>
      <div style={{ fontSize: 13, color: muted, marginBottom: 18, lineHeight: 1.6 }}>
        Before you go to the dashboard — a few final things to keep in mind.
      </div>

      {/* Minimum capital */}
      <div style={{
        background: "rgba(0,255,224,0.07)",
        border: "1px solid rgba(0,255,224,0.22)",
        borderRadius: 12, padding: "14px 16px", marginBottom: 14,
      }}>
        <div style={{ fontWeight: 800, color: teal, marginBottom: 6, fontSize: 13 }}>Minimum recommended capital</div>
        <div style={{ fontSize: 13, color: "#a7f3d0", lineHeight: 1.65 }}>
          <b>$50 USDT minimum</b> — works, but exchange fees will take a larger percentage of each trade.<br />
          <b>$100 – $500</b> is the ideal starting range for meaningful results with controlled risk.
        </div>
      </div>

      <Card>
        <CardTitle>Pre-launch checklist</CardTitle>
        {[
          ["Exchange", "API key connected in the Exchange tab (Bybit / OKX / Binance)"],
          ["Funds",    "USDT available in your Unified / Trading account"],
          ["Coin",     "Any USDT pair selected on the Dashboard (e.g. BTCUSDT, ETHUSDT)"],
          ["Mode",     "Risk mode chosen — MINI_ASYM recommended for most users"],
          ["Style",    "Trade style chosen — DAY_TRADE recommended for most users"],
          ["Duration", "1–30 days set — the engine stops automatically at the end"],
        ].map(([label, text], i, arr) => (
          <div key={label} style={{
            display: "flex", gap: 12, alignItems: "flex-start",
            padding: "9px 0",
            borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
          }}>
            <span style={{ color: "#00ff9d", fontWeight: 900, fontSize: 14, flexShrink: 0, marginTop: 1 }}>✓</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: teal, marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 12, color: muted }}>{text}</div>
            </div>
          </div>
        ))}
      </Card>

      <label style={{
        display: "flex", gap: 12, alignItems: "flex-start",
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${bdr}`,
        padding: "12px 14px", borderRadius: 14,
        cursor: "pointer", marginBottom: 4,
      }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          style={{ width: 18, height: 18, flexShrink: 0, marginTop: 2, cursor: "pointer" }}
        />
        <span style={{ fontWeight: 700, fontSize: 13, color: "#e2e8f0", lineHeight: 1.6 }}>
          I have read and understood this guide. I know that crypto trading involves risk and
          the AI cannot guarantee profits. I am only using funds I can afford to lose.
        </span>
      </label>
    </div>
  );
}

// ── Main Onboarding Component ─────────────────────────────────────────────────

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep]     = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const isLast = step === STEPS - 1;

  async function handleFinish() {
    if (!agreed || loading) return;
    setLoading(true);
    try {
      await api.apiRequest("/onboarding/complete", { method: "POST" });
    } catch {
      // non-critical — proceed regardless
    }
    setLoading(false);
    onComplete();
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      background: `radial-gradient(1200px 600px at 20% 10%, rgba(0,255,224,0.10), transparent 55%), ${dark}`,
      color: "white",
      padding: 16,
    }}>
      <div style={{
        width: 700,
        maxWidth: "100%",
        borderRadius: 22,
        padding: "26px 28px 24px",
        background: card,
        border: `1px solid ${bdr}`,
        boxShadow: "0 0 60px rgba(0,0,0,0.75)",
      }}>
        {/* Top label */}
        <div style={{
          fontSize: 10, fontWeight: 900, letterSpacing: 2,
          color: "rgba(255,255,255,0.3)", marginBottom: 8, textTransform: "uppercase",
        }}>
          Setup Guide &nbsp;·&nbsp; {step + 1} / {STEPS}
        </div>

        <ProgressBar current={step} />

        {/* Step content */}
        <div style={{ minHeight: 380 }}>
          {step === 0 && <Step1 />}
          {step === 1 && <Step2 />}
          {step === 2 && <Step3 />}
          {step === 3 && <Step4 />}
          {step === 4 && <Step5 />}
          {step === 5 && <Step6 checked={agreed} setChecked={setAgreed} />}
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          {step > 0 && (
            <button type="button" onClick={() => setStep(s => s - 1)} style={{
              padding: "12px 20px", borderRadius: 14,
              border: `1px solid ${bdr}`,
              background: "rgba(255,255,255,0.05)",
              color: "white", fontWeight: 800, cursor: "pointer", fontSize: 14,
            }}>
              ← Back
            </button>
          )}

          {!isLast ? (
            <button type="button" onClick={() => setStep(s => s + 1)} style={{
              flex: 1, padding: "12px 20px", borderRadius: 14, border: "none",
              background: `linear-gradient(90deg, #00ff9d, ${teal})`,
              color: dark, fontWeight: 950, cursor: "pointer", fontSize: 14,
            }}>
              Next →
            </button>
          ) : (
            <button type="button" onClick={handleFinish}
              disabled={!agreed || loading}
              style={{
                flex: 1, padding: "12px 20px", borderRadius: 14, border: "none",
                background: `linear-gradient(90deg, #00ff9d, ${teal})`,
                color: dark, fontWeight: 950, fontSize: 14,
                cursor: !agreed ? "not-allowed" : "pointer",
                opacity: !agreed ? 0.45 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {loading ? "Saving…" : "I Understand — Take Me to Dashboard →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
