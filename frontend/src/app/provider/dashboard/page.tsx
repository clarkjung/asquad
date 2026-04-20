"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { agentsApi } from "@/lib/api";

interface Agent {
  id: string;
  name: string;
  description: string;
  skills: string[];
  category: string;
  status: string;
  total_calls: number;
  avg_latency_ms: number;
  success_rate: number;
  protocol_type: string;
  auth_type: string;
  agent_card: object;
}

const CATEGORIES = ["General", "Customer Support", "Developer Tools", "Sales & Marketing", "Legal"];

export default function ProviderDashboard() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [form, setForm] = useState({
    name: "", description: "", skills: "", category: "General",
    endpoint_url: "", protocol_type: "rest", auth_type: "none", auth_credentials: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "provider") { router.push("/provider/login"); return; }
    loadAgents();
  }, [router]);

  const loadAgents = async () => {
    // Agents for current provider – we use browse for now (MVP: all active agents shown)
    // In Sprint 4 we'd add a provider-specific endpoint
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const r = await agentsApi.create({
        ...form,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      });
      setAgents([r.data, ...agents]);
      setShowForm(false);
      setForm({ name: "", description: "", skills: "", category: "General", endpoint_url: "", protocol_type: "rest", auth_type: "none", auth_credentials: "" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || "Failed to register agent.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-blue-600">asquad.ai</Link>
        <div className="flex gap-4 items-center">
          <span className="text-sm text-gray-500">Provider Dashboard</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-600">Logout</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Agents</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            + Register Agent
          </button>
        </div>

        {showForm && (
          <div className="bg-white border rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Register New Agent</h3>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <form onSubmit={handleCreate} className="grid gap-3">
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Agent Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <textarea className="border rounded-lg px-3 py-2 text-sm" placeholder="Description (what does this agent do?)" rows={3} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Skills (comma-separated: contract-review, nda-analysis)" required value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
              <select className="border rounded-lg px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Endpoint URL (https://...)" required value={form.endpoint_url} onChange={(e) => setForm({ ...form, endpoint_url: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <select className="border rounded-lg px-3 py-2 text-sm" value={form.protocol_type} onChange={(e) => setForm({ ...form, protocol_type: e.target.value })}>
                  <option value="rest">REST</option>
                  <option value="a2a">A2A Native</option>
                </select>
                <select className="border rounded-lg px-3 py-2 text-sm" value={form.auth_type} onChange={(e) => setForm({ ...form, auth_type: e.target.value })}>
                  <option value="none">No Auth</option>
                  <option value="api_key">API Key</option>
                  <option value="bearer">Bearer Token</option>
                </select>
              </div>
              {form.auth_type !== "none" && (
                <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Auth credentials" value={form.auth_credentials} onChange={(e) => setForm({ ...form, auth_credentials: e.target.value })} />
              )}
              <div className="flex gap-2">
                <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">{loading ? "Registering..." : "Register"}</button>
                <button type="button" onClick={() => setShowForm(false)} className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {selectedAgent && (
          <div className="bg-white border rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Agent Card — {selectedAgent.name}</h3>
              <button onClick={() => setSelectedAgent(null)} className="text-gray-400 hover:text-gray-600 text-sm">Close</button>
            </div>
            <pre className="bg-gray-50 rounded-lg p-4 text-xs overflow-auto max-h-64">
              {JSON.stringify(selectedAgent.agent_card, null, 2)}
            </pre>
          </div>
        )}

        {agents.length === 0 && !showForm && (
          <div className="text-center py-16 text-gray-400">
            <p>No agents registered yet.</p>
            <p className="text-sm mt-1">Click &quot;Register Agent&quot; to add your first agent.</p>
          </div>
        )}

        <div className="grid gap-4">
          {agents.map((agent) => (
            <div key={agent.id} className="bg-white border rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${agent.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{agent.status}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{agent.description}</p>
                </div>
                <div className="text-right text-xs text-gray-400">
                  <div>{agent.total_calls} calls</div>
                  <div>{Math.round(agent.avg_latency_ms)}ms</div>
                  <button onClick={() => setSelectedAgent(agent)} className="text-blue-500 hover:underline mt-1 block">View Card</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
