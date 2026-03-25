/**
 * phoneAnalyzer.ts
 * Analyse un numéro de téléphone pour détecter :
 * - Numéros surtaxés français
 * - Numéros VoIP suspects
 * - Spoofing (imitation banques/administrations)
 * - Numéros internationaux frauduleux connus
 * - Wangiri (appels manqués depuis numéros exotiques)
 * Entièrement gratuit, sans API externe.
 */

import { computeRisk, RiskResult } from "./riskScorer";

// ─── Normalisation ─────────────────────────────────────────────────────────

function normalizePhone(raw: string): string {
  return raw.replace(/[\s.\-()]/g, "").trim();
}

function toE164(phone: string): string {
  const n = normalizePhone(phone);
  if (n.startsWith("0") && n.length === 10) return "+33" + n.slice(1);
  if (n.startsWith("00")) return "+" + n.slice(2);
  return n;
}

// ─── Base de connaissance des préfixes FR ──────────────────────────────────

const FR_PREFIXES: Array<{ prefix: RegExp; label: string; score: number; explanation: string }> = [
  // Numéros spéciaux surtaxés
  { prefix: /^\+?33\s*8[09]/, label: "Numéro surtaxé 080x/090x", score: 30,
    explanation: "Les 080x/090x sont des numéros à tarification spéciale — souvent utilisés dans des arnaques de faux support technique ou concours frauduleux" },
  { prefix: /^\+?33\s*81/, label: "Audiotel surtaxé 081x", score: 25,
    explanation: "Numéro Audiotel à coût élevé — typique des concours, horoscopes et services premium frauduleux" },
  { prefix: /^\+?33\s*82/, label: "Numéro 082x surtaxé", score: 20,
    explanation: "Numéro à tarif majoré — méfiez-vous si vous n'attendiez pas cet appel" },

  // VoIP suspects
  { prefix: /^\+?33\s*9/, label: "Numéro VoIP 09x", score: 18,
    explanation: "Numéro VoIP (Internet) — très utilisé pour le spoofing car facile à créer et à masquer géographiquement" },

  // Numéros courts opérateurs détournés
  { prefix: /^(3[0-9]{3}|1[0-9]{3})$/, label: "Numéro court", score: 10,
    explanation: "Numéro court — vérifiez l'identité de l'expéditeur avant de rappeler" },

  // Mobiles FR normaux (à croiser avec contexte)
  { prefix: /^\+?33\s*[67]/, label: "Mobile français", score: 0,
    explanation: "Numéro mobile français standard" },

  // Fixes FR
  { prefix: /^\+?33\s*[1-5]/, label: "Fixe français", score: 0,
    explanation: "Numéro fixe français" },
];

// ─── Préfixes internationaux à risque élevé (Wangiri + fraude) ────────────

const RISKY_INTERNATIONAL: Array<{ prefix: string; country: string; score: number; reason: string }> = [
  { prefix: "+355", country: "Albanie", score: 40, reason: "Wangiri fréquent" },
  { prefix: "+225", country: "Côte d'Ivoire", score: 35, reason: "Arnaques téléphoniques très fréquentes" },
  { prefix: "+234", country: "Nigeria", score: 35, reason: "Arnaques 419 et Wangiri" },
  { prefix: "+212", country: "Maroc", score: 25, reason: "Wangiri signalé fréquemment" },
  { prefix: "+216", country: "Tunisie", score: 20, reason: "Arnaques téléphoniques signalées" },
  { prefix: "+370", country: "Lituanie", score: 30, reason: "Fraude par SMS premium" },
  { prefix: "+371", country: "Lettonie", score: 30, reason: "Fraude par SMS premium" },
  { prefix: "+372", country: "Estonie", score: 25, reason: "Wangiri et SMS premium" },
  { prefix: "+963", country: "Syrie", score: 35, reason: "Numéros fréquemment usurpés" },
  { prefix: "+261", country: "Madagascar", score: 35, reason: "Wangiri très fréquent" },
  { prefix: "+269", country: "Comores", score: 40, reason: "Wangiri — coût rappel très élevé" },
  { prefix: "+222", country: "Mauritanie", score: 35, reason: "Wangiri fréquent" },
  { prefix: "+44 70", country: "UK Personal numbering", score: 45, reason: "Fraude classique — redirigeables n'importe où" },
  { prefix: "+1 900", country: "USA/Canada premium", score: 40, reason: "Numéros surtaxés nord-américains" },
];

// ─── Patterns de spoofing (imitation organismes officiels) ────────────────

