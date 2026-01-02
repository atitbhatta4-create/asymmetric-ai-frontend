import React from "react";
import { useNavigate } from "react-router-dom";

export default function Terms() {
  const nav = useNavigate();

  return (
    <div style={{ padding: 22, color: "white" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <h1 style={{ margin: 0 }}>Terms (Demo)</h1>
          <button
            onClick={() => nav(-1)}
            style={{
              padding: "10px 14px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Back
          </button>
        </div>

        <div style={{ marginTop: 14, opacity: 0.85, lineHeight: 1.7 }}>
          <p>
            This is a demo version of Asymmetric AI provided for educational and testing purposes only.
            No real trading orders are sent to any exchange in this demo environment.
          </p>

          <p>
            You acknowledge that any outputs, trade simulations, PnL figures, and risk mode behavior are illustrative.
            They may be inaccurate or incomplete.
          </p>

          <p>
            You agree not to rely on this demo as financial, investment, legal, or tax advice.
            You are solely responsible for your decisions.
          </p>

          <p style={{ opacity: 0.7 }}>
            (We will replace/expand this for the real trading version with full legal wording, jurisdiction, API terms, etc.)
          </p>
        </div>
      </div>
    </div>
  );
}
