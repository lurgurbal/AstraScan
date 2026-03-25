"use client";
import { useState } from "react";
interface Props { type: string; content: string; score: number }
export default function CommunityReport({ type, content, score }: Props) {
  const [reported, setReported] = useState(false);
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true);
    try {
      await fetch("/api/community-report", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content, score }),
      });
      setReported(true);
    } catch {} finally { setLoading(false); }
  };
  if (reported) return (
    <div className="mt-3 text-xs text-emerald-400 flex items-center gap-1.5">
      <span>✓</span> Merci ! Signalement envoyé à la communauté.
    </div>
  );
  return (
    <button onClick={handle} disabled={loading}
      className="mt-3 text-xs text-white/25 hover:text-orange-400 transition-colors flex items-center gap-1.5 disabled:opacity-50">
      {loading ? "Envoi…" : "🚩 Signaler comme arnaque à la communauté"}
    </button>
  );
}
