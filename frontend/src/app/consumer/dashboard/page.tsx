"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";
import { Btn, Badge, Card, StatCard, MiniChart, Input } from "@/components/ui";
import { consumersApi } from "@/lib/api";

interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  is_active: boolean;
  created_at: string;
  raw?: string;
}

interface AgentUsage {
  agent_id: string;
  agent_name: string;
  call_count: number;
  token_count: number;
}

interface Usage {
  total_calls: number;
  week_calls: number;
  total_tokens: number;
  agent_usage: AgentUsage[];
  calls_last_minute: number;
  limit_rpm: number;
  remaining_rpm: number;
}

// ── Sidebar Link ──────────────────────────────────────────────────────────

function SidebarLink({ label, icon, badge, active }: { label: string; icon: string; badge?: string; active?: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 20px", cursor: "pointer",
      background: active ? "var(--accent-dim)" : "transparent",
      borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
      transition: "all 0.15s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 14, opacity: 0.7 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? "var(--t1)" : "var(--t2)" }}>{label}</span>
      </div>
      {badge && <span style={{ fontSize: 10, fontWeight: 700, background: "var(--accent)", color: "#fff", padding: "1px 6px", borderRadius: 8 }}>{badge}</span>}
    </div>
  );
}

// ── Consumer Dashboard ────────────────────────────────────────────────────

