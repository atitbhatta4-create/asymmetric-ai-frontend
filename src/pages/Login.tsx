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
      // 1️⃣ LOGIN (this sets the cookie)
      await api.apiRequest("/auth/login", {
        method: "POST",
        body: { email: cleanEmail, password },
      });

      // 2️⃣ NAVIGATE IMMEDIATELY (do NOT wait)
      nav("/accept");

      // 3️⃣ REFRESH SESSION IN BACKGROUND
      onLoggedIn().catch(() => {});
    } catch (e: any) {
      setErr(e?.message || "Login failed");
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
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {err && <div className="error">{err}</div>}

      <button onClick={doLogin} disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>

      <p>
        New user? <span onClick={() => nav("/signup")}>Create account</span>
      </p>
    </div>
  );
}
