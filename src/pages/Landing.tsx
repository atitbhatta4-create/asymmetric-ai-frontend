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
        <img src="/logo.png" alt="Asymmetric AI" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" }} />
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
    <section className="land-hero" style={{
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

        <div className="cta-row" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
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
      <div className="preview" style={{ position: "relative", marginTop: 60, width: "100%", maxWidth: 720 }}>
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
  const [active, setActive] = useState(0);

  const layers = [
    {
      n: "01", name: "Regime", icon: "📡",
      q: "Is there a trend worth trading?",
      desc: "The engine first checks if the market is in a real trend — not choppy sideways noise. If the market isn't moving with conviction, no trade is taken. Capital is preserved for better conditions.",
      checks: ["ADX ≥ 16 — real trend strength confirmed", "ATR in safe volatility range", "Choppy/ranging market detected → skip"],
      color: GN, score: 94,
    },
    {
      n: "02", name: "Direction", icon: "🧭",
      q: "Which way is the big money moving?",
      desc: "Once a trend is confirmed, the engine identifies the dominant direction using higher timeframe EMA alignment. It only trades with the trend — never against it.",
      checks: ["4h EMA21 above/below EMA50", "EMA spread widening (trend accelerating)", "Higher timeframe agrees with local signal"],
      color: "#00b8ff", score: 88,
    },
    {
      n: "03", name: "Entry", icon: "🎯",
      q: "Is this the right moment to enter?",
      desc: "Even in a strong trend, entries matter. The engine waits for a pullback to the EMA21 with a quality candle pattern — pin bar, engulfing, or reversal. No chasing breakouts.",
      checks: ["Price pulled back to EMA21 zone", "Candle pattern: pin bar / engulfing", "RSI not overbought or oversold"],
      color: "#7c5aff", score: 76,
    },
    {
      n: "04", name: "Momentum", icon: "⚡",
      q: "Is the move actually starting now?",
      desc: "The final gate. The engine checks that real momentum is behind the move — not a fake spike. Volume must confirm the direction and recent candles must align. No whale traps.",
      checks: ["Recent candles aligned with direction", "Volume ≥ 0.15× 20-candle average", "No fake spike / manipulation pattern"],
      color: YL, score: 81,
    },
  ];

  const l = layers[active];

  return (
    <section id="how" style={{ padding: "80px 24px", maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <Chip>The Mini-Asym Engine</Chip>
        <h2 style={h2Style}>4 Layers. All Must Pass.</h2>
        <p style={subStyle}>If any single layer fails, no trade is taken. Your capital stays safe until conditions are right.</p>
      </div>

      {/* layer selector tabs */}
      <div className="land-engine-tabs" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {layers.map((layer, i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            padding: "14px 12px", borderRadius: 12, cursor: "pointer", textAlign: "left",
            border: `1px solid ${active === i ? `${layer.color}55` : BDR2}`,
            background: active === i ? `${layer.color}10` : "rgba(255,255,255,.02)",
            transition: "all .18s ease",
          }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{layer.icon}</div>
            <div style={{ fontSize: 10, fontWeight: 900, color: S, letterSpacing: ".08em", marginBottom: 3 }}>LAYER {layer.n}</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: active === i ? layer.color : T }}>{layer.name}</div>
            {/* score bar */}
            <div style={{ marginTop: 10, height: 3, borderRadius: 99, background: "rgba(255,255,255,.08)" }}>
              <div style={{ height: "100%", borderRadius: 99, width: `${layer.score}%`, background: layer.color, opacity: active === i ? 1 : 0.4 }} />
            </div>
          </button>
        ))}
      </div>

      {/* active layer detail */}
      <div className="land-engine-detail" style={{ ...cardStyle(), borderColor: `${l.color}33`, background: `${l.color}06`, padding: "28px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
        {/* left */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${l.color}18`, border: `1px solid ${l.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{l.icon}</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 900, color: S, letterSpacing: ".10em" }}>LAYER {l.n}</div>
              <div style={{ fontSize: 20, fontWeight: 950, color: l.color }}>{l.name}</div>
            </div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, color: T, marginBottom: 12, lineHeight: 1.4 }}>{l.q}</div>
          <div style={{ fontSize: 13, color: M, lineHeight: 1.8 }}>{l.desc}</div>
        </div>

        {/* right — checks + signal score */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 900, color: S, letterSpacing: ".10em", marginBottom: 14 }}>WHAT IT CHECKS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {l.checks.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: `${l.color}18`, border: `1px solid ${l.color}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  <span style={{ fontSize: 10, color: l.color, fontWeight: 900 }}>✓</span>
                </div>
                <span style={{ fontSize: 13, color: T, lineHeight: 1.5 }}>{c}</span>
              </div>
            ))}
          </div>

          {/* signal strength meter */}
          <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(0,0,0,.22)", border: `1px solid ${BDR2}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 900, color: S, letterSpacing: ".08em" }}>LAYER SIGNAL STRENGTH</span>
              <span style={{ fontSize: 12, fontWeight: 900, color: l.color }}>{l.score}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,.08)" }}>
              <div style={{ height: "100%", borderRadius: 99, width: `${l.score}%`, background: `linear-gradient(90deg,${l.color},${l.color}88)` }} />
            </div>
            <div style={{ marginTop: 8, fontSize: 10, color: S }}>Passes this layer — signal forwarded to next</div>
          </div>
        </div>
      </div>

      {/* outcome row */}
      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ ...cardStyle(), padding: "16px 20px", borderColor: `${GN}33`, background: `${GN}06`, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 28 }}>✅</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: GN }}>All 4 pass → Trade Opens</div>
            <div style={{ fontSize: 12, color: M, marginTop: 4 }}>Grade A = full position · Grade B = split T1 + T2 targets</div>
          </div>
        </div>
        <div style={{ ...cardStyle(), padding: "16px 20px", borderColor: `${RD}33`, background: `${RD}06`, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 28 }}>🚫</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: RD }}>Any layer fails → No Trade</div>
            <div style={{ fontSize: 12, color: M, marginTop: 4 }}>Engine waits. Capital stays safe. No FOMO.</div>
          </div>
        </div>
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

