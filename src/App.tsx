import React, { useEffect, useState } from "react";
import { Routes, Route, NavLink, useNavigate, Navigate } from "react-router-dom";
import * as api from "./lib/api";

import Dashboard from "./pages/Dashboard";
import Market from "./pages/Market";
import MarketChart from "./pages/MarketChart";
import Exchange from "./pages/Exchange";
import History from "./pages/History";
import MiniAsym from "./pages/MiniAsym";

import Admin from "./pages/Admin";
import AdminUser from "./pages/AdminUser";
import Settings from "./pages/Settings";

import Login from "./pages/Login";
import Signup from "./pages/Signup";

import AcceptTerms from "./pages/AcceptTerms";
import Terms from "./pages/Terms";
import RiskDisclosure from "./pages/RiskDisclosure";

type SessionOut = { ok: boolean; email: string | null };

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#050814",
  color: "white",
  display: "grid",
  gridTemplateColumns: "260px 1fr",
};

const sidebarStyle: React.CSSProperties = {
  borderRight: "1px solid rgba(255,255,255,0.06)",
  padding: 18,
  background: "rgba(9, 15, 30, 0.92)",
};

const linkStyle = (active: boolean): React.CSSProperties => ({
  display: "block",
  padding: "12px 14px",
  borderRadius: 14,
  textDecoration: "none",
  color: "white",
  background: active ? "rgba(0,255,224,0.10)" : "transparent",
  border: active ? "1px solid rgba(0,255,224,0.22)" : "1px solid rgba(255,255,255,0.06)",
  fontWeight: 800,
  marginBottom: 10,
});

function termsKey(email: string | null) {
  return email ? `termsAccepted:${email}` : "termsAccepted:unknown";
}

export default function App() {
  const nav = useNavigate();
  const [session, setSession] = useState<SessionOut | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  const authed = !!session?.ok;

  const loadSession = async () => {
    try {
      const s = (await api.apiRequest("/session", { method: "GET" })) as SessionOut;
      setSession(s);
    } catch {
      setSession({ ok: false, email: null });
    }
  };

  const checkAdmin = async () => {
    setAdminChecked(false);
    try {
      await api.apiRequest("/admin/status", { method: "GET" });
      setIsAdmin(true);
    } catch {
      setIsAdmin(false);
    } finally {
      setAdminChecked(true);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (!session?.ok) return;
    const key = termsKey(session.email);
    setAcceptedTerms(localStorage.getItem(key) === "true");
  }, [session?.ok, session?.email]);

  useEffect(() => {
    if (!session?.ok) {
      setIsAdmin(false);
      setAdminChecked(true);
      return;
    }
    checkAdmin();
  }, [session?.ok, session?.email]);

  const doLogout = async () => {
    try {
      await api.apiRequest("/auth/logout", { method: "POST" });
    } finally {
      setIsAdmin(false);
      setAdminChecked(false);
      await loadSession();
      nav("/login");
    }
  };

  const handleAcceptTerms = () => {
    const key = termsKey(session?.email ?? null);
    localStorage.setItem(key, "true");
    setAcceptedTerms(true);
    nav("/");
  };

  if (!session) return <div style={{ padding: 30, color: "white" }}>Loading…</div>;

  // =========================
  // NOT AUTHED ROUTES
  // =========================
  if (!authed) {
    return (
      <Routes>
        {/* Explicit routes (avoids "still same" confusion) */}
        <Route path="/login" element={<Login onLoggedIn={loadSession} />} />
        <Route path="/signup" element={<Signup />} />

        {/* Default route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // wait admin check once user is authed
  if (!adminChecked) {
    return <div style={{ padding: 30, color: "white" }}>Loading…</div>;
  }

  // =========================
  // AUTHED BUT TERMS NOT ACCEPTED
  // =========================
  if (!acceptedTerms) {
    return (
      <Routes>
        <Route path="/terms" element={<Terms />} />
        <Route path="/risk" element={<RiskDisclosure />} />
        <Route path="/accept" element={<AcceptTerms onAccept={handleAcceptTerms} />} />
        <Route path="*" element={<Navigate to="/accept" replace />} />
      </Routes>
    );
  }

  // =========================
  // FULL APP SHELL
  // =========================
  return (
    <div style={shellStyle}>
      <aside style={sidebarStyle}>
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>Asymmetric AI</div>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 16 }}>
          Logged in: <b>{session.email}</b>
        </div>

        <NavLink to="/" style={({ isActive }) => linkStyle(isActive)}>
          Dashboard
        </NavLink>
        <NavLink to="/market" style={({ isActive }) => linkStyle(isActive)}>
          Market
        </NavLink>
        <NavLink to="/exchange" style={({ isActive }) => linkStyle(isActive)}>
          Exchange
        </NavLink>
        <NavLink to="/history" style={({ isActive }) => linkStyle(isActive)}>
          History
        </NavLink>
        <NavLink to="/mini-asym" style={({ isActive }) => linkStyle(isActive)}>
          Mini-Asym Panel
        </NavLink>
        <NavLink to="/settings" style={({ isActive }) => linkStyle(isActive)}>
          Settings
        </NavLink>

        {isAdmin && (
          <NavLink to="/admin" style={({ isActive }) => linkStyle(isActive)}>
            Admin
          </NavLink>
        )}

        <button
          onClick={doLogout}
          style={{
            marginTop: 18,
            width: "100%",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.04)",
            color: "white",
            padding: "12px 14px",
            cursor: "pointer",
            fontWeight: 900,
          }}
        >
          Logout
        </button>

        <div style={{ marginTop: 14, fontSize: 12, opacity: 0.65 }}>
          Demo mode • No real funds • Educational only
        </div>
      </aside>

      <main style={{ padding: 22 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/market" element={<Market />} />
          <Route path="/market/:symbol" element={<MarketChart />} />
          <Route path="/exchange" element={<Exchange />} />
          <Route path="/history" element={<History />} />
          <Route path="/mini-asym" element={<MiniAsym />} />
          <Route path="/settings" element={<Settings />} />

          {/* Admin routes */}
          <Route path="/admin" element={isAdmin ? <Admin /> : <Navigate to="/" replace />} />
          <Route path="/admin/user/:email" element={isAdmin ? <AdminUser /> : <Navigate to="/" replace />} />

          <Route path="/terms" element={<Terms />} />
          <Route path="/risk" element={<RiskDisclosure />} />

          <Route path="*" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
}
