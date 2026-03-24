"use client";

/**
 * HistoryPanel.tsx
 * Affiche l'historique des 20 dernières analyses stockées en localStorage.
 */

import { useState, useEffect } from "react";
import { getHistory, clearHistory, type HistoryEntry } from "@/lib/historyStore";

const colorMap: Record<string, string> = {
  red: "text-red-400 border-red-500/30 bg-red-500/10",
  amber: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  emerald: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
};

const typeIcon: Record<string, string> = {
  text: "💬",
  url: "🔗",
  image: "📸",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function HistoryPanel() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
  }, [open]);

  const handleClear = () => {
    clearHistory();
    setHistory([]);
  };

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-white/8 bg-white/[0.02] hover:bg-white/5 transition-all duration-200 group"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">🕓</span>
          <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
            Historique des analyses
          </span>
          {history.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/40 font-mono">
              {history.length}
            </span>
          )}
        </div>
        <span className={`text-white/30 text-xs transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▼</span>
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
          {history.length === 0 ? (
            <p className="text-center text-white/30 text-sm py-8">Aucune analyse enregistrée</p>
          ) : (
            <>
              <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                {history.map((entry) => {
                  const colors = colorMap[entry.result.color] ?? colorMap.emerald;
                  return (
                    <div key={entry.id} className="px-4 py-3 hover:bg-white/5 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="text-base shrink-0 mt-0.5">{typeIcon[entry.type]}</span>
                          <div className="min-w-0">
                            <p className="text-xs text-white/60 truncate font-mono">{entry.input.slice(0, 60)}{entry.input.length > 60 ? "…" : ""}</p>
                            <p className="text-[10px] text-white/25 mt-0.5">{formatDate(entry.date)}</p>
                          </div>
                        </div>
                        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${colors}`}>
                          {entry.result.emoji} {entry.result.score}/100
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-white/8 px-4 py-2 flex justify-end">
                <button onClick={handleClear} className="text-xs text-white/25 hover:text-red-400 transition-colors">
                  Effacer l&apos;historique
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
