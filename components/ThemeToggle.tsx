"use client";

/**
 * ThemeToggle.tsx
 * Bouton pour basculer entre le mode clair et sombre.
 */

import { useState, useEffect } from "react";
import { getPreferredTheme, saveTheme, applyTheme, type Theme } from "@/lib/themeStore";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const preferred = getPreferredTheme();
    setTheme(preferred);
    applyTheme(preferred);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    saveTheme(next);
    applyTheme(next);
  };

  if (!mounted) return <div className="w-9 h-9" />;

  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
      className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-200 text-base"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
