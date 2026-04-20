"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";
import { Btn, Badge, Card, StatCard, MiniChart, SuccessBar, LatencyBar } from "@/components/ui";
import { agentsApi, providersApi } from "@/lib/api";

interface Agent {
  id: string;
  name: string;
  category: string;
  status: string;
  total_calls: number;
  avg_latency_ms: number;
  success_rate: number;
}

interface CallEvent {
  id: string;
  time: string;
  consumer: string;
  status: "success" | "error";
  latency: number;
}

interface Stats {
  total_calls: number;
  week_calls: number;
  today_calls: number;
  avg_latency: number;
  success_rate: number;
  chart_data: number[];
  chart_labels: string[];
  recent_calls: CallEvent[];
}

// ── Sidebar ───────────────────────────────────────────────────────────────

type NavItem = { label: string; icon: string; badge?: string };

function SidebarLink({ label, icon, badge, active }: NavItem & { active?: boolean }) {
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

// ── Provider Dashboard ────────────────────────────────────────────────────

export default function ProviderDashboard() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [agentStatus, setAgentStatus] = useState("active");
  const [companyName, setCompanyName] = useState("Provider");

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "provider") { router.push("/register"); return; }
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const [meR, agentsR] = await Promise.all([
        providersApi.me(),
        providersApi.myAgents(),
      ]);
      setCompanyName(meR.data.company_name ?? "Provider");
      const list = agentsR.data as Agent[];
      setAgents(list);

      if (list.length > 0) {
        const a = list[0];
        setAgentStatus(a.status);
        const statsR = await agentsApi.stats(a.id);
        const s = statsR.data;
        setStats({
          total_calls: s.total_calls,
          week_calls: s.calls_this_week,
          today_calls: s.calls_today,
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push("/");
  };

  const firstAgent = agents[0];

  return (
    <div style={{ paddingTop: 56 }}>
      <TopNav />
      <div style={{ display: "flex", minHeight: "calc(100vh - 56px)" }}>

        {/* ── Sidebar ── */}
        <div style={{ width: 220, flexShrink: 0, borderRight: "1px solid var(--border)", padding: "28px 0", position: "sticky", top: 56, height: "calc(100vh - 56px)", overflowY: "auto" }}>
          <div style={{ padding: "0 20px 20px", borderBottom: "1px solid var(--border)", marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)", letterSpacing: "-0.01em" }}>Provider Portal</div>
            <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 2 }}>{companyName}</div>
          </div>
          {[
            { label: "Overview", icon: "◈", active: true },
            { label: "My Agents", icon: "◎", badge: agents.length.toString() },
            { label: "Usage Stats", icon: "▲" },
            { label: "API Calls Log", icon: "≡" },
            { label: "Settings", icon: "⚙" },
          ].map((item) => <SidebarLink key={item.label} {...item} />)}
          <div style={{ margin: "16px 12px 0", borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <button onClick={handleLogout} style={{ width: "100%", padding: "8px", fontSize: 12, color: "var(--t3)", background: "none", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>
              Sign Out
            </button>
          </div>
        </div>

        {/* ── Main ── */}
        <div style={{ flex: 1, minWidth: 0, padding: "32px 40px", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--t1)", margin: 0 }}>Overview</h1>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" size="sm" onClick={() => router.push(`/agents/${firstAgent?.id}`)}>Edit Agent</Btn>
              <Btn size="sm" onClick={() => router.push("/register?mode=provider")}>+ Register New Agent</Btn>
            </div>
          </div>

          {stats ? (
            <>
              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
                <StatCard label="Total Calls" value={stats.total_calls.toLocaleString()} sub="All time" />
                <StatCard label="This Week" value={stats.week_calls.toLocaleString()} sub="+12% vs last week" />
                <StatCard label="Today" value={stats.today_calls.toString()} sub="Live" accent />
                <StatCard label="Avg Latency" value={`${stats.avg_latency}ms`} sub="Last 30 days" />
              </div>

              {/* Chart + Agent info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, marginBottom: 16 }}>
                <Card>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)" }}>Calls This Week</div>
                    <Badge color="green">{Math.round(stats.success_rate * 100)}% uptime</Badge>
                  </div>
                  <MiniChart data={stats.chart_data} labels={stats.chart_labels} />
                </Card>

                {firstAgent && (
                  <Card>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t3)", marginBottom: 14, letterSpacing: "0.04em" }}>YOUR AGENT</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "var(--accent)" }}>
                        {firstAgent.name[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--t1)" }}>{firstAgent.name}</div>
                        <div style={{ fontSize: 12, color: "var(--t3)" }}>{firstAgent.category}</div>
                      </div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, color: "var(--t3)", marginBottom: 6 }}>Success Rate</div>
                      <SuccessBar rate={firstAgent.success_rate} />
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <Badge color={agentStatus === "active" ? "green" : "amber"}>{agentStatus}</Badge>
                      <button
                        onClick={() => setAgentStatus((v) => v === "active" ? "paused" : "active")}
                        style={{ fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
                      >
                        {agentStatus === "active" ? "Pause" : "Activate"}
                      </button>
                    </div>
                  </Card>
                )}
              </div>

              {/* Recent calls table */}
              <Card style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)" }}>Recent Calls</div>
                  <Badge>Last 24h</Badge>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--bg3)" }}>
                      {["Time", "Consumer", "Status", "Latency"].map((h) => (
                        <th key={h} style={{ padding: "10px 24px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--t3)", letterSpacing: "0.05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_calls.map((call, i) => (
                      <tr key={call.id} style={{ borderTop: "1px solid var(--border)", background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.015)" }}>
                        <td style={{ padding: "12px 24px", fontSize: 13, color: "var(--t3)" }}>{call.time}</td>
                        <td style={{ padding: "12px 24px", fontSize: 13, color: "var(--t2)", fontFamily: "monospace" }}>{call.consumer}</td>
                        <td style={{ padding: "12px 24px" }}>
                          <Badge color={call.status === "success" ? "green" : "red"}>{call.status}</Badge>
                        </td>
                        <td style={{ padding: "12px 24px" }}>
                          {call.status === "success" ? <LatencyBar ms={call.latency} /> : <span style={{ fontSize: 13, color: "var(--red)" }}>timeout</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "80px 0", color: "var(--t3)" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>◎</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--t2)", marginBottom: 8 }}>No agents yet</div>
              <div style={{ fontSize: 13, marginBottom: 24 }}>Register your first agent to see stats here.</div>
              <Btn onClick={() => router.push("/register?mode=provider")}>Register Your Agent →</Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
