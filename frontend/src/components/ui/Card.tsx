"use client";

import React, { useState } from "react";

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  hover?: boolean;
}

export default function Card({ children, style = {}, onClick, hover = false }: CardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--bg2)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 24,
        transition: "all 0.2s",
        cursor: onClick ? "pointer" : "default",
        ...(hover && hovered
          ? { border: "1px solid var(--border2)", transform: "translateY(-2px)", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }
          : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}
