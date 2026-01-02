import React, { useMemo, useState } from "react";

export default function BeforeContinue({ onAccepted }: { onAccepted: () => void }) {
  const [checked, setChecked] = useState(false);

  const versionText = useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `Version: v1 • Last updated: ${yyyy}-${mm}-${dd}`;
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "radial-gradient(1200px 600px at 20% 10%, rgba(0,255,224,0.14), transparent 55%), #050814",
        color: "white",
        padding: 20,
      }}
    >
      <div
        style={{
          width: 720,
          maxWidth: "100%",
          borderRadius: 22,
          padding: 22,
          background: "rgba(9, 15, 30, 0.96)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 0 40px rgba(0,0,0,0.65)",
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 950, letterSpacing: 0.2 }}>Before you continue</div>

        <div style={{ marginTop: 12, opacity: 0.85, lineHeight: 1.6 }}>
          <div>• This is a demo sandbox. No real trading happens yet.</div>
          <div>• Demo uses simulated outcomes and public market data.</div>
          <div>• No guarantees. Trading is risky and can lead to losses.</div>
          <div>• You are responsible for all decisions and outcomes.</div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => window.open("/terms", "_blank")}
            style={btnStyle}
          >
            Read Terms
          </button>
          <button
            type="button"
            onClick={() => window.open("/risk", "_blank")}
            style={btnStyle}
          >
            Read Risk Disclosure
          </button>
        </div>

        <label
          style={{
            marginTop: 16,
            display: "flex",
            gap: 10,
            alignItems: "center",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: 12,
            borderRadius: 16,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            style={{ width: 18, height: 18 }}
          />
          <span style={{ fontWeight: 800, opacity: 0.9 }}>
            I have read and agree to the Terms and Risk Disclosure, and I understand this is a demo sandbox.
          </span>
        </label>

        <button
          type="button"
          disabled={!checked}
          onClick={onAccepted}
          style={{
            marginTop: 16,
            width: "100%",
            borderRadius: 16,
            border: "none",
            padding: "14px 16px",
            cursor: checked ? "pointer" : "not-allowed",
            fontWeight: 950,
            background: "linear-gradient(90deg,#00ff9d,#00ffe0)",
            color: "#021018",
            opacity: checked ? 1 : 0.5,
            fontSize: 16,
          }}
        >
          Accept & Continue
        </button>

        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.6 }}>{versionText}</div>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 900,
};