export default function ConsumerDashboard() {
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);

  const CHART_DATA = [28, 34, 19, 45, 38, 22, 7];
  const CHART_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "consumer") { router.push("/register"); return; }
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const [keysR, usageR] = await Promise.all([
        consumersApi.listApiKeys(),
        consumersApi.usage(),
      ]);
      setApiKeys(keysR.data);
      const u = usageR.data;
      setUsage({
        total_calls: u.total_calls ?? 0,
        week_calls: u.calls_this_week ?? u.week_calls ?? 0,
        total_tokens: u.total_tokens ?? 0,
        agent_usage: u.top_agents?.map((a: { agent_id: string; call_count: number }) => ({
          agent_id: a.agent_id,
          agent_name: a.agent_id,
          call_count: a.call_count,
          token_count: 0,
        })) ?? [],
        calls_last_minute: u.calls_last_minute ?? 0,
        limit_rpm: u.limit_rpm ?? 60,
        remaining_rpm: u.remaining_rpm ?? 60,
      });
    } catch { /* backend may be down */ }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const r = await consumersApi.createApiKey({ name: newKeyName });
      setApiKeys((ks) => [{ ...r.data, raw: r.data.raw_key }, ...ks]);
      setNewKeyName("");
      setShowNewKey(false);
    } catch { /* handle */ }
    finally { setCreating(false); }
  };

  const handleRevoke = async (id: string) => {
    await consumersApi.revokeApiKey(id);
    setApiKeys((ks) => ks.map((k) => k.id === id ? { ...k, is_active: false } : k));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push("/");
  };

  const maxCalls = Math.max(...(usage?.agent_usage.map((a) => a.call_count) ?? [1]), 1);

  return (
    <div style={{ paddingTop: 56 }}>
      <TopNav />
      <div style={{ display: "flex", minHeight: "calc(100vh - 56px)" }}>

        {/* ── Sidebar ── */}
        <div style={{ width: 220, flexShrink: 0, borderRight: "1px solid var(--border)", padding: "28px 0", position: "sticky", top: 56, height: "calc(100vh - 56px)", overflowY: "auto" }}>
          <div style={{ padding: "0 20px 20px", borderBottom: "1px solid var(--border)", marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)", letterSpacing: "-0.01em" }}>Consumer Portal</div>
            <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 2 }}>My Account</div>
          </div>
          {[
            { label: "Overview", icon: "◈", active: true },
            { label: "API Keys", icon: "⚿", badge: apiKeys.filter((k) => k.is_active).length.toString() },
            { label: "Usage", icon: "▲" },
            { label: "Documentation", icon: "≡" },
            { label: "Settings", icon: "⚙" },
          ].map((item) => <SidebarLink key={item.label} {...item} />)}
          <div style={{ margin: "16px 12px 0", borderTop: "1px solid var(--border)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <Btn size="sm" style={{ width: "100%", justifyContent: "center" }} onClick={() => router.push("/marketplace")}>Browse Agents</Btn>
            <button onClick={handleLogout} style={{ width: "100%", padding: "8px", fontSize: 12, color: "var(--t3)", background: "none", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>
              Sign Out
            </button>
          </div>
        </div>

        {/* ── Main ── */}
        <div style={{ flex: 1, minWidth: 0, padding: "32px 40px", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--t1)", margin: 0 }}>Overview</h1>
            <Btn size="sm" onClick={() => setShowNewKey(true)}>+ New API Key</Btn>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
            <StatCard label="Total Calls" value={(usage?.total_calls ?? 0).toLocaleString()} sub="All time" />
            <StatCard label="This Week" value={(usage?.week_calls ?? 0).toLocaleString()} sub="Last 7 days" />
            <StatCard label="Total Tokens" value={usage ? `${(usage.total_tokens / 1_000_000).toFixed(1)}M` : "—"} sub="Consumed" />
            <StatCard label="Rate Limit" value={usage ? `${usage.remaining_rpm}/${usage.limit_rpm}` : "—"} sub="Remaining this minute" accent={usage ? usage.remaining_rpm > 0 : true} />
          </div>

          {/* Rate limit bar */}
          {usage && (
            <Card style={{ marginBottom: 16, padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t2)" }}>Rate Limit Usage (last 60s)</div>
                <div style={{ fontSize: 12, color: usage.remaining_rpm === 0 ? "var(--red)" : "var(--t3)" }}>
                  {usage.calls_last_minute} / {usage.limit_rpm} calls/min
                  {usage.remaining_rpm === 0 && <span style={{ marginLeft: 8, color: "var(--red)", fontWeight: 600 }}>● Limit reached</span>}
                </div>
              </div>
              <div style={{ height: 6, background: "var(--bg3)", borderRadius: 3 }}>
                <div style={{
                  height: "100%",
                  width: `${Math.min(100, (usage.calls_last_minute / usage.limit_rpm) * 100)}%`,
                  background: usage.remaining_rpm === 0 ? "var(--red)" : usage.calls_last_minute / usage.limit_rpm > 0.8 ? "var(--amber)" : "var(--green)",
                  borderRadius: 3,
                  transition: "width 0.4s ease",
                }} />
              </div>
            </Card>
          )}

          {/* Chart + Agent breakdown */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <Card>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)", marginBottom: 20 }}>Calls This Week</div>
              <MiniChart data={CHART_DATA} labels={CHART_LABELS} color="var(--green)" />
            </Card>
            <Card>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)", marginBottom: 16 }}>Top Agents Used</div>
              {usage?.agent_usage && usage.agent_usage.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {usage.agent_usage.slice(0, 4).map((a) => (
                    <div key={a.agent_id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>
                        {(a.agent_name ?? a.agent_id)[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>{a.agent_name ?? a.agent_id}</div>
                        <div style={{ height: 3, background: "var(--bg3)", borderRadius: 2, marginTop: 4 }}>
                          <div style={{ height: "100%", width: `${(a.call_count / maxCalls) * 100}%`, background: "var(--accent)", borderRadius: 2, transition: "width 0.6s ease" }} />
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--t3)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{a.call_count}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "var(--t3)", textAlign: "center", paddingTop: 20 }}>No calls yet</div>
              )}
            </Card>
          </div>

          {/* New key inline */}
          {showNewKey && (
            <Card style={{ marginBottom: 16, border: "1px solid var(--accent)", background: "var(--accent-dim)" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)", marginBottom: 14 }}>Create New API Key</div>
              <div style={{ display: "flex", gap: 8 }}>
                <Input placeholder='Key name (e.g. Production, Staging)' value={newKeyName} onChange={setNewKeyName} style={{ flex: 1 }} />
                <Btn onClick={handleCreateKey} disabled={!newKeyName.trim() || creating}>{creating ? "…" : "Create"}</Btn>
                <Btn variant="ghost" onClick={() => { setShowNewKey(false); setNewKeyName(""); }}>Cancel</Btn>
              </div>
            </Card>
          )}

          {/* API Keys table */}
          <Card style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)" }}>API Keys</div>
              <div style={{ fontSize: 12, color: "var(--t3)" }}>Keys are shown once on creation</div>
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
                    <td style={{ padding: "14px 24px", fontSize: 13, color: "var(--t3)" }}>
                      {new Date(key.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td style={{ padding: "14px 24px" }}>
                      <Badge color={key.is_active ? "green" : "red"}>{key.is_active ? "active" : "revoked"}</Badge>
                    </td>
                    <td style={{ padding: "14px 24px" }}>
                      {key.is_active && (
                        <button onClick={() => handleRevoke(key.id)} style={{ fontSize: 12, color: "var(--red)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Quickstart */}
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)", marginBottom: 14 }}>Quickstart</div>
            <pre style={{ fontSize: 12, color: "var(--green)", background: "var(--bg3)", padding: 16, borderRadius: 8, overflow: "auto", margin: 0, lineHeight: 1.7 }}>
{`import httpx

# 1. Search for an agent
agents = httpx.get(
    "https://api.asquad.ai/v1/agents/search",
    params={"q": "review legal contracts"}
).json()

# 2. Call the top result
agent_id = agents["results"][0]["id"]
response = httpx.post(
    f"https://api.asquad.ai/v1/agents/{agent_id}/a2a",
    headers={"Authorization": "Bearer asq_live_xxxxxxxxxxxx"},
    json={"jsonrpc":"2.0","method":"tasks/send","id":"1",
          "params":{"message":{"role":"user","parts":[{"text":"Review this NDA..."}]}}}
)
print(response.json()["result"]["artifacts"][0]["parts"][0]["text"])`}
            </pre>
          </Card>
        </div>
      </div>
    </div>
  );
}
