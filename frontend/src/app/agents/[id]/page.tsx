"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { agentsApi, gatewayApi } from "@/lib/api";

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
  agent_card: object;
}

export default function AgentDetail() {
  const params = useParams();
  const id = params.id as string;
  const [agent, setAgent] = useState<Agent | null>(null);
  const [message, setMessage] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [calling, setCalling] = useState(false);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    agentsApi.get(id).then((r) => setAgent(r.data)).catch(() => {});
  }, [id]);

  const handleTry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) { alert("Enter your API key first."); return; }
    setCalling(true);
    setResponse(null);
    try {
      const r = await gatewayApi.call(id, message, apiKey);
      const output = r.data?.result?.output;
      setResponse(typeof output === "string" ? output : JSON.stringify(output, null, 2));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setResponse(`Error: ${msg || "Failed to call agent"}`);
    } finally {
      setCalling(false);
    }
  };

  if (!agent) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-xl font-bold text-blue-600">asquad.ai</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-600 text-sm">{agent.name}</span>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white border rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full mt-1 inline-block">{agent.category}</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${agent.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{agent.status}</span>
          </div>

          <p className="text-gray-600 mb-4">{agent.description}</p>

          <div className="flex gap-2 flex-wrap mb-4">
            {agent.skills.map((s) => (
              <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 text-center border-t pt-4">
            <div><div className="text-lg font-bold">{agent.total_calls.toLocaleString()}</div><div className="text-xs text-gray-400">Total Calls</div></div>
            <div><div className="text-lg font-bold">{Math.round(agent.avg_latency_ms)}ms</div><div className="text-xs text-gray-400">Avg Latency</div></div>
            <div><div className="text-lg font-bold">{Math.round(agent.success_rate * 100)}%</div><div className="text-xs text-gray-400">Success Rate</div></div>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Try it Playground</h2>
          <form onSubmit={handleTry} className="flex flex-col gap-3">
            <input
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your API key (asq_live_...)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <textarea
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type your message..."
              rows={3}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button type="submit" disabled={calling} className="bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 font-medium">
              {calling ? "Calling agent..." : "Send"}
            </button>
          </form>

          {response !== null && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Response:</p>
              <pre className="text-sm whitespace-pre-wrap">{response}</pre>
            </div>
          )}
        </div>

        <div className="bg-white border rounded-2xl p-6">
          <button
            onClick={() => setShowCard(!showCard)}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="font-semibold">Agent Card (A2A)</span>
            <span className="text-gray-400 text-sm">{showCard ? "Hide" : "Show"}</span>
          </button>
          {showCard && (
            <pre className="mt-4 bg-gray-50 rounded-lg p-4 text-xs overflow-auto">
              {JSON.stringify(agent.agent_card, null, 2)}
            </pre>
          )}
        </div>
      </main>
    </div>
  );
}
