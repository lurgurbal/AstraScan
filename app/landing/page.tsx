"use client";
/**
 * app/landing/page.tsx — Page d'accueil AstraScan.
 * CORRECTION : href="/app" → href="/" (route correcte de l'outil)
 * CORRECTION : toutes les classes Tailwind remplacées par CSS variables
 */

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

const FEATURES = [
  { icon: "💬", title: "Analyse de messages",    desc: "SMS, e-mails, WhatsApp — détection linguistique avancée, psychologie, champs sémantiques." },
  { icon: "🔗", title: "Analyse d'URL",          desc: "Typosquatting Levenshtein, TLD suspects, vérification PhishTank en temps réel." },
  { icon: "📸", title: "Capture d'écran",        desc: "OCR Tesseract local (gratuit), extraction de texte + analyse approfondie." },
  { icon: "📞", title: "Numéro de téléphone",    desc: "Surtaxés 08xx, VoIP, Wangiri international, spoofing SMS." },
  { icon: "🚨", title: "Alertes temps réel",     desc: "Flux Cybermalveillance.gouv.fr, DGCCRF et SignalConso actualisés toutes les heures." },
  { icon: "🔒", title: "100% privé & gratuit",   desc: "Aucune donnée envoyée à un tiers. Analyse locale ou sur votre instance." },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Collez ou uploadez",   desc: "Un message, une URL, un numéro ou une capture d'écran." },
  { step: "02", title: "Analyse instantanée",  desc: "Moteur contextuel + sources officielles françaises." },
  { step: "03", title: "Verdict clair",         desc: "Score 0–100 avec explication en langage naturel." },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", color: "var(--text-primary)" }}>

      {/* ── Nav ── */}
      <nav className="nav-bar" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1024, margin: "0 auto", padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 20, fontWeight: 700 }}>
            <span style={{ color: "var(--text-primary)" }}>Astra</span>
            <span style={{ color: "#ef4444" }}>Scan</span>
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ThemeToggle />
            {/* ✅ CORRIGÉ : href="/" pas "/app" */}
            <Link href="/" className="btn-primary" style={{ padding: "8px 18px", fontSize: 14, textDecoration: "none", display: "inline-block" }}>
              Lancer l&apos;outil →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ paddingTop: 120, paddingBottom: 80, paddingLeft: 16, paddingRight: 16, textAlign: "center" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            borderRadius: 999, border: "1px solid rgba(239,68,68,0.25)",
            background: "rgba(239,68,68,0.08)", padding: "6px 14px",
            fontSize: 12, color: "#ef4444", fontWeight: 500, marginBottom: 24,
          }}>
            <span style={{ position: "relative", display: "flex", width: 8, height: 8 }}>
              <span style={{
                position: "absolute", width: "100%", height: "100%",
                borderRadius: "50%", background: "rgba(239,68,68,0.6)",
                animation: "ping 1.5s ease-in-out infinite",
              }} />
              <span style={{ position: "relative", width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
            </span>
            Détection en temps réel · Sources officielles françaises
          </div>

          <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 800, lineHeight: 1.1, marginBottom: 20, letterSpacing: "-0.02em" }}>
            Stoppez les arnaques<br />
            <span style={{ color: "#ef4444" }}>avant qu&apos;il soit trop tard</span>
          </h1>

          <p style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.7 }}>
            AstraScan analyse messages, URLs, captures d&apos;écran et numéros suspects pour détecter phishing, fraudes et escroqueries.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 32 }}>
            {/* ✅ CORRIGÉ : href="/" pas "/app" */}
            <Link href="/" className="btn-primary" style={{ padding: "14px 32px", fontSize: 16, textDecoration: "none", display: "inline-block", borderRadius: 14 }}>
              🔍 Analyser maintenant
            </Link>
            <a href="#fonctionnalites" className="btn-ghost" style={{ padding: "14px 32px", fontSize: 16, textDecoration: "none", display: "inline-block", borderRadius: 14 }}>
              En savoir plus
            </a>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", fontSize: 12, color: "var(--text-muted)" }}>
            {["Aucune inscription", "Aucune donnée collectée", "Open source", "Gratuit"].map(b => (
              <span key={b} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ color: "#10b981" }}>✓</span> {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ── */}
      <section style={{ padding: "64px 16px", borderTop: "1px solid var(--border-default)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Comment ça marche ?</h2>
          <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14, marginBottom: 48 }}>Simple, rapide, efficace</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32 }}>
            {HOW_IT_WORKS.map(step => (
              <div key={step.step}>
                <div style={{ fontSize: 52, fontWeight: 800, color: "var(--border-strong)", fontFamily: "var(--font-mono)", marginBottom: 8, lineHeight: 1 }}>{step.step}</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fonctionnalités ── */}
      <section id="fonctionnalites" style={{ padding: "64px 16px", borderTop: "1px solid var(--border-default)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Fonctionnalités</h2>
          <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14, marginBottom: 48 }}>Tout ce dont vous avez besoin, gratuitement</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
            {FEATURES.map(f => (
              <div key={f.title} className="card" style={{ padding: 20, transition: "box-shadow 0.2s" }}>
                <div style={{ fontSize: 26, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Verdicts ── */}
      <section style={{ padding: "64px 16px", borderTop: "1px solid var(--border-default)" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Trois niveaux de risque</h2>
          <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14, marginBottom: 48 }}>Un verdict clair, des raisons précises</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {[
              { emoji: "🚨", label: "Probable arnaque", range: "Score ≥ 70", bg: "rgba(239,68,68,0.07)", border: "rgba(239,68,68,0.2)", color: "#ef4444" },
              { emoji: "⚠️", label: "À vérifier",       range: "Score ≥ 40", bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.2)", color: "#f59e0b" },
              { emoji: "✅", label: "Rien de flagrant", range: "Score < 40",  bg: "rgba(16,185,129,0.07)", border: "rgba(16,185,129,0.2)", color: "#10b981" },
            ].map(v => (
              <div key={v.label} style={{ borderRadius: 16, border: `1px solid ${v.border}`, background: v.bg, padding: "20px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{v.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: v.color, marginBottom: 4 }}>{v.label}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{v.range}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section style={{ padding: "80px 16px", borderTop: "1px solid var(--border-default)", textAlign: "center" }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>Prêt à analyser ?</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 32 }}>Aucune inscription. Aucune installation. Gratuit.</p>
        <Link href="/" className="btn-primary" style={{ padding: "16px 40px", fontSize: 16, textDecoration: "none", display: "inline-block", borderRadius: 14 }}>
          🔍 Lancer AstraScan →
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid var(--border-default)", padding: "32px 16px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, fontSize: 12, color: "var(--text-muted)" }}>
          <span><strong style={{ color: "var(--text-primary)" }}>AstraScan</strong> — Outil d&apos;aide à la détection, non substitut à un avis professionnel.</span>
          <div style={{ display: "flex", gap: 16 }}>
            {[
              ["Signal Spam", "https://signal-spam.fr"],
              ["Cybermalveillance", "https://www.cybermalveillance.gouv.fr"],
              ["DGCCRF", "https://signal.conso.gouv.fr"],
            ].map(([label, url]) => (
              <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                style={{ color: "var(--text-muted)", textDecoration: "none" }}>
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
