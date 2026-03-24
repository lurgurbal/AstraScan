/**
 * lib/historyStore.ts
 * Gère l'historique des 20 dernières analyses en localStorage.
 */

import type { RiskResult } from "./riskScorer";

export interface HistoryEntry {
  id: string;
  type: "text" | "url" | "image";
  input: string;       // texte, url ou nom du fichier
  result: RiskResult;
  date: string;        // ISO string
}

const HISTORY_KEY = "astrascan_history";
const MAX_ENTRIES = 20;

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addToHistory(entry: Omit<HistoryEntry, "id" | "date">): void {
  if (typeof window === "undefined") return;
  try {
    const history = getHistory();
    const newEntry: HistoryEntry = {
      ...entry,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    // Ajouter en tête, limiter à MAX_ENTRIES
    const updated = [newEntry, ...history].slice(0, MAX_ENTRIES);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {}
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {}
}
