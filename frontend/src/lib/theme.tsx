"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";
type Accent = string;

const ACCENTS: Record<string, string> = {
  blue: "#4B6BFB",
  violet: "#8B5CF6",
  emerald: "#10B981",
};

interface ThemeContextValue {
  theme: Theme;
  accent: Accent;
  setTheme: (t: Theme) => void;
  setAccent: (hex: string) => void;
  accentDim: string;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  accent: ACCENTS.blue,
  setTheme: () => {},
  setAccent: () => {},
  accentDim: "rgba(75,107,251,0.13)",
});

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [accent, setAccentState] = useState<Accent>(ACCENTS.blue);

  useEffect(() => {
    const savedTheme = (localStorage.getItem("asquad-theme") as Theme) || "dark";
    const savedAccent = localStorage.getItem("asquad-accent") || ACCENTS.blue;
    setThemeState(savedTheme);
    setAccentState(savedAccent);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("asquad-theme", t);
    document.documentElement.setAttribute("data-theme", t);
  };

  const setAccent = (hex: string) => {
    setAccentState(hex);
    localStorage.setItem("asquad-accent", hex);
    const rgb = hexToRgb(hex);
    document.documentElement.style.setProperty("--accent", hex);
    document.documentElement.style.setProperty("--accent-dim", `rgba(${rgb}, 0.13)`);
  };

  const accentDim = `rgba(${hexToRgb(accent)}, 0.13)`;

  return (
    <ThemeContext.Provider value={{ theme, accent, setTheme, setAccent, accentDim }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
export { ACCENTS };
