// src/pages/Login.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../lib/api";

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
      // 1) LOGIN (sets cookie)
      await login(cleanEmail, password);

      // 2) NAVIGATE IMMEDIATELY
      nav("/accept");

      // 3) REFRESH SESSION IN BACKGROUND
      onLoggedIn().catch(() => {});
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h1>Asymmetric AI</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
      />

      {err && <div className="error">{err}</div>}

      <button onClick={doLogin} disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>

      <p>
        New user?{" "}
        <span style={{ cursor: "pointer" }} onClick={() => nav("/signup")}>
          Create account
        </span>
      </p>
    </div>
  );
}
