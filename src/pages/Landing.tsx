import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ── palette (matches app) ─────────────────────────────────────────────────────
const GN   = "#00ffd1";
const RD   = "#ff5078";
const YL   = "#fbbf24";
const BG   = "#050814";
const CARD = "rgba(13,22,44,.78)";
const BDR  = "rgba(255,255,255,.10)";
const BDR2 = "rgba(255,255,255,.06)";
const T    = "rgba(255,255,255,.92)";
const M    = "rgba(255,255,255,.60)";
const S    = "rgba(255,255,255,.32)";

const ff = "ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial";

// ── small helpers ─────────────────────────────────────────────────────────────
const Chip = ({ children, color = GN }: { children: React.ReactNode; color?: string }) => (
  <span style={{
    display: "inline-block", padding: "3px 10px", borderRadius: 999,
    border: `1px solid ${color}44`, background: `${color}11`,
    fontSize: 11, fontWeight: 800, color, letterSpacing: ".06em",
  }}>{children}</span>
);

const Divider = () => (
  <div style={{ height: 1, background: BDR2, margin: "0 auto", maxWidth: 1080 }} />
);

// ── nav ───────────────────────────────────────────────────────────────────────
function Nav({ onLogin }: { onLogin: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "rgba(5,8,20,.96)" : "transparent",
      borderBottom: scrolled ? `1px solid ${BDR2}` : "1px solid transparent",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      transition: "all .25s ease",
      padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
      height: 60,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${GN},#00b8ff)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#050814" }}>A</div>
        <span style={{ fontSize: 15, fontWeight: 900, color: T }}>Asymmetric AI</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onLogin} style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${BDR}`, background: "transparent", color: T, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
          Log In
        </button>
        <button onClick={onLogin} style={{ padding: "8px 18px", borderRadius: 10, border: `1px solid ${GN}55`, background: `${GN}18`, color: GN, fontSize: 13, fontWeight: 900, cursor: "pointer" }}>
          Get Early Access
        </button>
      </div>
    </nav>
  );
}

// ── hero ──────────────────────────────────────────────────────────────────────
function Hero({ onCTA }: { onCTA: () => void }) {
  return (
    <section style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", textAlign: "center",
      padding: "100px 24px 60px", position: "relative", overflow: "hidden",
    }}>
      {/* glow blobs */}
      <div style={{ position: "absolute", top: "10%", left: "15%", width: 500, height: 400, background: `radial-gradient(circle,${GN}12,transparent 65%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "5%", right: "10%", width: 400, height: 350, background: "radial-gradient(circle,rgba(120,90,255,.12),transparent 65%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", maxWidth: 780 }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: "clamp(18px,2.8vw,26px)", fontWeight: 950, color: GN, letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 14 }}>Asymmetric AI</div>
          <Chip>Non-Custodial · Your Keys Always</Chip>
        </div>

        <h1 style={{ fontSize: "clamp(36px,6vw,72px)", fontWeight: 950, lineHeight: 1.08, margin: "0 0 24px", color: T, fontFamily: ff }}>
          Trade With a System.<br />
          <span style={{ color: GN }}>Not an Emotion.</span>
        </h1>

        <p style={{ fontSize: "clamp(13px,1.5vw,16px)", color: GN, fontWeight: 800, marginBottom: 10, letterSpacing: ".02em" }}>
          An AI trading system that follows rules, not emotions — so you don't have to.
        </p>

        <p style={{ fontSize: "clamp(15px,2vw,20px)", color: M, lineHeight: 1.7, margin: "0 auto 36px", maxWidth: 620 }}>
          Asymmetric AI applies 4-layer institutional signal analysis and automatic
          capital protection to your Binance, Bybit, or OKX account — 24/7, discipline-first,
          no guessing.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={onCTA} style={{ padding: "14px 32px", borderRadius: 14, border: `1px solid ${GN}55`, background: `linear-gradient(90deg,${GN}28,${GN}10)`, color: GN, fontSize: 15, fontWeight: 950, cursor: "pointer", letterSpacing: ".02em" }}>
            Get Early Access →
          </button>
          <a href="#how" style={{ padding: "14px 28px", borderRadius: 14, border: `1px solid ${BDR}`, background: "rgba(255,255,255,.04)", color: T, fontSize: 15, fontWeight: 800, cursor: "pointer", textDecoration: "none", display: "inline-block" }}>
            See How It Works
          </a>
        </div>

        <div style={{ marginTop: 40, fontSize: 12, color: S }}>
          Seat-limited · Demo mode active · Real trading launching soon
        </div>
      </div>

      {/* floating equity curve preview */}
      <div style={{ position: "relative", marginTop: 60, width: "100%", maxWidth: 720 }}>
        <div style={{ ...cardStyle(), padding: "16px 20px 20px" }}>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: ".10em", textTransform: "uppercase", color: M, marginBottom: 10 }}>Live AI Signal Preview</div>
          <MiniEquityPreview />
          <div style={{ display: "flex", justifyContent: "space-around", marginTop: 14 }}>
            {[["4-Layer Signal", "All must pass"], ["Grade A / B", "Position sizing"], ["Auto Protection", "15% hard stop"]].map(([v, l]) => (
              <div key={v} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: GN }}>{v}</div>
                <div style={{ fontSize: 10, color: S, marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniEquityPreview() {
  const W = 600, H = 80, P = 10;
  const pts = [1000,1020,1015,1038,1030,1055,1048,1072,1065,1090,1085,1110];
  const min = Math.min(...pts), max = Math.max(...pts), range = max - min;
  const tx = (i: number) => P + (i / (pts.length - 1)) * (W - P * 2);
  const ty = (v: number) => H - P - ((v - min) / range) * (H - P * 2);
  const pStr = pts.map((v, i) => `${tx(i).toFixed(1)},${ty(v).toFixed(1)}`).join(" ");
  const fill = `M${tx(0).toFixed(1)},${H-P} L${pStr} L${tx(pts.length-1).toFixed(1)},${H-P} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H }}>
      <defs>
        <linearGradient id="hero-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GN} stopOpacity=".22" />
          <stop offset="100%" stopColor={GN} stopOpacity=".01" />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#hero-g)" />
      <polyline points={pStr} fill="none" stroke={GN} strokeWidth="2" />
      <circle cx={tx(pts.length-1)} cy={ty(pts[pts.length-1])} r="4" fill={GN} />
    </svg>
  );
}

// ── problem section ───────────────────────────────────────────────────────────
function Problem() {
  const items = [
    { icon: "⚡", title: "Emotional Trading", body: "You FOMO in at the top. You panic-sell at the bottom. Every retail trader does it. Not because they're dumb — because they have no system." },
    { icon: "🎲", title: "No Risk Discipline", body: "Hedge funds don't bet randomly. They have drawdown limits, position sizing rules, and regime filters. Most retail traders have none of these." },
    { icon: "😴", title: "Can't Monitor 24/7", body: "Crypto doesn't sleep. London opens at 8am, New York at 1pm, Asia at 3am. You can't catch every move. A system can." },
  ];
  return (
    <section style={{ padding: "80px 24px", maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <Chip color={RD}>The Problem</Chip>
        <h2 style={h2Style}>Why Retail Traders Lose</h2>
        <p style={subStyle}>It's rarely bad analysis. It's almost always bad discipline.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
        {items.map(item => (
          <div key={item.title} style={{ ...cardStyle(), padding: "24px" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>{item.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 8, color: T }}>{item.title}</div>
            <div style={{ fontSize: 13, color: M, lineHeight: 1.7 }}>{item.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── engine section ────────────────────────────────────────────────────────────
function Engine() {
  const layers = [
    { n: "01", name: "Regime", q: "Is there a trend worth trading?", checks: ["ADX ≥ 16 (real trend strength)", "ATR in safe volatility range", "Not choppy sideways market"], color: GN },
    { n: "02", name: "Direction", q: "Which way is the big money moving?", checks: ["4h EMA21 vs EMA50 alignment", "EMA spread widening confirmation", "Higher timeframe trend agree"], color: "#00b8ff" },
    { n: "03", name: "Entry", q: "Is NOW the right moment?", checks: ["Price in pullback zone from EMA21", "Candle pattern quality (pin bar, engulf)", "RSI not overbought/oversold"], color: "rgba(120,90,255,.95)" },
    { n: "04", name: "Momentum", q: "Is the move actually starting?", checks: ["Last N candles aligned with direction", "Volume ≥ 0.15× 20-candle average", "No fake/whale manipulation detected"], color: YL },
  ];
  return (
    <section id="how" style={{ padding: "80px 24px", maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <Chip>The Mini-Asym Engine</Chip>
        <h2 style={h2Style}>4 Layers. All Must Pass.</h2>
        <p style={subStyle}>If any single layer fails, no trade is taken. Capital stays safe.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14 }}>
        {layers.map((l, i) => (
          <div key={l.n} style={{ ...cardStyle(), padding: "22px 20px", borderColor: `${l.color}33` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${l.color}18`, border: `1px solid ${l.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: l.color }}>L{i+1}</div>
              <span style={{ fontSize: 14, fontWeight: 900, color: T }}>{l.name}</span>
            </div>
            <div style={{ fontSize: 12, color: l.color, fontWeight: 800, marginBottom: 10 }}>{l.q}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {l.checks.map(c => (
                <div key={c} style={{ display: "flex", gap: 8, fontSize: 11, color: M }}>
                  <span style={{ color: l.color, flexShrink: 0 }}>✓</span>
                  <span>{c}</span>
                </div>
              ))}
            </div>
            {i < layers.length - 1 && (
              <div style={{ marginTop: 16, fontSize: 10, color: S, textAlign: "center" }}>
                passes → Layer {i + 2}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, ...cardStyle(), padding: "16px 20px", borderColor: `${GN}33`, background: `${GN}06`, textAlign: "center" }}>
        <span style={{ fontSize: 13, color: GN, fontWeight: 900 }}>All 4 pass → </span>
        <span style={{ fontSize: 13, color: T, fontWeight: 800 }}>Grade A (full size) or Grade B (split T1+T2) — trade opens</span>
        <span style={{ fontSize: 13, color: M }}> · Any layer fails → </span>
        <span style={{ fontSize: 13, color: RD, fontWeight: 900 }}>No trade. Wait.</span>
      </div>
    </section>
  );
}

// ── protection section ────────────────────────────────────────────────────────
function Protection() {
  const tiers = [
    { dd: "-4%",  action: "Size shrinks to 65%",    color: YL,                      label: "Caution"  },
    { dd: "-7%",  action: "Size shrinks to 40%",    color: "rgba(255,140,60,.95)",  label: "Reduce"   },
    { dd: "-10%", action: "Size shrinks to 25%",    color: RD,                      label: "Recovery" },
    { dd: "-15%", action: "Engine stops completely", color: "rgba(200,20,60,.95)",  label: "Full Stop" },
  ];
  return (
    <section style={{ padding: "80px 24px", background: "rgba(0,0,0,.18)" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Chip color={RD}>Capital Protection</Chip>
          <h2 style={h2Style}>4-Tier Drawdown Guard</h2>
          <p style={subStyle}>Most trading bots let you blow your account. We stop before that happens.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14, marginBottom: 28 }}>
          {tiers.map(t => (
            <div key={t.dd} style={{ ...cardStyle(), padding: "20px", borderColor: `${t.color}33` }}>
              <div style={{ fontSize: 32, fontWeight: 950, color: t.color, marginBottom: 4 }}>{t.dd}</div>
              <div style={{ fontSize: 11, fontWeight: 900, color: t.color, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10 }}>{t.label}</div>
              <div style={{ fontSize: 13, color: M }}>{t.action}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ ...cardStyle(), padding: "20px" }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: T, marginBottom: 8 }}>Hard Floor</div>
            <div style={{ fontSize: 28, fontWeight: 950, color: GN, marginBottom: 4 }}>85%</div>
            <div style={{ fontSize: 12, color: M }}>If your equity drops below 85% of session start, the engine stops and will not trade again until you restart. Your remaining capital is always protected.</div>
          </div>
          <div style={{ ...cardStyle(), padding: "20px" }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: T, marginBottom: 8 }}>Trailing Stop System</div>
            <div style={{ fontSize: 13, color: M, lineHeight: 1.7 }}>
              <div style={{ marginBottom: 6 }}><span style={{ color: GN }}>40% of TP →</span> Stop-loss moves to breakeven. You can't lose.</div>
              <div><span style={{ color: GN }}>70% of TP →</span> Stop locks in 50% of SL distance as profit. Guaranteed gain.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── non-custodial section ─────────────────────────────────────────────────────
function NonCustodial() {
  const points = [
    { icon: "🔑", title: "Trade-Only API Key", body: "You connect a read+trade API key. Withdrawals are always disabled at the exchange level. We physically cannot move your funds." },
    { icon: "🏦", title: "Stays on Your Exchange", body: "Your crypto never leaves Binance, Bybit, or OKX. We send trade instructions. Your exchange executes them. Your account, your custody." },
    { icon: "🔒", title: "Encrypted Storage", body: "Your API keys are encrypted with AES-128 (Fernet) at rest. Never stored in plain text. Never shared. Ever." },
  ];
  return (
    <section style={{ padding: "80px 24px", maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <Chip color="#00b8ff">Security</Chip>
        <h2 style={h2Style}>We Never Touch Your Money</h2>
        <p style={subStyle}>Non-custodial by design. Your keys. Your funds. Always.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
        {points.map(p => (
          <div key={p.title} style={{ ...cardStyle(), padding: "24px" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>{p.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8, color: T }}>{p.title}</div>
            <div style={{ fontSize: 13, color: M, lineHeight: 1.7 }}>{p.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── honest returns ────────────────────────────────────────────────────────────
function Returns() {
  const months = [
    { label: "Bad Month", sub: "Choppy market", range: "-5% to +5%", color: YL },
    { label: "Average Month", sub: "Normal conditions", range: "+8% to +15%", color: GN },
    { label: "Strong Month", sub: "Clear trending market", range: "+20% to +30%", color: GN },
  ];
  return (
    <section style={{ padding: "80px 24px", background: "rgba(0,0,0,.18)" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Chip>Realistic Returns</Chip>
          <h2 style={h2Style}>Honest Numbers Only</h2>
          <p style={subStyle}>We don't promise 10x. We promise a systematic process that protects capital first and grows it second.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16, marginBottom: 28 }}>
          {months.map(m => (
            <div key={m.label} style={{ ...cardStyle(), padding: "24px", textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: S, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>{m.label}</div>
              <div style={{ fontSize: 11, color: M, marginBottom: 12 }}>{m.sub}</div>
              <div style={{ fontSize: 28, fontWeight: 950, color: m.color }}>{m.range}</div>
            </div>
          ))}
        </div>

        <div style={{ ...cardStyle(), padding: "20px 24px", borderColor: "rgba(251,191,36,.25)", background: "rgba(251,191,36,.05)" }}>
          <div style={{ fontSize: 12, color: YL, fontWeight: 900, marginBottom: 6 }}>⚠ Risk Disclosure</div>
          <div style={{ fontSize: 12, color: M, lineHeight: 1.7 }}>
            Trading crypto involves substantial risk of loss. Past performance is not indicative of future results. Asymmetric AI is a tool — not a guarantee. Only trade with capital you can afford to lose. Always read the full <a href="/risk" style={{ color: YL }}>risk disclosure</a> before use.
          </div>
        </div>
      </div>
    </section>
  );
}

// ── how to start ──────────────────────────────────────────────────────────────
function HowToStart({ onCTA }: { onCTA: () => void }) {
  const steps = [
    { n: "01", title: "Create Account", body: "Sign up with email. Takes 30 seconds." },
    { n: "02", title: "Connect Exchange", body: "Add a trade-only API key from Binance, Bybit, or OKX. Read+trade permissions only, withdrawals always blocked." },
    { n: "03", title: "Choose Your Mode", body: "ULTRA_SAFE to AGGRESSIVE. Pick based on your risk tolerance. You can change anytime." },
    { n: "04", title: "AI Runs 24/7", body: "Mini-Asym monitors the market every interval. Only trades when all 4 layers align. You watch the dashboard." },
  ];
  return (
    <section id="start" style={{ padding: "80px 24px", maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 52 }}>
        <Chip>Getting Started</Chip>
        <h2 style={h2Style}>Live in 4 Steps</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginBottom: 44 }}>
        {steps.map((s, i) => (
          <div key={s.n} style={{ ...cardStyle(), padding: "22px 20px", position: "relative" }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: GN, letterSpacing: ".08em", marginBottom: 10 }}>STEP {s.n}</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: T, marginBottom: 8 }}>{s.title}</div>
            <div style={{ fontSize: 13, color: M, lineHeight: 1.6 }}>{s.body}</div>
            {i < steps.length - 1 && (
              <div style={{ position: "absolute", top: "50%", right: -10, fontSize: 16, color: S, display: "none" }}>→</div>
            )}
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center" }}>
        <button onClick={onCTA} style={{ padding: "16px 40px", borderRadius: 14, border: `1px solid ${GN}55`, background: `linear-gradient(90deg,${GN}28,${GN}10)`, color: GN, fontSize: 16, fontWeight: 950, cursor: "pointer", letterSpacing: ".02em" }}>
          Start Free — Get Early Access →
        </button>
        <div style={{ marginTop: 12, fontSize: 11, color: S }}>Seat-limited · Demo mode · No credit card required</div>
      </div>
    </section>
  );
}

// ── exchange logos strip ──────────────────────────────────────────────────────
function Exchanges() {
  const exchanges = [
    { name: "Binance",  color: "#F0B90B", letter: "B", sub: "Supported" },
    { name: "Bybit",    color: "#F7A600", letter: "B", sub: "Supported" },
    { name: "OKX",      color: "#FFFFFF", letter: "O", sub: "Supported" },
  ];
  return (
    <section style={{ padding: "48px 24px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: S, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 28 }}>
          Connect Your Exchange
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
          {exchanges.map(ex => (
            <div key={ex.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 28px", borderRadius: 14, border: `1px solid ${BDR}`, background: "rgba(255,255,255,.03)" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${ex.color}22`, border: `1px solid ${ex.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: ex.color }}>{ex.letter}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: T }}>{ex.name}</div>
                <div style={{ fontSize: 10, color: GN, fontWeight: 800 }}>{ex.sub}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, fontSize: 12, color: S }}>
          Trade-only API key · Withdrawals always disabled · Your funds never leave your exchange
        </div>
      </div>
    </section>
  );
}

// ── modes section ─────────────────────────────────────────────────────────────
function Modes() {
  const modes = [
    { icon: "🛡️", name: "ULTRA SAFE",  tagline: "I want maximum protection.", sub: "Grow slowly, never blow up.", best: "First time users",     color: GN,                     flagship: false },
    { icon: "⚖️", name: "SAFE",        tagline: "I want steady growth with strong protection.", sub: "", best: "Conservative traders",  color: "#00d4ff",              flagship: false },
    { icon: "🎯", name: "NORMAL",      tagline: "Balanced approach.", sub: "Good returns, managed risk.", best: "Most users",             color: YL,                     flagship: false },
    { icon: "⚡", name: "MINI_ASYM",   tagline: "The flagship mode. Built for serious traders who trust the system.", sub: "", best: "Experienced traders",  color: GN, flagship: true  },
    { icon: "🔥", name: "AGGRESSIVE",  tagline: "Maximum opportunity.", sub: "Higher risk, higher reward.", best: "Risk tolerant only",   color: RD,                     flagship: false },
  ];
  return (
    <section style={{ padding: "80px 24px", background: "rgba(0,0,0,.18)" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Chip>Risk Modes</Chip>
          <h2 style={h2Style}>Choose Your Risk Personality</h2>
          <p style={subStyle}>5 modes from ultra conservative to aggressive. Switch anytime.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14 }}>
          {modes.map(m => (
            <div key={m.name} style={{
              ...cardStyle(),
              padding: "24px 20px",
              borderColor: m.flagship ? `${GN}55` : `${m.color}22`,
              background: m.flagship ? `${GN}07` : CARD,
              position: "relative",
            }}>
              {m.flagship && (
                <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", padding: "3px 12px", borderRadius: 999, background: GN, color: "#050814", fontSize: 9, fontWeight: 900, letterSpacing: ".08em", whiteSpace: "nowrap" }}>
                  ★ FLAGSHIP
                </div>
              )}
              <div style={{ fontSize: 28, marginBottom: 12 }}>{m.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 950, color: m.color, marginBottom: 8 }}>{m.name}</div>
              <div style={{ fontSize: 13, color: T, fontWeight: 800, lineHeight: 1.5, marginBottom: 4 }}>{m.tagline}</div>
              {m.sub && <div style={{ fontSize: 12, color: M, marginBottom: 10 }}>{m.sub}</div>}
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${BDR2}` }}>
                <span style={{ fontSize: 10, color: S, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase" }}>Best for  </span>
                <span style={{ fontSize: 11, color: m.color, fontWeight: 900 }}>{m.best}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: S }}>
          Full technical specs available after signup.
        </div>
      </div>
    </section>
  );
}