// ── exchange SVG logos ────────────────────────────────────────────────────────
function BinanceLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="10" fill="#F0B90B22" />
      <g transform="translate(18,18)" fill="#F0B90B">
        <rect x="-3.2" y="-3.2" width="6.4" height="6.4" transform="rotate(45)" />
        <rect x="-9.8" y="-3.2" width="6.4" height="6.4" transform="rotate(45)" />
        <rect x="3.4" y="-3.2" width="6.4" height="6.4" transform="rotate(45)" />
        <rect x="-3.2" y="-9.8" width="6.4" height="6.4" transform="rotate(45)" />
        <rect x="-3.2" y="3.4" width="6.4" height="6.4" transform="rotate(45)" />
      </g>
    </svg>
  );
}

function BybitLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="10" fill="#F7A60022" />
      <text x="18" y="24" textAnchor="middle" fontSize="15" fontWeight="900" fill="#F7A600" fontFamily="Arial,sans-serif">B</text>
      <rect x="8" y="24" width="20" height="2.5" rx="1.25" fill="#F7A600" />
    </svg>
  );
}

function OKXLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="10" fill="#ffffff18" />
      <rect x="8" y="14" width="7" height="7" rx="1.5" fill="white" />
      <rect x="14.5" y="14" width="7" height="7" rx="1.5" fill="white" />
      <rect x="21" y="14" width="7" height="7" rx="1.5" fill="white" />
    </svg>
  );
}

