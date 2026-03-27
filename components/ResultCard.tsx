"use client";
import type { RiskResult } from "@/lib/riskScorer";

interface Props { result: RiskResult | null; isLoading: boolean; error?: string | null }

const COLORS = {
  red:     { bg: "rgba(239,68,68,0.07)",   border: "rgba(239,68,68,0.25)",   text: "#ef4444",  bar: "#ef4444"  },
  amber:   { bg: "rgba(245,158,11,0.07)",  border: "rgba(245,158,11,0.25)",  text: "#f59e0b",  bar: "#f59e0b"  },
  emerald: { bg: "rgba(16,185,129,0.07)",  border: "rgba(16,185,129,0.25)",  text: "#10b981",  bar: "#10b981"  },
};

export default function ResultCard({ result, isLoading, error }: Props) {
  if (isLoading) return (
    <div style={{ marginTop: 20, borderRadius: 14, border: "1px solid var(--border-default)", background: "var(--bg-subtle)", padding: 20, animation: "fadeSlideIn 0.3s ease" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--border-default)" }} />
        <div style={{ height: 14, width: 140, borderRadius: 6, background: "var(--border-default)" }} />
      </div>
      {[100, 80, 60].map(w => (
        <div key={w} style={{ height: 10, width: `${w}%`, borderRadius: 5, background: "var(--border-default)", marginBottom: 8 }} />
      ))}
    </div>
  );

  if (error) return (
    <div style={{ marginTop: 16, borderRadius: 12, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.07)", padding: 16 }}>
      <p style={{ color: "#ef4444", fontSize: 13 }}>⚠ {error}</p>
    </div>
  );

  if (!result) return null;
  const c = COLORS[result.color as keyof typeof COLORS] ?? COLORS.emerald;

  return (
    <div style={{ marginTop: 20, borderRadius: 14, border: `1px solid ${c.border}`, background: c.bg, padding: 20, animation: "fadeSlideIn 0.4s ease" }}>
      {/* Verdict */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 28 }}>{result.emoji}</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: c.text }}>{result.label}</span>
        </div>
        <span style={{
          fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700,
          padding: "4px 10px", borderRadius: 999,
          background: c.bg, border: `1px solid ${c.border}`, color: c.text,
        }}>
          {result.score}/100
        </span>
      </div>

      {/* Barre de progression */}
      <div style={{ height: 6, background: "var(--border-default)", borderRadius: 3, marginBottom: 18, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${result.score}%`, background: c.bar, borderRadius: 3, transition: "width 0.7s ease" }} />
      </div>

      {/* Raisons */}
      <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 10 }}>
        Signaux détectés
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {result.reasons.map((reason, i) => (
          <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
            <span style={{ color: c.text, marginTop: 1, flexShrink: 0 }}>{result.verdict === "SAFE" ? "✓" : "→"}</span>
            <span>{reason}</span>
          </li>
        ))}
      </ul>

      <p style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border-default)", fontSize: 11, color: "var(--text-faint)" }}>
        Analyse automatique — ne constitue pas un avis juridique. En cas de doute, ne communiquez jamais vos informations.
      </p>
    </div>
  );
}
