"use client";
import { useState } from "react";
import type { RiskResult } from "@/lib/riskScorer";
import { addToHistory } from "@/lib/historyStore";
import { recordAnalysis } from "@/lib/statsStore";
import ResultCard from "./ResultCard";

const EXAMPLE_URLS = [
  "http://secure-paypa1-login.xyz/verify?account=12345",
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
    setIsLoading(true); setResult(null); setError(null);
    try {
      const res = await fetch("/api/analyze-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur"); return; }
      setResult(data);
      addToHistory({ type: "url", input: url, result: data });
      recordAnalysis(data.score);
    } catch { setError("Impossible de contacter le serveur."); }
    finally { setIsLoading(false); }
  };

  const btnStyle = { height: 44, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", padding: "0 16px" };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div style={{ position: "relative", marginBottom: 14 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: 14 }}>🔗</span>
          <input type="text" value={url} onChange={e => setUrl(e.target.value)}
            placeholder="https://exemple-suspect.xyz/verify" maxLength={2000}
            className="input-base" style={{ width: "100%", paddingLeft: 40, paddingRight: 14, paddingTop: 10, paddingBottom: 10, fontSize: 13, fontFamily: "var(--font-mono)" }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>URLs d&apos;exemple :</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {EXAMPLE_URLS.map((ex, i) => (
              <button key={i} type="button" onClick={() => setUrl(ex)} title={ex} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 999, border: "1px solid var(--border-default)", background: "var(--bg-subtle)", color: "var(--text-secondary)", cursor: "pointer", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Exemple {i + 1}
              </button>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 14, display: "flex", gap: 6 }}>
          <span>🔒</span><span>L&apos;URL est testée en HTTP réel (HEAD/GET) + vérification PhishTank. Ne soumettez pas d&apos;URLs avec données personnelles.</span>
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={!url.trim() || isLoading} className="btn-primary" style={{ ...btnStyle, flex: 1 }}>
            {isLoading ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span style={{ width: 14, height: 14, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "var(--bg-page)", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />Analyse (jusqu&apos;à 8s)…</span> : "🔍 Analyser l'URL"}
          </button>
          {(result || url) && <button type="button" onClick={() => { setUrl(""); setResult(null); setError(null); }} className="btn-ghost" style={{ ...btnStyle, padding: "0 14px" }}>Effacer</button>}
        </div>
      </form>
      {error && <div style={{ marginTop: 12, borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.07)", padding: 14 }}><p style={{ color: "#ef4444", fontSize: 13 }}>⚠ {error}</p></div>}
      <ResultCard result={result} isLoading={isLoading} error={null} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
