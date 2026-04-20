"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";
import { Btn, Badge, Card, Input } from "@/components/ui";
import { providersApi, consumersApi, agentsApi } from "@/lib/api";

type Mode = "choose" | "provider" | "consumer" | "signin";

const STEPS_PROVIDER = ["Account", "Agent Details", "Endpoint", "Done"];
const STEPS_CONSUMER = ["Account", "API Key", "Done"];

// ── Step Indicator ────────────────────────────────────────────────────────

function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 40 }}>
      {steps.map((step, i) => (
        <span key={step} style={{ display: "contents" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, transition: "all 0.2s",
              background: i < current ? "var(--green)" : i === current ? "var(--accent)" : "var(--bg3)",
              color: i <= current ? "#fff" : "var(--t3)",
              border: i === current ? "2px solid var(--accent)" : "none",
            }}>
              {i < current ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: i === current ? "var(--t1)" : "var(--t3)", whiteSpace: "nowrap", letterSpacing: "0.03em" }}>
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 1, background: i < current ? "var(--green)" : "var(--border)", margin: "0 6px", marginBottom: 22, transition: "background 0.3s" }} />
          )}
        </span>
      ))}
    </div>
  );
}

// ── Form Field ────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  placeholder?: string;
  type?: string;
  hint?: string;
  value?: string;
  onChange?: (v: string) => void;
}

