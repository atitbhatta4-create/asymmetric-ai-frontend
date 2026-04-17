import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../lib/api";

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 6,
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(148,163,184,0.5)",
  background: "rgba(15,23,42,0.85)",
  color: "white",
  fontSize: 14,
  boxSizing: "border-box",
};

export default function ForgotPassword() {
  const nav = useNavigate();
  const [step, setStep]           = useState<"email" | "code">("email");
  const [email, setEmail]         = useState("");
  const [code, setCode]           = useState("");
  const [newPass, setNewPass]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading]     = useState(false);
  const [err, setErr]             = useState("");
  const [success, setSuccess]     = useState(false);

  const sendCode = async () => {
    setErr("");
    const e = email.trim().toLowerCase();
    if (!e) { setErr("Enter your email."); return; }
    setLoading(true);
    try {
      await api.forgotPassword(e);
      setStep("code");
    } catch (ex: any) {
      setErr(ex?.message || "Failed to send code.");
    } finally {
      setLoading(false);
    }
  };

  const resetPass = async () => {
    setErr("");
    if (!code.trim()) { setErr("Enter the 6-digit code."); return; }
    if (newPass.length < 6) { setErr("Password must be at least 6 characters."); return; }
    if (newPass !== confirmPass) { setErr("Passwords do not match."); return; }
    setLoading(true);
    try {
      await api.resetPassword(email.trim().toLowerCase(), code.trim(), newPass);
      setSuccess(true);
    } catch (ex: any) {
      setErr(ex?.message || "Reset failed.");
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
      padding: 20,
    }}>
      <div style={{
        width: 460, maxWidth: "100%",
        borderRadius: 22, padding: 28,
        background: "rgba(9,15,30,0.96)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 0 40px rgba(0,0,0,0.65)",
      }}>
        <div style={{ fontSize: 28, fontWeight: 950 }}>Asymmetric AI</div>
        <div style={{ opacity: 0.6, marginTop: 4, marginBottom: 24 }}>
          {step === "email" ? "Reset your password" : "Enter the code sent to your email"}
        </div>

        {success ? (
          <>
            <div style={{
              padding: "14px 18px", borderRadius: 14,
              background: "rgba(0,255,157,0.10)",
              border: "1px solid rgba(0,255,157,0.3)",
              color: "#00ff9d", fontWeight: 900, marginBottom: 20,
            }}>
              Password reset successfully.
            </div>
            <button
              onClick={() => nav("/login")}
              style={{
                width: "100%", padding: "13px 14px", borderRadius: 14, border: "none",
                background: "linear-gradient(90deg,#00ff9d,#00ffe0)",
                color: "#021018", fontWeight: 950, fontSize: 15, cursor: "pointer",
              }}
            >
              Back to Login
            </button>
          </>
        ) : step === "email" ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 700 }}>Email address</div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendCode()}
                placeholder="you@example.com"
                autoComplete="email"
                style={inputStyle}
              />
            </div>

            {err && (
              <div style={{
                marginBottom: 14, padding: "10px 14px", borderRadius: 12,
                background: "rgba(220,38,38,0.12)", border: "1px solid rgba(248,113,113,0.4)",
                color: "#fecaca", fontSize: 13,
              }}>{err}</div>
            )}

            <button
              onClick={sendCode}
              disabled={loading}
              style={{
                width: "100%", padding: "13px 14px", borderRadius: 14, border: "none",
                background: loading ? "rgba(0,255,224,0.35)" : "linear-gradient(90deg,#00ff9d,#00ffe0)",
                color: "#021018", fontWeight: 950, fontSize: 15,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Sending…" : "Send reset code"}
            </button>

            <div style={{ marginTop: 14, fontSize: 13, textAlign: "center", opacity: 0.7 }}>
              <span
                onClick={() => nav("/login")}
                style={{ color: "#00ffe0", fontWeight: 900, cursor: "pointer" }}
              >
                Back to login
              </span>
            </div>
          </>
        ) : (
          <>
            <div style={{
              padding: "10px 14px", marginBottom: 18, borderRadius: 12,
              background: "rgba(0,255,224,0.07)", border: "1px solid rgba(0,255,224,0.15)",
              fontSize: 13, color: "#94a3b8",
            }}>
              A 6-digit code was sent to <b style={{ color: "#e5e7eb" }}>{email}</b>. Check your inbox (and spam).
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 700 }}>6-digit code</div>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                style={{ ...inputStyle, letterSpacing: 8, fontSize: 22, fontWeight: 900, textAlign: "center" }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 700 }}>New password</div>
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Min 6 characters"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 700 }}>Confirm new password</div>
              <input
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && resetPass()}
                placeholder="Repeat password"
                style={inputStyle}
              />
            </div>

            {err && (
              <div style={{
                marginBottom: 14, padding: "10px 14px", borderRadius: 12,
                background: "rgba(220,38,38,0.12)", border: "1px solid rgba(248,113,113,0.4)",
                color: "#fecaca", fontSize: 13,
              }}>{err}</div>
            )}

            <button
              onClick={resetPass}
              disabled={loading}
              style={{
                width: "100%", padding: "13px 14px", borderRadius: 14, border: "none",
                background: loading ? "rgba(0,255,224,0.35)" : "linear-gradient(90deg,#00ff9d,#00ffe0)",
                color: "#021018", fontWeight: 950, fontSize: 15,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Resetting…" : "Reset password"}
            </button>

            <div style={{ marginTop: 14, fontSize: 13, textAlign: "center" }}>
              <span
                onClick={() => { setStep("email"); setErr(""); setCode(""); }}
                style={{ color: "#00ffe0", fontWeight: 900, cursor: "pointer", opacity: 0.8 }}
              >
                Resend code
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
