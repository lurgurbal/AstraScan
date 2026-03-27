"use client";
/**
 * app/page.tsx — Outil principal AstraScan (route "/").
 * CORRECTION : c'est "/" pas "/app" → landing pointe correctement ici.
 */

import { useState } from "react";
import Link from "next/link";
import TextForm from "@/components/TextForm";
import UrlForm from "@/components/UrlForm";
import ImageForm from "@/components/ImageForm";
import PhoneForm from "@/components/PhoneForm";
import HistoryPanel from "@/components/HistoryPanel";
import StatsBar from "@/components/StatsBar";
import ThemeToggle from "@/components/ThemeToggle";
import ThreatFeed from "@/components/ThreatFeed";

type Tab = "text" | "url" | "image" | "phone";

const TABS: { id: Tab; icon: string; label: string; desc: string }[] = [
  { id: "text",  icon: "💬", label: "Message",   desc: "SMS, e-mail ou WhatsApp — analyse linguistique avancée, détection psychologique et sémantique sans liste de mots." },
  { id: "url",   icon: "🔗", label: "URL",        desc: "Lien suspect — Levenshtein typosquatting, PhishTank temps réel, testeur HTTP, analyse structurelle." },
  { id: "image", icon: "📸", label: "Capture",    desc: "Screenshot — OCR Tesseract local (gratuit), analyse du texte extrait + deepfake EXIF." },
  { id: "phone", icon: "📞", label: "Téléphone",  desc: "Numéro suspect — surtaxés 08xx, VoIP, Wangiri international, spoofing SMS." },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("text");

  return (
    <main className="page-glow-red grid-bg" style={{ minHeight: "100vh", position: "relative" }}>
      <div style={{ position: "relative", zIndex: 1, maxWidth: 672, margin: "0 auto", padding: "48px 16px 80px" }}>

        {/* Nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
          <Link href="/landing" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>
            ← Accueil
          </Link>
          <span style={{ fontSize: 18, fontWeight: 700 }}>
            <span style={{ color: "var(--text-primary)" }}>Astra</span>
            <span style={{ color: "#ef4444" }}>Scan</span>
          </span>
          <ThemeToggle />
        </div>

        {/* Header */}
        <header style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 999,
            border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.08)",
            padding: "5px 14px", fontSize: 11, color: "#ef4444", fontWeight: 500, marginBottom: 16,
          }}>
            <span style={{ position: "relative", display: "inline-flex", width: 7, height: 7 }}>
              <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(239,68,68,0.5)", animation: "ping 1.5s ease-in-out infinite" }} />
              <span style={{ position: "relative", width: 7, height: 7, borderRadius: "50%", background: "#ef4444" }} />
            </span>
            Moteur v3 · Sources officielles françaises
          </div>

          <h1 style={{ fontSize: "clamp(2.5rem, 8vw, 3.5rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 10 }}>
            <span style={{ color: "var(--text-primary)" }}>Astra</span>
            <span style={{ color: "#ef4444" }}>Scan</span>
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>
            Moteur contextuel · Levenshtein · PhishTank · OCR · EXIF · DGCCRF · Cybermalveillance
          </p>
        </header>

        {/* Carte principale */}
        <div className="card" style={{ marginBottom: 16, overflow: "hidden" }}>
          {/* Onglets */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderBottom: "1px solid var(--border-default)" }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                padding: "14px 4px", fontSize: 11, fontWeight: 500, cursor: "pointer",
                background: activeTab === tab.id ? "var(--bg-subtle)" : "transparent",
                color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-muted)",
                borderBottom: activeTab === tab.id ? "2px solid #ef4444" : "2px solid transparent",
                border: "none", transition: "all 0.15s",
              }}>
                <span style={{ fontSize: 18 }}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Contenu */}
          <div style={{ padding: 24 }}>
            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 20 }}>
              {TABS.find(t => t.id === activeTab)?.desc}
            </p>
            {activeTab === "text"  && <TextForm />}
            {activeTab === "url"   && <UrlForm />}
            {activeTab === "image" && <ImageForm />}
            {activeTab === "phone" && <PhoneForm />}
          </div>
        </div>

        {/* Alertes temps réel */}
        <ThreatFeed />

        {/* Légende scores */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 16 }}>
          {[
            { emoji: "🚨", label: "Probable arnaque", range: "≥ 70", bg: "rgba(239,68,68,0.07)", border: "rgba(239,68,68,0.2)" },
            { emoji: "⚠️", label: "À vérifier",       range: "≥ 40", bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.2)" },
            { emoji: "✅", label: "Rien de flagrant", range: "< 40",  bg: "rgba(16,185,129,0.07)", border: "rgba(16,185,129,0.2)" },
          ].map(item => (
            <div key={item.label} style={{ borderRadius: 12, border: `1px solid ${item.border}`, background: item.bg, padding: "12px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{item.emoji}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>{item.label}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>Score {item.range}</div>
            </div>
          ))}
        </div>

        <StatsBar />
        <HistoryPanel />

        <footer style={{ marginTop: 40, textAlign: "center", fontSize: 11, color: "var(--text-faint)", lineHeight: 2 }}>
          <p>AstraScan v3 · Moteur contextuel · PhishTank · Levenshtein · Tesseract OCR · EXIF</p>
          <p>
            {[
              ["signal-spam.fr", "https://signal-spam.fr"],
              ["phishing-initiative.fr", "https://phishing-initiative.fr"],
              ["cybermalveillance.gouv.fr", "https://www.cybermalveillance.gouv.fr"],
              ["signal.conso.gouv.fr", "https://signal.conso.gouv.fr"],
            ].map(([label, url], i) => (
              <span key={label}>
                {i > 0 && <span style={{ margin: "0 6px", opacity: 0.4 }}>·</span>}
                <a href={url} target="_blank" rel="noopener noreferrer"
                  style={{ color: "var(--text-faint)", textDecoration: "none" }}>{label}</a>
              </span>
            ))}
          </p>
        </footer>
      </div>
    </main>
  );
}
