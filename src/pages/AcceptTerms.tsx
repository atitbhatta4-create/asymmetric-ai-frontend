import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

type Props = {
  onAccept: () => void;
};

type SessionOut = { ok: boolean; email: string | null };

export default function AcceptTerms({ onAccept }: Props) {
  const nav = useNavigate();
  const [checked, setChecked] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const s = (await api("/session", { method: "GET" })) as SessionOut;
        setSessionEmail(s?.ok ? s.email : null);
      } catch {
        setSessionEmail(null);
      }
    })();
  }, []);

  const handleAccept = () => {
    if (!checked) return;
    onAccept();
  };

  const doLogout = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      nav("/login");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(1200px 600px at 20% 10%, rgba(0,255,224,0.14), transparent 55%), #050814",
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
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 34, fontWeight: 950, letterSpacing: 0.2, marginBottom: 4 }}>
              Before you continue
            </div>
            <div style={{ opacity: 0.75, fontSize: 13 }}>
              Logged in: <b>{sessionEmail ?? "unknown"}</b>
            </div>
          </div>

          <button
            type="button"
            onClick={doLogout}
            style={{
              padding: "10px 14px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
              fontWeight: 900,
              cursor: "pointer",
              height: 42,
            }}
            title="Logout and switch account"
          >
            Logout
          </button>
        </div>

        <div style={{ marginTop: 12, opacity: 0.85, lineHeight: 1.7, fontSize: 15 }}>
          <div>• This is a demo sandbox. No real trading happens yet.</div>
          <div>• Demo uses simulated outcomes and public market data.</div>
          <div>• No guarantees. Trading is risky and can lead to losses.</div>
          <div>• You are responsible for all decisions and outcomes.</div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => nav("/terms")}
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
            Read Terms
          </button>

          <button
            type="button"
            onClick={() => nav("/risk")}
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
            Read Risk Disclosure
          </button>
        </div>

        {/* must be manually checked by user */}
        <div style={{ marginTop: 16 }}>
          <label style={{ display: "flex", gap: 10, alignItems: "center", opacity: 0.95 }}>
            <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
            <span style={{ fontWeight: 800 }}>
              I have read and agree to the Terms and Risk Disclosure, and I understand this is a demo sandbox.
            </span>
          </label>
        </div>

        <button
          type="button"
          onClick={handleAccept}
          disabled={!checked}
          style={{
            marginTop: 14,
            width: "100%",
            borderRadius: 14,
            border: "none",
            padding: "14px 14px",
            cursor: !checked ? "not-allowed" : "pointer",
            fontWeight: 950,
            background: "linear-gradient(90deg,#00ff9d,#00ffe0)",
            color: "#021018",
            opacity: !checked ? 0.6 : 1,
          }}
        >
          Accept & Continue
        </button>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.65 }}>
          Version: v1 · Last updated: 2025-12-16
        </div>
      </div>
    </div>
  );
}
