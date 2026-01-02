import React from "react";
import { useNavigate } from "react-router-dom";

export default function RiskDisclosure() {
  const nav = useNavigate();

  return (
    <div style={{ padding: 22, color: "white" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <h1 style={{ margin: 0 }}>Risk Disclosure (Demo)</h1>
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
            Trading and investing involve substantial risk. You can lose money. Past performance does not guarantee future results.
          </p>

          <p>
            This demo uses simulated outcomes and public market pricing. It does not represent actual execution, slippage, fees,
            or real liquidity constraints.
          </p>

          <p>
            You remain responsible for any actions you take based on information presented by this software.
          </p>

          <p style={{ opacity: 0.7 }}>
            (For the real version, we’ll add full risk disclosures for crypto derivatives, leverage, margin liquidation, regional restrictions, etc.)
          </p>
        </div>
      </div>
    </div>
  );
}
