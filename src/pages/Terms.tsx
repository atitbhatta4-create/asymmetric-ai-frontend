import React from "react";
import { useNavigate } from "react-router-dom";

const GN = "#00ffd1";
const ff = "ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 16, fontWeight: 900, color: GN, marginBottom: 12, letterSpacing: ".02em" }}>{title}</h2>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,.72)", lineHeight: 1.85 }}>{children}</div>
    </div>
  );
}

export default function Terms() {
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
          <h1 style={{ fontSize: 32, fontWeight: 950, margin: "0 0 10px", color: "white" }}>Terms of Service</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)", margin: 0 }}>Last updated: April 2026 · Demo mode only</p>
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,.08)", marginBottom: 40 }} />

        <Section title="1. Acceptance of Terms">
          By accessing or using Asymmetric AI ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Platform. We reserve the right to update these terms at any time. Continued use after changes constitutes acceptance.
        </Section>

        <Section title="2. Demo Mode Disclaimer">
          <p style={{ marginBottom: 10 }}>Asymmetric AI is currently operating in <strong style={{ color: GN }}>demo mode only</strong>. No real trading orders are sent to any exchange. All trade simulations, P&L figures, equity curves, and performance data shown are for educational and testing purposes only.</p>
          <p>When real-money trading is enabled, additional terms and exchange-specific disclosures will apply. Users will be explicitly notified before any real funds are at risk.</p>
        </Section>

        <Section title="3. Non-Custodial Service">
          <p style={{ marginBottom: 10 }}>Asymmetric AI is a non-custodial platform. We do not hold, control, or have access to your funds at any time. You connect your exchange account via a trade-only API key with withdrawals permanently disabled at the exchange level.</p>
          <p>You remain solely in control of your funds. We send trade instructions to your exchange on your behalf — we cannot move, transfer, or withdraw your assets under any circumstance.</p>
        </Section>

        <Section title="4. Not Financial Advice">
          The Platform, its signals, grades, modes, and outputs are automated software tools — not financial advice. Nothing on this platform constitutes investment, legal, tax, or financial advice. You are solely responsible for all trading and investment decisions.
        </Section>

        <Section title="5. Risk of Loss">
          Trading cryptocurrency carries a substantial risk of loss. You may lose some or all of your capital. Past performance displayed on the Platform is not indicative of future results. Only use capital you can afford to lose entirely.
        </Section>

        <Section title="6. API Key Security">
          <p style={{ marginBottom: 10 }}>You are responsible for the security of your exchange API keys. We encrypt all API keys using AES-128 (Fernet) encryption at rest. However, you should:</p>
          <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            <li>Never grant withdrawal permissions to any API key used with Asymmetric AI</li>
            <li>Rotate your API keys regularly</li>
            <li>Immediately revoke keys if you suspect unauthorized access</li>
          </ul>
        </Section>

        <Section title="7. Account Responsibility">
          You are responsible for maintaining the confidentiality of your account credentials. You agree not to share your account, attempt to access other users' accounts, or use the Platform for any unlawful purpose.
        </Section>

        <Section title="8. Service Availability">
          We do not guarantee uninterrupted access to the Platform. The AI engine may be stopped, paused, or unavailable due to maintenance, exchange issues, market conditions, or technical errors. We are not liable for missed trades or losses resulting from service interruptions.
        </Section>

        <Section title="9. Limitation of Liability">
          To the maximum extent permitted by applicable law, Asymmetric AI and its operators shall not be liable for any indirect, incidental, special, or consequential damages, including but not limited to trading losses, loss of profits, or loss of data arising from your use of the Platform.
        </Section>

        <Section title="10. Governing Law">
          These terms are governed by applicable laws. Any disputes shall be resolved through binding arbitration. By using the Platform, you waive your right to participate in class-action lawsuits related to the Platform.
        </Section>

        <Section title="11. Administrator Access Policy">
          Asymmetric AI administrators may access your account data including trade history, AI logs, and portfolio performance for the following purposes only:
          <ul style={{ marginTop: 8, lineHeight: 2 }}>
            <li>Providing customer support</li>
            <li>Resolving technical issues</li>
            <li>Monitoring platform performance</li>
            <li>Ensuring risk engine accuracy</li>
            <li>Regulatory compliance</li>
          </ul>
          All administrator access is logged automatically with a timestamp, retained for a minimum of 24 months, and available to you upon written request. Administrators will never share your data with third parties, use your trading patterns personally, or access your data without a valid reason.
          <br /><br />
          Your data may be used in anonymous aggregated form for platform improvement and marketing statistics. Your individual data will never appear in marketing without your explicit written permission.
        </Section>

        <Section title="12. Contact">
          For questions about these Terms, contact us at:{" "}
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
