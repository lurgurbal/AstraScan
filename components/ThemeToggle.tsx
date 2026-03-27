"use client";
/**
 * ThemeToggle.tsx — Bouton clair/sombre.
 * Lit le thème depuis le DOM (pas useState init) pour éviter le flash.
 */
import { useState, useEffect } from "react";
import { saveTheme, applyTheme, type Theme } from "@/lib/themeStore";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Lire depuis le DOM (appliqué par le script anti-FOUC dans layout.tsx)
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
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
      title={theme === "dark" ? "Mode clair" : "Mode sombre"}
      style={{
        width: 36, height: 36,
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 10,
        border: "1px solid var(--border-default)",
        background: "var(--bg-subtle)",
        color: "var(--text-secondary)",
        cursor: "pointer",
        fontSize: 16,
        transition: "all 0.15s",
      }}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