const SPOOFING_PATTERNS: Array<{ pattern: RegExp; impersonates: string; score: number }> = [
  // Banques françaises — leurs numéros réels
  { pattern: /^(\+33|0)(1\s*57\s*00|1\s*40\s*14|800\s*00\s*32|969\s*32)/, impersonates: "BNP Paribas", score: 0 },
  { pattern: /^(\+33|0)(800\s*00\s*17|4\s*72\s*43)/, impersonates: "Crédit Agricole", score: 0 },
  // Si ce n'est pas un numéro officiel mais ressemble à un service
  { pattern: /^(\+33|0)800/, impersonates: "Numéro vert (gratuit)", score: 5 },
];

// ─── Détection de patterns suspects ───────────────────────────────────────

function detectSuspiciousPatterns(phone: string, normalized: string): Array<{ label: string; score: number }> {
  const findings: Array<{ label: string; score: number }> = [];

  // Trop de chiffres identiques consécutifs (numéros générés)
  if (/(\d)\1{4,}/.test(normalized)) {
    findings.push({ label: "Numéro avec trop de chiffres identiques répétés (ex: 0666666666) — possible numéro généré", score: 20 });
  }

  // Numéro extrêmement court (< 5 chiffres) sauf codes courts connus
  const digitsOnly = normalized.replace(/\D/g, "");
  if (digitsOnly.length < 5 && digitsOnly.length > 0) {
    findings.push({ label: `Numéro très court (${digitsOnly.length} chiffres) — inhabituellement bref`, score: 15 });
  }

  // Numéro commençant par +0 (impossible en E.164)
  if (/^\+0/.test(normalized)) {
    findings.push({ label: "Format invalide (+0...) — numéro falsifié ou masqué", score: 35 });
  }

  // Numéro "No Caller ID" ou "Anonyme"
  if (/^(anonyme|inconnu|masqué|privé|no caller|withheld|unknown)$/i.test(phone)) {
    findings.push({ label: "Numéro masqué ou anonyme — méfiez-vous si vous n'attendiez pas cet appel", score: 20 });
  }

  // SMS depuis adresse e-mail ou nom (spoofing SMS)
  if (/^[a-zA-Z@._-]{3,}$/.test(phone) && !phone.match(/\d/)) {
    findings.push({ label: "L'expéditeur est un nom ou e-mail (pas un numéro) — technique de spoofing SMS très utilisée par les arnaqueurs", score: 25 });
  }

  return findings;
}

// ─── Générateur d'explication naturelle ───────────────────────────────────

function buildExplanation(phone: string, e164: string, score: number): string[] {
  const reasons: string[] = [];

  // Vérif préfixes FR
  for (const rule of FR_PREFIXES) {
    if (rule.prefix.test(e164) && rule.score > 0) {
      reasons.push(`${rule.label} : ${rule.explanation}`);
    }
  }

  // Vérif international risqué
  for (const intl of RISKY_INTERNATIONAL) {
    if (e164.startsWith(intl.prefix)) {
      reasons.push(`Indicatif ${intl.country} (${intl.prefix}) — ${intl.reason}`);
    }
  }

  // Patterns suspects
  const suspicious = detectSuspiciousPatterns(phone, e164);
  reasons.push(...suspicious.map(s => s.label));

  // Aucune anomalie
  if (reasons.length === 0) {
    const isMobileFR = /^\+33[67]/.test(e164);
    const isFixedFR = /^\+33[1-5]/.test(e164);
    if (isMobileFR) reasons.push("Numéro mobile français standard — aucun signal suspect détecté");
    else if (isFixedFR) reasons.push("Numéro fixe français standard — aucun signal suspect détecté");
    else reasons.push("Aucune anomalie détectée pour ce numéro — restez vigilant si l'appel est inattendu");
  }

  // Conseil systématique
  if (score >= 30) {
    reasons.push("💡 Conseil : Ne rappelez jamais un numéro inconnu qui vous a laissé un appel manqué — c'est la mécanique du Wangiri");
  }

  return reasons;
}

// ─── Fonction principale ───────────────────────────────────────────────────

export interface PhoneAnalysisInput { phone: string }

export function analyzePhone(input: PhoneAnalysisInput): RiskResult {
  const { phone } = input;
  if (!phone || phone.trim().length === 0) return computeRisk(0, ["Aucun numéro fourni"]);

  const normalized = normalizePhone(phone);
  const e164 = toE164(phone);
  let rawScore = 0;

  // Score préfixes FR
  for (const rule of FR_PREFIXES) {
    if (rule.prefix.test(e164)) rawScore += rule.score;
  }

  // Score international
  for (const intl of RISKY_INTERNATIONAL) {
    if (e164.startsWith(intl.prefix)) rawScore += intl.score;
  }

  // Score patterns suspects
  const suspicious = detectSuspiciousPatterns(phone, e164);
  rawScore += suspicious.reduce((sum, s) => sum + s.score, 0);

  const reasons = buildExplanation(phone, e164, rawScore);
  return computeRisk(rawScore, reasons);
}
