"use client";

import { useState } from "react";
import type { RiskResult } from "@/lib/riskScorer";
import { addToHistory } from "@/lib/historyStore";
import { recordAnalysis } from "@/lib/statsStore";
import ResultCard from "./ResultCard";

const EXAMPLES = [
  "URGENT : Votre compte bancaire a été suspendu. Cliquez ici immédiatement pour vérifier votre identité : http://secure-login-confirm.xyz",
  "Félicitations ! Vous avez été sélectionné comme gagnant de notre tirage au sort. Envoyez votre RIB et votre carte bancaire pour recevoir 5 000€.",
  "Bonjour, voici les documents pour la réunion de demain. N'hésitez pas si tu as des questions !",
];

export default function TextForm() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<RiskResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setIsLoading(true); setResult(null); setError(null);
    try {
      const res = await fetch("/api/analyze-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur inconnue"); }
      else {
        setResult(data);
        addToHistory({ type: "text", input: text.slice(0, 80), result: data });
        recordAnalysis(data.score);
      }
    } catch { setError("Impossible de contacter le serveur."); }
    finally { setIsLoading(false); }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={5000} rows={6}
            placeholder="Collez ici le message suspect (SMS, e-mail, WhatsApp…)"
            className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all duration-200 font-mono leading-relaxed" />
          <span className={`absolute bottom-3 right-3 text-xs font-mono ${text.length > 4500 ? "text-red-400" : "text-white/30"}`}>
            {text.length}/5000
          </span>
        </div>
        <div>
          <p className="text-xs text-white/40 mb-2 uppercase tracking-widest">Exemples :</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex, i) => (
              <button key={i} type="button" onClick={() => setText(ex)}
                className="text-xs px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/50 hover:text-white hover:border-white/30 transition-all duration-150">
                Exemple {i + 1}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={!text.trim() || isLoading}
            className="flex-1 rounded-xl bg-white text-black font-semibold py-3 text-sm hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200">
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                Analyse en cours…
              </span>
            ) : "🔍 Analyser le message"}
          </button>
          {(result || text) && (
            <button type="button" onClick={() => { setText(""); setResult(null); setError(null); }}
              className="px-4 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/30 text-sm transition-all duration-200">
              Effacer
            </button>
          )}
        </div>
      </form>
      <ResultCard result={result} isLoading={isLoading} error={error} />
    </div>
  );
}
