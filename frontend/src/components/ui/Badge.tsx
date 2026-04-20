import React from "react";

type BadgeColor = "default" | "blue" | "green" | "amber" | "red";

const colors: Record<BadgeColor, React.CSSProperties> = {
  default: { background: "var(--bg3)", color: "var(--t2)" },
  blue: { background: "var(--accent-dim)", color: "var(--accent)" },
  green: { background: "var(--green-dim)", color: "var(--green)" },
  amber: { background: "rgba(245,158,11,0.12)", color: "var(--amber)" },
  red: { background: "rgba(239,68,68,0.12)", color: "var(--red)" },
};

export default function Badge({ children, color = "default" }: { children: React.ReactNode; color?: BadgeColor }) {
  return (
    <span
      style={{
        ...colors[color],
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 8px",
        borderRadius: 4,
        letterSpacing: "0.02em",
        textTransform: "uppercase",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {children}
    </span>
  );
}
