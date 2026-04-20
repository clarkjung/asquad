import React from "react";

interface MiniChartProps {
  data: number[];
  color?: string;
  labels?: string[];
}

export default function MiniChart({ data, color = "var(--accent)", labels }: MiniChartProps) {
  const max = Math.max(...data);
  const w = 280, h = 60;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h * 0.85 - 4}`)
    .join(" ");
  const area = `0,${h} ${points} ${w},${h}`;
  const gradId = `grad-${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#${gradId})`} />
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((v, i) => (
          <circle
            key={i}
            cx={(i / (data.length - 1)) * w}
            cy={h - (v / max) * h * 0.85 - 4}
            r="3"
            fill={color}
          />
        ))}
      </svg>
      {labels && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          {labels.map((l) => (
            <span key={l} style={{ fontSize: 11, color: "var(--t3)" }}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}
