/**
 * lib/statsStore.ts
 * Gère les statistiques globales stockées en localStorage.
 * Compte le nombre total d'analyses et d'arnaques détectées.
 */

export interface Stats {
  totalAnalyses: number;
  totalScams: number;      // score >= 70
  totalSuspicious: number; // score >= 40
  totalSafe: number;       // score < 40
}

const STATS_KEY = "astrascan_stats";

export function getStats(): Stats {
  if (typeof window === "undefined") return { totalAnalyses: 0, totalScams: 0, totalSuspicious: 0, totalSafe: 0 };
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { totalAnalyses: 0, totalScams: 0, totalSuspicious: 0, totalSafe: 0 };
    return JSON.parse(raw);
  } catch {
    return { totalAnalyses: 0, totalScams: 0, totalSuspicious: 0, totalSafe: 0 };
  }
}

export function recordAnalysis(score: number): void {
  if (typeof window === "undefined") return;
  try {
    const stats = getStats();
    stats.totalAnalyses += 1;
    if (score >= 70) stats.totalScams += 1;
    else if (score >= 40) stats.totalSuspicious += 1;
    else stats.totalSafe += 1;
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
}
