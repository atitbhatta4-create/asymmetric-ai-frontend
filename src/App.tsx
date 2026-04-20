import React, { useEffect, useState } from "react";
import { Routes, Route, NavLink, useNavigate, Navigate } from "react-router-dom";
import * as api from "./lib/api";
import useIsMobile from "./hooks/useIsMobile";

import Dashboard from "./pages/Dashboard";
import Market from "./pages/Market";
import MarketChart from "./pages/MarketChart";
import Exchange from "./pages/Exchange";
import History from "./pages/History";
import MiniAsym from "./pages/MiniAsym";
import Portfolio from "./pages/Portfolio";
import Admin from "./pages/Admin";
import AdminUser from "./pages/AdminUser";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import AcceptTerms from "./pages/AcceptTerms";
import Terms from "./pages/Terms";
import RiskDisclosure from "./pages/RiskDisclosure";

type SessionOut = { ok: boolean; email: string | null };

function termsKey(email: string | null) {
  return email ? `termsAccepted:${email}` : "termsAccepted:unknown";
}

const NAV_ITEMS = [
  { to: "/",           label: "Dashboard" },
  { to: "/market",     label: "Market"    },
  { to: "/exchange",   label: "Exchange"  },
  { to: "/history",    label: "History"   },
  { to: "/portfolio",  label: "Portfolio" },
  { to: "/mini-asym",  label: "Mini-Asym" },
  { to: "/settings",   label: "Settings"  },
];

