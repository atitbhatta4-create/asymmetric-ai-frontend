import React from "react";
import { useNavigate } from "react-router-dom";

const GN = "#00ffd1";
const RD = "#ff5078";
const YL = "#fbbf24";
const ff = "ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial";

function Section({ title, children, color = GN }: { title: string; children: React.ReactNode; color?: string }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 16, fontWeight: 900, color, marginBottom: 12, letterSpacing: ".02em" }}>{title}</h2>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,.72)", lineHeight: 1.85 }}>{children}</div>
    </div>
  );
}

export default function RiskDisclosure() {
  const nav = useNavigate();
  return (
    <div style={{ minHeight: "100vh", background: "#050814", color: "white", fontFamily: ff, padding: "60px 24px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        {/* header */}
        <div style={{ marginBottom: 48 }}>
          <button onClick={() => nav(-1)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "rgba(255,255,255,.5)", fontSize: 13, cursor: "pointer", marginBottom: 32, padding: 0 }}>
            ← Back
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${GN},#00b8ff)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#050814" }}>A</div>
            <span style={{ fontSize: 14, fontWeight: 900, color: "rgba(255,255,255,.6)" }}>Asymmetric AI</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 950, margin: "0 0 10px", color: "white" }}>Risk Disclosure</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)", margin: 0 }}>Last updated: April 2026 · Please read carefully before using the Platform</p>
        </div>

        {/* warning banner */}
        <div style={{ background: `${RD}10`, border: `1px solid ${RD}33`, borderRadius: 14, padding: "18px 22px", marginBottom: 40 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: RD, marginBottom: 8 }}>⚠ Important Warning</div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,.75)", lineHeight: 1.8, margin: 0 }}>
            Trading cryptocurrency involves <strong style={{ color: "white" }}>substantial risk of loss</strong>. You may lose some or all of your capital. Do not trade with money you cannot afford to lose. Past performance shown on this platform is <strong style={{ color: "white" }}>not indicative of future results</strong>.
          </p>
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,.08)", marginBottom: 40 }} />

        <Section title="1. General Trading Risk" color={RD}>
          <p style={{ marginBottom: 10 }}>Cryptocurrency markets are highly volatile. Prices can move significantly within seconds, and no trading system — automated or manual — can guarantee profits. You can lose your entire investment.</p>
          <p>Asymmetric AI is an automated signal engine. It operates based on technical analysis and predefined rules. It cannot predict black swan events, exchange outages, regulatory actions, or sudden market manipulation.</p>
        </Section>

        <Section title="2. Leverage Risk" color={RD}>
          <p style={{ marginBottom: 10 }}>Some trading modes on this platform use leverage (2× to 8× depending on mode). Leverage amplifies both gains <em>and</em> losses. A 10% adverse price move with 8× leverage results in an 80% loss of your position.</p>
          <p>Always understand the leverage level of your chosen mode before running the engine. We recommend starting with ULTRA_SAFE (2×) or SAFE (3×) modes if you are new to leveraged trading.</p>
        </Section>

        <Section title="3. Liquidation Risk" color={YL}>
          The engine includes automatic stop-loss protection, but under extreme market conditions (flash crashes, gaps, extreme volatility), stop-losses may be executed at prices worse than expected (slippage). In severe cases, your position could be liquidated by your exchange before the engine's stop-loss is triggered.
        </Section>

        <Section title="4. Drawdown Limits" color={YL}>
          <p style={{ marginBottom: 10 }}>The engine implements a 4-tier drawdown protection system:</p>
          <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            <li><strong style={{ color: YL }}>-4%</strong> — Position size reduced to 65%</li>
            <li><strong style={{ color: "rgba(255,140,60,.95)" }}>-7%</strong> — Position size reduced to 40%</li>
            <li><strong style={{ color: RD }}>-10%</strong> — Position size reduced to 25%</li>
            <li><strong style={{ color: RD }}>-15%</strong> — Engine stops completely. No further trades until manually restarted.</li>
          </ul>
          <p style={{ marginTop: 10 }}>These limits protect capital but do not eliminate the possibility of loss.</p>
        </Section>

        <Section title="5. Exchange & Counterparty Risk" color={YL}>
          Your funds are held on your exchange account (Binance, Bybit, or OKX). Asymmetric AI has no control over exchange operations. Exchange hacks, insolvency, regulatory shutdowns, or technical failures at the exchange level are outside our control and may result in loss of funds.
        </Section>

        <Section title="6. API & Technical Risk" color={GN}>
          <p style={{ marginBottom: 10 }}>The engine communicates with exchanges via API. Risks include:</p>
          <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            <li>API rate limiting causing missed signals</li>
            <li>Internet connectivity issues</li>
            <li>Exchange API downtime</li>
            <li>Software bugs or unexpected behavior</li>
          </ul>
          <p style={{ marginTop: 10 }}>We monitor the engine continuously but cannot guarantee zero downtime or zero technical errors.</p>
        </Section>

        <Section title="7. Demo Mode" color={GN}>
          Asymmetric AI is currently in <strong style={{ color: GN }}>demo mode only</strong>. No real orders are placed. All figures shown (P&L, equity, win rate) are simulated using real market data. When real-money trading is activated, users will be explicitly notified and must accept updated terms.
        </Section>

        <Section title="8. No Financial Advice" color={GN}>
          Nothing on this platform constitutes financial, investment, legal, or tax advice. The platform is a software tool that automates technical analysis. All trading decisions and their consequences are your sole responsibility. Consult a qualified financial advisor before trading with real funds.
        </Section>

        <Section title="9. Regulatory Risk" color={GN}>
          Cryptocurrency regulations vary by jurisdiction and change frequently. It is your responsibility to ensure that using this platform complies with all applicable laws in your country of residence. Asymmetric AI does not guarantee availability or legal compliance in all jurisdictions.
        </Section>

        <Section title="10. Contact" color={GN}>
          For questions about this Risk Disclosure, contact us at:{" "}
          <a href="mailto:support.asymetricai@gmail.com" style={{ color: GN }}>support.asymetricai@gmail.com</a>
        </Section>

        <div style={{ height: 1, background: "rgba(255,255,255,.08)", marginBottom: 24 }} />
        <p style={{ fontSize: 12, color: "rgba(255,255,255,.25)", lineHeight: 1.7 }}>
          © 2026 Asymmetric AI · asymetricai.com · Demo mode only · No real funds at risk
        </p>
      </div>
    </div>
  );
}