// ── faq ───────────────────────────────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const items = [
    { q: "Is my money safe?", a: "Your funds never leave your exchange. You connect a trade-only API key with withdrawals disabled. We send trade signals — your exchange executes them. We cannot access, move, or withdraw your funds under any circumstance." },
    { q: "Can I lose money?", a: "Yes. Crypto trading involves real risk of loss. The engine is designed to limit losses through drawdown tiers, position sizing, and hard stops — but no system guarantees profits. Only trade with capital you can afford to lose." },
    { q: "Which exchanges are supported?", a: "Currently Binance, Bybit, and OKX. More exchanges will be added as the platform grows." },
    { q: "What returns can I realistically expect?", a: "Average month: +8% to +15%. Strong trending month: +20% to +30%. Choppy market: -5% to +5%. We do not promise specific returns. The engine protects capital first, grows it second." },
    { q: "What happens if the AI keeps losing?", a: "After 2 consecutive bad trades, the engine raises signal strictness automatically. At -15% drawdown from peak, it stops completely and will not trade again until you restart — protecting your remaining capital." },
    { q: "Is this real-money trading right now?", a: "Currently in demo mode (paper trading with real market data). Real-money execution is launching soon after paper validation is complete." },
  ];
  return (
    <section style={{ padding: "80px 24px", maxWidth: 760, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <Chip>FAQ</Chip>
        <h2 style={h2Style}>Common Questions</h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((item, i) => (
          <div key={i} style={{ ...cardStyle(), overflow: "hidden" }}>
            <button onClick={() => setOpen(open === i ? null : i)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "transparent", border: "none", color: T, fontSize: 14, fontWeight: 800, cursor: "pointer", textAlign: "left", gap: 12 }}>
              <span>{item.q}</span>
              <span style={{ color: GN, flexShrink: 0, fontSize: 18 }}>{open === i ? "−" : "+"}</span>
            </button>
            {open === i && (
              <div style={{ padding: "0 20px 18px", fontSize: 13, color: M, lineHeight: 1.7, borderTop: `1px solid ${BDR2}`, paddingTop: 14 }}>
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── footer CTA ────────────────────────────────────────────────────────────────
function FooterCTA({ onCTA }: { onCTA: () => void }) {
  return (
    <section style={{ padding: "80px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center,${GN}0d,transparent 65%)`, pointerEvents: "none" }} />
      <div style={{ position: "relative", maxWidth: 600, margin: "0 auto" }}>
        <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 950, color: T, marginBottom: 16 }}>
          Ready to Trade<br /><span style={{ color: GN }}>With Discipline?</span>
        </h2>
        <p style={{ fontSize: 16, color: M, marginBottom: 32, lineHeight: 1.6 }}>
          Seats are limited. Join the early access list and be first when real-money trading launches.
        </p>
        <button onClick={onCTA} style={{ padding: "16px 44px", borderRadius: 14, border: `1px solid ${GN}55`, background: `linear-gradient(90deg,${GN}28,${GN}10)`, color: GN, fontSize: 16, fontWeight: 950, cursor: "pointer" }}>
          Get Early Access →
        </button>
        <div style={{ marginTop: 14, fontSize: 11, color: S }}>
          asymetricai.com · Non-custodial · Your keys always yours
        </div>
      </div>
    </section>
  );
}

// ── footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ padding: "28px 24px", borderTop: `1px solid ${BDR2}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 20, height: 20, borderRadius: 5, background: `linear-gradient(135deg,${GN},#00b8ff)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: "#050814" }}>A</div>
        <span style={{ fontSize: 13, fontWeight: 900, color: M }}>Asymmetric AI</span>
      </div>
      <div style={{ display: "flex", gap: 20, fontSize: 12, color: S }}>
        <a href="/terms" style={{ color: S, textDecoration: "none" }}>Terms</a>
        <a href="/risk"  style={{ color: S, textDecoration: "none" }}>Risk Disclosure</a>
        <a href="/login" style={{ color: S, textDecoration: "none" }}>Log In</a>
      </div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,.20)", textAlign: "center" }}>
        Demo mode only · No real funds at risk currently · Educational purposes<br />
        © 2026 Asymmetric AI · asymetricai.com
      </div>
    </footer>
  );
}

// ── shared styles ─────────────────────────────────────────────────────────────
const cardStyle = (): React.CSSProperties => ({
  background: CARD, border: `1px solid ${BDR}`, borderRadius: 16,
  backdropFilter: "blur(10px)",
});
const h2Style: React.CSSProperties = {
  fontSize: "clamp(26px,4vw,42px)", fontWeight: 950, color: T,
  margin: "12px 0 14px", fontFamily: ff,
};
const subStyle: React.CSSProperties = {
  fontSize: "clamp(13px,1.6vw,17px)", color: M, lineHeight: 1.7,
  maxWidth: 560, margin: "0 auto",
};

// ── page ──────────────────────────────────────────────────────────────────────
export default function Landing() {
  const nav = useNavigate();
  const goSignup = () => nav("/signup");

  return (
    <div style={{ background: BG, color: T, fontFamily: ff, minHeight: "100vh" }}>
      <Nav onLogin={() => nav("/login")} />
      <Hero onCTA={goSignup} />
      <Divider />
      <Exchanges />
      <Divider />
      <Problem />
      <Divider />
      <Engine />
      <Divider />
      <Protection />
      <Divider />
      <NonCustodial />
      <Divider />
      <Returns />
      <Divider />
      <Modes />
      <Divider />
      <HowToStart onCTA={goSignup} />
      <Divider />
      <FAQ />
      <Divider />
      <FooterCTA onCTA={goSignup} />
      <Footer />
    </div>
  );
}
