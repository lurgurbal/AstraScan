"use client";
import { useState } from "react";
import type { RiskResult } from "@/lib/riskScorer";
import { addToHistory } from "@/lib/historyStore";
import { recordAnalysis } from "@/lib/statsStore";
import ResultCard from "./ResultCard";

const EXAMPLES = [
  "URGENT : Votre compte bancaire a été suspendu. Cliquez ici immédiatement pour vérifier votre identité : http://secure-login-confirm.xyz",
  "Félicitations ! Vous avez été sélectionné comme gagnant. Envoyez votre RIB et votre carte bancaire pour recevoir 5 000€.",
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
      const res = await fetch("/api/analyze-text", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur"); return; }
      setResult(data);
      addToHistory({ type: "text", input: text.slice(0, 80), result: data });
      recordAnalysis(data.score);
    } catch { setError("Impossible de contacter le serveur."); }
    finally { setIsLoading(false); }
  };

  const btnStyle = { height: 44, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", padding: "0 16px" };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div style={{ position: "relative", marginBottom: 14 }}>
          <textarea value={text} onChange={e => setText(e.target.value)} maxLength={5000} rows={6}
            placeholder="Collez ici le message suspect (SMS, e-mail, WhatsApp…)"
            className="input-base" style={{ width: "100%", resize: "none", padding: "12px 14px", fontSize: 13, fontFamily: "var(--font-mono)", lineHeight: 1.6 }} />
          <span style={{ position: "absolute", bottom: 10, right: 12, fontSize: 10, fontFamily: "var(--font-mono)", color: text.length > 4500 ? "#ef4444" : "var(--text-faint)" }}>{text.length}/5000</span>
        </div>
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Exemples :</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {EXAMPLES.map((ex, i) => (
              <button key={i} type="button" onClick={() => setText(ex)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 999, border: "1px solid var(--border-default)", background: "var(--bg-subtle)", color: "var(--text-secondary)", cursor: "pointer" }}>
                Exemple {i + 1}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={!text.trim() || isLoading} className="btn-primary" style={{ ...btnStyle, flex: 1 }}>
            {isLoading ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span style={{ width: 14, height: 14, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "var(--bg-page)", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />Analyse…</span> : "🔍 Analyser le message"}
          </button>
          {(result || text) && <button type="button" onClick={() => { setText(""); setResult(null); setError(null); }} className="btn-ghost" style={{ ...btnStyle, padding: "0 14px" }}>Effacer</button>}
        </div>
      </form>
      {error && <div style={{ marginTop: 12, borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.07)", padding: 14 }}><p style={{ color: "#ef4444", fontSize: 13 }}>⚠ {error}</p></div>}
      <ResultCard result={result} isLoading={isLoading} error={null} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
