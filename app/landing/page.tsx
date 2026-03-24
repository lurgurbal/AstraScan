"use client";

/**
 * app/landing/page.tsx
 * Page d'accueil / landing page d'AstraScan.
 */

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

const FEATURES = [
  {
    icon: "💬",
    title: "Analyse de messages",
    desc: "SMS, e-mails, WhatsApp… détectez les mots d'urgence, demandes de données bancaires et menaces.",
  },
  {
    icon: "🔗",
    title: "Analyse d'URL",
    desc: "Typosquatting, TLD suspects, structure inhabituelle, blacklist — chaque lien est disséqué.",
  },
  {
    icon: "📸",
    title: "Capture d'écran",
    desc: "Uploadez n'importe quelle capture. L'OCR extrait le texte et l'analyse instantanément.",
  },
  {
    icon: "🛡️",
    title: "100% gratuit & privé",
    desc: "Aucune donnée envoyée à un serveur tiers. Tout est analysé localement ou sur votre propre instance.",
  },
  {
    icon: "🕓",
    title: "Historique local",
    desc: "Retrouvez vos 20 dernières analyses, stockées uniquement dans votre navigateur.",
  },
  {
    icon: "📊",
    title: "Statistiques",
    desc: "Suivez combien d'arnaques vous avez évitées grâce à AstraScan.",
  },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Collez ou uploadez", desc: "Un message, une URL ou une capture d'écran suspecte." },
  { step: "02", title: "Analyse instantanée", desc: "Nos règles de détection et l'OCR examinent le contenu." },
  { step: "03", title: "Verdict clair", desc: "Score 0–100 avec les raisons précises détectées." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070809] text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/8 bg-[#070809]/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">
              <span className="text-white">Astra</span>
              <span className="text-red-500">Scan</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all duration-200"
            >
              Lancer l&apos;outil →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-red-600/8 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-xs text-red-400 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            Détection en temps réel — 100% gratuit
          </div>

          <h1 className="mb-5 text-5xl sm:text-7xl font-bold tracking-tight leading-none">
            Stoppez les arnaques
            <br />
            <span className="text-red-500">avant qu&apos;il soit trop tard</span>
          </h1>

          <p className="mb-8 text-lg text-white/50 max-w-xl mx-auto leading-relaxed">
            AstraScan analyse vos messages, URLs et captures d&apos;écran suspects en quelques secondes pour détecter phishing, fraudes et escroqueries.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-black font-semibold text-base hover:bg-white/90 transition-all duration-200"
            >
              🔍 Analyser maintenant
            </Link>
            <a
              href="#fonctionnalites"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-white/15 text-white/60 font-medium text-base hover:border-white/30 hover:text-white transition-all duration-200"
            >
              En savoir plus
            </a>
          </div>

          {/* Badges de confiance */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-white/30">
            {["Aucune inscription requise", "Aucune donnée collectée", "Open source", "Gratuit pour toujours"].map((b) => (
              <span key={b} className="flex items-center gap-1.5">
                <span className="text-emerald-500">✓</span> {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-16 px-4 border-t border-white/8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold mb-2">Comment ça marche ?</h2>
          <p className="text-center text-white/40 text-sm mb-10">Simple, rapide, efficace</p>
          <div className="grid sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="relative">
                <div className="text-5xl font-bold text-white/5 font-mono mb-3">{step.step}</div>
                <h3 className="text-base font-semibold mb-1">{step.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section id="fonctionnalites" className="py-16 px-4 border-t border-white/8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold mb-2">Fonctionnalités</h2>
          <p className="text-center text-white/40 text-sm mb-10">Tout ce dont vous avez besoin, gratuitement</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-all duration-200">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="text-sm font-semibold mb-1.5">{f.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verdicts */}
      <section className="py-16 px-4 border-t border-white/8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold mb-2">Trois niveaux de risque</h2>
          <p className="text-center text-white/40 text-sm mb-10">Un verdict clair, des raisons précises</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { emoji: "🚨", label: "Probable arnaque", range: "Score ≥ 70", color: "border-red-500/20 bg-red-500/5 text-red-400" },
              { emoji: "⚠️", label: "À vérifier", range: "Score ≥ 40", color: "border-amber-500/20 bg-amber-500/5 text-amber-400" },
              { emoji: "✅", label: "Rien de flagrant", range: "Score < 40", color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" },
            ].map((v) => (
              <div key={v.label} className={`rounded-2xl border ${v.color} p-5 text-center`}>
                <div className="text-3xl mb-2">{v.emoji}</div>
                <div className="text-sm font-semibold mb-1">{v.label}</div>
                <div className="text-xs opacity-60 font-mono">{v.range}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 px-4 border-t border-white/8">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-bold mb-4">Prêt à analyser ?</h2>
          <p className="text-white/40 text-sm mb-8">Aucune inscription. Aucune installation. Gratuit.</p>
          <Link
            href="/"
            className="inline-flex px-10 py-4 rounded-xl bg-white text-black font-semibold text-base hover:bg-white/90 transition-all duration-200"
          >
            🔍 Lancer AstraScan →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 py-8 px-4">
        <div className="mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/25">
          <span><span className="text-white/40 font-semibold">Astra</span><span className="text-red-500/60 font-semibold">Scan</span> — Outil d&apos;aide à la détection, non substitut à un avis professionnel.</span>
          <div className="flex gap-4">
            <a href="https://signal-spam.fr" target="_blank" rel="noopener noreferrer" className="hover:text-white/50 transition-colors">Signal Spam</a>
            <a href="https://cybermalveillance.gouv.fr" target="_blank" rel="noopener noreferrer" className="hover:text-white/50 transition-colors">Cybermalveillance</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
