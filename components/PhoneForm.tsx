"use client";
import { useState } from "react";
import type { RiskResult } from "@/lib/riskScorer";
import { addToHistory } from "@/lib/historyStore";
import { recordAnalysis } from "@/lib/statsStore";
import ResultCard from "./ResultCard";

const EXAMPLES = ["+33 9 72 23 44 12", "+33 800 123 456", "+269 123 456", "0 899 23 45 67"];

export default function PhoneForm() {
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<RiskResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setIsLoading(true); setResult(null); setError(null);
    try {
      const res = await fetch("/api/analyze-phone", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur"); return; }
      setResult(data);
      addToHistory({ type: "text", input: `📞 ${phone}`, result: data });
      recordAnalysis(data.score);
    } catch { setError("Erreur réseau."); }
    finally { setIsLoading(false); }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative flex items-center">
          <span className="absolute left-4 text-white/30 text-sm select-none">📞</span>
          <input type="text" value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="+33 6 12 34 56 78 ou 0899 23 45 67"
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30 font-mono transition-all" />
        </div>
        <div>
          <p className="text-xs text-white/40 mb-2 uppercase tracking-widest">Exemples :</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex, i) => (
              <button key={i} type="button" onClick={() => setPhone(ex)}
                className="text-xs px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/50 hover:text-white hover:border-white/30 transition-all font-mono">
                {ex}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={!phone.trim() || isLoading}
            className="flex-1 rounded-xl bg-white text-black font-semibold py-3 text-sm hover:bg-white/90 disabled:opacity-40 transition-all">
            {isLoading ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />Analyse…</span> : "🔍 Analyser le numéro"}
          </button>
          {(result || phone) && <button type="button" onClick={() => { setPhone(""); setResult(null); setError(null); }} className="px-4 rounded-xl border border-white/10 text-white/40 hover:text-white text-sm transition-all">Effacer</button>}
        </div>
      </form>
      {error && <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/30 p-4"><p className="text-red-400 text-sm">⚠ {error}</p></div>}
      <ResultCard result={result} isLoading={isLoading} error={null} />
    </div>
  );
}
