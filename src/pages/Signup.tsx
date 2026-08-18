import React, { useState } from "react";
import * as api from "../lib/api";
import { useNavigate } from "react-router-dom";
import useIsMobile from "../hooks/useIsMobile";

export default function Signup() {
  const nav = useNavigate();
  const isMobile = useIsMobile();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    marginTop: isMobile ? 4 : 6,
    padding: isMobile ? "9px 11px" : "12px",
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,0.5)",
    background: "rgba(15,23,42,0.85)",
    color: "white",
    outline: "none",
    fontSize: 16,
  };

  const doSignup = async () => {
    if (loading) return;
    setErr(null);
    setOk(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) { setErr("Please enter email and password."); return; }
    if (password.length < 8) { setErr("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setErr("Passwords do not match."); return; }

    setLoading(true);
    try {
      await api.signup(email, password);
      setOk("Account created. You can login now.");
      setTimeout(() => nav("/login"), 600);
    } catch (e: any) {
      setErr(String(e?.message || "Signup failed"));
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") doSignup();
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
        width: 460,
        maxWidth: "100%",
        borderRadius: 22,
        padding: isMobile ? "14px 16px" : 22,
        background: "rgba(9, 15, 30, 0.96)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 0 40px rgba(0,0,0,0.65)",
      }}>
        <div style={{ fontSize: isMobile ? 20 : 34, fontWeight: 950, letterSpacing: 0.3 }}>
          Asymmetric AI
        </div>
        <div style={{ opacity: 0.7, marginTop: isMobile ? 4 : 6, fontSize: isMobile ? 12 : 14 }}>
          Create account
        </div>

        {err && (
          <div style={{
            marginTop: isMobile ? 10 : 14,
            background: "rgba(220,38,38,0.12)",
            border: "1px solid rgba(248,113,113,0.55)",
            color: "#fecaca",
            padding: isMobile ? "7px 10px" : 10,
            borderRadius: 14,
            whiteSpace: "pre-wrap",
            fontSize: isMobile ? 12 : 13,
          }}>
            <b>Error:</b> {err}
          </div>
        )}

        {ok && (
          <div style={{
            marginTop: isMobile ? 10 : 14,
            background: "rgba(16,185,129,0.12)",
            border: "1px solid rgba(16,185,129,0.55)",
            color: "#bbf7d0",
            padding: isMobile ? "7px 10px" : 10,
            borderRadius: 14,
            whiteSpace: "pre-wrap",
            fontSize: isMobile ? 12 : 13,
          }}>
            {ok}
          </div>
        )}

        <div style={{ marginTop: isMobile ? 12 : 16 }}>
          <div style={{ fontSize: isMobile ? 11 : 12, opacity: 0.75 }}>Email</div>
          <input value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={onKeyDown} autoComplete="email" style={inputStyle} />
        </div>

        <div style={{ marginTop: isMobile ? 9 : 12 }}>
          <div style={{ fontSize: isMobile ? 11 : 12, opacity: 0.75 }}>Password</div>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={onKeyDown} autoComplete="new-password" style={inputStyle} />
        </div>

        <div style={{ marginTop: isMobile ? 9 : 12 }}>
          <div style={{ fontSize: isMobile ? 11 : 12, opacity: 0.75 }}>Confirm password</div>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={onKeyDown} autoComplete="new-password" style={inputStyle} />
        </div>

        <button
          onClick={doSignup}
          disabled={loading}
          style={{
            marginTop: isMobile ? 12 : 16,
            width: "100%",
            borderRadius: 14,
            border: "none",
            padding: isMobile ? "10px 11px" : "12px 14px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 950,
            fontSize: isMobile ? 13 : 15,
            background: "linear-gradient(90deg,#00ff9d,#00ffe0)",
            color: "#021018",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Creating…" : "Create account"}
        </button>

        <div style={{ marginTop: isMobile ? 8 : 10, fontSize: isMobile ? 12 : 13 }}>
          Already have an account?{" "}
          <span onClick={() => nav("/login")} style={{ color: "#00ffe0", fontWeight: 900, cursor: "pointer" }}>
            Login
          </span>
        </div>
      </div>
    </div>
  );
}
