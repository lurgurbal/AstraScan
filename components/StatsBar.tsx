"use client";

/**
 * StatsBar.tsx
 * Affiche les statistiques d'utilisation locales de l'utilisateur.
 */

import { useState, useEffect } from "react";
import { getStats, type Stats } from "@/lib/statsStore";

export default function StatsBar() {
  const [stats, setStats] = useState<Stats>({ totalAnalyses: 0, totalScams: 0, totalSuspicious: 0, totalSafe: 0 });

  useEffect(() => {
    setStats(getStats());
    // Rafraîchir après chaque analyse
    const interval = setInterval(() => setStats(getStats()), 2000);
    return () => clearInterval(interval);
  }, []);

  if (stats.totalAnalyses === 0) return null;

  return (
    <div className="mt-8 grid grid-cols-4 gap-2">
      {[
        { label: "Analyses", value: stats.totalAnalyses, color: "text-white/60" },
        { label: "Arnaques 🚨", value: stats.totalScams, color: "text-red-400" },
        { label: "À vérifier ⚠️", value: stats.totalSuspicious, color: "text-amber-400" },
        { label: "Sûrs ✅", value: stats.totalSafe, color: "text-emerald-400" },
      ].map((stat) => (
        <div key={stat.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-center">
          <div className={`text-xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
          <div className="text-[10px] text-white/30 mt-0.5">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