export default function App() {
  const nav = useNavigate();
  const isMobile = useIsMobile();
  const [session, setSession]         = useState<SessionOut | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isAdmin, setIsAdmin]         = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);

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

  useEffect(() => { loadSession(); }, []);

  useEffect(() => {
    if (!session?.ok) return;
    setAcceptedTerms(localStorage.getItem(termsKey(session.email)) === "true");
  }, [session?.ok, session?.email]);

  useEffect(() => {
    if (!session?.ok) { setIsAdmin(false); setAdminChecked(true); return; }
    checkAdmin();
  }, [session?.ok, session?.email]);

  const doLogout = async () => {
    try { await api.apiRequest("/auth/logout", { method: "POST" }); } finally {
      setIsAdmin(false); setAdminChecked(false);
      await loadSession();
      nav("/login");
    }
  };

  const handleAcceptTerms = () => {
    localStorage.setItem(termsKey(session?.email ?? null), "true");
    setAcceptedTerms(true);
    nav("/");
  };

  if (!session) return <div style={{ padding: 30, color: "white" }}>Loading…</div>;

  if (!authed) {
    return (
      <Routes>
        <Route path="/login"            element={<Login onLoggedIn={loadSession} />} />
        <Route path="/signup"           element={<Signup />} />
        <Route path="/forgot-password"  element={<ForgotPassword />} />
        <Route path="*"                 element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (!adminChecked) return <div style={{ padding: 30, color: "white" }}>Loading…</div>;

  if (!acceptedTerms) {
    return (
      <Routes>
        <Route path="/terms"  element={<Terms />} />
        <Route path="/risk"   element={<RiskDisclosure />} />
        <Route path="/accept" element={<AcceptTerms onAccept={handleAcceptTerms} />} />
        <Route path="*"       element={<Navigate to="/accept" replace />} />
      </Routes>
    );
  }

  const linkStyle = (active: boolean): React.CSSProperties => ({
    display: "block",
    padding: isMobile ? "12px 16px" : "9px 11px",
    borderRadius: 12,
    textDecoration: "none",
    color: "white",
    background: active ? "rgba(0,255,224,0.10)" : "transparent",
    border: active ? "1px solid rgba(0,255,224,0.22)" : "1px solid rgba(255,255,255,0.06)",
    fontWeight: 800,
    marginBottom: isMobile ? 5 : 6,
    fontSize: isMobile ? 14 : 13,
  });

  const allNavItems = isAdmin
    ? [...NAV_ITEMS, { to: "/admin", label: "Admin" }]
    : NAV_ITEMS;

  // ── MOBILE LAYOUT ─────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ minHeight: "100vh", background: "#050814", color: "white" }}>
        {/* Top bar */}
        <div style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "rgba(9,15,30,0.97)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          padding: "12px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900 }}>Asymmetric AI</div>
            <div style={{ fontSize: 10, opacity: 0.5 }}>{session.email}</div>
          </div>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 10, color: "white", padding: "8px 12px", cursor: "pointer",
              fontSize: 18, lineHeight: 1,
            }}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Slide-down menu */}
        {menuOpen && (
          <div style={{
            position: "fixed", top: 57, left: 0, right: 0, bottom: 0,
            background: "rgba(9,15,30,0.98)", zIndex: 99,
            padding: 16, overflowY: "auto",
          }}>
            {allNavItems.map(({ to, label }) => (
              <NavLink key={to} to={to}
                style={({ isActive }) => linkStyle(isActive)}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </NavLink>
            ))}
            <button
              onClick={doLogout}
              style={{
                width: "100%", borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.04)", color: "white",
                padding: "14px", cursor: "pointer", fontWeight: 800, fontSize: 15, marginTop: 8,
              }}
            >
              Logout
            </button>
            <div style={{ marginTop: 16, fontSize: 11, opacity: 0.4, textAlign: "center" }}>
              Demo mode · No real funds · Educational only
            </div>
          </div>
        )}

        {/* Page content */}
        <main style={{ padding: 10, paddingBottom: 20 }}>
          <Routes>
            <Route path="/"           element={<Dashboard />} />
            <Route path="/market"     element={<Market />} />
            <Route path="/market/:symbol" element={<MarketChart />} />
            <Route path="/exchange"   element={<Exchange />} />
            <Route path="/history"    element={<History />} />
            <Route path="/mini-asym"  element={<MiniAsym />} />
            <Route path="/portfolio"  element={<Portfolio />} />
            <Route path="/settings"   element={<Settings />} />
            <Route path="/admin"      element={isAdmin ? <Admin /> : <Navigate to="/" replace />} />
            <Route path="/admin/user/:email" element={isAdmin ? <AdminUser /> : <Navigate to="/" replace />} />
            <Route path="/terms"      element={<Terms />} />
            <Route path="/risk"       element={<RiskDisclosure />} />
            <Route path="*"           element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    );
  }

  // ── DESKTOP LAYOUT ────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh", background: "#050814", color: "white",
      display: "grid", gridTemplateColumns: "200px 1fr",
    }}>
      <aside style={{
        borderRight: "1px solid rgba(255,255,255,0.06)",
        padding: 12, background: "rgba(9,15,30,0.92)",
        position: "sticky", top: 0, height: "100vh", overflowY: "auto",
      }}>
        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 2 }}>Asymmetric AI</div>
        <div style={{ fontSize: 10, opacity: 0.55, marginBottom: 12 }}>
          <b>{session.email}</b>
        </div>

        {allNavItems.map(({ to, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => linkStyle(isActive)}>
            {label}
          </NavLink>
        ))}

        <button
          onClick={doLogout}
          style={{
            marginTop: 10, width: "100%", borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.04)", color: "white",
            padding: "9px 12px", cursor: "pointer", fontWeight: 800, fontSize: 13,
          }}
        >
          Logout
        </button>

        <div style={{ marginTop: 10, fontSize: 10, opacity: 0.45 }}>
          Demo mode · No real funds · Educational only
        </div>
      </aside>

      <main style={{ padding: 16, minWidth: 0 }}>
        <Routes>
          <Route path="/"           element={<Dashboard />} />
          <Route path="/market"     element={<Market />} />
          <Route path="/market/:symbol" element={<MarketChart />} />
          <Route path="/exchange"   element={<Exchange />} />
          <Route path="/history"    element={<History />} />
          <Route path="/mini-asym"  element={<MiniAsym />} />
          <Route path="/portfolio"  element={<Portfolio />} />
          <Route path="/settings"   element={<Settings />} />
          <Route path="/admin"      element={isAdmin ? <Admin /> : <Navigate to="/" replace />} />
          <Route path="/admin/user/:email" element={isAdmin ? <AdminUser /> : <Navigate to="/" replace />} />
          <Route path="/terms"      element={<Terms />} />
          <Route path="/risk"       element={<RiskDisclosure />} />
          <Route path="*"           element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
}
