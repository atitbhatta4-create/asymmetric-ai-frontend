import React, { useState } from "react";
import { api } from "../lib/api";

const card: React.CSSProperties = {
  background: "rgba(9, 15, 30, 0.92)",
  borderRadius: 18,
  padding: 20,
  border: "1px solid rgba(255,255,255,0.08)",
  maxWidth: 480,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 6,
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(148,163,184,0.35)",
  background: "rgba(15,23,42,0.85)",
  color: "white",
  fontSize: 14,
  boxSizing: "border-box",
};

export default function Settings() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setSuccess(false);

    if (next.length < 6) {
      setErr("New password must be at least 6 characters.");
      return;
    }
    if (next !== confirm) {
      setErr("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api("/auth/change-password", {
        method: "POST",
        body: { current_password: current, new_password: next },
      });
      setSuccess(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (e: any) {
      setErr(e?.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ fontSize: 26, fontWeight: 950, marginBottom: 6 }}>Settings</div>
      <div style={{ opacity: 0.7, marginBottom: 20 }}>Manage your account</div>

      <div style={card}>
        <div style={{ fontWeight: 950, marginBottom: 16 }}>Change Password</div>

        <form onSubmit={submit}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 700 }}>Current password</div>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="Enter current password"
              style={inputStyle}
              required
              autoComplete="current-password"
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 700 }}>New password</div>
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="Min 6 characters"
              style={inputStyle}
              required
              autoComplete="new-password"
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 700 }}>Confirm new password</div>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat new password"
              style={inputStyle}
              required
              autoComplete="new-password"
            />
          </div>

          {err && (
            <div style={{
              marginBottom: 14, padding: "10px 14px", borderRadius: 12,
              background: "rgba(220,38,38,0.12)", border: "1px solid rgba(248,113,113,0.4)",
              color: "#fecaca", fontSize: 13,
            }}>
              {err}
            </div>
          )}

          {success && (
            <div style={{
              marginBottom: 14, padding: "10px 14px", borderRadius: 12,
              background: "rgba(0,255,157,0.10)", border: "1px solid rgba(0,255,157,0.30)",
              color: "#00ff9d", fontSize: 13, fontWeight: 900,
            }}>
              Password changed successfully.
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px 14px",
              borderRadius: 14,
              border: "none",
              background: loading ? "rgba(0,255,224,0.35)" : "linear-gradient(90deg,#00ff9d,#00ffe0)",
              color: "#021018",
              fontWeight: 950,
              fontSize: 15,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Saving…" : "Save new password"}
          </button>
        </form>
      </div>
    </div>
  );
}
