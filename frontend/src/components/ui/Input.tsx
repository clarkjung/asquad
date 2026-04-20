"use client";

import React from "react";

interface InputProps {
  placeholder?: string;
  value?: string;
  onChange?: (val: string) => void;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
  type?: string;
}

export default function Input({ placeholder, value, onChange, icon, style = {}, type = "text" }: InputProps) {
  return (
    <div style={{ position: "relative", ...style }}>
      {icon && (
        <span
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--t3)",
            fontSize: 16,
            pointerEvents: "none",
          }}
        >
          {icon}
        </span>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        style={{
          width: "100%",
          background: "var(--bg2)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: icon ? "10px 14px 10px 40px" : "10px 14px",
          color: "var(--t1)",
          fontSize: 14,
          fontFamily: "inherit",
          outline: "none",
          transition: "border-color 0.15s",
        }}
      />
    </div>
  );
}
