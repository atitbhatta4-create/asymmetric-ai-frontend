import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../lib/api";
import useIsMobile from "../hooks/useIsMobile";

export default function Login({ onLoggedIn }: { onLoggedIn: () => Promise<void> }) {
  const nav = useNavigate();
  const isMobile = useIsMobile();

  const [step, setStep]       = useState<"login" | "2fa">("login");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState<string | null>(null);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    marginTop: isMobile ? 4 : 6,
    padding: isMobile ? "9px 11px" : "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,0.5)",
    background: "rgba(15,23,42,0.85)",
    color: "white",
    fontSize: 16,
    boxSizing: "border-box",
  };

  const doLogin = async () => {
    if (loading) return;
    setErr(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) { setErr("Please enter email and password."); return; }

    setLoading(true);
    try {
      const res: any = await api.login(cleanEmail, password);
      if (res?.requires_2fa) {
        setStep("2fa");
      } else {
        await onLoggedIn().catch(() => {});
        nav("/accept");
      }
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const do2fa = async () => {
    if (loading) return;
    setErr(null);
    const c = totpCode.replace(/\s/g, "");
    if (c.length !== 6) { setErr("Enter the 6-digit code from your authenticator app."); return; }

    setLoading(true);
    try {
      await api.verify2fa(c);
      await onLoggedIn().catch(() => {});
      nav("/accept");
    } catch (e: any) {
      setErr(e?.message || "Invalid 2FA code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      background: "radial-gradient(1200px 600px at 20% 10%, rgba(0,255,224,0.14), transparent 55%), #050814",
      color: "white",
      padding: isMobile ? 12 : 20,
    }}>
      <div style={{
        width: 460, maxWidth: "100%",
        borderRadius: 18,
        padding: isMobile ? "14px 16px" : "clamp(18px, 5vw, 28px)",
        background: "rgba(9,15,30,0.96)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 0 40px rgba(0,0,0,0.65)",
      }}>
        <div style={{ fontSize: isMobile ? 20 : "clamp(22px, 6vw, 34px)", fontWeight: 950 }}>Asymmetric AI</div>
        <div style={{ opacity: 0.7, marginTop: 4, marginBottom: isMobile ? 14 : 20, fontSize: isMobile ? 12 : 14 }}>
          {step === "login" ? "Login" : "Two-Factor Authentication"}
        </div>

        {err && (
          <div style={{
            marginBottom: isMobile ? 12 : 16,
            background: "rgba(220,38,38,0.12)",
            border: "1px solid rgba(248,113,113,0.55)",
            color: "#fecaca",
            padding: isMobile ? "8px 11px" : "10px 14px",
            borderRadius: 14,
            fontSize: isMobile ? 12 : 13,
          }}>
            {err}
          </div>
        )}

        {step === "login" ? (
          <>
            <div style={{ marginBottom: isMobile ? 10 : 14 }}>
              <div style={{ fontSize: isMobile ? 11 : 12, opacity: 0.75 }}>Email</div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: isMobile ? 4 : 6 }}>
              <div style={{ fontSize: isMobile ? 11 : 12, opacity: 0.75 }}>Password</div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doLogin()}
                autoComplete="current-password"
                style={inputStyle}
              />
            </div>

            <div style={{ textAlign: "right", marginBottom: isMobile ? 14 : 18 }}>
              <span
                onClick={() => nav("/forgot-password")}
                style={{ fontSize: isMobile ? 11 : 12, color: "#00ffe0", cursor: "pointer", opacity: 0.8 }}
              >
                Forgot password?
              </span>
            </div>

            <button
              onClick={doLogin}
              disabled={loading}
              style={{
                width: "100%",
                padding: isMobile ? "10px 11px" : "13px 14px",
                borderRadius: 14, border: "none",
                background: loading ? "rgba(0,255,224,0.35)" : "linear-gradient(90deg,#00ff9d,#00ffe0)",
                color: "#021018", fontWeight: 950,
                fontSize: isMobile ? 13 : 15,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Logging in…" : "Login"}
            </button>

            <div style={{ marginTop: isMobile ? 10 : 14, fontSize: isMobile ? 12 : 13 }}>
              New user?{" "}
              <span
                onClick={() => nav("/signup")}
                style={{ color: "#00ffe0", fontWeight: 900, cursor: "pointer" }}
              >
                Create account
              </span>
            </div>
          </>
        ) : (
          <>
            <div style={{
              padding: isMobile ? "9px 11px" : "12px 16px",
              marginBottom: isMobile ? 14 : 20,
              borderRadius: 12,
              background: "rgba(0,255,224,0.07)", border: "1px solid rgba(0,255,224,0.15)",
              fontSize: isMobile ? 12 : 13, color: "#94a3b8",
            }}>
              Open <b style={{ color: "#e5e7eb" }}>Google Authenticator</b> or <b style={{ color: "#e5e7eb" }}>Authy</b> and enter the 6-digit code for Asymmetric AI.
            </div>

            <div style={{ marginBottom: isMobile ? 14 : 20 }}>
              <div style={{ fontSize: isMobile ? 12 : 13, opacity: 0.75, fontWeight: 700, marginBottom: 6 }}>Authenticator code</div>
              <input
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && do2fa()}
                placeholder="000000"
                maxLength={6}
                autoFocus
                style={{ ...inputStyle, letterSpacing: 10, fontSize: isMobile ? 22 : 26, fontWeight: 900, textAlign: "center" }}
              />
            </div>

            <button
              onClick={do2fa}
              disabled={loading}
              style={{
                width: "100%",
                padding: isMobile ? "10px 11px" : "13px 14px",
                borderRadius: 14, border: "none",
                background: loading ? "rgba(0,255,224,0.35)" : "linear-gradient(90deg,#00ff9d,#00ffe0)",
                color: "#021018", fontWeight: 950,
                fontSize: isMobile ? 13 : 15,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Verifying…" : "Verify"}
            </button>

            <div style={{ marginTop: isMobile ? 10 : 14, fontSize: isMobile ? 12 : 13, textAlign: "center" }}>
              <span
                onClick={() => { setStep("login"); setTotpCode(""); setErr(null); }}
                style={{ color: "#00ffe0", cursor: "pointer", opacity: 0.7 }}
              >
                Back to login
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
