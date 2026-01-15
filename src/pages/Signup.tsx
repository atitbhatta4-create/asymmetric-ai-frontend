// frontend/src/pages/Signup.tsx
import React, { useState } from "react";
import * as api from "../lib/api";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = email.trim().toLowerCase();
    // FIX: missing || caused broken validation / build issues
    if (!e || !e.includes("@") || !e.includes(".")) return "Enter a valid email.";
    if (!password || password.length < 6) return "Password must be at least 6 characters.";
    return null;
  };

  const doSignup = async () => {
    if (loading) return;

    setErr(null);
    setOk(null);

    const v = validate();
    if (v) {
      setErr(v);
      return;
    }

    setLoading(true);

    try {
      const e = email.trim().toLowerCase();

      // 1) create account
      await api.apiRequest("/auth/signup", {
        method: "POST",
        // IMPORTANT: pass object, do NOT JSON.stringify
        body: { email: e, password },
      });

      // 2) auto-login right away (sets cookie)
      await api.apiRequest("/auth/login", {
        method: "POST",
        body: { email: e, password },
      });

      setOk("Account created. Redirecting…");

      // 3) go to accept-terms gate
      setTimeout(() => nav("/accept"), 250);
    } catch (e: any) {
      setErr(e?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") doSignup();
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
        <div style={{ fontSize: 28, fontWeight: 950 }}>Create account</div>
        <div style={{ opacity: 0.7, marginTop: 6 }}>
          Demo users can signup (SQLite) — then accept Terms before using the app.
        </div>

        {err && (
          <div
            style={{
              marginTop: 14,
              padding: 10,
              borderRadius: 14,
              background: "rgba(220,38,38,0.12)",
              border: "1px solid rgba(248,113,113,0.55)",
              color: "#fecaca",
              whiteSpace: "pre-wrap",
            }}
          >
            <b>Error:</b> {err}
          </div>
        )}

        {ok && (
          <div
            style={{
              marginTop: 14,
              padding: 10,
              borderRadius: 14,
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.35)",
              color: "#bbf7d0",
              whiteSpace: "pre-wrap",
            }}
          >
            {ok}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, opacity: 0.75 }}>Email</div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="you@example.com"
            autoComplete="email"
            style={{
              width: "100%",
              marginTop: 6,
              padding: 12,
              borderRadius: 14,
              border: "1px solid rgba(148,163,184,0.5)",
              background: "rgba(15,23,42,0.85)",
              color: "white",
              outline: "none",
            }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.75 }}>Password</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="min 6 characters"
            autoComplete="new-password"
            style={{
              width: "100%",
              marginTop: 6,
              padding: 12,
              borderRadius: 14,
              border: "1px solid rgba(148,163,184,0.5)",
              background: "rgba(15,23,42,0.85)",
              color: "white",
              outline: "none",
            }}
          />
        </div>

        <button
          onClick={doSignup}
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
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Creating…" : "Create account"}
        </button>

        <div style={{ marginTop: 14, fontSize: 12, opacity: 0.65 }}>
          By continuing you agree to{" "}
          <span
            onClick={() => nav("/terms")}
            style={{ color: "#00ffe0", fontWeight: 900, cursor: "pointer" }}
          >
            Terms
          </span>{" "}
          and{" "}
          <span
            onClick={() => nav("/risk")}
            style={{ color: "#00ffe0", fontWeight: 900, cursor: "pointer" }}
          >
            Risk Disclosure
          </span>
          .
        </div>

        <div style={{ marginTop: 12, fontSize: 13 }}>
          Already have an account?{" "}
          <span
            onClick={() => nav("/login")}
            style={{ color: "#00ffe0", fontWeight: 900, cursor: "pointer" }}
          >
            Back to login
          </span>
        </div>
      </div>
    </div>
  );
}
