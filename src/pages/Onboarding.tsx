import React, { useState } from "react";
import * as api from "../lib/api";

const STEPS = 5;

const teal = "#00ffe0";
const dark = "#050814";
const card = "rgba(9,15,30,0.96)";
const border = "rgba(255,255,255,0.08)";
const muted = "#94a3b8";

function ProgressDots({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 22 }}>
      {Array.from({ length: STEPS }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? 20 : 8,
            height: 8,
            borderRadius: 4,
            background: i <= current ? teal : "rgba(255,255,255,0.15)",
            transition: "all 0.25s ease",
          }}
        />
      ))}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 20,
      background: "rgba(0,255,224,0.12)",
      border: "1px solid rgba(0,255,224,0.25)",
      color: teal,
      fontWeight: 800,
      fontSize: 12,
    }}>
      {children}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "#0f172a",
      border: `1px solid ${border}`,
      borderRadius: 14,
      padding: "14px 16px",
      marginBottom: 14,
    }}>
      <div style={{ fontWeight: 800, color: "#f1f5f9", marginBottom: 10, fontSize: 14 }}>{title}</div>
      {children}
    </div>
  );
}

function InfoRow({ icon, text }: { icon: string; text: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <span style={{ fontSize: 13, color: muted, lineHeight: 1.6 }}>{text}</span>
    </div>
  );
}

function Step1() {
  return (
    <div>
      <div style={{ fontSize: 26, fontWeight: 950, marginBottom: 4 }}>Welcome to Asymmetric AI</div>
      <div style={{ color: muted, fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
        An automated crypto trading engine that protects your capital while finding high-quality trades.
        Read this guide once — it answers 90% of questions new users have.
      </div>

      <div style={{
        background: "rgba(0,255,224,0.07)",
        border: "1px solid rgba(0,255,224,0.22)",
        borderRadius: 12,
        padding: "13px 16px",
        marginBottom: 16,
      }}>
        <div style={{ fontWeight: 800, color: teal, marginBottom: 6, fontSize: 13 }}>Minimum recommended capital</div>
        <div style={{ fontSize: 13, color: "#a7f3d0", lineHeight: 1.6 }}>
          <b>$50 USDT minimum</b> — works, but fees will take a larger share of each trade.<br />
          <b>$100–$500</b> is the ideal starting range for meaningful results.
        </div>
      </div>

      <Section title="How it works">
        <InfoRow icon="🔍" text={<><b style={{ color: "#f1f5f9" }}>4-Layer signal system</b> — the engine checks Trend strength (ADX), Direction (4h EMAs), Entry timing (pullback zone + candle pattern), and Momentum (volume) every interval. All 4 must align before a trade fires.</>} />
        <InfoRow icon="⏳" text={<><b style={{ color: "#f1f5f9" }}>Why it trades less than you expect</b> — this is by design. Quality over quantity. Waiting for all 4 layers protects you from bad entries that would otherwise cause losses.</>} />
        <InfoRow icon="🔐" text={<><b style={{ color: "#f1f5f9" }}>Non-custodial</b> — the AI only gets trade permission on your API key. It can never withdraw your funds. You can disconnect or withdraw from your exchange at any time.</>} />
      </Section>
    </div>
  );
}

function Step2() {
  const steps = [
    ["Log in to Bybit", "Go to bybit.com and sign in to your account."],
    ["Open API Management", "Click your profile icon (top right) → API Management."],
    ["Create New Key", "Click 'Create New Key' → choose 'System-generated API Keys'."],
    ["Set permissions", <>Enable: <Badge>Read</Badge> <Badge>Trade</Badge> — Leave <b style={{ color: "#fca5a5" }}>Withdrawal OFF</b> (we never need it).</>],
    ["Copy your keys", "Copy API Key and Secret — the Secret is shown only once. Paste both into Asymmetric AI → Exchange tab."],
  ];

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 950, marginBottom: 4 }}>Connect Your Exchange API</div>
      <div style={{ color: muted, fontSize: 13, marginBottom: 18, lineHeight: 1.6 }}>
        We support Bybit and OKX. Follow the steps below to create a trade-only API key.
      </div>

      <Section title="Bybit — Step by step">
        {steps.map(([title, desc], i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < steps.length - 1 ? 12 : 0, alignItems: "flex-start" }}>
            <div style={{
              minWidth: 22, height: 22,
              background: "rgba(0,255,224,0.15)",
              border: "1px solid rgba(0,255,224,0.3)",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 900, fontSize: 11, color: teal, flexShrink: 0,
            }}>
              {i + 1}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: 13, marginBottom: 2 }}>{title}</div>
              <div style={{ fontSize: 12, color: muted }}>{desc}</div>
            </div>
          </div>
        ))}
      </Section>

      <div style={{
        background: "rgba(220,38,38,0.08)",
        border: "1px solid rgba(248,113,113,0.25)",
        borderRadius: 12,
        padding: "12px 16px",
        fontSize: 13,
        color: "#fecaca",
        lineHeight: 1.6,
      }}>
        <b>Security rule:</b> Never enable <b>Withdrawal</b> permission on any API key connected to Asymmetric AI.
        Your keys are AES-encrypted in our database — we never see them in plain text.
      </div>

      <div style={{ marginTop: 14, fontSize: 13, color: muted, lineHeight: 1.6 }}>
        <b style={{ color: "#f1f5f9" }}>Where to keep your USDT:</b><br />
        Bybit → <b>Unified Trading Account</b><br />
        OKX → <b>Trading Account</b><br />
        The AI reads your USDT balance from there and sizes all positions accordingly.
      </div>
    </div>
  );
}

