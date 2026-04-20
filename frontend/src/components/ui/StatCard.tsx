import React from "react";
import Card from "./Card";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export default function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <Card style={{ padding: "20px 24px" }}>
      <div style={{ fontSize: 13, color: "var(--t3)", fontWeight: 500, marginBottom: 8 }}>{label}</div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: accent ? "var(--accent)" : "var(--t1)",
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 6 }}>{sub}</div>}
    </Card>
  );
}
