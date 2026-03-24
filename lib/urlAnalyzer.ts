/**
 * urlAnalyzer.ts
 * ---------------------------------------------------------------------------
 * 🔍 Analyse avancée d'URL pour détecter phishing, scam et comportements suspects
 *
 * ✔ Détection :
 *  - Blacklist (Google Safe Browsing simulé)
 *  - VirusTotal (simulé)
 *  - WHOIS (âge du domaine)
 *  - TLD suspects
 *  - Typosquatting (marques connues)
 *  - Structure anormale (sous-domaines)
 *  - Longueur excessive
 *  - Mots-clés suspects
 *  - IP au lieu de domaine
 *  - URL obfusquée (@, encodage)
 *  - HTTP non sécurisé
 *  - Entropie élevée (URL aléatoire)
 *
 * 🚀 TODO PROD :
 *  - Google Safe Browsing API
 *  - VirusTotal API
 *  - WHOIS réel
 *  - DNS lookup / réputation IP
 *
 * 💡 Si tu veux aller encore plus loin (niveau startup / SaaS) :
 *  - DNS + IP reputation (Cloudflare / AbuseIPDB)
 *  - AI classifier (OpenAI / local model)
 *  - GeoIP mismatch (user vs serveur)
 *  - Dashboard de scoring
 *  - API REST complète (Next.js route handler)
 * ---------------------------------------------------------------------------
 */

import { computeRisk, RiskResult } from "./riskScorer";

// ---------------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------------

const CONFIG = {
  MAX_URL_LENGTH: 100,
  HIGH_SUBDOMAIN_THRESHOLD: 4,
  MEDIUM_SUBDOMAIN_THRESHOLD: 3,
};

// ---------------------------------------------------------------------------
// BLACKLIST (SIMULÉE)
// ---------------------------------------------------------------------------

const SIMULATED_BLACKLIST: string[] = [
  "phishing-example.com",
  "fake-paypal-login.com",
  "amazon-security-alert.xyz",
  "free-iphone-winner.ru",
  "banque-securite-alerte.net",
  "microsoft-support-urgent.tk",
];

// ---------------------------------------------------------------------------
// TLD SUSPECTS
// ---------------------------------------------------------------------------

const SUSPICIOUS_TLDS = [
  ".xyz", ".ru", ".tk", ".top", ".club", ".icu",
  ".gq", ".cf", ".ml", ".ga", ".pw", ".men",
  ".win", ".loan", ".bid", ".stream", ".download",
  ".work", ".click", ".link",
];

// ---------------------------------------------------------------------------
// MARQUES CIBLES (TYPOSQUATTING)
// ---------------------------------------------------------------------------

