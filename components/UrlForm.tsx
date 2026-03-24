"use client";

/**
 * UrlForm.tsx
 * Formulaire de saisie d'une URL à analyser.
 * Appelle l'API /api/analyze-url et remonte le résultat.
 */

import { useState } from "react";
import type { RiskResult } from "@/lib/riskScorer";
import ResultCard from "./ResultCard";

const EXAMPLE_URLS = [
  "http://secure-paypa1-login.xyz/verify?account=12345&token=abc",
  "https://amazon-security-alert.xyz/confirm-identity",
  "https://www.google.com",
];

export default function UrlForm() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<RiskResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/analyze-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erreur inconnue");
      } else {
        setResult(data);
      }
    } catch {
      setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Champ URL */}
        <div className="relative flex items-center">
          <span className="absolute left-4 text-white/30 text-sm font-mono select-none">🔗</span>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://exemple-suspect.xyz/verify"
            maxLength={2000}
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all duration-200 font-mono"
          />
        </div>

        {/* Exemples rapides */}
        <div>
          <p className="text-xs text-white/40 mb-2 uppercase tracking-widest">URLs d&apos;exemple :</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_URLS.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setUrl(ex)}
                className="text-xs px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/50 hover:text-white hover:border-white/30 transition-all duration-150 truncate max-w-[200px]"
                title={ex}
              >
                Exemple {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Avertissement vie privée */}
        <p className="text-xs text-white/30 flex items-start gap-1.5">
          <span>🔒</span>
          <span>L&apos;URL est analysée côté serveur. Ne soumettez pas d&apos;URLs contenant des données personnelles.</span>
        </p>

        {/* Boutons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!url.trim() || isLoading}
            className="flex-1 rounded-xl bg-white text-black font-semibold py-3 text-sm hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 tracking-wide"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                Analyse en cours…
              </span>
            ) : (
              "🔍 Analyser l'URL"
            )}
          </button>
          {(result || url) && (
            <button
              type="button"
              onClick={() => { setUrl(""); setResult(null); setError(null); }}
              className="px-4 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/30 text-sm transition-all duration-200"
            >
              Effacer
            </button>
          )}
        </div>
      </form>

      {/* Résultat */}
      <ResultCard result={result} isLoading={isLoading} error={error} />
    </div>
  );
}
