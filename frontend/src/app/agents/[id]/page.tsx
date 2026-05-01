"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import TopNav from "@/components/TopNav";
import { Btn, Badge, Card, StatCard, Input, SuccessBar } from "@/components/ui";
import { agentsApi, gatewayApi } from "@/lib/api";

interface AgentFull {
  id: string;
  name: string;
  description: string;
  skills: string[];
  category: string;
  protocol_type: "a2a" | "rest";
  total_calls: number;
  avg_latency_ms: number;
  success_rate: number;
  provider_name?: string;
  agent_card?: Record<string, unknown>;
  status?: string;
}

// ── Try It Playground ─────────────────────────────────────────────────────

function TryItPlayground({ agent }: { agent: AgentFull }) {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResponse(null);
    try {
      const r = await gatewayApi.call(agent.id, input, "");
      const task = r.data?.result;
      const text =
        task?.artifacts?.[0]?.parts?.[0]?.text ??
        task?.status?.message?.parts?.[0]?.text ??
        JSON.stringify(r.data, null, 2);
      setResponse(text);
    } catch {
      setResponse(`(Simulated) ${agent.description} — This agent is ready to handle your request via the asquad.ai gateway.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ marginTop: 24 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t2)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
        Try it — Playground
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <Input placeholder={`Ask ${agent.name} something…`} value={input} onChange={setInput} style={{ flex: 1 }} />
        <Btn onClick={handleSend} disabled={loading || !input.trim()}>
          {loading ? "…" : "Send"}
        </Btn>
      </div>
      {loading && (
        <div style={{ padding: 16, background: "var(--bg3)", borderRadius: 8, fontSize: 13, color: "var(--t3)" }}>
          <span style={{ display: "inline-block", animation: "pulse 1s infinite" }}>Calling agent via gateway…</span>
        </div>
      )}
      {response && (
        <div style={{ padding: 16, background: "var(--bg3)", borderRadius: 8, fontSize: 14, color: "var(--t1)", lineHeight: 1.6 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", marginBottom: 8, letterSpacing: "0.05em" }}>
            RESPONSE · {agent.name}
          </div>
          {response}
        </div>
      )}
    </Card>
  );
}

// ── Agent Detail Page ─────────────────────────────────────────────────────

export default function AgentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [agent, setAgent] = useState<AgentFull | null>(null);
  const [tab, setTab] = useState<"overview" | "agent-card" | "quickstart">("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    agentsApi
      .get(id)
      .then((r) => setAgent(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ paddingTop: 56 }}>
        <TopNav />
        <div style={{ textAlign: "center", padding: "120px 0", color: "var(--t3)" }}>Loading…</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div style={{ paddingTop: 56 }}>
        <TopNav />
        <div style={{ textAlign: "center", padding: "120px 0", color: "var(--t3)" }}>Agent not found.</div>
      </div>
    );
  }

  const agentCard = agent.agent_card ?? {
    schema_version: "1.0",
    name: agent.name,
    description: agent.description,
    provider: { organization: agent.provider_name ?? "Unknown" },
    skills: agent.skills.map((s) => ({ id: s, name: s })),
    endpoint: `https://api.asquad.ai/v1/agents/${agent.id}/a2a`,
    protocol: agent.protocol_type,
    capabilities: { streaming: agent.protocol_type === "a2a", async: false },
  };

  const pythonCode = `import httpx

response = httpx.post(
    "https://api.asquad.ai/v1/agents/${agent.id}/a2a",
    headers={"Authorization": "Bearer asq_live_xxxxxxxxxxxx"},
    json={
        "jsonrpc": "2.0",
        "method": "tasks/send",
        "id": "1",
        "params": {
            "message": {
                "role": "user",
                "parts": [{"text": "Your request here"}]
            }
        }
    }
)
print(response.json())`;

  const curlCode = `curl -X POST https://api.asquad.ai/v1/agents/${agent.id}/a2a \\
  -H "Authorization: Bearer asq_live_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","method":"tasks/send","id":"1",
       "params":{"message":{"role":"user","parts":[{"text":"Your request"}]}}}'`;

  return (
    <div style={{ paddingTop: 56 }}>
      <TopNav />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 5vw 60px" }}>
        {/* Back */}
        <button
          onClick={() => router.push("/marketplace")}
          style={{ background: "none", border: "none", color: "var(--t3)", fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginBottom: 24, display: "flex", alignItems: "center", gap: 6, padding: 0 }}
        >
          ← Back to Marketplace
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
          {/* ── Left ── */}
          <div>
            {/* Agent header card */}
            <Card style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14, background: "var(--accent-dim)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, fontWeight: 800, color: "var(--accent)", flexShrink: 0,
                }}>
                  {agent.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                    <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--t1)", margin: 0 }}>
                      {agent.name}
                    </h1>
                    <Badge color={agent.status === "active" ? "green" : "amber"}>{agent.status ?? "active"}</Badge>
                    <Badge color={agent.protocol_type === "a2a" ? "blue" : "default"}>{(agent.protocol_type ?? "rest").toUpperCase()}</Badge>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--t3)", marginBottom: 10 }}>by {agent.provider_name ?? "Unknown"}</div>
                  <p style={{ fontSize: 15, color: "var(--t2)", lineHeight: 1.6, margin: 0 }}>{agent.description}</p>
                </div>
                <Btn onClick={() => router.push(localStorage.getItem("logged_in") ? "/dashboard?section=api-keys" : "/register")}>Use This Agent →</Btn>
              </div>
            </Card>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
              {(["overview", "agent-card", "quickstart"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    background: "none", border: "none",
                    borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
                    padding: "10px 20px", fontSize: 13,
                    fontWeight: tab === t ? 600 : 500,
                    color: tab === t ? "var(--t1)" : "var(--t3)",
                    cursor: "pointer", fontFamily: "inherit",
                    textTransform: "capitalize", transition: "all 0.15s", marginBottom: -1,
                  }}
                >
                  {t.replace("-", " ")}
                </button>
              ))}
            </div>

            {/* Tab: overview */}
            {tab === "overview" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
                  <StatCard label="Total Calls" value={agent.total_calls.toLocaleString()} />
                  <StatCard label="Avg Latency" value={agent.avg_latency_ms >= 1000 ? `${(agent.avg_latency_ms / 1000).toFixed(1)}s` : `${agent.avg_latency_ms}ms`} />
                  <StatCard label="Success Rate" value={`${Math.round(agent.success_rate * 100)}%`} accent={agent.success_rate >= 0.95} />
                </div>
                <Card style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t3)", marginBottom: 12 }}>SKILLS & CAPABILITIES</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {agent.skills.map((s) => <Badge key={s} color="blue">{s}</Badge>)}
                  </div>
                </Card>
                <TryItPlayground agent={agent} />
              </div>
            )}

            {/* Tab: agent-card */}
            {tab === "agent-card" && (
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t2)" }}>Auto-generated A2A Agent Card</div>
                  <Badge color="green">A2A Spec v1.0</Badge>
                </div>
                <pre style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.7, overflow: "auto", background: "var(--bg3)", padding: 16, borderRadius: 8, margin: 0 }}>
                  {JSON.stringify(agentCard, null, 2)}
                </pre>
              </Card>
            )}

            {/* Tab: quickstart */}
            {tab === "quickstart" && (
              <Card>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t2)", marginBottom: 16 }}>Call this agent in your code</div>
                {[{ lang: "Python", code: pythonCode }, { lang: "cURL", code: curlCode }].map(({ lang, code }) => (
                  <div key={lang} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--t3)", letterSpacing: "0.05em", marginBottom: 8 }}>{lang}</div>
                    <pre style={{ fontSize: 12, color: "var(--green)", background: "var(--bg3)", padding: 16, borderRadius: 8, overflow: "auto", margin: 0, lineHeight: 1.6 }}>
                      {code}
                    </pre>
                  </div>
                ))}
              </Card>
            )}
          </div>

          {/* ── Right sidebar ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 72 }}>
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--t3)", marginBottom: 14, letterSpacing: "0.05em" }}>AGENT INFO</div>
              {[
                { label: "Category", value: agent.category },
                { label: "Protocol", value: (agent.protocol_type ?? "rest").toUpperCase() },
                { label: "Status", value: agent.status ?? "active" },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: "var(--t3)" }}>{label}</span>
                  <span style={{ fontSize: 13, color: "var(--t1)", fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </Card>

            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--t3)", marginBottom: 14, letterSpacing: "0.05em" }}>SUCCESS RATE</div>
              <SuccessBar rate={agent.success_rate} />
              <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 8 }}>Based on last 30 days</div>
            </Card>

            <Card style={{ padding: 20, background: "var(--accent-dim)", border: "1px solid rgba(75,107,251,0.2)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)", marginBottom: 8 }}>Start using this agent</div>
              <div style={{ fontSize: 13, color: "var(--t2)", marginBottom: 16 }}>Get an API key and start calling in minutes.</div>
              <Btn style={{ width: "100%", justifyContent: "center" }} onClick={() => router.push(localStorage.getItem("logged_in") ? "/dashboard?section=api-keys" : "/register")}>
                Use This Agent →
              </Btn>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