function Step3() {
  const modes = [
    ["ULTRA_SAFE", "30%", "2×", "1/day", "First week, testing the water"],
    ["SAFE", "45%", "3×", "2/day", "Conservative, steady growth"],
    ["MINI_ASYM", "65%", "6×", "3/day", "Flagship mode — best balance"],
    ["NORMAL", "60%", "5×", "3/day", "Balanced, slightly more active"],
    ["AGGRESSIVE", "85%", "8×", "5/day", "Experienced traders only"],
  ];

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 950, marginBottom: 4 }}>Modes & Styles</div>
      <div style={{ color: muted, fontSize: 13, marginBottom: 18, lineHeight: 1.6 }}>
        <b>Mode</b> controls how big your positions are and how strict the signal filter is.
        <b> Style</b> controls which timeframe and how far SL/TP sit.
      </div>

      <Section title="Risk Modes">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${border}` }}>
                {["Mode", "Size", "Lev", "Trades", "Best for"].map(h => (
                  <td key={h} style={{ padding: "6px 6px", color: muted, fontWeight: 700 }}>{h}</td>
                ))}
              </tr>
            </thead>
            <tbody>
              {modes.map(([name, size, lev, trades, desc], i) => (
                <tr key={i} style={{ borderBottom: i < modes.length - 1 ? `1px solid rgba(255,255,255,0.04)` : "none" }}>
                  <td style={{ padding: "7px 6px", fontWeight: 800, color: name === "MINI_ASYM" ? teal : "#f1f5f9" }}>{name}</td>
                  <td style={{ padding: "7px 6px", color: muted }}>{size}</td>
                  <td style={{ padding: "7px 6px", color: muted }}>{lev}</td>
                  <td style={{ padding: "7px 6px", color: muted }}>{trades}</td>
                  <td style={{ padding: "7px 6px", color: muted }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Trade Styles">
        {[
          ["SCALP", "15m candles · checks every 15 min · tighter SL/TP", "Most active, fast trades"],
          ["DAY_TRADE", "1h candles · checks every hour · balanced SL/TP", "Recommended — best balance of activity and signal quality"],
          ["SWING", "4h candles · checks every 4 hours · wider SL/TP", "Fewest trades, holds positions longer"],
        ].map(([name, detail, note], i) => (
          <div key={i} style={{ marginBottom: i < 2 ? 12 : 0 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
              <Badge>{name}</Badge>
              {name === "DAY_TRADE" && <span style={{ fontSize: 11, color: "#00ff9d", fontWeight: 700 }}>Recommended</span>}
            </div>
            <div style={{ fontSize: 12, color: muted, marginLeft: 2 }}>{detail}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginLeft: 2 }}>{note}</div>
          </div>
        ))}
      </Section>

      <div style={{ fontSize: 12, color: muted, lineHeight: 1.6 }}>
        <b style={{ color: "#f1f5f9" }}>Recommended start:</b> MINI_ASYM + DAY_TRADE + BTCUSDT or ETHUSDT.
        These combinations have the most reliable signal history.
      </div>
    </div>
  );
}

function Step4() {
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 950, marginBottom: 4 }}>How It Protects Your Money</div>
      <div style={{ color: muted, fontSize: 13, marginBottom: 18, lineHeight: 1.6 }}>
        Capital protection is built into every layer. You don't need to manage risk manually.
      </div>

      <Section title="Hard Floor — the ultimate safety net">
        <InfoRow icon="🛑" text={<>If your account drops <b style={{ color: "#f1f5f9" }}>15% from its highest point</b>, the engine stops completely and emails you. Example: peak $1,000 → floor $850 → AI stops if equity hits $850.</>} />
        <InfoRow icon="📈" text={<>Once your equity <b style={{ color: "#f1f5f9" }}>doubles</b> your starting amount, the floor tightens to 10% from peak — locking in your compounded profits.</>} />
      </Section>

      <Section title="Drawdown Tiers — automatic size reduction">
        {[
          ["−4% from peak", "Position size shrinks to 65%"],
          ["−7% from peak", "Position size shrinks to 40%"],
          ["−10% from peak", "Position size shrinks to 25% (recovery mode)"],
          ["−15% from peak", "Engine fully stops"],
        ].map(([trigger, action], i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: i < 3 ? 8 : 0, gap: 10 }}>
            <span style={{ color: "#fca5a5", fontWeight: 700 }}>{trigger}</span>
            <span style={{ color: muted }}>{action}</span>
          </div>
        ))}
      </Section>

      <Section title="Per-trade risk cap">
        <div style={{ fontSize: 13, color: muted, lineHeight: 1.65 }}>
          Maximum loss per trade is capped at <b style={{ color: "#f1f5f9" }}>1.5–3% of your equity</b> depending on style (SCALP: 1.5%, DAY_TRADE: 2%, SWING: 3%). Even in the worst case, one bad trade cannot take more than 3% of your money.
        </div>
      </Section>

      <div style={{
        background: "rgba(0,255,224,0.06)",
        border: "1px solid rgba(0,255,224,0.18)",
        borderRadius: 12,
        padding: "12px 16px",
        fontSize: 13,
        color: "#a7f3d0",
        lineHeight: 1.6,
      }}>
        <b>You can withdraw anytime.</b> The AI only trades — it cannot move funds off your exchange. Disconnect the API key at any time to stop everything instantly.
      </div>
    </div>
  );
}

function Step5({ checked, setChecked }: { checked: boolean; setChecked: (v: boolean) => void }) {
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 950, marginBottom: 4 }}>You're Ready to Start</div>
      <div style={{ color: muted, fontSize: 13, marginBottom: 18, lineHeight: 1.6 }}>
        Here's your quick-start checklist before hitting Start AI.
      </div>

      {[
        ["Exchange", "Bybit or OKX API key connected (Exchange tab)"],
        ["Funds", "USDT in your Unified/Trading account ($50+ recommended)"],
        ["Coin", "Choose BTCUSDT or ETHUSDT to start"],
        ["Mode", "SAFE or MINI_ASYM recommended for first session"],
        ["Style", "DAY_TRADE recommended (1h, balanced)"],
        ["Duration", "Set 1–30 days — the engine stops automatically at the end"],
      ].map(([label, text], i) => (
        <div key={i} style={{
          display: "flex", gap: 12, alignItems: "flex-start",
          padding: "10px 0",
          borderBottom: i < 5 ? `1px solid rgba(255,255,255,0.05)` : "none",
        }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>✓</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: teal, marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 13, color: muted }}>{text}</div>
          </div>
        </div>
      ))}

      <label style={{
        display: "flex", gap: 12, alignItems: "flex-start",
        marginTop: 20,
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${border}`,
        padding: "12px 14px",
        borderRadius: 14,
        cursor: "pointer",
      }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          style={{ width: 18, height: 18, flexShrink: 0, marginTop: 2 }}
        />
        <span style={{ fontWeight: 700, fontSize: 13, color: "#e2e8f0", lineHeight: 1.55 }}>
          I have read and understood the guide above. I know that trading involves risk and the AI cannot
          guarantee profits. I am only using funds I can afford to lose.
        </span>
      </label>
    </div>
  );
}

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const isLast = step === STEPS - 1;

  async function handleFinish() {
    if (!agreed) return;
    setLoading(true);
    try {
      await api.apiRequest("/onboarding/complete", { method: "POST" });
    } catch {
      // non-critical — proceed anyway
    }
    setLoading(false);
    onComplete();
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      background: `radial-gradient(1200px 600px at 20% 10%, rgba(0,255,224,0.12), transparent 55%), ${dark}`,
      color: "white",
      padding: 20,
    }}>
      <div style={{
        width: 680,
        maxWidth: "100%",
        borderRadius: 22,
        padding: "26px 28px",
        background: card,
        border: `1px solid ${border}`,
        boxShadow: "0 0 50px rgba(0,0,0,0.7)",
      }}>
        {/* Header */}
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: teal, marginBottom: 14, textTransform: "uppercase" }}>
          Step {step + 1} of {STEPS}
        </div>
        <ProgressDots current={step} />

        {/* Step content */}
        <div style={{ minHeight: 340 }}>
          {step === 0 && <Step1 />}
          {step === 1 && <Step2 />}
          {step === 2 && <Step3 />}
          {step === 3 && <Step4 />}
          {step === 4 && <Step5 checked={agreed} setChecked={setAgreed} />}
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              style={{
                padding: "12px 20px",
                borderRadius: 14,
                border: `1px solid ${border}`,
                background: "rgba(255,255,255,0.05)",
                color: "white",
                fontWeight: 800,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              ← Back
            </button>
          )}
          {!isLast ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              style={{
                flex: 1,
                padding: "12px 20px",
                borderRadius: 14,
                border: "none",
                background: `linear-gradient(90deg, #00ff9d, ${teal})`,
                color: dark,
                fontWeight: 950,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={!agreed || loading}
              style={{
                flex: 1,
                padding: "12px 20px",
                borderRadius: 14,
                border: "none",
                background: `linear-gradient(90deg, #00ff9d, ${teal})`,
                color: dark,
                fontWeight: 950,
                cursor: !agreed ? "not-allowed" : "pointer",
                fontSize: 14,
                opacity: !agreed ? 0.5 : 1,
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
