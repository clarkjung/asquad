import React from "react";

export default function SuccessBar({ rate }: { rate: number }) {
  const pct = Math.round(rate * 100);
  const color = pct >= 95 ? "var(--green)" : pct >= 85 ? "var(--amber)" : "var(--red)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: "var(--bg3)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 12, color, fontWeight: 600, minWidth: 32 }}>{pct}%</span>
    </div>
  );
}
