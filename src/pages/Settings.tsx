import React, { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";
import * as apiLib from "../lib/api";

// ── QR code ───────────────────────────────────────────────────────────────────
function QRImage({ uri }: { uri: string }) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(uri)}`;
  return <img src={src} alt="Scan with authenticator" style={{ borderRadius: 12, border: "2px solid rgba(0,255,224,0.3)", marginTop: 12 }} />;
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid rgba(148,163,184,0.25)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  fontSize: 14,
  boxSizing: "border-box",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.55,
  fontWeight: 700,
  marginBottom: 6,
  display: "block",
  letterSpacing: 0.3,
};

const btnPrimary: React.CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(90deg,#00ff9d,#00ffe0)",
  color: "#021018",
  fontWeight: 950,
  fontSize: 14,
  cursor: "pointer",
  marginTop: 4,
};

const btnGhost: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 12,
  border: "1px solid rgba(0,255,224,0.22)",
  background: "rgba(0,255,224,0.06)",
  color: "#00ffe0",
  fontWeight: 900,
  fontSize: 14,
  cursor: "pointer",
  marginTop: 4,
};

function SuccessBanner({ msg }: { msg: string }) {
  return (
    <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(0,255,157,0.10)", border: "1px solid rgba(0,255,157,0.28)", color: "#00ff9d", fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
      {msg}
    </div>
  );
}

function ErrBanner({ msg }: { msg: string }) {
  return (
    <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(220,38,38,0.12)", border: "1px solid rgba(248,113,113,0.35)", color: "#fecaca", fontSize: 13, marginBottom: 14 }}>
      {msg}
    </div>
  );
}

// ── Accordion row wrapper ─────────────────────────────────────────────────────
function AccordionRow({
  icon, title, subtitle, badge, open, onToggle, children,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);

  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Row header — clickable */}
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "18px 20px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          textAlign: "left",
          color: "white",
          transition: "background 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
        onMouseLeave={e => (e.currentTarget.style.background = "none")}
      >
        {/* Icon */}
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: open ? "rgba(0,255,224,0.12)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${open ? "rgba(0,255,224,0.25)" : "rgba(255,255,255,0.08)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 17, transition: "all 0.2s",
        }}>
          {icon}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 14, color: open ? "#e2e8f0" : "#cbd5e1" }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 12, opacity: 0.45, marginTop: 2 }}>{subtitle}</div>
          )}
        </div>

        {/* Badge */}
        {badge && <div style={{ flexShrink: 0 }}>{badge}</div>}

        {/* Chevron */}
        <div style={{
          fontSize: 11, opacity: 0.4, flexShrink: 0, marginLeft: 4,
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.22s ease",
        }}>
          ▼
        </div>
      </button>

      {/* Expandable body */}
      <div
        ref={bodyRef}
        style={{
          overflow: "hidden",
          maxHeight: open ? 900 : 0,
          opacity: open ? 1 : 0,
          transition: "max-height 0.3s ease, opacity 0.2s ease",
        }}
      >
        <div style={{ padding: "4px 20px 22px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Display Name section ──────────────────────────────────────────────────────
function DisplayNameSection() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    api("/profile", { method: "GET" }).then((r: any) => setName(r.display_name || "")).catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setSuccess(false);
    if (!name.trim()) { setErr("Name cannot be empty."); return; }
    setLoading(true);
    try {
      await api("/profile", { method: "POST", body: { display_name: name.trim() } });
      setSuccess(true);
    } catch (e: any) { setErr(e?.message || "Failed to update name."); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit}>
      {success && <SuccessBanner msg="Display name updated." />}
      {err && <ErrBanner msg={err} />}
      <label style={labelStyle}>Display name</label>
      <input
        type="text" value={name} onChange={e => setName(e.target.value)}
        placeholder="Your name" style={inputStyle} maxLength={40} required
      />
      <button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
        {loading ? "Saving…" : "Save name"}
      </button>
    </form>
  );
}

// ── Password sub-tabs ─────────────────────────────────────────────────────────
function PasswordSection() {
  const [tab, setTab] = useState<"change" | "reset">("change");

  // Change password
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [chgLoading, setChgLoading] = useState(false);
  const [chgSuccess, setChgSuccess] = useState(false);
  const [chgErr, setChgErr] = useState("");

  const changeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChgErr(""); setChgSuccess(false);
    if (next.length < 6) { setChgErr("New password must be at least 6 characters."); return; }
    if (next !== confirm) { setChgErr("Passwords do not match."); return; }
    setChgLoading(true);
    try {
      await api("/auth/change-password", { method: "POST", body: { current_password: current, new_password: next } });
      setChgSuccess(true); setCurrent(""); setNext(""); setConfirm("");
    } catch (e: any) { setChgErr(e?.message || "Failed to change password."); }
    finally { setChgLoading(false); }
  };

  // Reset via email
  const [step, setStep] = useState<"idle" | "sent" | "done">("idle");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [rstLoading, setRstLoading] = useState(false);
  const [rstErr, setRstErr] = useState("");

  const sendCode = async () => {
    setRstErr("");
    const e = email.trim().toLowerCase();
    if (!e) { setRstErr("Enter your email address."); return; }
    setRstLoading(true);
    try { await apiLib.forgotPassword(e); setStep("sent"); }
    catch (ex: any) { setRstErr(ex?.message || "Failed to send."); }
    finally { setRstLoading(false); }
  };

  const doReset = async () => {
    setRstErr("");
    if (code.trim().length !== 6) { setRstErr("Enter the 6-digit code."); return; }
    if (newPass.length < 6) { setRstErr("Password must be at least 6 characters."); return; }
    if (newPass !== confirmPass) { setRstErr("Passwords do not match."); return; }
    setRstLoading(true);
    try { await apiLib.resetPassword(email.trim().toLowerCase(), code.trim(), newPass); setStep("done"); }
    catch (ex: any) { setRstErr(ex?.message || "Reset failed."); }
    finally { setRstLoading(false); }
  };

  return (
    <div>
      {/* Sub-tab switcher */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4 }}>
        {(["change", "reset"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: "8px 10px", borderRadius: 8, border: "none", cursor: "pointer",
              fontWeight: 900, fontSize: 13,
              background: tab === t ? "rgba(0,255,224,0.14)" : "transparent",
              color: tab === t ? "#00ffe0" : "#64748b",
              transition: "all 0.15s",
            }}
          >
            {t === "change" ? "Change Password" : "Reset via Email"}
          </button>
        ))}
      </div>

      {/* Change Password */}
      {tab === "change" && (
        <form onSubmit={changeSubmit}>
          {chgSuccess && <SuccessBanner msg="Password changed successfully." />}
          {chgErr && <ErrBanner msg={chgErr} />}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Current password</label>
            <input type="password" value={current} onChange={e => setCurrent(e.target.value)}
              placeholder="Enter current password" style={inputStyle} required autoComplete="current-password" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>New password</label>
            <input type="password" value={next} onChange={e => setNext(e.target.value)}
              placeholder="Min 6 characters" style={inputStyle} required autoComplete="new-password" />
          </div>
          <div style={{ marginBottom: 4 }}>
            <label style={labelStyle}>Confirm new password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat new password" style={inputStyle} required autoComplete="new-password" />
          </div>
          <button type="submit" disabled={chgLoading} style={{ ...btnPrimary, opacity: chgLoading ? 0.6 : 1, cursor: chgLoading ? "not-allowed" : "pointer" }}>
            {chgLoading ? "Saving…" : "Save new password"}
          </button>
        </form>
      )}

      {/* Reset via Email */}
      {tab === "reset" && (
        <div>
          {rstErr && <ErrBanner msg={rstErr} />}
          {step === "done" && <SuccessBanner msg="Password reset successfully. Your new password is now active." />}
          {step === "idle" && (
            <>
              <label style={labelStyle}>Your email address</label>
              <input value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendCode()}
                placeholder="you@example.com" style={inputStyle} />
              <button onClick={sendCode} disabled={rstLoading} style={{ ...btnGhost, opacity: rstLoading ? 0.6 : 1, cursor: rstLoading ? "not-allowed" : "pointer" }}>
                {rstLoading ? "Sending…" : "Send reset code to my email"}
              </button>
            </>
          )}
          {step === "sent" && (
            <>
              <div style={{ padding: "10px 14px", marginBottom: 14, borderRadius: 10, background: "rgba(0,255,224,0.06)", border: "1px solid rgba(0,255,224,0.15)", fontSize: 13, color: "#94a3b8" }}>
                Code sent to <b style={{ color: "#e5e7eb" }}>{email}</b>. Check your inbox. Expires in 15 min.
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>6-digit code</label>
                <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000" maxLength={6} autoFocus
                  style={{ ...inputStyle, letterSpacing: 8, fontSize: 22, fontWeight: 900, textAlign: "center" }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>New password</label>
                <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Min 6 characters" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 4 }}>
                <label style={labelStyle}>Confirm new password</label>
                <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && doReset()} placeholder="Repeat password" style={inputStyle} />
              </div>
              <button onClick={doReset} disabled={rstLoading} style={{ ...btnPrimary, opacity: rstLoading ? 0.6 : 1, cursor: rstLoading ? "not-allowed" : "pointer" }}>
                {rstLoading ? "Resetting…" : "Reset password"}
              </button>
              <div style={{ marginTop: 12, textAlign: "center" }}>
                <span onClick={() => { setStep("idle"); setRstErr(""); }} style={{ fontSize: 12, color: "#00ffe0", cursor: "pointer", opacity: 0.7 }}>
                  Resend code
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── 2FA section ───────────────────────────────────────────────────────────────
function TwoFactorSection({ onStatusChange }: { onStatusChange: (e: boolean) => void }) {
  type TfaStep = "idle" | "setup" | "confirm" | "disable";
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [step, setStep] = useState<TfaStep>("idle");
  const [qrUri, setQrUri] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    apiLib.get2faStatus().then((r: any) => {
      const v = !!r?.enabled;
      setEnabled(v);
      onStatusChange(v);
    }).catch(() => setEnabled(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSetup = async () => {
    setErr(""); setMsg(""); setLoading(true);
    try {
      const r: any = await apiLib.setup2fa();
      setQrUri(r.uri); setSecret(r.secret); setStep("setup");
    } catch (e: any) { setErr(e?.message || "Failed"); }
    finally { setLoading(false); }
  };

  const confirmSetup = async () => {
    setErr("");
    if (code.length !== 6) { setErr("Enter the 6-digit code from your app."); return; }
    setLoading(true);
    try {
      await apiLib.confirm2fa(code);
      setEnabled(true); onStatusChange(true); setStep("idle"); setCode("");
      setMsg("2FA is now active on your account.");
    } catch (e: any) { setErr(e?.message || "Invalid code"); }
    finally { setLoading(false); }
  };

  const doDisable = async () => {
    setErr("");
    if (code.length !== 6) { setErr("Enter your 6-digit code to confirm."); return; }
    setLoading(true);
    try {
      await apiLib.disable2fa(code);
      setEnabled(false); onStatusChange(false); setStep("idle"); setCode("");
      setMsg("2FA has been disabled.");
    } catch (e: any) { setErr(e?.message || "Invalid code"); }
    finally { setLoading(false); }
  };

  if (enabled === null) return <div style={{ opacity: 0.45, fontSize: 13 }}>Loading…</div>;

  return (
    <div>
      {msg && <SuccessBanner msg={msg} />}
      {err && <ErrBanner msg={err} />}

      {step === "idle" && !enabled && (
        <>
          <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 16, lineHeight: 1.6 }}>
            Add an extra layer of security with Google Authenticator or Authy. You'll need your app every time you log in.
          </div>
          <button onClick={startSetup} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Loading…" : "Enable 2FA"}
          </button>
        </>
      )}

      {step === "idle" && enabled && (
        <>
          <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 16, lineHeight: 1.6 }}>
            Your account is protected. You need your authenticator app every time you log in.
          </div>
          <button onClick={() => { setStep("disable"); setCode(""); setErr(""); }}
            style={{ ...btnGhost, border: "1px solid rgba(248,113,113,0.35)", color: "#fca5a5", background: "rgba(220,38,38,0.08)" }}>
            Disable 2FA
          </button>
        </>
      )}

      {step === "setup" && (
        <div>
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 14, lineHeight: 1.7 }}>
            1. Open <b style={{ color: "white" }}>Google Authenticator</b> or <b style={{ color: "white" }}>Authy</b><br />
            2. Tap <b style={{ color: "white" }}>+ → Scan QR code</b><br />
            3. Scan below, then enter the 6-digit code it shows
          </div>
          <div style={{ textAlign: "center" }}>
            <QRImage uri={qrUri} />
          </div>
          <div style={{ margin: "14px 0 6px", fontSize: 12, opacity: 0.45, textAlign: "center" }}>Can't scan? Enter this code manually:</div>
          <div style={{ fontFamily: "monospace", fontSize: 13, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "8px 12px", wordBreak: "break-all", textAlign: "center", color: "#00ffe0", marginBottom: 16 }}>
            {secret}
          </div>
          <label style={labelStyle}>Enter 6-digit code from app</label>
          <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={e => e.key === "Enter" && confirmSetup()}
            placeholder="000000" maxLength={6} autoFocus
            style={{ ...inputStyle, letterSpacing: 8, fontSize: 22, fontWeight: 900, textAlign: "center", marginBottom: 4 }} />
          <button onClick={confirmSetup} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Activating…" : "Activate 2FA"}
          </button>
          <div style={{ marginTop: 12, textAlign: "center" }}>
            <span onClick={() => { setStep("idle"); setErr(""); }} style={{ fontSize: 12, color: "#94a3b8", cursor: "pointer" }}>Cancel</span>
          </div>
        </div>
      )}

      {step === "disable" && (
        <div>
          <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 14 }}>
            Enter your current 6-digit authenticator code to confirm.
          </div>
          <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={e => e.key === "Enter" && doDisable()}
            placeholder="000000" maxLength={6} autoFocus
            style={{ ...inputStyle, letterSpacing: 8, fontSize: 22, fontWeight: 900, textAlign: "center", marginBottom: 4 }} />
          <button onClick={doDisable} disabled={loading}
            style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: "rgba(220,38,38,0.80)", color: "white", fontWeight: 950, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", marginTop: 4, opacity: loading ? 0.6 : 1 }}>
            {loading ? "Disabling…" : "Confirm — Disable 2FA"}
          </button>
          <div style={{ marginTop: 12, textAlign: "center" }}>
            <span onClick={() => { setStep("idle"); setErr(""); }} style={{ fontSize: 12, color: "#94a3b8", cursor: "pointer" }}>Cancel</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Settings page ────────────────────────────────────────────────────────
type Section = "name" | "password" | "2fa" | "support" | null;

export default function Settings() {
  const [open, setOpen] = useState<Section>(null);
  const [tfaEnabled, setTfaEnabled] = useState(false);

  const toggle = (s: Section) => setOpen(prev => (prev === s ? null : s));

  const tfaBadge = (
    <div style={{
      padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 900,
      background: tfaEnabled ? "rgba(0,255,157,0.12)" : "rgba(255,255,255,0.06)",
      border: `1px solid ${tfaEnabled ? "rgba(0,255,157,0.30)" : "rgba(255,255,255,0.10)"}`,
      color: tfaEnabled ? "#00ff9d" : "#64748b",
    }}>
      {tfaEnabled ? "Enabled" : "Disabled"}
    </div>
  );

  return (
    <div style={{ maxWidth: 520 }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 950 }}>Settings</div>
        <div style={{ fontSize: 13, opacity: 0.45, marginTop: 4 }}>Manage your account and security</div>
      </div>

      {/* Accordion card */}
      <div style={{
        background: "rgba(9, 15, 30, 0.92)",
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.08)",
        overflow: "hidden",
      }}>
        <AccordionRow
          icon="👤"
          title="Display Name"
          subtitle="Change your name shown on the dashboard"
          open={open === "name"}
          onToggle={() => toggle("name")}
        >
          <DisplayNameSection />
        </AccordionRow>

        <AccordionRow
          icon="🔒"
          title="Password"
          subtitle="Change your password or reset it via email"
          open={open === "password"}
          onToggle={() => toggle("password")}
        >
          <PasswordSection />
        </AccordionRow>

        <AccordionRow
          icon="🛡️"
          title="Two-Factor Authentication"
          subtitle="Secure your account with an authenticator app"
          badge={tfaBadge}
          open={open === "2fa"}
          onToggle={() => toggle("2fa")}
        >
          <TwoFactorSection onStatusChange={setTfaEnabled} />
        </AccordionRow>

        <div style={{ borderBottom: "none" }}>
          <AccordionRow
            icon="💬"
            title="Contact Support"
            subtitle="Our team replies within 24 hours"
            open={open === "support"}
            onToggle={() => toggle("support")}
          >
            <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 16, lineHeight: 1.6 }}>
              Have a question or need help? Send us a message and we'll get back to you.
            </div>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("open-support-chat"));
                setOpen(null);
              }}
              style={{
                padding: "12px 20px", borderRadius: 12, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg,#00ffe0,#0066ff)",
                color: "#020612", fontWeight: 900, fontSize: 14,
              }}
            >
              Open Support Chat
            </button>
          </AccordionRow>
        </div>
      </div>
    </div>
  );
}
