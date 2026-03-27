/**
 * lib/themeStore.ts — Gestion thème clair/sombre.
 * MODE CLAIR PAR DÉFAUT.
 */

const THEME_KEY = "astrascan_theme";
export type Theme = "dark" | "light";

export function getSavedTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try { return (localStorage.getItem(THEME_KEY) as Theme) || null; }
  catch { return null; }
}

// ✅ CORRIGÉ : light par défaut (plus dark)
export function getPreferredTheme(): Theme {
  const saved = getSavedTheme();
  if (saved) return saved;
  // Respecter la préférence système si elle est explicitement sombre
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light"; // ← défaut = clair
}

export function saveTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(THEME_KEY, theme); } catch {}
}

export function applyTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
}
