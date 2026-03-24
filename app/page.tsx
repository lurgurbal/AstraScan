"use client";

/**
 * app/page.tsx
 * Page principale de ScamDetector.
 * Deux onglets : Analyser un message | Analyser une URL.
 */

import { useState } from "react";
import TextForm from "@/components/TextForm";
import UrlForm from "@/components/UrlForm";

type Tab = "text" | "url";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("text");

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* ── Arrière-plan animé ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {/* Gradient mesh */}
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-red-600/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[400px] w-[400px] rounded-full bg-orange-500/8 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-red-800/8 blur-[80px]" />
        {/* Grille fine */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-16 sm:py-24">
        {/* ── En-tête ── */}
        <header className="mb-12 text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-xs text-red-400 font-medium tracking-wide">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            Détection en temps réel
          </div>

          {/* Titre principal */}
          <h1 className="mb-3 text-5xl sm:text-6xl font-bold tracking-tight leading-none">
            <span className="text-white">Scam</span>
            <span className="text-red-500">Detector</span>
          </h1>

          <p className="text-base text-white/50 max-w-md mx-auto leading-relaxed">
            Analysez instantanément vos messages et URLs suspects pour détecter les tentatives d&apos;arnaque, de phishing et de fraude.
          </p>

          {/* Badges stats */}
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-white/30">
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-emerald-500" />
              100% gratuit
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-emerald-500" />
              Analyse locale
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-emerald-500" />
              Aucune donnée stockée
            </span>
          </div>
        </header>

        {/* ── Carte principale ── */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-sm shadow-2xl shadow-black/50">
          {/* Onglets */}
          <div className="flex border-b border-white/8">
            <TabButton
              active={activeTab === "text"}
              onClick={() => setActiveTab("text")}
              icon="💬"
              label="Message"
            />
            <TabButton
              active={activeTab === "url"}
              onClick={() => setActiveTab("url")}
              icon="🔗"
              label="URL"
            />
          </div>

          {/* Contenu de l'onglet actif */}
          <div className="p-6">
            {/* Description contextuelle */}
            <p className="mb-5 text-xs text-white/40 leading-relaxed">
              {activeTab === "text"
                ? "Collez un SMS, e-mail ou message WhatsApp suspect. L'analyse détecte le vocabulaire de pression, les demandes d'informations sensibles et les signes d'arnaque."
                : "Entrez une URL suspecte reçue par message ou e-mail. L'analyse vérifie le domaine, la structure, les TLD douteux et les techniques de typosquatting."}
            </p>

            {/* Formulaire actif */}
            {activeTab === "text" ? <TextForm /> : <UrlForm />}
          </div>
        </div>

        {/* ── Légende des scores ── */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            { emoji: "🚨", label: "Probable arnaque", range: "Score ≥ 70", color: "text-red-400", border: "border-red-500/20 bg-red-500/5" },
            { emoji: "⚠️", label: "À vérifier", range: "Score ≥ 40", color: "text-amber-400", border: "border-amber-500/20 bg-amber-500/5" },
            { emoji: "✅", label: "Rien de flagrant", range: "Score < 40", color: "text-emerald-400", border: "border-emerald-500/20 bg-emerald-500/5" },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-xl border ${item.border} p-3 text-center`}
            >
              <div className="text-xl mb-1">{item.emoji}</div>
              <div className={`text-xs font-semibold ${item.color}`}>{item.label}</div>
              <div className="text-[10px] text-white/30 mt-0.5 font-mono">{item.range}</div>
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <footer className="mt-10 text-center text-xs text-white/20 space-y-1">
          <p>ScamDetector — Outil d&apos;aide à la détection, non substitut à un avis professionnel.</p>
          <p>En cas d&apos;arnaque avérée, signalez sur <strong className="text-white/40">signal-spam.fr</strong> ou <strong className="text-white/40">phishing-initiative.fr</strong>.</p>
        </footer>
      </div>
    </main>
  );
}

// ── Composant interne : bouton d'onglet ──

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all duration-200 ${
        active
          ? "text-white border-b-2 border-red-500 bg-white/[0.02]"
          : "text-white/40 hover:text-white/70 border-b-2 border-transparent"
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
