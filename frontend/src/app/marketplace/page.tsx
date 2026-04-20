"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";
import { AgentCard, Agent, Input } from "@/components/ui";
import { agentsApi } from "@/lib/api";

const CATEGORIES = ["All", "Customer Support", "Developer Tools", "Sales & Marketing", "Legal", "General"];

export default function MarketplacePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (cat: string) => {
    setLoading(true);
    try {
      const r = cat === "All" ? await agentsApi.browse() : await agentsApi.browse(cat);
      setAgents(r.data);
    } catch {
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(activeCategory);
  }, [activeCategory, load]);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      load(activeCategory);
      return;
    }
    setLoading(true);
    try {
      const r = await agentsApi.search(q);
      setAgents(r.data.map((item: { agent: Agent }) => item.agent));
    } catch {
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, load]);

  return (
    <div style={{ paddingTop: 56 }}>
      <TopNav />

      {/* Search hero */}
      <div style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)", padding: "48px 5vw 36px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--t1)", marginBottom: 8 }}>
            Find the right agent
          </h1>
          <p style={{ fontSize: 15, color: "var(--t2)", marginBottom: 28 }}>Search by capability in plain English</p>
          <Input
            icon="⌕"
            placeholder='Try "review my legal contract" or "analyze email tone"…'
            value={query}
            onChange={handleSearch}
          />
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 5vw" }}>
        {/* Category pills */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap", alignItems: "center" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setQuery(""); }}
              style={{
                padding: "6px 16px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 500,
                fontFamily: "inherit",
                cursor: "pointer",
                transition: "all 0.15s",
                border: activeCategory === cat ? "none" : "1px solid var(--border)",
                background: activeCategory === cat ? "var(--accent)" : "var(--bg2)",
                color: activeCategory === cat ? "#fff" : "var(--t2)",
              }}
            >
              {cat}
            </button>
          ))}
          <div style={{ marginLeft: "auto", fontSize: 13, color: "var(--t3)" }}>
            {loading ? "…" : `${agents.length} agent${agents.length !== 1 ? "s" : ""}`}
          </div>
        </div>

        {/* Agent grid */}
        {!loading && agents.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {agents.map((a) => (
              <AgentCard key={a.id} agent={a} onClick={() => router.push(`/agents/${a.id}`)} />
            ))}
          </div>
        ) : !loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--t3)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>◎</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--t2)" }}>No agents found</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Try a different search or category</div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--t3)", fontSize: 14 }}>Loading…</div>
        )}
      </div>
    </div>
  );
}
