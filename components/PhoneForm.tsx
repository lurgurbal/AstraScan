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
      const res = await fetch("/api/analyze-phone", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur"); return; }
      setResult(data);
      addToHistory({ type: "text", input: `📞 ${phone}`, result: data });
      recordAnalysis(data.score);
    } catch { setError("Erreur réseau."); }
    finally { setIsLoading(false); }
  };

  const btnStyle = { height: 44, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", padding: "0 16px" };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div style={{ position: "relative", marginBottom: 14 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: 14 }}>📞</span>
          <input type="text" value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="+33 6 12 34 56 78 ou 0899 23 45 67" maxLength={30}
            className="input-base" style={{ width: "100%", paddingLeft: 40, paddingRight: 14, paddingTop: 10, paddingBottom: 10, fontSize: 13, fontFamily: "var(--font-mono)" }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Exemples :</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {EXAMPLES.map((ex, i) => (
              <button key={i} type="button" onClick={() => setPhone(ex)} style={{
                fontSize: 11, padding: "4px 10px", borderRadius: 999,
                border: "1px solid var(--border-default)", background: "var(--bg-subtle)",
                color: "var(--text-secondary)", cursor: "pointer", fontFamily: "var(--font-mono)",
              }}>{ex}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={!phone.trim() || isLoading} className="btn-primary" style={{ ...btnStyle, flex: 1 }}>
            {isLoading ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span style={{ width: 14, height: 14, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "var(--bg-page)", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />Analyse…</span> : "🔍 Analyser le numéro"}
          </button>
          {(result || phone) && <button type="button" onClick={() => { setPhone(""); setResult(null); setError(null); }} className="btn-ghost" style={{ ...btnStyle, padding: "0 14px" }}>Effacer</button>}
        </div>
      </form>
      {error && <div style={{ marginTop: 12, borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.07)", padding: 14 }}><p style={{ color: "#ef4444", fontSize: 13 }}>⚠ {error}</p></div>}
      <ResultCard result={result} isLoading={isLoading} error={null} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
