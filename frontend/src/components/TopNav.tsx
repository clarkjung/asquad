"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Btn from "./ui/Btn";

const NAV_ITEMS = [
  { href: "/", label: "Marketplace" },
  { href: "/provider/dashboard", label: "Provider" },
  { href: "/consumer/dashboard", label: "Consumer" },
];

export default function TopNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 56,
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 32px",
        backdropFilter: "blur(12px)",
        gap: 0,
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", marginRight: 40, flexShrink: 0 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="4" cy="4" r="2" fill="white" opacity="0.9" />
            <circle cx="10" cy="4" r="2" fill="white" opacity="0.6" />
            <circle cx="7" cy="10" r="2" fill="white" />
            <line x1="4" y1="4" x2="7" y2="10" stroke="white" strokeWidth="1" opacity="0.5" />
            <line x1="10" y1="4" x2="7" y2="10" stroke="white" strokeWidth="1" opacity="0.5" />
          </svg>
        </div>
        <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--t1)" }}>
          asquad<span style={{ color: "var(--accent)" }}>.ai</span>
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: "flex", gap: 2, flex: 1, overflowX: "auto" }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                background: active ? "var(--bg3)" : "transparent",
                border: "none",
                padding: "6px 14px",
                borderRadius: 6,
                fontSize: 13,
                color: active ? "var(--t1)" : "var(--t3)",
                fontWeight: active ? 600 : 500,
                whiteSpace: "nowrap",
                transition: "all 0.15s",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Auth buttons */}
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <Btn variant="ghost" size="sm" onClick={() => (window.location.href = "/consumer/login")}>Sign In</Btn>
        <Btn size="sm" onClick={() => (window.location.href = "/consumer/register")}>Get Started</Btn>
      </div>
    </nav>
  );
}
