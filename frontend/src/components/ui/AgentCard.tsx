"use client";

import React from "react";
import Card from "./Card";
import Badge from "./Badge";
import LatencyBar from "./LatencyBar";

export interface Agent {
  id: string;
  name: string;
  provider: string;
  description: string;
  skills: string[];
  protocol_type: "a2a" | "rest";
  total_calls: number;
  avg_latency_ms: number;
  success_rate: number;
}

interface AgentCardProps {
  agent: Agent;
  onClick?: () => void;
}

export default function AgentCard({ agent, onClick }: AgentCardProps) {
  return (
    <Card hover onClick={onClick} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--accent-dim)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              color: "var(--accent)",
              fontWeight: 700,
            }}
          >
            {agent.name[0]}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--t1)", letterSpacing: "-0.02em" }}>{agent.name}</div>
            <div style={{ fontSize: 12, color: "var(--t3)" }}>{agent.provider}</div>
          </div>
        </div>
        <Badge color={agent.protocol_type === "a2a" ? "blue" : "default"}>{agent.protocol_type === "a2a" ? "A2A" : "REST"}</Badge>
      </div>
      <p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.5, flex: 1, margin: 0 }}>{agent.description}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {agent.skills.slice(0, 3).map((s) => (
          <Badge key={s}>{s}</Badge>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: 12, color: "var(--t3)" }}>
          <span style={{ color: "var(--t1)", fontWeight: 600 }}>{agent.total_calls.toLocaleString()}</span> calls
        </div>
        <LatencyBar ms={agent.avg_latency_ms} />
        <div style={{ fontSize: 12 }}>
          <span style={{ color: "var(--green)", fontWeight: 600 }}>{Math.round(agent.success_rate * 100)}%</span> uptime
        </div>
      </div>
    </Card>
  );
}
