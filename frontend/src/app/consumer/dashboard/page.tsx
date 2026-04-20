"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { consumersApi } from "@/lib/api";

interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

interface Usage {
  total_calls: number;
  calls_today: number;
  calls_this_week: number;
  calls_this_month: number;
  top_agents: { agent_id: string; call_count: number }[];
}

export default function ConsumerDashboard() {
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<{ raw_key: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "consumer") { router.push("/consumer/login"); return; }
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const [keysR, usageR] = await Promise.all([
        consumersApi.listApiKeys(),
        consumersApi.usage(),
      ]);
      setApiKeys(keysR.data);
      setUsage(usageR.data);
    } catch {
      // Token might be expired
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await consumersApi.createApiKey({ name: newKeyName });
      setCreatedKey({ raw_key: r.data.raw_key, name: r.data.name });
      setApiKeys([r.data, ...apiKeys]);
      setNewKeyName("");
    } catch {
      // handle
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    await consumersApi.revokeApiKey(id);
    setApiKeys(apiKeys.map((k) => k.id === id ? { ...k, is_active: false } : k));
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
          <span className="text-sm text-gray-500">Consumer Dashboard</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-600">Logout</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {usage && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Calls", value: usage.total_calls },
              { label: "Today", value: usage.calls_today },
              { label: "This Week", value: usage.calls_this_week },
              { label: "This Month", value: usage.calls_this_month },
            ].map((stat) => (
              <div key={stat.label} className="bg-white border rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</div>
                <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white border rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">API Keys</h2>

          {createdKey && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-green-800 mb-1">API key created — save it now, it won&apos;t be shown again!</p>
              <code className="text-xs bg-white border rounded px-2 py-1 block break-all">{createdKey.raw_key}</code>
              <button onClick={() => setCreatedKey(null)} className="text-xs text-green-600 mt-2 hover:underline">Dismiss</button>
            </div>
          )}

          <form onSubmit={handleCreateKey} className="flex gap-2 mb-4">
            <input
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Key name (e.g. production)"
              required
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
            />
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
              {loading ? "..." : "Generate"}
            </button>
          </form>

          <div className="divide-y">
            {apiKeys.map((key) => (
              <div key={key.id} className="flex items-center justify-between py-3">
                <div>
                  <span className="text-sm font-medium text-gray-900">{key.name}</span>
                  <code className="text-xs text-gray-400 ml-2">{key.key_prefix}...</code>
                  {!key.is_active && <span className="text-xs text-red-400 ml-2">(revoked)</span>}
                </div>
                {key.is_active && (
                  <button onClick={() => handleRevoke(key.id)} className="text-xs text-red-400 hover:text-red-600">Revoke</button>
                )}
              </div>
            ))}
            {apiKeys.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">No API keys yet.</p>}
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-3">Quickstart</h2>
          <pre className="bg-gray-50 rounded-lg p-4 text-xs overflow-auto">
{`curl -X POST https://api.asquad.ai/api/v1/agents/{agent_id}/a2a \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "tasks/send",
    "params": {
      "message": {
        "parts": [{"type": "text", "text": "Your message here"}]
      }
    },
    "id": 1
  }'`}
          </pre>
        </div>
      </main>
    </div>
  );
}
