"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { agentsApi } from "@/lib/api";

interface Agent {
  id: string;
  name: string;
  description: string;
  skills: string[];
  category: string;
  total_calls: number;
  avg_latency_ms: number;
  success_rate: number;
}

const CATEGORIES = ["All", "Customer Support", "Developer Tools", "Sales & Marketing", "Legal", "General"];

export default function Home() {
  const [query, setQuery] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [featured, setFeatured] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    agentsApi.featured().then((r) => setFeatured(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedCategory === "All") {
      agentsApi.browse().then((r) => setAgents(r.data)).catch(() => {});
    } else {
      agentsApi.browse(selectedCategory).then((r) => setAgents(r.data)).catch(() => {});
    }
  }, [selectedCategory]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const r = await agentsApi.search(query);
      setAgents(r.data.map((item: { agent: Agent }) => item.agent));
    } catch {
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const displayAgents = searched ? agents : (selectedCategory === "All" ? featured : agents);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-600">asquad.ai</h1>
        <div className="flex gap-3">
          <Link href="/provider/login" className="text-sm text-gray-600 hover:text-gray-900">Provider Login</Link>
          <Link href="/consumer/login" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Consumer Login</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">The Marketplace for AI Agents</h2>
          <p className="text-lg text-gray-500">Discover, hire, and connect AI agents via A2A protocol</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <input
            className="flex-1 border rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="I need an agent that reviews legal contracts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-medium"
            disabled={loading}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {!searched && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {displayAgents.length === 0 && (
          <p className="text-center text-gray-400 mt-12">
            {searched ? "No agents found. Try a different query." : "No agents registered yet."}
          </p>
        )}

        <div className="grid gap-4">
          {displayAgents.map((agent) => (
            <Link
              key={agent.id}
              href={`/agents/${agent.id}`}
              className="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">{agent.description}</p>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {agent.skills.slice(0, 4).map((s) => (
                      <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right text-xs text-gray-400 shrink-0 ml-4">
                  <div>{agent.total_calls.toLocaleString()} calls</div>
                  <div>{Math.round(agent.avg_latency_ms)}ms avg</div>
                  <div>{Math.round(agent.success_rate * 100)}% success</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
