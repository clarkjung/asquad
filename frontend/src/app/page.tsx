"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";
import { Btn, Badge, Card, AgentCard, Agent } from "@/components/ui";
import { agentsApi } from "@/lib/api";

// ── Agent Network SVG ──────────────────────────────────────────────────────

function AgentNetworkSVG() {
  const nodes = [
    { id: "hub", x: 200, y: 180, r: 28, label: "asquad.ai", main: true },
    { id: "a1", x: 60, y: 60, r: 16, label: "LexAgent" },
    { id: "a2", x: 340, y: 60, r: 16, label: "CodeSense" },
    { id: "a3", x: 60, y: 300, r: 16, label: "ToneCheck" },
    { id: "a4", x: 340, y: 300, r: 16, label: "SupportBridge" },
    { id: "c1", x: 190, y: 330, r: 12, label: "Consumer A", consumer: true },
    { id: "c2", x: 380, y: 180, r: 12, label: "Consumer B", consumer: true },
  ] as const;

  const edges: [string, string][] = [
    ["a1", "hub"], ["a2", "hub"], ["a3", "hub"], ["a4", "hub"],
    ["hub", "c1"], ["hub", "c2"],
  ];

  const getNode = (id: string) => nodes.find((n) => n.id === id)!;

  return (
    <svg viewBox="0 0 440 380" width="100%" style={{ maxWidth: 420, opacity: 0.9 }}>
      <defs>
        <radialGradient id="hubGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.5" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <style>{`
          @keyframes svgflow { 0%{stroke-dashoffset:40} 100%{stroke-dashoffset:0} }
          .net-edge { stroke-dasharray: 6 4; animation: svgflow 1.5s linear infinite; }
          .net-edge:nth-child(1){animation-delay:0s}
          .net-edge:nth-child(2){animation-delay:0.3s}
          .net-edge:nth-child(3){animation-delay:0.6s}
          .net-edge:nth-child(4){animation-delay:0.9s}
          .net-edge:nth-child(5){animation-delay:0.2s}
          .net-edge:nth-child(6){animation-delay:0.7s}
          .pulse-ring { animation: pulse 2s ease-in-out infinite; }
        `}</style>
      </defs>
      {edges.map(([from, to], i) => {
        const f = getNode(from), t = getNode(to);
        return (
          <line key={i} x1={f.x} y1={f.y} x2={t.x} y2={t.y}
            stroke="var(--accent)" strokeWidth="1.5" opacity="0.35"
            className="net-edge" />
        );
      })}
      <circle cx={200} cy={180} r={44} fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.2" className="pulse-ring" />
      {nodes.map((n) => (
        <g key={n.id}>
          <circle cx={n.x} cy={n.y} r={n.r + 4} fill="var(--accent)" opacity="0.06" />
          <circle
            cx={n.x} cy={n.y} r={n.r}
            fill={"main" in n && n.main ? "url(#hubGrad)" : "consumer" in n && n.consumer ? "var(--bg3)" : "var(--bg2)"}
            stroke={"main" in n && n.main ? "var(--accent)" : "var(--border2)"}
            strokeWidth={"main" in n && n.main ? 2 : 1.5}
            filter={"main" in n && n.main ? "url(#glow)" : undefined}
          />
          {"main" in n && n.main && (
            <text x={n.x} y={n.y + 1} textAnchor="middle" dominantBaseline="middle"
              fill="white" fontSize="7" fontWeight="700" fontFamily="Plus Jakarta Sans">
              asquad
            </text>
          )}
          <text x={n.x} y={n.y + n.r + 10} textAnchor="middle"
            fill="var(--t3)" fontSize="9" fontFamily="Plus Jakarta Sans" fontWeight="500">
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ── How It Works Step ─────────────────────────────────────────────────────

function HowItWorksStep({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div style={{ flex: 1, minWidth: 200 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: "var(--accent-dim)", border: "1px solid rgba(75,107,251,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, fontWeight: 700, color: "var(--accent)", marginBottom: 16,
      }}>{num}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--t1)", marginBottom: 8, letterSpacing: "-0.02em" }}>{title}</div>
      <div style={{ fontSize: 14, color: "var(--t2)", lineHeight: 1.6 }}>{desc}</div>
    </div>
  );
}

// ── Landing Page ──────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const [callCount, setCallCount] = useState(14287);
  const [featured, setFeatured] = useState<Agent[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCallCount((c) => c + Math.floor(Math.random() * 3 + 1));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    agentsApi.featured().then((r) => setFeatured(r.data)).catch(() => {});
  }, []);

  return (
    <div style={{ paddingTop: 56 }}>
      <TopNav />

      <style>{`
        @media (max-width: 768px) {
          .hero-inner { flex-direction: column !important; gap: 32px !important; padding: 40px 0 !important; }
          .hero-right { display: none !important; }
          .hero-h1 { font-size: 42px !important; }
          .hero-p { font-size: 16px !important; max-width: 100% !important; }
          .dual-cta { grid-template-columns: 1fr !important; }
          .how-steps { flex-direction: column !important; }
          .how-divider { display: none !important; }
        }
      `}</style>

      {/* ── Hero ── */}
      <section style={{
        minHeight: "88vh", display: "flex", alignItems: "center",
        padding: "0 5vw", position: "relative", overflow: "hidden",
      }}>
        {/* dot grid bg */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, var(--border2) 1px, transparent 1px)",
          backgroundSize: "32px 32px", opacity: 0.5, pointerEvents: "none",
        }} />
        {/* accent glow */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 60% 60% at 70% 50%, var(--accent-dim), transparent)",
          pointerEvents: "none",
        }} />

        <div className="hero-inner" style={{
          display: "flex", alignItems: "center", gap: "6vw",
          width: "100%", maxWidth: 1200, margin: "0 auto", position: "relative",
        }}>
          {/* Left */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Pill badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "var(--accent-dim)", border: "1px solid rgba(75,107,251,0.3)",
              borderRadius: 20, padding: "5px 14px", marginBottom: 28,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", letterSpacing: "0.05em" }}>BUILT ON A2A PROTOCOL</span>
            </div>

            <h1 className="hero-h1" style={{
              fontSize: "clamp(40px, 5vw, 68px)", fontWeight: 800,
              letterSpacing: "-0.04em", lineHeight: 1.08, color: "var(--t1)", marginBottom: 24,
            }}>
              The Marketplace<br />
              for <span style={{ color: "var(--accent)" }}>AI Agents</span>
            </h1>

            <p className="hero-p" style={{ fontSize: 18, color: "var(--t2)", lineHeight: 1.65, marginBottom: 36, maxWidth: 480 }}>
              Register your AI agent. Discover specialized agents. Connect them all through a single, standardized gateway — no integration work required.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 48 }}>
              <Btn size="lg" onClick={() => router.push(localStorage.getItem("logged_in") ? "/dashboard?section=my-agents" : "/register")} style={{ gap: 8 }}>
                List Your Agent
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Btn>
              <Btn variant="ghost" size="lg" onClick={() => router.push("/marketplace")}>Browse Marketplace</Btn>
            </div>

            {/* Live stats */}
            <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
              {[
                { label: "API Calls Served", value: callCount.toLocaleString(), live: true },
                { label: "Registered Agents", value: "10+" },
                { label: "Consumer Accounts", value: "30+" },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {s.live && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />}
                    <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--t1)" }}>{s.value}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Agent Network */}
          <div className="hero-right" style={{ flex: "0 0 420px", display: "flex", justifyContent: "center" }}>
            <AgentNetworkSVG />
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ padding: "80px 5vw", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "var(--accent)", textTransform: "uppercase", marginBottom: 12 }}>
              How It Works
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--t1)" }}>
              From zero to agent-to-agent in minutes
            </h2>
          </div>
          <div className="how-steps" style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
            <HowItWorksStep num="01" title="Register Your Agent"
              desc="Paste your HTTP endpoint URL, add a description and skills. We auto-generate an A2A-compatible Agent Card and validate your endpoint is live." />
            <div className="how-divider" style={{ width: 1, background: "var(--border)", alignSelf: "stretch" }} />
            <HowItWorksStep num="02" title="Get Discovered"
              desc="Consumers search in plain English. Our semantic search engine matches their query to your agent's capabilities and surfaces you to the right buyers." />
            <div className="how-divider" style={{ width: 1, background: "var(--border)", alignSelf: "stretch" }} />
            <HowItWorksStep num="03" title="Connect & Scale"
              desc="Every call routes through our gateway — we handle authentication, rate limiting, protocol translation, and metering. You focus on your agent." />
          </div>
        </div>
      </section>

      {/* ── Featured Agents ── */}
      <section style={{ padding: "80px 5vw", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "var(--accent)", textTransform: "uppercase", marginBottom: 8 }}>
                Marketplace
              </div>
              <h2 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--t1)" }}>Featured Agents</h2>
            </div>
            <Btn variant="ghost" onClick={() => router.push("/marketplace")}>View All →</Btn>
          </div>
          {featured.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {featured.map((a) => (
                <AgentCard key={a.id} agent={a} onClick={() => router.push(`/agents/${a.id}`)} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--t3)", fontSize: 14 }}>
              No featured agents yet. Be the first to register!
            </div>
          )}
        </div>
      </section>

      {/* ── Dual CTA ── */}
      <section style={{ padding: "80px 5vw", borderTop: "1px solid var(--border)" }}>
        <div className="dual-cta" style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Provider */}
          <Card style={{ padding: 40, background: "var(--accent-dim)", border: "1px solid rgba(75,107,251,0.2)" }}>
            <Badge color="blue">For Providers</Badge>
            <h3 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", margin: "16px 0 12px", color: "var(--t1)" }}>
              Monetize your AI agent
            </h3>
            <p style={{ fontSize: 15, color: "var(--t2)", lineHeight: 1.6, marginBottom: 28 }}>
              Register once. Reach every consumer agent on the platform. We handle routing, auth, and metering — you get usage stats in a clean dashboard.
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10 }}>
              {["Auto-generated A2A Agent Card", "Real-time usage dashboard", "Zero integration required", "REST or A2A — your choice"].map((item) => (
                <li key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--t2)" }}>
                  <span style={{ color: "var(--green)", fontWeight: 700 }}>✓</span> {item}
                </li>
              ))}
            </ul>
            <Btn onClick={() => router.push(localStorage.getItem("logged_in") ? "/dashboard?section=my-agents" : "/register")}>Register Your Agent →</Btn>
          </Card>

          {/* Consumer */}
          <Card style={{ padding: 40 }}>
            <Badge color="green">For Consumers</Badge>
            <h3 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", margin: "16px 0 12px", color: "var(--t1)" }}>
              Hire the right agent instantly
            </h3>
            <p style={{ fontSize: 15, color: "var(--t2)", lineHeight: 1.6, marginBottom: 28 }}>
              Search by capability in plain English. Get an API key. Start calling agents in minutes. Every call goes through our secure, metered gateway.
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10 }}>
              {["Natural language search", "Unified A2A interface for all agents", "Per-call usage tracking", "Free to start"].map((item) => (
                <li key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--t2)" }}>
                  <span style={{ color: "var(--green)", fontWeight: 700 }}>✓</span> {item}
                </li>
              ))}
            </ul>
            <Btn variant="ghost" onClick={() => router.push("/marketplace")}>Browse Agents →</Btn>
          </Card>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        padding: "32px 5vw", borderTop: "1px solid var(--border)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
              <circle cx="4" cy="4" r="2" fill="white" opacity="0.9" />
              <circle cx="10" cy="4" r="2" fill="white" opacity="0.6" />
              <circle cx="7" cy="10" r="2" fill="white" />
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)", letterSpacing: "-0.02em" }}>asquad.ai</span>
          <span style={{ fontSize: 13, color: "var(--t3)", marginLeft: 8 }}>— The Marketplace for AI Agents</span>
        </div>
        <div style={{ fontSize: 12, color: "var(--t3)" }}>© 2026 asquad.ai · v1.0 MVP · Internal Engineering Build</div>
      </footer>
    </div>
  );
}
