import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import * as apiLib from "../lib/api";
import useIsMobile from "../hooks/useIsMobile";

const card: React.CSSProperties = {
  background: "rgba(9, 15, 30, 0.92)",
  borderRadius: 18,
  padding: 20,
  border: "1px solid rgba(255,255,255,0.08)",
  maxWidth: 480,
  marginBottom: 18,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 6,
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(148,163,184,0.35)",
  background: "rgba(15,23,42,0.85)",
  color: "white",
  fontSize: 16,
  boxSizing: "border-box",
};

// ── QR code rendered via Google Charts (no external lib) ─────────────────────
function QRImage({ uri }: { uri: string }) {
  const encoded = encodeURIComponent(uri);
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encoded}`;
  return (
    <img
      src={src}
      alt="Scan with authenticator"
      style={{ borderRadius: 12, border: "2px solid rgba(0,255,224,0.3)", marginTop: 12 }}
    />
  );
}

// ── Change password card ──────────────────────────────────────────────────────
function ChangePassword() {
  const [current, setCurrent]   = useState("");
  const [next, setNext]         = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [err, setErr]           = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setSuccess(false);
    if (next.length < 6) { setErr("New password must be at least 6 characters."); return; }
    if (next !== confirm) { setErr("New passwords do not match."); return; }
    setLoading(true);
    try {
      await api("/auth/change-password", { method: "POST", body: { current_password: current, new_password: next } });
      setSuccess(true); setCurrent(""); setNext(""); setConfirm("");
    } catch (e: any) {
      setErr(e?.message || "Failed to change password.");
    } finally { setLoading(false); }
  };

  return (
    <div style={card}>
      <div style={{ fontWeight: 950, marginBottom: 4 }}>Change Password</div>
      <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 16 }}>Requires your current password</div>
      <form onSubmit={submit}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 700 }}>Current password</div>
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)}
            placeholder="Enter current password" style={inputStyle} required autoComplete="current-password" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 700 }}>New password</div>
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)}
            placeholder="Min 6 characters" style={inputStyle} required autoComplete="new-password" />
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 700 }}>Confirm new password</div>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat new password" style={inputStyle} required autoComplete="new-password" />
        </div>
        {err && <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 12, background: "rgba(220,38,38,0.12)", border: "1px solid rgba(248,113,113,0.4)", color: "#fecaca", fontSize: 13 }}>{err}</div>}
        {success && <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 12, background: "rgba(0,255,157,0.10)", border: "1px solid rgba(0,255,157,0.30)", color: "#00ff9d", fontSize: 13, fontWeight: 900 }}>Password changed successfully.</div>}
        <button type="submit" disabled={loading} style={{ width: "100%", padding: "13px 14px", borderRadius: 14, border: "none", background: loading ? "rgba(0,255,224,0.35)" : "linear-gradient(90deg,#00ff9d,#00ffe0)", color: "#021018", fontWeight: 950, fontSize: 15, cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Saving…" : "Save new password"}
        </button>
      </form>
    </div>
  );
}

// ── Reset password via email OTP (for when you forgot current password) ───────
function ResetViaEmail() {
  const [step, setStep]           = useState<"idle" | "sent" | "done">("idle");
  const [email, setEmail]         = useState("");
  const [code, setCode]           = useState("");
  const [newPass, setNewPass]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading]     = useState(false);
  const [err, setErr]             = useState("");

  const sendCode = async () => {
    setErr("");
    const e = email.trim().toLowerCase();
    if (!e) { setErr("Enter your email address."); return; }
    setLoading(true);
    try {
      await apiLib.forgotPassword(e);
      setStep("sent");
    } catch (ex: any) { setErr(ex?.message || "Failed to send."); }
    finally { setLoading(false); }
  };

  const doReset = async () => {
    setErr("");
    if (code.trim().length !== 6) { setErr("Enter the 6-digit code."); return; }
    if (newPass.length < 6) { setErr("Password must be at least 6 characters."); return; }
    if (newPass !== confirmPass) { setErr("Passwords do not match."); return; }
    setLoading(true);
    try {
      await apiLib.resetPassword(email.trim().toLowerCase(), code.trim(), newPass);
      setStep("done");
    } catch (ex: any) { setErr(ex?.message || "Reset failed."); }
    finally { setLoading(false); }
  };

  if (step === "done") return (
    <div style={card}>
      <div style={{ fontWeight: 950, marginBottom: 12 }}>Reset via Email</div>
      <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(0,255,157,0.10)", border: "1px solid rgba(0,255,157,0.30)", color: "#00ff9d", fontWeight: 900, fontSize: 13 }}>
        Password reset successfully. Your new password is active.
      </div>
    </div>
  );

  return (
    <div style={card}>
      <div style={{ fontWeight: 950, marginBottom: 4 }}>Reset via Email Code</div>
      <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 16 }}>Forgot your current password? We'll send a code to your email</div>

      {err && <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 12, background: "rgba(220,38,38,0.12)", border: "1px solid rgba(248,113,113,0.4)", color: "#fecaca", fontSize: 13 }}>{err}</div>}

      {step === "idle" && (
        <>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 700 }}>Your email address</div>
            <input value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendCode()}
              placeholder="you@example.com" style={inputStyle} />
          </div>
          <button onClick={sendCode} disabled={loading} style={{ width: "100%", padding: "12px 14px", borderRadius: 14, border: "1px solid rgba(0,255,224,0.25)", background: "rgba(0,255,224,0.07)", color: "#00ffe0", fontWeight: 950, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Sending…" : "Send reset code to my email"}
          </button>
        </>
      )}

      {step === "sent" && (
        <>
          <div style={{ padding: "10px 14px", marginBottom: 16, borderRadius: 12, background: "rgba(0,255,224,0.07)", border: "1px solid rgba(0,255,224,0.15)", fontSize: 13, color: "#94a3b8" }}>
            Code sent to <b style={{ color: "#e5e7eb" }}>{email}</b>. Check your inbox (and spam). Expires in 15 minutes.
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 700 }}>6-digit code</div>
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000" maxLength={6} autoFocus
              style={{ ...inputStyle, letterSpacing: 8, fontSize: 22, fontWeight: 900, textAlign: "center" }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 700 }}>New password</div>
            <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Min 6 characters" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 700 }}>Confirm new password</div>
            <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doReset()} placeholder="Repeat password" style={inputStyle} />
          </div>
          <button onClick={doReset} disabled={loading} style={{ width: "100%", padding: "12px 14px", borderRadius: 14, border: "none", background: loading ? "rgba(0,255,224,0.35)" : "linear-gradient(90deg,#00ff9d,#00ffe0)", color: "#021018", fontWeight: 950, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Resetting…" : "Reset password"}
          </button>
          <div style={{ marginTop: 12, textAlign: "center" }}>
            <span onClick={() => { setStep("idle"); setErr(""); }} style={{ fontSize: 12, color: "#00ffe0", cursor: "pointer", opacity: 0.7 }}>Resend code</span>
          </div>
        </>
      )}
    </div>
  );
}

// ── 2FA card ──────────────────────────────────────────────────────────────────
function TwoFactor() {
  type TfaStep = "idle" | "setup" | "confirm" | "disable";
  const [enabled, setEnabled]   = useState<boolean | null>(null);
  const [step, setStep]         = useState<TfaStep>("idle");
  const [qrUri, setQrUri]       = useState("");
  const [secret, setSecret]     = useState("");
  const [code, setCode]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState("");
  const [msg, setMsg]           = useState("");

  useEffect(() => {
    apiLib.get2faStatus().then((r: any) => setEnabled(!!r?.enabled)).catch(() => setEnabled(false));
  }, []);

  const startSetup = async () => {
    setErr(""); setMsg("");
    setLoading(true);
    try {
      const r: any = await apiLib.setup2fa();
      setQrUri(r.uri);
      setSecret(r.secret);
      setStep("setup");
    } catch (e: any) { setErr(e?.message || "Failed"); }
    finally { setLoading(false); }
  };

  const confirmSetup = async () => {
    setErr("");
    if (code.length !== 6) { setErr("Enter the 6-digit code from your app."); return; }
    setLoading(true);
    try {
      await apiLib.confirm2fa(code);
      setEnabled(true); setStep("idle"); setCode("");
      setMsg("2FA is now active on your account.");
    } catch (e: any) { setErr(e?.message || "Invalid code"); }
    finally { setLoading(false); }
  };

  const doDisable = async () => {
    setErr("");
    if (code.length !== 6) { setErr("Enter your current 6-digit code to disable 2FA."); return; }
    setLoading(true);
    try {
      await apiLib.disable2fa(code);
      setEnabled(false); setStep("idle"); setCode("");
      setMsg("2FA has been disabled.");
    } catch (e: any) { setErr(e?.message || "Invalid code"); }
    finally { setLoading(false); }
  };

  if (enabled === null) return <div style={card}><div style={{ opacity: 0.5 }}>Loading 2FA status…</div></div>;

  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontWeight: 950 }}>Two-Factor Authentication</div>
        <div style={{
          padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 900,
          background: enabled ? "rgba(0,255,157,0.12)" : "rgba(255,255,255,0.06)",
          border: `1px solid ${enabled ? "rgba(0,255,157,0.35)" : "rgba(255,255,255,0.12)"}`,
          color: enabled ? "#00ff9d" : "#94a3b8",
        }}>
          {enabled ? "Enabled" : "Disabled"}
        </div>
      </div>

      <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 18, lineHeight: 1.6 }}>
        {enabled
          ? "Your account is protected with 2FA. You need your authenticator app every login."
          : "Add an extra layer of security. Use Google Authenticator or Authy."}
      </div>

      {msg && <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 12, background: "rgba(0,255,157,0.10)", border: "1px solid rgba(0,255,157,0.30)", color: "#00ff9d", fontSize: 13, fontWeight: 900 }}>{msg}</div>}
      {err && <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 12, background: "rgba(220,38,38,0.12)", border: "1px solid rgba(248,113,113,0.4)", color: "#fecaca", fontSize: 13 }}>{err}</div>}

      {/* ── Idle state ── */}
      {step === "idle" && !enabled && (
        <button onClick={startSetup} disabled={loading} style={{ width: "100%", padding: "12px 14px", borderRadius: 14, border: "none", background: loading ? "rgba(0,255,224,0.3)" : "linear-gradient(90deg,#00ff9d,#00ffe0)", color: "#021018", fontWeight: 950, cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Loading…" : "Enable 2FA"}
        </button>
      )}
      {step === "idle" && enabled && (
        <button onClick={() => { setStep("disable"); setCode(""); setErr(""); }} style={{ width: "100%", padding: "12px 14px", borderRadius: 14, border: "1px solid rgba(248,113,113,0.4)", background: "rgba(220,38,38,0.10)", color: "#fca5a5", fontWeight: 950, cursor: "pointer" }}>
          Disable 2FA
        </button>
      )}

      {/* ── Setup: show QR code ── */}
      {step === "setup" && (
        <div>
          <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 10, lineHeight: 1.6 }}>
            1. Open <b style={{ color: "white" }}>Google Authenticator</b> or <b style={{ color: "white" }}>Authy</b><br />
            2. Tap <b style={{ color: "white" }}>+ → Scan QR code</b><br />
            3. Scan the code below, then enter the 6-digit code it shows
          </div>
          <div style={{ textAlign: "center" }}>
            <QRImage uri={qrUri} />
          </div>
          <div style={{ margin: "14px 0 6px", fontSize: 12, opacity: 0.55, textAlign: "center" }}>
            Can't scan? Enter this code manually:
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 13, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "8px 12px", wordBreak: "break-all", textAlign: "center", color: "#00ffe0", marginBottom: 18 }}>
            {secret}
          </div>
          <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 700, marginBottom: 6 }}>Enter 6-digit code from app</div>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={(e) => e.key === "Enter" && confirmSetup()}
            placeholder="000000"
            maxLength={6}
            autoFocus
            style={{ ...inputStyle, letterSpacing: 8, fontSize: 22, fontWeight: 900, textAlign: "center", marginBottom: 14 }}
          />
          <button onClick={confirmSetup} disabled={loading} style={{ width: "100%", padding: "12px 14px", borderRadius: 14, border: "none", background: loading ? "rgba(0,255,224,0.3)" : "linear-gradient(90deg,#00ff9d,#00ffe0)", color: "#021018", fontWeight: 950, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Activating…" : "Activate 2FA"}
          </button>
          <div style={{ marginTop: 12, textAlign: "center" }}>
            <span onClick={() => { setStep("idle"); setErr(""); }} style={{ fontSize: 13, color: "#00ffe0", cursor: "pointer", opacity: 0.7 }}>Cancel</span>
          </div>
        </div>
      )}

      {/* ── Disable: require current code ── */}
      {step === "disable" && (
        <div>
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 14, lineHeight: 1.6 }}>
            Enter your current 6-digit code from your authenticator app to confirm disabling 2FA.
          </div>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={(e) => e.key === "Enter" && doDisable()}
            placeholder="000000"
            maxLength={6}
            autoFocus
            style={{ ...inputStyle, letterSpacing: 8, fontSize: 22, fontWeight: 900, textAlign: "center", marginBottom: 14 }}
          />
          <button onClick={doDisable} disabled={loading} style={{ width: "100%", padding: "12px 14px", borderRadius: 14, border: "none", background: "rgba(220,38,38,0.75)", color: "white", fontWeight: 950, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Disabling…" : "Confirm — Disable 2FA"}
          </button>
          <div style={{ marginTop: 12, textAlign: "center" }}>
            <span onClick={() => { setStep("idle"); setErr(""); }} style={{ fontSize: 13, color: "#00ffe0", cursor: "pointer", opacity: 0.7 }}>Cancel</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Settings page ────────────────────────────────────────────────────────
export default function Settings() {
  const isMobile = useIsMobile();
  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 950, marginBottom: isMobile ? 4 : 6 }}>Settings</div>
      <div style={{ opacity: 0.7, marginBottom: isMobile ? 14 : 20, fontSize: isMobile ? 12 : 14 }}>Manage your account</div>
      <ChangePassword />
      <ResetViaEmail />
      <TwoFactor />
    </div>
  );
}
