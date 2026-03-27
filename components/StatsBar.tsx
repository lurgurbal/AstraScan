"use client";
import { useState, useEffect } from "react";
import { getStats } from "@/lib/statsStore";

export default function StatsBar() {
  const [stats, setStats] = useState({ totalAnalyses: 0, totalScams: 0, totalSuspicious: 0, totalSafe: 0 });
  useEffect(() => {
    setStats(getStats());
    const id = setInterval(() => setStats(getStats()), 2000);
    return () => clearInterval(id);
  }, []);
  if (stats.totalAnalyses === 0) return null;
  return (
    <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
      {[
        { label: "Analyses", value: stats.totalAnalyses, color: "var(--text-secondary)" },
        { label: "Arnaques 🚨", value: stats.totalScams, color: "#ef4444" },
        { label: "Suspects ⚠️", value: stats.totalSuspicious, color: "#f59e0b" },
        { label: "Sûrs ✅", value: stats.totalSafe, color: "#10b981" },
      ].map(s => (
        <div key={s.label} className="card" style={{ padding: "12px 8px", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)", color: s.color }}>{s.value}</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}
