/**
 * lib/themeStore.ts
 * Gère le thème clair/sombre avec localStorage + préférence système.
 */

const THEME_KEY = "astrascan_theme";

export type Theme = "dark" | "light";

export function getSavedTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    return (localStorage.getItem(THEME_KEY) as Theme) || null;
  } catch {
    return null;
  }
}

export function getPreferredTheme(): Theme {
  const saved = getSavedTheme();
  if (saved) return saved;
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return "dark";
}

export function saveTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
}

export function applyTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.add("light");
    root.classList.remove("dark");
  } else {
    root.classList.add("dark");
    root.classList.remove("light");
  }
}
