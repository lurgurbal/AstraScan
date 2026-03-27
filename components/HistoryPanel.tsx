"use client";
import { useState, useEffect } from "react";
import { getHistory, clearHistory, type HistoryEntry } from "@/lib/historyStore";
const COLORS = { red: "#ef4444", amber: "#f59e0b", emerald: "#10b981" };
const TYPE_ICON: Record<string, string> = { text: "💬", url: "🔗", image: "📸", phone: "📞" };
function fmt(iso: string) {
  try { return new Date(iso).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }); }
  catch { return ""; }
}
export default function HistoryPanel() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => { setHistory(getHistory()); }, [open]);
  return (
    <div style={{ marginTop: 12 }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border-default)",
        background: "var(--bg-subtle)", cursor: "pointer",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>🕓</span>
          <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>Historique</span>
          {history.length > 0 && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: "var(--border-default)", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{history.length}</span>}
        </div>
        <span style={{ fontSize: 10, color: "var(--text-muted)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
      </button>
      {open && (
        <div style={{ marginTop: 4, borderRadius: 12, border: "1px solid var(--border-default)", background: "var(--bg-card)", overflow: "hidden" }}>
          {history.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, padding: 24 }}>Aucune analyse enregistrée</p>
          ) : (
            <>
              <div style={{ maxHeight: 280, overflowY: "auto" }}>
                {history.map(e => {
                  const c = COLORS[e.result.color as keyof typeof COLORS] ?? COLORS.emerald;
                  return (
                    <div key={e.id} style={{ padding: "10px 16px", borderBottom: "1px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <span>{TYPE_ICON[e.type] ?? "🔍"}</span>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 11, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--font-mono)", margin: 0 }}>{e.input.slice(0,55)}{e.input.length>55?"…":""}</p>
                          <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>{fmt(e.date)}</p>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 999, border: `1px solid ${c}40`, background: `${c}15`, color: c, whiteSpace: "nowrap", fontWeight: 600 }}>{e.result.emoji} {e.result.score}/100</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: "8px 16px", borderTop: "1px solid var(--border-default)", textAlign: "right" }}>
                <button onClick={() => { clearHistory(); setHistory([]); }} style={{ fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>Effacer l&apos;historique</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
