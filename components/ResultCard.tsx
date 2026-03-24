"use client";

/**
 * ResultCard.tsx
 * Affiche le résultat d'une analyse (texte ou URL).
 * Props : result (RiskResult) | null, isLoading
 */

import type { RiskResult } from "@/lib/riskScorer";

interface ResultCardProps {
  result: RiskResult | null;
  isLoading: boolean;
  error?: string | null;
}

// Mapping couleur → classes Tailwind (pour que Tailwind les inclue dans le build)
const colorMap: Record<string, { bg: string; border: string; text: string; bar: string; badge: string }> = {
  red: {
    bg: "bg-red-950/40",
    border: "border-red-500/40",
    text: "text-red-400",
    bar: "bg-red-500",
    badge: "bg-red-500/20 text-red-300 border-red-500/30",
  },
  amber: {
    bg: "bg-amber-950/40",
    border: "border-amber-500/40",
    text: "text-amber-400",
    bar: "bg-amber-500",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  emerald: {
    bg: "bg-emerald-950/40",
    border: "border-emerald-500/40",
    text: "text-emerald-400",
    bar: "bg-emerald-500",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
};

export default function ResultCard({ result, isLoading, error }: ResultCardProps) {
  // --- État chargement ---
  if (isLoading) {
    return (
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-full bg-white/10" />
          <div className="h-5 w-40 rounded bg-white/10" />
        </div>
        <div className="h-3 w-full rounded bg-white/10 mb-2" />
        <div className="h-3 w-5/6 rounded bg-white/10 mb-2" />
        <div className="h-3 w-4/6 rounded bg-white/10" />
      </div>
    );
  }

  // --- État erreur ---
  if (error) {
    return (
      <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-950/30 p-6">
        <p className="text-red-400 font-medium">⚠ Erreur : {error}</p>
      </div>
    );
  }

  // --- Aucun résultat ---
  if (!result) return null;

  const colors = colorMap[result.color] ?? colorMap.emerald;

  return (
    <div
      className={`mt-6 rounded-2xl border ${colors.border} ${colors.bg} p-6 transition-all duration-500`}
      style={{ animation: "fadeSlideIn 0.4s ease-out" }}
    >
      {/* En-tête verdict */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="text-3xl mr-2">{result.emoji}</span>
          <span className={`text-xl font-bold ${colors.text}`}>{result.label}</span>
        </div>
        <span
          className={`text-sm font-mono font-bold px-3 py-1 rounded-full border ${colors.badge}`}
        >
          Score : {result.score}/100
        </span>
      </div>

      {/* Barre de progression */}
      <div className="h-2 w-full bg-white/10 rounded-full mb-5 overflow-hidden">
        <div
          className={`h-full ${colors.bar} rounded-full transition-all duration-700`}
          style={{ width: `${result.score}%` }}
        />
      </div>

      {/* Liste des raisons */}
      <div>
        <p className="text-xs uppercase tracking-widest text-white/40 mb-3 font-semibold">
          Signaux détectés
        </p>
        <ul className="space-y-2">
          {result.reasons.map((reason, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-white/70"
            >
              <span className={`mt-0.5 shrink-0 ${colors.text}`}>
                {result.verdict === "SAFE" ? "✓" : "→"}
              </span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Avertissement légal */}
      <p className="mt-5 text-xs text-white/30 border-t border-white/10 pt-3">
        Cette analyse est automatique et ne constitue pas un avis juridique. En cas de doute, ne communiquez jamais vos informations personnelles.
      </p>
    </div>
  );
}