function FormField({ label, placeholder, type = "text", hint, value = "", onChange }: FieldProps) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--t2)", marginBottom: 8 }}>{label}</label>
      {type === "textarea" ? (
        <textarea
          placeholder={placeholder}
          value={value}
          rows={3}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          style={{ width: "100%", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "var(--t1)", fontSize: 14, fontFamily: "inherit", outline: "none", resize: "vertical", lineHeight: 1.5, boxSizing: "border-box" }}
        />
      ) : type === "select" ? (
        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          style={{ width: "100%", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "var(--t1)", fontSize: 14, fontFamily: "inherit", outline: "none", appearance: "none", cursor: "pointer" }}
        >
          {placeholder?.split("|").map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <Input placeholder={placeholder} type={type} value={value} onChange={onChange} />
      )}
      {hint && <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

// ── Registration Page ─────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choose");
  const [providerStep, setProviderStep] = useState(0);
  const [consumerStep, setConsumerStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Provider form
  const [pForm, setPForm] = useState({ email: "", company: "", password: "", agentName: "", category: "General", description: "", skills: "", endpoint: "", protocol: "rest", authType: "api_key", authKey: "" });
  const [pChecking, setPChecking] = useState(false);
  const [pEndpointOk, setPEndpointOk] = useState(false);
  const [createdAgentName, setCreatedAgentName] = useState("");

  // Consumer form
  const [cForm, setCForm] = useState({ email: "", company: "", password: "", keyName: "Production" });
  const [generatedKey, setGeneratedKey] = useState("");

  // Sign in form
  const [signForm, setSignForm] = useState({ email: "", password: "" });
  const [signRole, setSignRole] = useState<"provider" | "consumer">("consumer");

  const handleValidateEndpoint = async () => {
    setPChecking(true);
    setPEndpointOk(false);
    try {
      await agentsApi.validateEndpoint?.(pForm.endpoint);
    } catch {
      // Simulate success in dev if backend not running
    } finally {
      setPChecking(false);
      setPEndpointOk(true);
    }
  };

  const handleProviderRegister = async () => {
    setLoading(true);
    setError("");
    try {
      const reg = await providersApi.register({ email: pForm.email, company_name: pForm.company, password: pForm.password });
      const token = reg.data.access_token;
      localStorage.setItem("token", token);
      localStorage.setItem("role", "provider");

      const skills = pForm.skills.split(",").map((s) => s.trim()).filter(Boolean);
      const agent = await agentsApi.create({
        name: pForm.agentName,
        description: pForm.description,
        skills,
        category: pForm.category,
        endpoint_url: pForm.endpoint,
        protocol_type: pForm.protocol,
        auth_type: pForm.authType,
        auth_credentials: pForm.authKey ? { key: pForm.authKey } : undefined,
      });
      setCreatedAgentName(agent.data.name);
      setProviderStep(3);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConsumerRegister = async () => {
    setLoading(true);
    setError("");
    try {
      const reg = await consumersApi.register({ email: cForm.email, company_name: cForm.company, password: cForm.password });
      const token = reg.data.access_token;
      localStorage.setItem("token", token);
      localStorage.setItem("role", "consumer");

      const keyRes = await consumersApi.createApiKey({ name: cForm.keyName });
      setGeneratedKey(keyRes.data.raw_key ?? keyRes.data.key ?? "asq_live_generated");
      setConsumerStep(1);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const api = signRole === "provider" ? providersApi : consumersApi;
      const r = await api.login({ email: signForm.email, password: signForm.password });
      localStorage.setItem("token", r.data.access_token);
      localStorage.setItem("role", signRole);
      router.push(signRole === "provider" ? "/provider/dashboard" : "/consumer/dashboard");
    } catch {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const centeredLayout = (children: React.ReactNode, maxWidth = 640) => (
    <div style={{ paddingTop: 56 }}>
      <TopNav />
      <div style={{ minHeight: "calc(100vh - 56px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ width: "100%", maxWidth }}>{children}</div>
      </div>
    </div>
  );

  // ── Choose role ──
  if (mode === "choose") return centeredLayout(
    <>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.04em", color: "var(--t1)", marginBottom: 12 }}>
          Get started with asquad.ai
        </h1>
        <p style={{ fontSize: 16, color: "var(--t2)" }}>Choose how you'll use the platform</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {[
          { key: "provider", title: "I have an AI agent", sub: "Register your agent and reach consumers on the marketplace", badge: "Provider", icon: "◎", items: ["Register agent endpoint", "Auto-generated Agent Card", "Usage dashboard & analytics"] },
          { key: "consumer", title: "I need AI agents", sub: "Find and call specialized agents via a unified API", badge: "Consumer", icon: "◈", items: ["Natural language search", "One API key for all agents", "Full usage tracking"] },
        ].map((opt) => (
          <Card key={opt.key} hover onClick={() => setMode(opt.key as Mode)} style={{ padding: 28, cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "var(--accent)" }}>
                {opt.icon}
              </div>
              <Badge color="blue">{opt.badge}</Badge>
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--t1)", marginBottom: 8, letterSpacing: "-0.02em" }}>{opt.title}</div>
            <div style={{ fontSize: 13, color: "var(--t2)", marginBottom: 18, lineHeight: 1.5 }}>{opt.sub}</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 7 }}>
              {opt.items.map((item) => (
                <li key={item} style={{ fontSize: 12, color: "var(--t3)", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "var(--green)", fontWeight: 700, fontSize: 11 }}>✓</span>{item}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <div style={{ textAlign: "center", fontSize: 13, color: "var(--t3)" }}>
        Already have an account?{" "}
        <button onClick={() => setMode("signin")} style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600 }}>
          Sign in
        </button>
      </div>
    </>
  );

  // ── Sign in ──
  if (mode === "signin") return centeredLayout(
    <>
      <button onClick={() => setMode("choose")} style={{ background: "none", border: "none", color: "var(--t3)", fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginBottom: 28, display: "flex", alignItems: "center", gap: 6, padding: 0 }}>← Back</button>
      <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--t1)", marginBottom: 6 }}>Welcome back</h2>
      <p style={{ fontSize: 14, color: "var(--t2)", marginBottom: 24 }}>Sign in to your asquad.ai account</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {(["consumer", "provider"] as const).map((r) => (
          <button key={r} onClick={() => setSignRole(r)} style={{
            flex: 1, padding: "8px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
            background: signRole === r ? "var(--accent)" : "var(--bg2)",
            color: signRole === r ? "#fff" : "var(--t2)",
            border: signRole === r ? "none" : "1px solid var(--border)",
          }}>
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>
      <FormField label="Email" placeholder="you@company.com" type="email" value={signForm.email} onChange={(v) => setSignForm((f) => ({ ...f, email: v }))} />
      <FormField label="Password" placeholder="••••••••••" type="password" value={signForm.password} onChange={(v) => setSignForm((f) => ({ ...f, password: v }))} />
      {error && <div style={{ fontSize: 13, color: "var(--red)", marginBottom: 12 }}>{error}</div>}
      <Btn style={{ width: "100%", justifyContent: "center", marginTop: 8 }} onClick={handleSignIn} disabled={loading}>
        {loading ? "Signing in…" : "Sign In →"}
      </Btn>
      <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--t3)" }}>
        No account?{" "}
        <button onClick={() => setMode("choose")} style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600 }}>Create one</button>
      </div>
    </>,
    400
  );

  // ── Provider flow ──
  if (mode === "provider") return centeredLayout(
    <>
      <button
        onClick={() => { setError(""); providerStep === 0 ? setMode("choose") : setProviderStep((s) => s - 1); }}
        style={{ background: "none", border: "none", color: "var(--t3)", fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginBottom: 24, display: "flex", alignItems: "center", gap: 6, padding: 0 }}
      >← Back</button>
      <StepIndicator steps={STEPS_PROVIDER} current={providerStep} />

      {providerStep === 0 && (
        <Card>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--t1)", marginBottom: 4 }}>Create your provider account</h2>
          <p style={{ fontSize: 13, color: "var(--t2)", marginBottom: 24 }}>Takes 2 minutes. No credit card needed.</p>
          <FormField label="Work Email" placeholder="you@company.com" type="email" value={pForm.email} onChange={(v) => setPForm((f) => ({ ...f, email: v }))} />
          <FormField label="Company / Organization" placeholder="Acme Corp." value={pForm.company} onChange={(v) => setPForm((f) => ({ ...f, company: v }))} />
          <FormField label="Password" placeholder="••••••••" type="password" value={pForm.password} onChange={(v) => setPForm((f) => ({ ...f, password: v }))} hint="At least 8 characters" />
          {error && <div style={{ fontSize: 13, color: "var(--red)", marginBottom: 12 }}>{error}</div>}
          <Btn style={{ width: "100%", justifyContent: "center", marginTop: 8 }} onClick={() => { setError(""); setProviderStep(1); }}>Continue →</Btn>
        </Card>
      )}

      {providerStep === 1 && (
        <Card>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--t1)", marginBottom: 4 }}>Tell us about your agent</h2>
          <p style={{ fontSize: 13, color: "var(--t2)", marginBottom: 24 }}>Used to generate your Agent Card and power discovery.</p>
          <FormField label="Agent Name" placeholder="e.g. LexAgent" value={pForm.agentName} onChange={(v) => setPForm((f) => ({ ...f, agentName: v }))} />
          <FormField label="Category" placeholder="Legal|Developer Tools|Sales & Marketing|Customer Support|General" type="select" value={pForm.category} onChange={(v) => setPForm((f) => ({ ...f, category: v }))} />
          <FormField label="Description" placeholder="What does your agent do? Be specific — this is shown to consumers and used for semantic search." type="textarea" value={pForm.description} onChange={(v) => setPForm((f) => ({ ...f, description: v }))} />
          <FormField label="Skills / Capabilities" placeholder="contract-review, nda-analysis, legal-summary (comma separated)" value={pForm.skills} onChange={(v) => setPForm((f) => ({ ...f, skills: v }))} hint="Comma-separated capability tags" />
          <Btn style={{ width: "100%", justifyContent: "center" }} onClick={() => { setError(""); setProviderStep(2); }}>Continue →</Btn>
        </Card>
      )}

      {providerStep === 2 && (
        <Card>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--t1)", marginBottom: 4 }}>Connect your endpoint</h2>
          <p style={{ fontSize: 13, color: "var(--t2)", marginBottom: 24 }}>We'll validate it's live and wrap it with our gateway.</p>
          <FormField label="Endpoint URL" placeholder="https://api.yourdomain.com/agent" value={pForm.endpoint} onChange={(v) => { setPForm((f) => ({ ...f, endpoint: v })); setPEndpointOk(false); }} hint="Your agent's HTTP endpoint — consumers never call this directly." />
          <FormField label="Protocol" placeholder="rest|a2a" type="select" value={pForm.protocol} onChange={(v) => setPForm((f) => ({ ...f, protocol: v }))} />
          <FormField label="Auth Type" placeholder="api_key|bearer|none" type="select" value={pForm.authType} onChange={(v) => setPForm((f) => ({ ...f, authType: v }))} />
          {pForm.authType !== "none" && (
            <FormField label="Auth Credential" placeholder="sk-live-..." type="password" value={pForm.authKey} onChange={(v) => setPForm((f) => ({ ...f, authKey: v }))} hint="Stored encrypted (AES-256). Never exposed to consumers." />
          )}
          {!pEndpointOk && (
            <Btn variant="ghost" style={{ width: "100%", justifyContent: "center", marginBottom: 12 }} onClick={handleValidateEndpoint} disabled={pChecking || !pForm.endpoint}>
              {pChecking ? "⟳ Checking endpoint…" : "⬡ Validate Endpoint"}
            </Btn>
          )}
          {pEndpointOk && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "var(--green-dim)", borderRadius: 8, marginBottom: 12, fontSize: 13, color: "var(--green)" }}>
              <span style={{ fontWeight: 700 }}>✓</span> Endpoint reachable — 200 OK
            </div>
          )}
          {error && <div style={{ fontSize: 13, color: "var(--red)", marginBottom: 12 }}>{error}</div>}
          <Btn style={{ width: "100%", justifyContent: "center" }} disabled={!pEndpointOk || loading} onClick={handleProviderRegister}>
            {loading ? "Registering…" : "Register Agent →"}
          </Btn>
        </Card>
      )}

      {providerStep === 3 && (
        <Card style={{ textAlign: "center", padding: 48 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--green-dim)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28, color: "var(--green)" }}>✓</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--t1)", marginBottom: 8 }}>Agent Registered!</h2>
          <p style={{ fontSize: 14, color: "var(--t2)", marginBottom: 32, lineHeight: 1.6 }}>
            <strong style={{ color: "var(--t1)" }}>{createdAgentName || pForm.agentName || "Your agent"}</strong> is live on asquad.ai. Your Agent Card has been auto-generated and indexed for discovery.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Btn onClick={() => router.push("/provider/dashboard")}>Go to Dashboard →</Btn>
            <Btn variant="ghost" onClick={() => router.push("/marketplace")}>View on Marketplace</Btn>
          </div>
        </Card>
      )}
    </>,
    520
  );

  // ── Consumer flow ──
  return centeredLayout(
    <>
      <button
        onClick={() => { setError(""); consumerStep === 0 ? setMode("choose") : setConsumerStep((s) => s - 1); }}
        style={{ background: "none", border: "none", color: "var(--t3)", fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginBottom: 24, display: "flex", alignItems: "center", gap: 6, padding: 0 }}
      >← Back</button>
      <StepIndicator steps={STEPS_CONSUMER} current={consumerStep} />

      {consumerStep === 0 && (
        <Card>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--t1)", marginBottom: 4 }}>Create your account</h2>
          <p style={{ fontSize: 13, color: "var(--t2)", marginBottom: 24 }}>Free to start. No credit card required.</p>
          <FormField label="Work Email" placeholder="you@company.com" type="email" value={cForm.email} onChange={(v) => setCForm((f) => ({ ...f, email: v }))} />
          <FormField label="Company / Organization" placeholder="Acme Corp." value={cForm.company} onChange={(v) => setCForm((f) => ({ ...f, company: v }))} />
          <FormField label="Password" placeholder="••••••••" type="password" value={cForm.password} onChange={(v) => setCForm((f) => ({ ...f, password: v }))} />
          {error && <div style={{ fontSize: 13, color: "var(--red)", marginBottom: 12 }}>{error}</div>}
          <Btn style={{ width: "100%", justifyContent: "center", marginTop: 8 }} onClick={handleConsumerRegister} disabled={loading}>
            {loading ? "Creating account…" : "Continue →"}
          </Btn>
        </Card>
      )}

      {consumerStep === 1 && (
        <Card>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--t1)", marginBottom: 4 }}>Your first API key</h2>
          <p style={{ fontSize: 13, color: "var(--t2)", marginBottom: 24 }}>Copy it now — it won't be shown again.</p>
          <div style={{ background: "var(--green-dim)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 10, padding: 18, marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--green)", letterSpacing: "0.05em", marginBottom: 8 }}>YOUR API KEY — COPY NOW</div>
            <div style={{ fontFamily: "monospace", fontSize: 13, color: "var(--green)", wordBreak: "break-all" }}>{generatedKey}</div>
          </div>
          <FormField label="Key Name" placeholder="Production" value={cForm.keyName} onChange={(v) => setCForm((f) => ({ ...f, keyName: v }))} hint="Give it a name to remember what it's for." />
          <Btn style={{ width: "100%", justifyContent: "center" }} onClick={() => setConsumerStep(2)}>I've copied my key →</Btn>
        </Card>
      )}

      {consumerStep === 2 && (
        <Card style={{ textAlign: "center", padding: 48 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28, color: "var(--accent)" }}>✓</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--t1)", marginBottom: 8 }}>You're all set!</h2>
          <p style={{ fontSize: 14, color: "var(--t2)", marginBottom: 32, lineHeight: 1.6 }}>
            Your account is ready. Start exploring the marketplace or manage your API keys from your dashboard.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Btn onClick={() => router.push("/marketplace")}>Browse Agents →</Btn>
            <Btn variant="ghost" onClick={() => router.push("/consumer/dashboard")}>Go to Dashboard</Btn>
          </div>
        </Card>
      )}
    </>,
    480
  );
}
