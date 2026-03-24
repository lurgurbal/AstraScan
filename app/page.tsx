"use client";

/**
 * app/page.tsx - Page principale de AstraScan (outil d'analyse).
 * Onglets : Message | URL | Capture d'écran
 * + Mode clair/sombre, historique, stats
 */

import { useState } from "react";
import Link from "next/link";
import TextForm from "@/components/TextForm";
import UrlForm from "@/components/UrlForm";
import ImageForm from "@/components/ImageForm";
import HistoryPanel from "@/components/HistoryPanel";
import StatsBar from "@/components/StatsBar";
import ThemeToggle from "@/components/ThemeToggle";

type Tab = "text" | "url" | "image";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("text");

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070809] dark:bg-[#070809] light:bg-gray-50 transition-colors duration-300">
      {/* Arrière-plan */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-red-600/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[400px] w-[400px] rounded-full bg-orange-500/8 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-red-800/8 blur-[80px]" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-12 sm:py-20">

        {/* Nav top */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/landing" className="text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1">
            ← Accueil
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">
              <span className="text-white">Astra</span>
              <span className="text-red-500">Scan</span>
            </span>
          </div>
          <ThemeToggle />
        </div>

        {/* En-tête */}
        <header className="mb-10 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-xs text-red-400 font-medium tracking-wide">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            Détection en temps réel
          </div>
          <h1 className="mb-3 text-5xl sm:text-6xl font-bold tracking-tight leading-none">
            <span className="text-white">Astra</span>
            <span className="text-red-500">Scan</span>
          </h1>
          <p className="text-sm text-white/50 max-w-md mx-auto leading-relaxed">
            Analysez instantanément vos messages, URLs et captures d&apos;écran suspects.
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-white/25">
            <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-emerald-500" />100% gratuit</span>
            <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-emerald-500" />Aucune donnée collectée</span>
            <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-emerald-500" />OCR local</span>
          </div>
        </header>

        {/* Carte principale */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-sm shadow-2xl shadow-black/50">
          {/* Onglets */}
          <div className="flex border-b border-white/8">
            {([
              { id: "text" as Tab, icon: "💬", label: "Message" },
              { id: "url" as Tab, icon: "🔗", label: "URL" },
              { id: "image" as Tab, icon: "📸", label: "Capture" },
            ]).map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "text-white border-b-2 border-red-500 bg-white/[0.02]"
                    : "text-white/40 hover:text-white/70 border-b-2 border-transparent"
                }`}>
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Contenu */}
          <div className="p-6">
            <p className="mb-5 text-xs text-white/40 leading-relaxed">
              {activeTab === "text"
                ? "Collez un SMS, e-mail ou message WhatsApp suspect. L'analyse détecte urgence, demandes sensibles et signes d'arnaque."
                : activeTab === "url"
                ? "Entrez une URL suspecte. Vérification du domaine, TLD, typosquatting et blacklist."
                : "Uploadez une capture d'écran. L'OCR extrait le texte et l'analyse gratuitement, sans API."}
            </p>
            {activeTab === "text" ? <TextForm /> : activeTab === "url" ? <UrlForm /> : <ImageForm />}
          </div>
        </div>

        {/* Légende scores */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { emoji: "🚨", label: "Probable arnaque", range: "Score ≥ 70", border: "border-red-500/20 bg-red-500/5" },
            { emoji: "⚠️", label: "À vérifier", range: "Score ≥ 40", border: "border-amber-500/20 bg-amber-500/5" },
            { emoji: "✅", label: "Rien de flagrant", range: "Score < 40", border: "border-emerald-500/20 bg-emerald-500/5" },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl border ${item.border} p-3 text-center`}>
              <div className="text-xl mb-1">{item.emoji}</div>
              <div className="text-xs font-semibold text-white/70">{item.label}</div>
              <div className="text-[10px] text-white/30 mt-0.5 font-mono">{item.range}</div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <StatsBar />

        {/* Historique */}
        <HistoryPanel />

        {/* Footer */}
        <footer className="mt-10 text-center text-xs text-white/20 space-y-1">
          <p>AstraScan — Outil d&apos;aide à la détection, non substitut à un avis professionnel.</p>
          <p>En cas d&apos;arnaque avérée, signalez sur <strong className="text-white/35">signal-spam.fr</strong> ou <strong className="text-white/35">phishing-initiative.fr</strong></p>
        </footer>
      </div>
    </main>
  );
}
