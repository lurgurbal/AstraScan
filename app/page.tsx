"use client";
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
  { id: "text",  icon: "💬", label: "Message",  desc: "SMS, e-mail ou WhatsApp suspect — analyse linguistique avancée sans liste de mots, détection psychologique et sémantique." },
  { id: "url",   icon: "🔗", label: "URL",       desc: "Lien suspect — détection typosquatting par algorithme Levenshtein, vérification PhishTank en temps réel, analyse structurelle." },
  { id: "image", icon: "📸", label: "Capture",   desc: "Screenshot suspect — OCR Tesseract local (gratuit), puis analyse avancée du texte extrait. Analyse deepfake des métadonnées EXIF." },
  { id: "phone", icon: "📞", label: "Téléphone", desc: "Numéro suspect — détection numéros surtaxés, VoIP, Wangiri international, spoofing et patterns frauduleux." },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("text");
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070809] transition-colors duration-300">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-red-600/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[400px] w-[400px] rounded-full bg-orange-500/8 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "linear-gradient(#ffffff 1px,transparent 1px),linear-gradient(90deg,#ffffff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-12 sm:py-20">
        {/* Nav */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/landing" className="text-xs text-white/30 hover:text-white/60 transition-colors">← Accueil</Link>
          <span className="text-lg font-bold"><span className="text-white">Astra</span><span className="text-red-500">Scan</span></span>
          <ThemeToggle />
        </div>

        {/* Header */}
        <header className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-xs text-red-400 font-medium">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" /></span>
            Moteur v2 — Analyse contextuelle sans liste de mots
          </div>
          <h1 className="mb-2 text-5xl sm:text-6xl font-bold tracking-tight leading-none">
            <span className="text-white">Astra</span><span className="text-red-500">Scan</span>
          </h1>
          <p className="text-sm text-white/45 max-w-lg mx-auto leading-relaxed">
            Analyse linguistique avancée · Levenshtein typosquatting · PhishTank · OCR · Deepfake EXIF · Alertes temps réel
          </p>
        </header>

        {/* Onglets */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-sm shadow-2xl shadow-black/50 mb-4">
          <div className="grid grid-cols-4 border-b border-white/8">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 py-3.5 text-xs font-medium transition-all duration-200 ${
                  activeTab === tab.id ? "text-white border-b-2 border-red-500 bg-white/[0.02]" : "text-white/35 hover:text-white/65 border-b-2 border-transparent"
                }`}>
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          <div className="p-6">
            <p className="mb-5 text-xs text-white/35 leading-relaxed">
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

        {/* Légende */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { emoji: "🚨", label: "Probable arnaque", range: "≥ 70", border: "border-red-500/20 bg-red-500/5" },
            { emoji: "⚠️", label: "À vérifier", range: "≥ 40", border: "border-amber-500/20 bg-amber-500/5" },
            { emoji: "✅", label: "Rien de flagrant", range: "< 40", border: "border-emerald-500/20 bg-emerald-500/5" },
          ].map(item => (
            <div key={item.label} className={`rounded-xl border ${item.border} p-3 text-center`}>
              <div className="text-xl mb-1">{item.emoji}</div>
              <div className="text-xs font-medium text-white/65">{item.label}</div>
              <div className="text-[10px] text-white/30 mt-0.5 font-mono">Score {item.range}</div>
            </div>
          ))}
        </div>

        <StatsBar />
        <HistoryPanel />

        <footer className="mt-10 text-center text-xs text-white/20 space-y-1">
          <p>AstraScan v2 — Moteur contextuel · PhishTank · Levenshtein · Tesseract OCR · EXIF</p>
          <p>Signaler : <a className="text-white/35 hover:text-white/55 transition-colors" href="https://signal-spam.fr" target="_blank" rel="noopener noreferrer">signal-spam.fr</a> · <a className="text-white/35 hover:text-white/55 transition-colors" href="https://phishing-initiative.fr" target="_blank" rel="noopener noreferrer">phishing-initiative.fr</a> · <a className="text-white/35 hover:text-white/55 transition-colors" href="https://cybermalveillance.gouv.fr" target="_blank" rel="noopener noreferrer">cybermalveillance.gouv.fr</a></p>
        </footer>
      </div>
    </main>
  );
}