const BRAND_TARGETS: { brand: string; regex: RegExp }[] = [
  { brand: "PayPal", regex: /paypa[^l]|p4ypal|payp4l|paypall|paypa1/i },
  { brand: "Google", regex: /g[0o][0o]gle|g00gle|g0ogle|go0gle|googel/i },
  { brand: "Amazon", regex: /amaz[o0]n|am4zon|amazoon|arnazon/i },
  { brand: "Apple", regex: /app1e|appl3|applle|aple/i },
  { brand: "Microsoft", regex: /micros[o0]ft|microsoift|m1crosoft/i },
  { brand: "Netflix", regex: /netfl1x|n3tflix|netfllx|netfix/i },
  { brand: "Facebook", regex: /faceb[o0][o0]k|faceb00k|facebok/i },
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function extractHostname(url: string): string | null {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function extractTLD(hostname: string): string {
  const parts = hostname.split(".");
  return parts.length > 1 ? "." + parts.pop() : "";
}

function countSubdomains(hostname: string): number {
  return Math.max(0, hostname.split(".").length - 2);
}

function isIPAddress(hostname: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
}

/**
 * Calcule une entropie simple pour détecter les URLs "random"
 */
function calculateEntropy(str: string): number {
  const map: Record<string, number> = {};
  for (const char of str) {
    map[char] = (map[char] || 0) + 1;
  }

  const len = str.length;
  return Object.values(map).reduce((entropy, count) => {
    const p = count / len;
    return entropy - p * Math.log2(p);
  }, 0);
}

// ---------------------------------------------------------------------------
// SIMULATIONS API (À REMPLACER)
// ---------------------------------------------------------------------------

async function checkGoogleSafeBrowsing(url: string): Promise<boolean> {
  return SIMULATED_BLACKLIST.some((b) => url.includes(b));
}

async function checkVirusTotal(_url: string): Promise<boolean> {
  return false;
}

async function checkWhois(_hostname: string): Promise<{ isNew: boolean }> {
  return { isNew: false };
}

// ---------------------------------------------------------------------------
// ANALYSE PRINCIPALE
// ---------------------------------------------------------------------------

export interface UrlAnalysisInput {
  url: string;
}

export async function analyzeUrl(input: UrlAnalysisInput): Promise<RiskResult> {
  const { url } = input;

  if (!url?.trim()) {
    return computeRisk(0, ["Aucune URL fournie"]);
  }

  const rawUrl = url.trim();
  const hostname = extractHostname(rawUrl);

  if (!hostname) {
    return computeRisk(30, ["URL invalide"]);
  }

  let score = 0;
  const reasons: string[] = [];

  // -----------------------------------------------------------------------
  // 1. BLACKLIST
  // -----------------------------------------------------------------------
  if (await checkGoogleSafeBrowsing(rawUrl)) {
    score += 60;
    reasons.push("Présente dans une blacklist de sécurité");
  }

  if (await checkVirusTotal(rawUrl)) {
    score += 40;
    reasons.push("Signalée comme malveillante (VirusTotal)");
  }

  // -----------------------------------------------------------------------
  // 2. TLD
  // -----------------------------------------------------------------------
  const tld = extractTLD(hostname);
  if (SUSPICIOUS_TLDS.includes(tld)) {
    score += 20;
    reasons.push(`TLD suspect : ${tld}`);
  }

  // -----------------------------------------------------------------------
  // 3. TYPOSQUATTING
  // -----------------------------------------------------------------------
  for (const { brand, regex } of BRAND_TARGETS) {
    if (regex.test(hostname)) {
      score += 35;
      reasons.push(`Imitation possible de ${brand}`);
      break;
    }
  }

  // -----------------------------------------------------------------------
  // 4. STRUCTURE
  // -----------------------------------------------------------------------
  const subdomains = countSubdomains(hostname);

  if (subdomains >= CONFIG.HIGH_SUBDOMAIN_THRESHOLD) {
    score += 25;
    reasons.push(`Trop de sous-domaines (${subdomains})`);
  } else if (subdomains >= CONFIG.MEDIUM_SUBDOMAIN_THRESHOLD) {
    score += 10;
    reasons.push(`Sous-domaines nombreux (${subdomains})`);
  }

  // -----------------------------------------------------------------------
  // 5. LONGUEUR
  // -----------------------------------------------------------------------
  if (rawUrl.length > CONFIG.MAX_URL_LENGTH) {
    score += 10;
    reasons.push("URL anormalement longue");
  }

  // -----------------------------------------------------------------------
  // 6. MOTS-CLÉS
  // -----------------------------------------------------------------------
  const keywords = [
    "login", "verify", "secure", "account",
    "password", "urgent", "alert", "confirm",
  ];

  const found = keywords.filter(k => rawUrl.toLowerCase().includes(k));

  if (found.length >= 3) {
    score += 20;
    reasons.push(`Beaucoup de mots suspects : ${found.join(", ")}`);
  } else if (found.length > 0) {
    score += 10;
    reasons.push(`Mot suspect détecté : ${found.join(", ")}`);
  }

  // -----------------------------------------------------------------------
  // 7. IP
  // -----------------------------------------------------------------------
  if (isIPAddress(hostname)) {
    score += 30;
    reasons.push("Utilisation d'une adresse IP");
  }

  // -----------------------------------------------------------------------
  // 8. OBFUSCATION
  // -----------------------------------------------------------------------
  if (rawUrl.includes("@") || rawUrl.includes("%40")) {
    score += 20;
    reasons.push("URL obfusquée (@)");
  }

  // -----------------------------------------------------------------------
  // 9. HTTP
  // -----------------------------------------------------------------------
  if (rawUrl.startsWith("http://")) {
    score += 10;
    reasons.push("Connexion non sécurisée (HTTP)");
  }

  // -----------------------------------------------------------------------
  // 10. ENTROPIE (URL RANDOM)
  // -----------------------------------------------------------------------
  const entropy = calculateEntropy(rawUrl);
  if (entropy > 4.5) {
    score += 15;
    reasons.push("URL très aléatoire (entropie élevée)");
  }

  // -----------------------------------------------------------------------
  // 11. WHOIS
  // -----------------------------------------------------------------------
  const whois = await checkWhois(hostname);
  if (whois.isNew) {
    score += 20;
    reasons.push("Domaine récent");
  }

  // -----------------------------------------------------------------------
  // FINAL
  // -----------------------------------------------------------------------
  if (reasons.length === 0) {
    reasons.push("Aucun signal suspect");
  }

  return computeRisk(score, reasons);
}
