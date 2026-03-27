"use client";
import { useState, useEffect } from "react";
interface ThreatEntry { title: string; description: string; link: string; pubDate: string; source: string; category: string; keywords: string[] }
interface Feed { entries: ThreatEntry[]; lastUpdated: string; sources: string[]; fromCache?: boolean }

function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const d = Math.floor(diff / 86400000);
    const h = Math.floor(diff / 3600000);
    if (d > 0) return `il y a ${d}j`;
    if (h > 0) return `il y a ${h}h`;
    return "récent";
  } catch { return ""; }
}

const CAT_COLOR: Record<string, string> = {
  phishing: "#ef4444", arnaque: "#f59e0b", fraude: "#f97316", alerte: "#8b5cf6", info: "#6b7280"
};

export default function ThreatFeed() {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || feed) return;
    setLoading(true);
    fetch("/api/threats-feed").then(r => r.json()).then(setFeed).catch(() => {}).finally(() => setLoading(false));
  }, [open, feed]);

  return (
    <div style={{ marginTop: 16 }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", borderRadius: 12,
        border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)",
        cursor: "pointer", transition: "background 0.15s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8 }}>
            <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(239,68,68,0.5)", animation: "ping 1.5s ease-in-out infinite" }} />
            <span style={{ position: "relative", width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
          </span>
          <span style={{ fontSize: 13, color: "#ef4444", fontWeight: 600 }}>Alertes arnaques en temps réel</span>
          <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 400 }}>Cybermalveillance · DGCCRF · CNIL</span>
        </div>
        <span style={{ color: "#ef4444", opacity: 0.5, fontSize: 10, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
      </button>

      {open && (
        <div style={{ marginTop: 4, borderRadius: 12, border: "1px solid rgba(239,68,68,0.15)", background: "rgba(239,68,68,0.04)", overflow: "hidden" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 32, color: "var(--text-muted)", fontSize: 13 }}>
              <span style={{ width: 14, height: 14, border: "2px solid rgba(239,68,68,0.2)", borderTopColor: "#ef4444", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
              Chargement des alertes…
            </div>
          ) : feed ? (
            <>
              <div style={{ padding: "8px 16px", borderBottom: "1px solid rgba(239,68,68,0.1)", display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
                <span>Sources : {feed.sources?.join(", ")}</span>
                <span>{timeAgo(feed.lastUpdated)}</span>
              </div>
              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {feed.entries?.slice(0, 7).map((entry, i) => (
                  <a key={i} href={entry.link || "#"} target="_blank" rel="noopener noreferrer" style={{
                    display: "block", padding: "12px 16px", borderBottom: "1px solid rgba(239,68,68,0.08)",
                    textDecoration: "none", transition: "background 0.1s",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4, margin: 0 }}>{entry.title}</p>
                      <span style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0 }}>{timeAgo(entry.pubDate)}</span>
                    </div>
                    {entry.description && <p style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 6px" }}>{entry.description.slice(0, 160)}{entry.description.length > 160 ? "…" : ""}</p>}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {entry.category && (
                        <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: `${CAT_COLOR[entry.category] ?? "#6b7280"}20`, color: CAT_COLOR[entry.category] ?? "#6b7280" }}>
                          {entry.category}
                        </span>
                      )}
                      {entry.keywords?.slice(0,2).map(kw => (
                        <span key={kw} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>{kw}</span>
                      ))}
                    </div>
                  </a>
                ))}
              </div>
              <div style={{ padding: "8px 16px", borderTop: "1px solid rgba(239,68,68,0.1)", textAlign: "center" }}>
                <a href="https://www.cybermalveillance.gouv.fr/tous-nos-contenus/actualites" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#ef4444", opacity: 0.7, textDecoration: "none" }}>
                  Voir toutes les alertes officielles →
                </a>
              </div>
            </>
          ) : (
            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, padding: 24 }}>Impossible de charger les alertes</p>
          )}
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes ping{0%,100%{opacity:.75;transform:scale(1)}50%{opacity:0;transform:scale(2)}}`}</style>
    </div>
  );
}
