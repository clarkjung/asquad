"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import TopNav from "@/components/TopNav";
import { Badge, Card, StatCard } from "@/components/ui";
import { providersApi } from "@/lib/api";

interface ProviderProfile {
  id: string;
  company_name: string;
  title: string | null;
  bio: string | null;
  years_experience: number | null;
  linkedin_url: string | null;
  specialty: string | null;
  is_verified: boolean;
  created_at: string;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  skills: string[];
  protocol_type: string;
  total_calls: number;
  avg_latency_ms: number;
  success_rate: number;
  status: string;
}

export default function ProviderProfilePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      providersApi.getPublicProfile(id),
      providersApi.getProviderAgents(id),
    ])
      .then(([profileRes, agentsRes]) => {
        setProvider(profileRes.data);
        setAgents(agentsRes.data);
      })
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

  if (!provider) {
    return (
      <div style={{ paddingTop: 56 }}>
        <TopNav />
        <div style={{ textAlign: "center", padding: "120px 0", color: "var(--t3)" }}>Provider not found.</div>
      </div>
    );
  }

  const initials = provider.company_name.slice(0, 2).toUpperCase();
  const memberSince = new Date(provider.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const totalCalls = agents.reduce((sum, a) => sum + a.total_calls, 0);
  const avgRating = 4.8; // placeholder until reviews are implemented

  return (
    <div style={{ paddingTop: 56 }}>
      <TopNav />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "72px 5vw 60px" }}>
        <button
          onClick={() => router.back()}
          style={{ background: "none", border: "none", color: "var(--t3)", fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginBottom: 24, display: "flex", alignItems: "center", gap: 6, padding: 0 }}
        >
          ← Back
        </button>

        {/* Profile header */}
        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
            <div style={{
              width: 72, height: 72, borderRadius: 18, background: "var(--accent-dim)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, fontWeight: 800, color: "var(--accent)", flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--t1)", margin: 0 }}>
                  {provider.company_name}
                </h1>
                {provider.is_verified && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--green)", background: "var(--green-dim)", padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(16,185,129,0.3)" }}>
                    ✓ Verified
                  </span>
                )}
              </div>
              {provider.title && (
                <div style={{ fontSize: 15, color: "var(--accent)", fontWeight: 600, marginBottom: 6 }}>
                  {provider.title}
                  {provider.years_experience && (
                    <span style={{ color: "var(--t3)", fontWeight: 400 }}> · {provider.years_experience} years</span>
                  )}
                </div>
              )}
              {provider.bio && (
                <p style={{ fontSize: 14, color: "var(--t2)", lineHeight: 1.65, margin: "8px 0 0" }}>
                  {provider.bio}
                </p>
              )}
              <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
                {provider.specialty && (
                  <span style={{ fontSize: 12, color: "var(--t3)" }}>
                    🎯 {provider.specialty}
                  </span>
                )}
                {provider.linkedin_url && (
                  <a href={provider.linkedin_url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>
                    LinkedIn →
                  </a>
                )}
                <span style={{ fontSize: 12, color: "var(--t3)" }}>Member since {memberSince}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
          <StatCard label="Skills Published" value={String(agents.length)} />
          <StatCard label="Total API Calls" value={totalCalls.toLocaleString()} />
          <StatCard label="Avg Rating" value={`★ ${avgRating}`} accent />
        </div>

        {/* Agents */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)", marginBottom: 16 }}>
            Published Skills ({agents.length})
          </div>
          {agents.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 40, color: "var(--t3)" }}>
              No skills published yet.
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {agents.map((agent) => (
                <Card
                  key={agent.id}
                  style={{ cursor: "pointer", transition: "border-color 0.15s" }}
                  onClick={() => router.push(`/agents/${agent.id}`)}
                >
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 10, background: "var(--accent-dim)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, fontWeight: 800, color: "var(--accent)", flexShrink: 0,
                    }}>
                      {agent.name[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--t1)" }}>{agent.name}</span>
                        <Badge color={agent.protocol_type === "a2a" ? "blue" : "default"}>{agent.protocol_type.toUpperCase()}</Badge>
                        <Badge color="default">{agent.category}</Badge>
                      </div>
                      <p style={{ fontSize: 13, color: "var(--t2)", margin: 0, lineHeight: 1.5 }}>{agent.description}</p>
                      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                        {agent.skills.slice(0, 4).map((s) => (
                          <span key={s} style={{ fontSize: 11, color: "var(--t3)", background: "var(--bg3)", padding: "2px 8px", borderRadius: 10, border: "1px solid var(--border)" }}>{s}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", flexShrink: 0 }}>
                      <span style={{ fontSize: 13, color: "var(--t2)", fontWeight: 600 }}>{agent.total_calls.toLocaleString()} calls</span>
                      <span style={{ fontSize: 12, color: Math.round(agent.success_rate * 100) >= 95 ? "var(--green)" : "var(--amber)" }}>
                        {Math.round(agent.success_rate * 100)}% success
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
