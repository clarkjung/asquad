"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TopNav from "@/components/TopNav";
import { Btn, Badge, Card, StatCard, MiniChart, SuccessBar, LatencyBar, Input } from "@/components/ui";
import { agentsApi, providersApi, consumersApi } from "@/lib/api";

interface Agent {
  id: string;
  name: string;
  category: string;
  status: string;
  total_calls: number;
  avg_latency_ms: number;
  success_rate: number;
}

interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  is_active: boolean;
  created_at: string;
  raw?: string;
}

interface Usage {
  total_calls: number;
  week_calls: number;
  calls_last_minute: number;
  limit_rpm: number;
  remaining_rpm: number;
  chart_data: number[];
  chart_labels: string[];
}

interface AgentStats {
  total_calls: number;
  week_calls: number;
  avg_latency: number;
  success_rate: number;
  chart_data: number[];
  chart_labels: string[];
  recent_calls: { id: string; time: string; consumer: string; status: "success" | "error"; latency: number }[];
}

type Section = "overview" | "my-agents" | "api-keys" | "usage";

function SidebarLink({ label, icon, badge, active, onClick }: { label: string; icon: string; badge?: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 20px", cursor: "pointer", width: "100%", textAlign: "left",
      background: active ? "var(--accent-dim)" : "transparent",
      borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
      borderTop: "none", borderRight: "none", borderBottom: "none",
      transition: "all 0.15s", fontFamily: "inherit",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 14, opacity: 0.7 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? "var(--t1)" : "var(--t2)" }}>{label}</span>
      </div>
      {badge && <span style={{ fontSize: 10, fontWeight: 700, background: "var(--accent)", color: "#fff", padding: "1px 6px", borderRadius: 8 }}>{badge}</span>}
    </button>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [section, setSection] = useState<Section>((searchParams.get("section") as Section) ?? "overview");
  const [companyName, setCompanyName] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentStats, setAgentStats] = useState<AgentStats | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("logged_in")) {
      router.push("/register");
      return;
    }
    loadAll();
  }, [router]);

  const loadAll = async () => {
    try {
      const [meR, agentsR, keysR, usageR] = await Promise.all([
        providersApi.me(),
        providersApi.myAgents(),
        consumersApi.listApiKeys(),
        consumersApi.usage(),
      ]);
      setCompanyName(meR.data.company_name ?? "");
      const list = agentsR.data as Agent[];
      setAgents(list);
      setApiKeys(keysR.data);
      const u = usageR.data;
      setUsage({
        total_calls: u.total_calls ?? 0,
        week_calls: u.calls_this_week ?? 0,
        calls_last_minute: u.calls_last_minute ?? 0,
        limit_rpm: u.limit_rpm ?? 60,
        remaining_rpm: u.remaining_rpm ?? 60,
        chart_data: u.chart_data ?? [0, 0, 0, 0, 0, 0, 0],
        chart_labels: u.chart_labels ?? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      });
      if (list.length > 0) {
        const s = (await agentsApi.stats(list[0].id)).data;
        setAgentStats({
          total_calls: s.total_calls,
          week_calls: s.calls_this_week,
          avg_latency: Math.round(s.avg_latency_ms),
          success_rate: s.success_rate,
          chart_data: s.chart_data?.length ? s.chart_data : [0, 0, 0, 0, 0, 0, 0],
          chart_labels: s.chart_labels?.length ? s.chart_labels : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          recent_calls: (s.recent_calls ?? []).map((c: { time: string; consumer: string; status: string; latency_ms: number }, i: number) => ({
            id: String(i),
            time: new Date(c.time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            consumer: c.consumer,
            status: c.status as "success" | "error",
            latency: c.latency_ms,
          })),
        });
      }
    } catch { /* not logged in or backend down */ }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const r = await consumersApi.createApiKey({ name: newKeyName });
      setApiKeys((ks) => [{ ...r.data, raw: r.data.raw_key }, ...ks]);
      setNewKeyName("");
      setShowNewKey(false);
    } finally { setCreating(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("provider_token");
    localStorage.removeItem("consumer_token");
    localStorage.removeItem("logged_in");
    router.push("/");
  };

  const nav = [
    { id: "overview" as Section, label: "Overview", icon: "◈" },
    { id: "my-agents" as Section, label: "My Agents", icon: "◎", badge: agents.length > 0 ? String(agents.length) : undefined },
    { id: "api-keys" as Section, label: "API Keys", icon: "⚿", badge: apiKeys.filter((k) => k.is_active).length > 0 ? String(apiKeys.filter((k) => k.is_active).length) : undefined },
    { id: "usage" as Section, label: "Usage", icon: "▲" },
  ];

  return (
    <div style={{ paddingTop: 56 }}>
      <TopNav />
      <div style={{ display: "flex", minHeight: "calc(100vh - 56px)" }}>

        {/* Sidebar */}
        <div style={{ width: 220, flexShrink: 0, borderRight: "1px solid var(--border)", padding: "28px 0", position: "sticky", top: 56, height: "calc(100vh - 56px)", overflowY: "auto" }}>
          <div style={{ padding: "0 20px 20px", borderBottom: "1px solid var(--border)", marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)" }}>Dashboard</div>
            {companyName && <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 2 }}>{companyName}</div>}
          </div>
          {nav.map((item) => (
            <SidebarLink key={item.id} label={item.label} icon={item.icon} badge={item.badge} active={section === item.id} onClick={() => setSection(item.id)} />
          ))}
          <div style={{ margin: "16px 12px 0", borderTop: "1px solid var(--border)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <Btn size="sm" style={{ width: "100%", justifyContent: "center" }} onClick={() => router.push("/marketplace")}>Browse Agents</Btn>
            <button onClick={handleLogout} style={{ width: "100%", padding: "8px", fontSize: 12, color: "var(--t3)", background: "none", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>Sign Out</button>
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, minWidth: 0, padding: "32px 40px", overflowY: "auto" }}>

          {/* ── Overview ── */}
          {section === "overview" && (
            <>
              <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--t1)", marginBottom: 24 }}>Overview</h1>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
                <StatCard label="My Agents" value={String(agents.length)} sub="Registered" />
                <StatCard label="Total API Calls" value={(usage?.total_calls ?? 0).toLocaleString()} sub="All time" />
                <StatCard label="This Week" value={(usage?.week_calls ?? 0).toLocaleString()} sub="Last 7 days" />
                <StatCard label="Rate Limit" value={usage ? `${usage.remaining_rpm}/${usage.limit_rpm}` : "—"} sub="Remaining / min" accent={usage ? usage.remaining_rpm > 0 : true} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Card>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)", marginBottom: 16 }}>API Usage This Week</div>
                  <MiniChart data={usage?.chart_data ?? [0,0,0,0,0,0,0]} labels={usage?.chart_labels ?? ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]} color="var(--accent)" />
                </Card>
                <Card>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)", marginBottom: 16 }}>My Agents</div>
                  {agents.length === 0 ? (
                    <div style={{ fontSize: 13, color: "var(--t3)", textAlign: "center", paddingTop: 16 }}>
                      <div style={{ marginBottom: 12 }}>No agents registered yet</div>
                      <Btn size="sm" onClick={() => setSection("my-agents")}>Register an Agent</Btn>
                    </div>
                  ) : agents.slice(0, 3).map((a) => (
                    <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>{a.name[0]}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</div>
                        <div style={{ fontSize: 11, color: "var(--t3)" }}>{a.total_calls.toLocaleString()} calls</div>
                      </div>
                      <Badge color={a.status === "active" ? "green" : "amber"}>{a.status}</Badge>
                    </div>
                  ))}
                </Card>
              </div>
            </>
          )}

          {/* ── My Agents ── */}
          {section === "my-agents" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--t1)", margin: 0 }}>My Agents</h1>
                <Btn size="sm" onClick={() => router.push("/agents/new")}>+ Register Agent</Btn>
              </div>
              {agents.length === 0 ? (
                <Card style={{ textAlign: "center", padding: 60 }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>◎</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--t2)", marginBottom: 8 }}>No agents yet</div>
                  <div style={{ fontSize: 13, color: "var(--t3)", marginBottom: 24 }}>Register your AI agent to reach consumers on the marketplace.</div>
                  <Btn onClick={() => router.push("/agents/new")}>Register Your Agent →</Btn>
                </Card>
              ) : (
                <>
                  {agents.map((a) => (
                    <Card key={a.id} style={{ marginBottom: 12, padding: "20px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "var(--accent)", flexShrink: 0 }}>{a.name[0]}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--t1)" }}>{a.name}</div>
                          <div style={{ fontSize: 12, color: "var(--t3)" }}>{a.category} · {a.total_calls.toLocaleString()} calls</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 120 }}><SuccessBar rate={a.success_rate} /></div>
                          <Badge color={a.status === "active" ? "green" : "amber"}>{a.status}</Badge>
                          <Btn variant="ghost" size="sm" onClick={() => router.push(`/agents/${a.id}`)}>View</Btn>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {agentStats && (
                    <Card style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)", marginBottom: 20 }}>Agent Calls This Week ({agents[0]?.name})</div>
                      <MiniChart data={agentStats.chart_data} labels={agentStats.chart_labels} />
                      {agentStats.recent_calls.length > 0 && (
                        <div style={{ marginTop: 20 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t2)", marginBottom: 12 }}>Recent Calls</div>
                          <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                              <tr>
                                {["Time", "Consumer", "Status", "Latency"].map((h) => (
                                  <th key={h} style={{ padding: "6px 0", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--t3)", letterSpacing: "0.04em" }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {agentStats.recent_calls.map((c) => (
                                <tr key={c.id} style={{ borderTop: "1px solid var(--border)" }}>
                                  <td style={{ padding: "10px 0", fontSize: 12, color: "var(--t3)" }}>{c.time}</td>
                                  <td style={{ padding: "10px 0", fontSize: 12, color: "var(--t2)", fontFamily: "monospace" }}>{c.consumer}</td>
                                  <td style={{ padding: "10px 0" }}><Badge color={c.status === "success" ? "green" : "red"}>{c.status}</Badge></td>
                                  <td style={{ padding: "10px 0" }}>{c.status === "success" ? <LatencyBar ms={c.latency} /> : <span style={{ fontSize: 12, color: "var(--red)" }}>timeout</span>}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Card>
                  )}
                </>
              )}
            </>
          )}

          {/* ── API Keys ── */}
          {section === "api-keys" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--t1)", margin: 0 }}>API Keys</h1>
                <Btn size="sm" onClick={() => setShowNewKey(true)}>+ New Key</Btn>
              </div>
              {showNewKey && (
                <Card style={{ marginBottom: 16, border: "1px solid var(--accent)", background: "var(--accent-dim)" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)", marginBottom: 14 }}>Create New API Key</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Input placeholder="Key name (e.g. Production)" value={newKeyName} onChange={setNewKeyName} style={{ flex: 1 }} />
                    <Btn onClick={handleCreateKey} disabled={!newKeyName.trim() || creating}>{creating ? "…" : "Create"}</Btn>
                    <Btn variant="ghost" onClick={() => { setShowNewKey(false); setNewKeyName(""); }}>Cancel</Btn>
                  </div>
                </Card>
              )}
              <Card style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)" }}>Your Keys</div>
                  <div style={{ fontSize: 12, color: "var(--t3)" }}>Shown once on creation</div>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--bg3)" }}>
                      {["Name", "Key", "Created", "Status", ""].map((h) => (
                        <th key={h} style={{ padding: "10px 24px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--t3)", letterSpacing: "0.05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: "32px 24px", textAlign: "center", fontSize: 13, color: "var(--t3)" }}>No API keys yet.</td></tr>
                    ) : apiKeys.map((key) => (
                      <tr key={key.id} style={{ borderTop: "1px solid var(--border)" }}>
                        <td style={{ padding: "14px 24px", fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>{key.name}</td>
                        <td style={{ padding: "14px 24px" }}>
                          {key.raw ? (
                            <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--green)", background: "var(--green-dim)", padding: "4px 8px", borderRadius: 4 }}>{key.raw}</span>
                          ) : (
                            <span style={{ fontFamily: "monospace", fontSize: 13, color: "var(--t3)" }}>{key.key_prefix}••••••••••••</span>
                          )}
                        </td>
                        <td style={{ padding: "14px 24px", fontSize: 13, color: "var(--t3)" }}>{new Date(key.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                        <td style={{ padding: "14px 24px" }}><Badge color={key.is_active ? "green" : "red"}>{key.is_active ? "active" : "revoked"}</Badge></td>
                        <td style={{ padding: "14px 24px" }}>
                          {key.is_active && (
                            <button onClick={async () => { await consumersApi.revokeApiKey(key.id); setApiKeys((ks) => ks.map((k) => k.id === key.id ? { ...k, is_active: false } : k)); }} style={{ fontSize: 12, color: "var(--red)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Revoke</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </>
          )}

          {/* ── Usage ── */}
          {section === "usage" && (
            <>
              <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--t1)", marginBottom: 24 }}>Usage</h1>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
                <StatCard label="Total Calls" value={(usage?.total_calls ?? 0).toLocaleString()} sub="All time" />
                <StatCard label="This Week" value={(usage?.week_calls ?? 0).toLocaleString()} sub="Last 7 days" />
                <StatCard label="Rate Limit" value={usage ? `${usage.remaining_rpm}/${usage.limit_rpm}` : "—"} sub="Remaining this minute" accent={usage ? usage.remaining_rpm > 0 : true} />
              </div>
              {usage && (
                <Card style={{ marginBottom: 16, padding: "16px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t2)" }}>Rate Limit (last 60s)</div>
                    <div style={{ fontSize: 12, color: usage.remaining_rpm === 0 ? "var(--red)" : "var(--t3)" }}>{usage.calls_last_minute} / {usage.limit_rpm} calls/min</div>
                  </div>
                  <div style={{ height: 6, background: "var(--bg3)", borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${Math.min(100, (usage.calls_last_minute / usage.limit_rpm) * 100)}%`, background: usage.remaining_rpm === 0 ? "var(--red)" : "var(--green)", borderRadius: 3, transition: "width 0.4s" }} />
                  </div>
                </Card>
              )}
              <Card>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)", marginBottom: 20 }}>Calls This Week</div>
                <MiniChart data={usage?.chart_data ?? [0,0,0,0,0,0,0]} labels={usage?.chart_labels ?? ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]} color="var(--accent)" />
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