// ── exchange logos strip ──────────────────────────────────────────────────────
function Exchanges() {
  const exchanges: { name: string; sub: string; logo: React.ReactNode }[] = [
    { name: "Binance", sub: "Supported", logo: <BinanceLogo /> },
    { name: "Bybit",   sub: "Supported", logo: <BybitLogo /> },
    { name: "OKX",     sub: "Supported", logo: <OKXLogo /> },
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
              {ex.logo}
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

        <div className="land-modes-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14 }}>
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
  const [open, setOpen] = useState<number | null>(0);
  const items = [
    { q: "Is my money safe?", a: "Your funds never leave your exchange. You connect a trade-only API key with withdrawals disabled. We send trade signals — your exchange executes them. We cannot access, move, or withdraw your funds." },
    { q: "Can I lose money?", a: "Yes. Crypto trading involves real risk. The engine limits losses through drawdown tiers and hard stops — but no system guarantees profits. Only trade with capital you can afford to lose." },
    { q: "Which exchanges are supported?", a: "Currently Binance, Bybit, and OKX. More exchanges coming as the platform grows." },
    { q: "What returns can I expect?", a: "Average month: +8% to +15%. Strong trending month: +20% to +30%. Choppy market: -5% to +5%. The engine protects capital first, grows it second." },
    { q: "What if the AI keeps losing?", a: "After 2 bad trades, the engine raises strictness automatically. At -15% drawdown it stops completely — protecting your remaining capital." },
    { q: "Is this real-money trading now?", a: "Demo mode only — paper trading with real market data. Real-money execution launches soon after validation is complete." },
  ];

  return (
    <section id="faq" style={{ padding: "80px 24px" }}>
      <div className="land-faq-grid" style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>

        {/* left — text */}
        <div>
          <Chip>FAQ</Chip>
          <h2 style={{ ...h2Style, marginTop: 16 }}>Got Questions?<br /><span style={{ color: GN }}>We've Got Answers.</span></h2>
          <p style={{ fontSize: 15, color: M, lineHeight: 1.8, marginBottom: 32 }}>
            Everything you need to know about how Asymmetric AI works, what it costs, and how your funds are protected.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map((item, i) => (
              <div key={i} style={{ borderRadius: 12, border: `1px solid ${open === i ? `${GN}33` : BDR2}`, overflow: "hidden", background: open === i ? `${GN}05` : "transparent", transition: "all .18s" }}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: "transparent", border: "none", color: T, fontSize: 13, fontWeight: 800, cursor: "pointer", textAlign: "left", gap: 12 }}
                >
                  <span>{item.q}</span>
                  <span style={{ color: GN, flexShrink: 0, fontSize: 18, lineHeight: 1 }}>{open === i ? "−" : "+"}</span>
                </button>
                {open === i && (
                  <div style={{ padding: "0 18px 14px", fontSize: 13, color: M, lineHeight: 1.75, borderTop: `1px solid ${BDR2}`, paddingTop: 12 }}>
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* right — phone mockup */}
        <div className="land-faq-phone" style={{ display: "flex", justifyContent: "center" }}>
          <div style={{
            width: 220, borderRadius: 36, overflow: "hidden",
            border: "1.5px solid rgba(255,255,255,.15)",
            boxShadow: `0 40px 80px rgba(0,0,0,.6), 0 0 60px ${GN}12`,
            background: "#070a14",
            position: "relative",
          }}>
            {/* notch */}
            <div style={{ background: "#070a14", padding: "14px 0 8px", display: "flex", justifyContent: "center" }}>
              <div style={{ width: 50, height: 5, borderRadius: 99, background: "rgba(255,255,255,.18)" }} />
            </div>

            {/* phone screen */}
            <div style={{ padding: "10px 12px 20px" }}>
              {/* top bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: GN }}>Asymmetric AI</span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: GN, boxShadow: `0 0 4px ${GN}` }} />
                  <span style={{ fontSize: 8, color: GN, fontWeight: 800 }}>LIVE</span>
                </div>
              </div>

              {/* stat pills */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
                {[["Equity","$11,406",GN],[" Win Rate","72%",GN],["Drawdown","-2.1%",YL],["Trades","18W / 7L",M]].map(([l,v,c])=>(
                  <div key={String(l)} style={{ background: "rgba(255,255,255,.04)", border: `1px solid rgba(255,255,255,.07)`, borderRadius: 8, padding: "7px 8px" }}>
                    <div style={{ fontSize: 7, color: S, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em" }}>{l}</div>
                    <div style={{ fontSize: 13, fontWeight: 950, color: String(c) }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* faq list inside phone */}
              <div style={{ fontSize: 8, fontWeight: 900, color: S, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>Common Questions</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {items.map((item, i) => (
                  <div key={i} style={{
                    borderRadius: 8, border: `1px solid ${i === open ? `${GN}44` : "rgba(255,255,255,.07)"}`,
                    background: i === open ? `${GN}08` : "rgba(255,255,255,.03)",
                    padding: "7px 9px", cursor: "pointer", transition: "all .15s",
                  }} onClick={() => setOpen(i === open ? null : i)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: i === open ? GN : T, lineHeight: 1.3, flex: 1, marginRight: 4 }}>{item.q}</span>
                      <span style={{ fontSize: 10, color: GN, flexShrink: 0 }}>{i === open ? "−" : "+"}</span>
                    </div>
                    {i === open && (
                      <div style={{ fontSize: 8, color: M, lineHeight: 1.6, marginTop: 5, paddingTop: 5, borderTop: `1px solid rgba(255,255,255,.07)` }}>
                        {item.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* home bar */}
            <div style={{ padding: "8px 0 14px", display: "flex", justifyContent: "center" }}>
              <div style={{ width: 60, height: 4, borderRadius: 99, background: "rgba(255,255,255,.2)" }} />
            </div>
          </div>
        </div>

      </div>

      {/* mobile: stack vertically */}
      <style>{`.faq-grid-mobile { } @media(max-width:768px){ #faq .faq-two-col { grid-template-columns: 1fr !important; } }`}</style>
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

// ── social icon svgs ─────────────────────────────────────────────────────────
function IconInstagram({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill={color} stroke="none"/>
    </svg>
  );
}

function IconTikTok({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
    </svg>
  );
}

// ── footer ────────────────────────────────────────────────────────────────────
function Footer({ onLogin, onSignup }: { onLogin: () => void; onSignup: () => void }) {
  const [igHover, setIgHover] = React.useState(false);
  const [ttHover, setTtHover] = React.useState(false);
  const [faqOpen, setFaqOpen] = React.useState(false);
  const [faqItem, setFaqItem] = React.useState<number | null>(null);
  const [howOpen, setHowOpen] = React.useState(false);
  const [contactOpen, setContactOpen] = React.useState(false);

  const faqItems = [
    { q: "Is my money safe?", a: "Your funds never leave your exchange. You connect a trade-only API key with withdrawals disabled. We send trade signals — your exchange executes them. We cannot access, move, or withdraw your funds." },
    { q: "Can I lose money?", a: "Yes. Crypto trading involves real risk. The engine limits losses through drawdown tiers and hard stops — but no system guarantees profits. Only trade with capital you can afford to lose." },
    { q: "Which exchanges are supported?", a: "Currently Binance, Bybit, and OKX. More exchanges will be added as the platform grows." },
    { q: "What returns can I expect?", a: "Average month: +8% to +15%. Strong trending month: +20% to +30%. Choppy market: -5% to +5%. The engine protects capital first, grows it second." },
    { q: "What if the AI keeps losing?", a: "After 2 consecutive bad trades, the engine raises signal strictness automatically. At -15% drawdown it stops completely — protecting your remaining capital." },
    { q: "Is this real-money trading now?", a: "Currently in demo mode (paper trading with real market data). Real-money execution launches soon after paper validation is complete." },
  ];

  const colTitle: React.CSSProperties = {
    fontSize: 11, fontWeight: 900, color: T,
    letterSpacing: ".10em", textTransform: "uppercase", marginBottom: 16,
  };
  const link: React.CSSProperties = {
    display: "block", fontSize: 13, color: M, textDecoration: "none",
    marginBottom: 10, cursor: "pointer", transition: "color .15s",
  };

  const socials = [
    {
      label: "Instagram",
      url: "https://www.instagram.com/asymmetric_ai",
      icon: (hovered: boolean) => <IconInstagram size={20} color={hovered ? GN : "rgba(255,255,255,.65)"} />,
      hovered: igHover,
      setHovered: setIgHover,
    },
    {
      label: "TikTok",
      url: "https://www.tiktok.com/@asymmetric_ai",
      icon: (hovered: boolean) => <IconTikTok size={20} color={hovered ? GN : "rgba(255,255,255,.65)"} />,
      hovered: ttHover,
      setHovered: setTtHover,
    },
    // ── add more social icons here before launch ──────────────────────────
    // { label: "X",        url: "https://x.com/asymmetric_ai",        icon: ... },
    // { label: "Telegram", url: "https://t.me/asymmetricai",          icon: ... },
    // { label: "Discord",  url: "https://discord.gg/asymmetricai",    icon: ... },
    // { label: "LinkedIn", url: "https://linkedin.com/company/...",   icon: ... },
    // { label: "YouTube",  url: "https://youtube.com/@asymmetricai",  icon: ... },
  ];

  return (
    <footer style={{
      background: "#0d1117",
      borderTop: "1px solid rgba(255,255,255,.08)",
      padding: "48px 24px 32px",
      fontFamily: ff,
    }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>

        {/* ── top: logo + 3-col links ───────────────────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr repeat(3, auto)",
          gap: "32px 48px",
          marginBottom: 40,
        }} className="footer-grid">

          {/* brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${GN},#00b8ff)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#050814" }}>A</div>
              <span style={{ fontSize: 15, fontWeight: 900, color: T }}>Asymmetric AI</span>
            </div>
            <p style={{ fontSize: 13, color: S, lineHeight: 1.7, maxWidth: 240 }}>
              4-layer AI signal engine with automatic capital protection. Non-custodial. Your keys, always.
            </p>
          </div>

          {/* col 1 — product */}
          <div>
            <div style={colTitle}>Product</div>

            {/* How It Works — inline dropdown */}
            <span
              style={{ ...link, display: "flex", alignItems: "center", gap: 6, userSelect: "none" }}
              onClick={() => setHowOpen(o => !o)}
              onMouseEnter={e => (e.currentTarget.style.color = GN)}
              onMouseLeave={e => (e.currentTarget.style.color = M)}
            >
              How It Works <span style={{ fontSize: 10, color: GN }}>{howOpen ? "▲" : "▼"}</span>
            </span>
            {howOpen && (
              <div style={{ marginBottom: 8, borderRadius: 10, border: `1px solid ${BDR2}`, overflow: "hidden", width: 260 }}>
                {[
                  { step: "01", title: "Connect Your Exchange", body: "Link your Binance, Bybit, or OKX account with a trade-only API key. Withdrawals are always blocked — your funds never leave your exchange." },
                  { step: "02", title: "4-Layer Signal Engine", body: "Every cycle, the AI runs 4 filters: Regime (is there a trend?), Direction (which way?), Entry (right moment?), Momentum (is it starting?). All 4 must pass." },
                  { step: "03", title: "Grade A or B Trade Opens", body: "Grade A = full position. Grade B = split into T1 (60%) and T2 (40%) with separate take-profit targets. The engine sizes the trade based on your mode." },
                  { step: "04", title: "Automatic Protection", body: "Trailing stops move to breakeven at 40% of TP. At -15% drawdown the engine stops completely. Capital protection runs 24/7, no action needed from you." },
                ].map((s, i) => (
                  <div key={i} style={{ padding: "10px 12px", borderBottom: i < 3 ? `1px solid ${BDR2}` : "none", background: "rgba(0,0,0,.15)" }}>
                    <div style={{ fontSize: 9, fontWeight: 900, color: GN, letterSpacing: ".08em", marginBottom: 3 }}>STEP {s.step} — {s.title}</div>
                    <div style={{ fontSize: 11, color: M, lineHeight: 1.6 }}>{s.body}</div>
                  </div>
                ))}
              </div>
            )}

            <span style={link} onClick={onLogin} onMouseEnter={e => (e.currentTarget.style.color = GN)} onMouseLeave={e => (e.currentTarget.style.color = M)}>Log In</span>
            <span style={{ ...link, color: GN, fontWeight: 800 }} onClick={onSignup} onMouseEnter={e => (e.currentTarget.style.color = "white")} onMouseLeave={e => (e.currentTarget.style.color = GN)}>Get Early Access →</span>
          </div>

          {/* col 2 — legal */}
          <div>
            <div style={colTitle}>Legal</div>
            <a href="/terms" style={link} onMouseEnter={e => (e.currentTarget.style.color = GN)} onMouseLeave={e => (e.currentTarget.style.color = M)}>Terms of Service</a>
            <a href="/privacy" style={link} onMouseEnter={e => (e.currentTarget.style.color = GN)} onMouseLeave={e => (e.currentTarget.style.color = M)}>Privacy Policy</a>
            <a href="/risk" style={link} onMouseEnter={e => (e.currentTarget.style.color = GN)} onMouseLeave={e => (e.currentTarget.style.color = M)}>Risk Disclosure</a>
          </div>

          {/* col 3 — connect */}
          <div>
            <div style={colTitle}>Connect</div>
            <span
              style={{ ...link, display: "flex", alignItems: "center", gap: 6, userSelect: "none" }}
              onClick={() => { setFaqOpen(o => !o); setFaqItem(null); }}
              onMouseEnter={e => (e.currentTarget.style.color = GN)}
              onMouseLeave={e => (e.currentTarget.style.color = M)}
            >
              FAQ <span style={{ fontSize: 10, color: GN }}>{faqOpen ? "▲" : "▼"}</span>
            </span>

            {/* FAQ drops down right here inside the column */}
            {faqOpen && (
              <div style={{ marginBottom: 8, borderRadius: 10, border: `1px solid ${BDR2}`, overflow: "hidden", width: 260 }}>
                {faqItems.map((item, i) => (
                  <div key={i} style={{ borderBottom: i < faqItems.length - 1 ? `1px solid ${BDR2}` : "none" }}>
                    <button
                      onClick={() => setFaqItem(faqItem === i ? null : i)}
                      style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: faqItem === i ? `${GN}08` : "transparent", border: "none", color: T, fontSize: 11, fontWeight: 800, cursor: "pointer", textAlign: "left", gap: 8 }}
                    >
                      <span>{item.q}</span>
                      <span style={{ color: GN, flexShrink: 0 }}>{faqItem === i ? "−" : "+"}</span>
                    </button>
                    {faqItem === i && (
                      <div style={{ padding: "8px 12px 10px", fontSize: 11, color: M, lineHeight: 1.7, borderTop: `1px solid ${BDR2}`, background: "rgba(0,0,0,.2)" }}>
                        {item.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Contact — inline dropdown */}
            <span
              style={{ ...link, display: "flex", alignItems: "center", gap: 6, userSelect: "none" }}
              onClick={() => setContactOpen(o => !o)}
              onMouseEnter={e => (e.currentTarget.style.color = GN)}
              onMouseLeave={e => (e.currentTarget.style.color = M)}
            >
              Contact <span style={{ fontSize: 10, color: GN }}>{contactOpen ? "▲" : "▼"}</span>
            </span>
            {contactOpen && (
              <div style={{ marginBottom: 8, borderRadius: 10, border: `1px solid ${BDR2}`, padding: "14px", background: "rgba(0,0,0,.2)", width: 260 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: GN, marginBottom: 8 }}>Get in Touch</div>
                <div style={{ fontSize: 11, color: M, lineHeight: 1.7, marginBottom: 10 }}>
                  For support, questions, or partnership enquiries — reach us on Instagram or TikTok. We typically respond within 24 hours.
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <a href="https://www.instagram.com/asymmetric_ai" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, border: `1px solid ${BDR2}`, background: "rgba(255,255,255,.04)", color: M, fontSize: 11, textDecoration: "none", fontWeight: 700 }}>
                    <IconInstagram size={13} color={GN} /> Instagram
                  </a>
                  <a href="https://www.tiktok.com/@asymmetric_ai" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, border: `1px solid ${BDR2}`, background: "rgba(255,255,255,.04)", color: M, fontSize: 11, textDecoration: "none", fontWeight: 700 }}>
                    <IconTikTok size={13} color={GN} /> TikTok
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── social icons row (right-aligned) ──────────────────────── */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginBottom: 28 }}>
          <span style={{ fontSize: 12, color: S, alignSelf: "center", marginRight: 4 }}>Follow us</span>
          {socials.map(s => (
            <a
              key={s.label}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              onMouseEnter={() => s.setHovered(true)}
              onMouseLeave={() => s.setHovered(false)}
              style={{
                width: 40, height: 40, borderRadius: 10,
                border: `1px solid ${s.hovered ? `${GN}44` : "rgba(255,255,255,.10)"}`,
                background: s.hovered ? `${GN}10` : "rgba(255,255,255,.04)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .18s ease", textDecoration: "none",
              }}
            >
              {s.icon(s.hovered)}
            </a>
          ))}
        </div>

        {/* ── divider ───────────────────────────────────────────────── */}
        <div style={{ height: 1, background: "rgba(255,255,255,.07)", marginBottom: 24 }} />

        {/* ── risk disclosure ───────────────────────────────────────── */}
        <p style={{ fontSize: 13, color: "rgba(255,255,255,.35)", lineHeight: 1.9, marginBottom: 20, maxWidth: 900 }}>
          Trading cryptocurrency involves substantial risk of loss. Past performance is not indicative of future results.
          Asymmetric AI is an automated software tool — not financial advice. Only trade with capital you can afford to lose.
          You are solely responsible for all trading decisions. This platform is currently in demo mode — no real funds are at risk.
        </p>

        {/* ── copyright ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,.30)", fontWeight: 700 }}>
            © 2026 Asymmetric AI · asymetricai.com
          </span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,.25)" }}>
            Demo mode only · No real funds at risk · Non-custodial · Your keys always yours
          </span>
        </div>
      </div>

      {/* mobile responsive + smooth scroll */}
      <style>{`
        html { scroll-behavior: smooth; }
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .footer-grid > div:first-child {
            grid-column: 1 / -1;
          }
        }
        @media (max-width: 480px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}

// ── dashboard mockup ──────────────────────────────────────────────────────────
function DashboardMockup() {
  const pts = [1000,1018,1012,1034,1028,1052,1044,1068,1060,1088,1082,1106,1098,1124,1140];
  const W = 320, H = 60, P = 6;
  const min = Math.min(...pts), max = Math.max(...pts), range = max - min;
  const tx = (i: number) => P + (i / (pts.length - 1)) * (W - P * 2);
  const ty = (v: number) => H - P - ((v - min) / range) * (H - P * 2);
  const pStr = pts.map((v, i) => `${tx(i).toFixed(1)},${ty(v).toFixed(1)}`).join(" ");
  const fillD = `M${tx(0)},${H-P} L${pStr} L${tx(pts.length-1)},${H-P} Z`;

  const trades = [
    { sym: "BTC/USDT", side: "LONG",  grade: "A", pnl: "+$142.80", win: true },
    { sym: "ETH/USDT", side: "LONG",  grade: "B", pnl: "+$68.20",  win: true },
    { sym: "SOL/USDT", side: "SHORT", grade: "B", pnl: "-$31.40",  win: false },
  ];

  return (
    <section style={{ padding: "100px 24px", position: "relative", overflow: "hidden" }}>
      {/* background glow */}
      <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)", width: 800, height: 400, background: `radial-gradient(ellipse,${GN}0f,transparent 65%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "20%", right: "5%", width: 400, height: 300, background: "radial-gradient(ellipse,rgba(120,90,255,.10),transparent 65%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* heading */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <Chip>Live Dashboard</Chip>
          <h2 style={h2Style}>Everything in One View</h2>
          <p style={subStyle}>Monitor your AI, track every trade, and stay in full control — from desktop or phone.</p>
        </div>

        {/* mockup stage */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>

          {/* ── DESKTOP BROWSER (tilted 3D) ───────────────────────────────── */}
          <div className="land-dash-tilt" style={{
            width: "min(780px, 90vw)",
            transform: "perspective(1400px) rotateX(4deg) rotateY(-6deg) rotateZ(1deg)",
            transformOrigin: "center center",
            borderRadius: 16,
            overflow: "hidden",
            border: `1px solid rgba(255,255,255,.12)`,
            boxShadow: `0 60px 120px rgba(0,0,0,.7), 0 0 80px ${GN}18, 0 0 0 1px rgba(255,255,255,.05)`,
            flexShrink: 0,
          }}>
            {/* browser bar */}
            <div style={{ background: "rgba(7,10,22,1)", padding: "9px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid rgba(255,255,255,.07)` }}>
              <div style={{ display: "flex", gap: 5 }}>
                {["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />)}
              </div>
              <div style={{ flex: 1, background: "rgba(255,255,255,.05)", borderRadius: 5, padding: "3px 10px", fontSize: 9, color: S, textAlign: "center" }}>
                asymetricai.com/dashboard
              </div>
            </div>

            {/* app body */}
            <div style={{ background: "#070a14", display: "grid", gridTemplateColumns: "140px 1fr" }}>
              {/* sidebar */}
              <div style={{ background: "rgba(9,15,30,.95)", borderRight: `1px solid rgba(255,255,255,.06)`, padding: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: GN, marginBottom: 1 }}>Asymmetric AI</div>
                <div style={{ fontSize: 8, color: S, marginBottom: 12 }}>user@email.com</div>
                {[["Dashboard", true],["Market",false],["Exchange",false],["History",false],["Portfolio",false],["Mini-Asym",false]].map(([label, active]) => (
                  <div key={String(label)} style={{ padding: "6px 9px", borderRadius: 7, marginBottom: 3, fontSize: 9, fontWeight: 800, color: active ? GN : M, background: active ? `${GN}12` : "transparent", border: `1px solid ${active ? `${GN}30` : "rgba(255,255,255,.04)"}` }}>
                    {label}
                  </div>
                ))}
              </div>

              {/* content */}
              <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                {/* stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                  {[
                    { label: "Equity",     value: "$11,406", sub: "+14.06%", color: GN  },
                    { label: "Today P&L",  value: "+$210",   sub: "2 trades", color: GN  },
                    { label: "Win Rate",   value: "72%",     sub: "18W / 7L", color: GN  },
                    { label: "Drawdown",   value: "-2.1%",   sub: "Safe",    color: YL  },
                  ].map(s => (
                    <div key={s.label} style={{ background: CARD, border: `1px solid ${BDR2}`, borderRadius: 9, padding: "9px 10px" }}>
                      <div style={{ fontSize: 7, fontWeight: 900, color: S, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 3 }}>{s.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 950, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 7, color: M, marginTop: 1 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* curve + trades */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ background: CARD, border: `1px solid ${BDR2}`, borderRadius: 9, padding: "9px 10px" }}>
                    <div style={{ fontSize: 7, fontWeight: 900, color: S, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>Equity Curve</div>
                    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H }}>
                      <defs>
                        <linearGradient id="mock-g" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={GN} stopOpacity=".22" />
                          <stop offset="100%" stopColor={GN} stopOpacity=".00" />
                        </linearGradient>
                      </defs>
                      <path d={fillD} fill="url(#mock-g)" />
                      <polyline points={pStr} fill="none" stroke={GN} strokeWidth="1.6" />
                      <circle cx={tx(pts.length-1)} cy={ty(pts[pts.length-1])} r="3" fill={GN} />
                    </svg>
                  </div>
                  <div style={{ background: CARD, border: `1px solid ${BDR2}`, borderRadius: 9, padding: "9px 10px" }}>
                    <div style={{ fontSize: 7, fontWeight: 900, color: S, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>Recent Trades</div>
                    {trades.map((t, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 6, marginBottom: 6, borderBottom: i < trades.length-1 ? `1px solid ${BDR2}` : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 18, height: 18, borderRadius: 5, background: t.win ? `${GN}18` : `${RD}18`, border: `1px solid ${t.win ? `${GN}33` : `${RD}33`}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 900, color: t.win ? GN : RD }}>{t.grade}</div>
                          <div>
                            <div style={{ fontSize: 8, fontWeight: 900, color: T }}>{t.sym}</div>
                            <div style={{ fontSize: 7, color: t.side === "LONG" ? GN : RD, fontWeight: 800 }}>{t.side}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 9, fontWeight: 900, color: t.win ? GN : RD }}>{t.pnl}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI status */}
                <div style={{ background: `${GN}08`, border: `1px solid ${GN}20`, borderRadius: 9, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: GN, boxShadow: `0 0 5px ${GN}` }} />
                    <span style={{ fontSize: 8, fontWeight: 900, color: GN }}>AI RUNNING · MINI_ASYM MODE</span>
                  </div>
                  <span style={{ fontSize: 7, color: M }}>BTC/USDT · Next check 4m</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── PHONE MOCKUP (overlapping right side) ─────────────────────── */}
          <div className="land-dash-phone" style={{
            position: "absolute",
            right: "calc(50% - 520px)",
            bottom: -30,
            width: 140,
            transform: "perspective(800px) rotateX(2deg) rotateY(-4deg)",
            borderRadius: 22,
            overflow: "hidden",
            border: `1.5px solid rgba(255,255,255,.14)`,
            boxShadow: `0 40px 80px rgba(0,0,0,.7), 0 0 40px ${GN}14`,
            background: "#070a14",
          }}>
            {/* phone notch */}
            <div style={{ background: "rgba(7,10,22,1)", padding: "10px 0 6px", display: "flex", justifyContent: "center", borderBottom: `1px solid rgba(255,255,255,.06)` }}>
              <div style={{ width: 40, height: 5, borderRadius: 99, background: "rgba(255,255,255,.15)" }} />
            </div>
            {/* phone content */}
            <div style={{ padding: 8 }}>
              <div style={{ fontSize: 7, fontWeight: 900, color: GN, marginBottom: 6 }}>Asymmetric AI</div>
              {[
                { label: "Equity",    value: "$11,406", color: GN },
                { label: "Today",     value: "+$210",   color: GN },
                { label: "Win Rate",  value: "72%",     color: GN },
              ].map(s => (
                <div key={s.label} style={{ background: CARD, border: `1px solid ${BDR2}`, borderRadius: 7, padding: "6px 8px", marginBottom: 5 }}>
                  <div style={{ fontSize: 6, color: S, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em" }}>{s.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 950, color: s.color }}>{s.value}</div>
                </div>
              ))}
              <div style={{ background: `${GN}08`, border: `1px solid ${GN}22`, borderRadius: 7, padding: "6px 8px", marginTop: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: GN, boxShadow: `0 0 4px ${GN}` }} />
                  <span style={{ fontSize: 6, fontWeight: 900, color: GN }}>AI RUNNING</span>
                </div>
                <div style={{ fontSize: 6, color: M, marginTop: 2 }}>MINI_ASYM · BTC/USDT</div>
              </div>
            </div>
          </div>

          {/* ── FLOATING STAT BADGES ──────────────────────────────────────── */}
          <div className="land-dash-badge" style={{ position: "absolute", top: -20, left: "calc(50% - 480px)", background: CARD, border: `1px solid ${GN}33`, borderRadius: 12, padding: "10px 14px", boxShadow: `0 8px 24px rgba(0,0,0,.4)` }}>
            <div style={{ fontSize: 9, color: S, fontWeight: 800, marginBottom: 2 }}>THIS MONTH</div>
            <div style={{ fontSize: 18, fontWeight: 950, color: GN }}>+14.2%</div>
          </div>

          <div style={{ position: "absolute", top: 60, left: "calc(50% - 510px)", background: CARD, border: `1px solid ${BDR}`, borderRadius: 12, padding: "10px 14px", boxShadow: `0 8px 24px rgba(0,0,0,.4)` }}>
            <div style={{ fontSize: 9, color: S, fontWeight: 800, marginBottom: 2 }}>WIN RATE</div>
            <div style={{ fontSize: 18, fontWeight: 950, color: GN }}>72%</div>
          </div>

          <div style={{ position: "absolute", bottom: 20, left: "calc(50% - 490px)", background: CARD, border: `1px solid rgba(120,90,255,.35)`, borderRadius: 12, padding: "10px 14px", boxShadow: `0 8px 24px rgba(0,0,0,.4)` }}>
            <div style={{ fontSize: 9, color: S, fontWeight: 800, marginBottom: 2 }}>DRAWDOWN</div>
            <div style={{ fontSize: 18, fontWeight: 950, color: YL }}>-2.1%</div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 48, fontSize: 12, color: S }}>
          Simulated dashboard preview · Real data shown after connecting your exchange
        </div>
      </div>
    </section>
  );
}
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
      <style>{`
        html { scroll-behavior: smooth; }

        /* ── MOBILE (≤768px) ── */
        @media (max-width: 768px) {

          /* global font + spacing scale-down */
          body { font-size: 13px !important; }

          /* hero */
          .land-hero { padding: 70px 14px 32px !important; min-height: auto !important; }
          .land-hero h1 { font-size: 22px !important; line-height: 1.2 !important; margin-bottom: 12px !important; }
          .land-hero p { font-size: 13px !important; margin-bottom: 20px !important; }
          .land-hero .cta-row { flex-direction: column !important; align-items: stretch !important; gap: 8px !important; }
          .land-hero .cta-row a,
          .land-hero .cta-row button { font-size: 13px !important; padding: 11px 16px !important; text-align: center !important; }
          .land-hero .preview { margin-top: 24px !important; }
          .land-brand-name { font-size: 14px !important; letter-spacing: .10em !important; }

          /* section headings */
          h2 { font-size: 20px !important; margin-bottom: 8px !important; }
          h2 + p, section > div > p { font-size: 13px !important; }

          /* section padding */
          section { padding-top: 40px !important; padding-bottom: 40px !important; padding-left: 14px !important; padding-right: 14px !important; }

          /* chips */
          span[style*="border-radius: 999"] { font-size: 9px !important; padding: 2px 8px !important; }

          /* cards */
          div[style*="border-radius: 16px"], div[style*="border-radius: 14px"] { border-radius: 10px !important; }

          /* exchanges */
          .land-exchanges { flex-wrap: wrap !important; gap: 8px !important; justify-content: center !important; }
          .land-exchange-chip { padding: 8px 12px !important; font-size: 11px !important; }

          /* grids — single col */
          .land-grid-auto { grid-template-columns: 1fr !important; gap: 10px !important; }
          .land-engine-tabs { grid-template-columns: 1fr 1fr !important; gap: 6px !important; }
          .land-engine-detail { grid-template-columns: 1fr !important; gap: 16px !important; }
          .land-engine-tabs button { padding: 10px 8px !important; }
          .land-engine-tabs button div:first-child { font-size: 14px !important; }
          .land-engine-tabs button div:nth-child(3) { font-size: 11px !important; }

          /* dashboard mockup */
          .land-dash-tilt { transform: none !important; width: 100% !important; box-shadow: 0 20px 40px rgba(0,0,0,.5) !important; }
          .land-dash-phone { display: none !important; }
          .land-dash-badge { display: none !important; }

          /* modes */
          .land-modes-grid { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
          .land-modes-grid > div { padding: 14px 12px !important; }
          .land-modes-grid .flagship-badge { font-size: 7px !important; padding: 2px 8px !important; }

          /* FAQ */
          .land-faq-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .land-faq-phone { display: none !important; }

          /* steps */
          .land-steps-grid { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
          .land-steps-grid > div { padding: 14px 12px !important; }

          /* protection */
          .land-protection-grid { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
          .land-protection-bottom { grid-template-columns: 1fr !important; gap: 8px !important; }

          /* returns */
          .land-returns-grid { grid-template-columns: 1fr !important; gap: 8px !important; }

          /* footer */
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 20px 16px !important; }
          .footer-grid > div:first-child { grid-column: 1 / -1 !important; }
          footer { padding: 32px 14px 24px !important; }
          footer p { font-size: 11px !important; }
        }

        /* ── SMALL PHONES (≤480px) ── */
        @media (max-width: 480px) {
          .land-hero h1 { font-size: 20px !important; }
          .land-engine-tabs { grid-template-columns: 1fr 1fr !important; }
          .land-modes-grid { grid-template-columns: 1fr !important; }
          .land-steps-grid { grid-template-columns: 1fr !important; }
          .land-protection-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
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
      <DashboardMockup />
      <Divider />
      <Modes />
      <Divider />
      <HowToStart onCTA={goSignup} />
      <Divider />
      <FAQ />
      <Divider />
      <FooterCTA onCTA={goSignup} />
      <Footer onLogin={() => nav("/login")} onSignup={goSignup} />
    </div>
  );
}
