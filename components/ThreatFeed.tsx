"use client";
import { useState, useEffect } from "react";
interface ThreatEntry { title: string; description: string; link: string; pubDate: string; source: string; keywords: string[] }
interface Feed { entries: ThreatEntry[]; lastUpdated: string; sources: string[] }

function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (d > 0) return `il y a ${d}j`;
    if (h > 0) return `il y a ${h}h`;
    return "récent";
  } catch { return ""; }
}

export default function ThreatFeed() {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || feed) return;
    setLoading(true);
    fetch("/api/threats-feed")
      .then(r => r.json()).then(setFeed)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, feed]);

  return (
    <div className="mt-4">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-red-500/15 bg-red-500/5 hover:bg-red-500/10 transition-all group">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          <span className="text-sm text-red-400 font-medium">Alertes arnaques en temps réel</span>
        </div>
        <span className={`text-red-400/50 text-xs transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▼</span>
      </button>
      {open && (
        <div className="mt-2 rounded-xl border border-red-500/15 bg-red-500/5 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-3">
              <span className="h-4 w-4 rounded-full border-2 border-red-500/30 border-t-red-500 animate-spin" />
              <span className="text-sm text-white/40">Chargement des alertes…</span>
            </div>
          ) : feed ? (
            <>
              <div className="px-4 py-2 border-b border-red-500/10 flex items-center justify-between">
                <span className="text-xs text-white/30">Sources : {feed.sources.join(", ")}</span>
                <span className="text-xs text-white/20">{timeAgo(feed.lastUpdated)}</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-red-500/10">
                {feed.entries.slice(0, 8).map((entry, i) => (
                  <a key={i} href={entry.link} target="_blank" rel="noopener noreferrer"
                    className="block px-4 py-3 hover:bg-red-500/10 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-xs font-medium text-white/75 leading-snug">{entry.title}</p>
                      <span className="text-[10px] text-white/25 shrink-0 mt-0.5">{timeAgo(entry.pubDate)}</span>
                    </div>
                    {entry.description && (
                      <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2">{entry.description}</p>
                    )}
                    {entry.keywords.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {entry.keywords.slice(0, 3).map(kw => (
                          <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">{kw}</span>
                        ))}
                      </div>
                    )}
                  </a>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-red-500/10 text-center">
                <a href="https://www.cybermalveillance.gouv.fr" target="_blank" rel="noopener noreferrer"
                  className="text-xs text-red-400/60 hover:text-red-400 transition-colors">
                  Voir toutes les alertes sur Cybermalveillance.gouv.fr →
                </a>
              </div>
            </>
          ) : (
            <p className="text-center text-white/30 text-sm py-6">Impossible de charger les alertes</p>
          )}
        </div>
      )}
    </div>
  );
}
