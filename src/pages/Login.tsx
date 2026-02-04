import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../lib/api";

export default function Login({
  onLoggedIn,
}: {
  onLoggedIn: () => Promise<void>;
}) {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const doLogin = async () => {
    if (loading) return;
    setErr(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErr("Please enter email and password.");
      return;
    }

    setLoading(true);
    try {
      await api.login(cleanEmail, password);
      nav("/accept");
      onLoggedIn().catch(() => {});
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      setLoading(false);
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
          width: 460,
          maxWidth: "100%",
          borderRadius: 22,
          padding: 22,
          background: "rgba(9, 15, 30, 0.96)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 0 40px rgba(0,0,0,0.65)",
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 950 }}>Asymmetric AI</div>
        <div style={{ opacity: 0.7, marginTop: 6 }}>Login</div>

        {err && (
          <div
            style={{
              marginTop: 14,
              background: "rgba(220,38,38,0.12)",
              border: "1px solid rgba(248,113,113,0.55)",
              color: "#fecaca",
              padding: 10,
              borderRadius: 14,
            }}
          >
            {err}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, opacity: 0.75 }}>Email</div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            style={{
              width: "100%",
              marginTop: 6,
              padding: 12,
              borderRadius: 14,
              border: "1px solid rgba(148,163,184,0.5)",
              background: "rgba(15,23,42,0.85)",
              color: "white",
            }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.75 }}>Password</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            style={{
              width: "100%",
              marginTop: 6,
              padding: 12,
              borderRadius: 14,
              border: "1px solid rgba(148,163,184,0.5)",
              background: "rgba(15,23,42,0.85)",
              color: "white",
            }}
          />
        </div>

        <button
          onClick={doLogin}
          disabled={loading}
          style={{
            marginTop: 16,
            width: "100%",
            borderRadius: 14,
            border: "none",
            padding: "12px 14px",
            fontWeight: 950,
            background: "linear-gradient(90deg,#00ff9d,#00ffe0)",
            color: "#021018",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Logging in…" : "Login"}
        </button>

        <div style={{ marginTop: 10, fontSize: 13 }}>
          New user?{" "}
          <span
            onClick={() => nav("/signup")}
            style={{ color: "#00ffe0", fontWeight: 900, cursor: "pointer" }}
          >
            Create account
          </span>
        </div>
      </div>
    </div>
  );
}
