"use client";

import React, { useState } from "react";

type Variant = "primary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

interface BtnProps {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  type?: "button" | "submit" | "reset";
}

const sizes: Record<Size, React.CSSProperties> = {
  sm: { padding: "6px 14px", fontSize: 13 },
  md: { padding: "10px 20px", fontSize: 14 },
  lg: { padding: "13px 28px", fontSize: 15 },
};

const variants: Record<Variant, React.CSSProperties> = {
  primary: { background: "var(--accent)", color: "#fff" },
  ghost: { background: "transparent", color: "var(--t2)", border: "1px solid var(--border2)" },
  danger: { background: "rgba(239,68,68,0.12)", color: "var(--red)", border: "1px solid rgba(239,68,68,0.2)" },
  success: { background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(16,185,129,0.2)" },
};

export default function Btn({ children, variant = "primary", size = "md", onClick, disabled, style = {}, type = "button" }: BtnProps) {
  const [hovered, setHovered] = useState(false);

  const hoverStyle: React.CSSProperties =
    hovered && !disabled
      ? variant === "primary"
        ? { filter: "brightness(1.1)", transform: "translateY(-1px)" }
        : { background: "var(--bg3)" }
      : {};

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "inherit",
        fontWeight: 600,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.15s",
        borderRadius: 8,
        letterSpacing: "-0.01em",
        opacity: disabled ? 0.5 : 1,
        ...sizes[size],
        ...variants[variant],
        ...hoverStyle,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
