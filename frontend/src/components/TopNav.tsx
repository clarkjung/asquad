"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Btn from "./ui/Btn";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/provider/dashboard", label: "Provider" },
  { href: "/consumer/dashboard", label: "Consumer" },
];

export default function TopNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <style>{`
        .topnav-links { display: flex; }
        .topnav-auth { display: flex; }
        .topnav-hamburger { display: none; }
        .topnav-mobile-menu { display: none; }
        @media (max-width: 640px) {
          .topnav-links { display: none !important; }
          .topnav-auth { display: none !important; }
          .topnav-hamburger { display: flex !important; }
          .topnav-mobile-menu { display: flex !important; }
        }
      `}</style>
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
          padding: "0 20px",
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

        {/* Desktop nav links */}
        <div className="topnav-links" style={{ gap: 2, flex: 1 }}>
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

        {/* Desktop auth buttons */}
        <div className="topnav-auth" style={{ gap: 8, flexShrink: 0 }}>
          <Btn variant="ghost" size="sm" onClick={() => (window.location.href = "/register?mode=signin")}>Sign In</Btn>
          <Btn size="sm" onClick={() => (window.location.href = "/register")}>Get Started</Btn>
        </div>

        {/* Mobile hamburger */}
        <div style={{ flex: 1 }} />
        <button
          className="topnav-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 8, color: "var(--t1)", alignItems: "center", justifyContent: "center" }}
        >
          {menuOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <line x1="4" y1="4" x2="16" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="16" y1="4" x2="4" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <line x1="3" y1="6" x2="17" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="3" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          className="topnav-mobile-menu"
          style={{
            position: "fixed",
            top: 56,
            left: 0,
            right: 0,
            zIndex: 99,
            background: "var(--bg)",
            borderBottom: "1px solid var(--border)",
            flexDirection: "column",
            padding: "8px 16px 16px",
            gap: 4,
          }}
        >
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  background: active ? "var(--bg3)" : "transparent",
                  padding: "10px 14px",
                  borderRadius: 8,
                  fontSize: 15,
                  color: active ? "var(--t1)" : "var(--t2)",
                  fontWeight: active ? 600 : 500,
                  textDecoration: "none",
                  display: "block",
                }}
              >
                {item.label}
              </Link>
            );
          })}
          <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />
          <button onClick={() => { setMenuOpen(false); window.location.href = "/register?mode=signin"; }} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: 15, color: "var(--t1)", cursor: "pointer", textAlign: "left", fontWeight: 500 }}>Sign In</button>
          <button onClick={() => { setMenuOpen(false); window.location.href = "/register"; }} style={{ background: "var(--accent)", border: "none", borderRadius: 8, padding: "10px 14px", fontSize: 15, color: "white", cursor: "pointer", textAlign: "left", fontWeight: 600, marginTop: 4 }}>Get Started</button>
        </div>
      )}
    </>
  );
}
