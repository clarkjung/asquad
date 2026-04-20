import React from "react";

export default function LatencyBar({ ms }: { ms: number }) {
  const level = ms < 500 ? "green" : ms < 1500 ? "amber" : "red";
  const colorMap = { green: "var(--green)", amber: "var(--amber)", red: "var(--red)" };
  return (
    <span style={{ color: colorMap[level], fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
      {ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`}
    </span>
  );
}
