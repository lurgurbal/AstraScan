/**
 * urlAnalyzer.ts
 * Analyse une URL pour détecter des signaux d'arnaque :
 *  - TLD suspects
 *  - Typosquatting (imitation de marques connues)
 *  - Structure inhabituelle (sous-domaines en excès, longueur anormale)
 *  - Présence dans une blacklist simulée
 *  - Caractères spéciaux ou encodés suspects
 *
 * TODO (prod) : brancher Google Safe Browsing, VirusTotal, WHOIS
 */

import { computeRisk, RiskResult } from "./riskScorer";

// ---------------------------------------------------------------------------
// Blacklist simulée (remplacer par un appel API en production)
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
// TLD suspects (fréquemment utilisés dans les arnaques)
// ---------------------------------------------------------------------------

const SUSPICIOUS_TLDS = [
  ".xyz", ".ru", ".tk", ".top", ".club", ".icu",
  ".gq", ".cf", ".ml", ".ga", ".pw", ".men",
  ".win", ".loan", ".bid", ".stream", ".download",
  ".work", ".click", ".link",
];

// ---------------------------------------------------------------------------
// Marques souvent imitées (typosquatting)
// ---------------------------------------------------------------------------

const BRAND_TARGETS: { brand: string; variants: RegExp }[] = [
  { brand: "PayPal",     variants: /paypa[^l]|p4ypal|payp4l|paypall|paypa1/i },
  { brand: "Google",     variants: /g[0o][0o]gle|g00gle|g0ogle|go0gle|googel/i },
  { brand: "Amazon",     variants: /amaz[o0]n|am4zon|amazoon|arnazon/i },
  { brand: "Apple",      variants: /app1e|appl3|applle|aple/i },
  { brand: "Microsoft",  variants: /micros[o0]ft|microsoift|m1crosoft/i },
  { brand: "Netflix",    variants: /netfl1x|n3tflix|netfllx|netfix/i },
  { brand: "Facebook",   variants: /faceb[o0][o0]k|faceb00k|facebok/i },
  { brand: "Banque",     variants: /banque[^.]{0,10}\.(com|net|org|fr)|credit-agr[i1]cole|lcl[^.]/i },
  { brand: "La Poste",   variants: /lapost[e3]|la-poste-|colis-laposte/i },
  { brand: "DHL / FedEx / UPS", variants: /dh1\.com|fedex-[a-z]+\.com|ups-[a-z]+\.com/i },
  { brand: "Impôts / Finances", variants: /impots?-(gouv|service)|finances-publiques|dgfip/i },
  { brand: "Ameli / CAF / CPAM", variants: /ame1i|caf-[a-z]+|cpam-[a-z]+/i },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extrait le hostname d'une URL, ou null si invalide */
function extractHostname(url: string): string | null {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** Extrait le TLD (extension) d'un hostname */
function extractTLD(hostname: string): string {
  const parts = hostname.split(".");
  if (parts.length < 2) return "";
  return "." + parts[parts.length - 1];
}

/** Compte le nombre de sous-domaines dans un hostname */
function countSubdomains(hostname: string): number {
  // www.example.com → 0 sous-domaine "réel", secure.login.paypal.fake.com → beaucoup
  const parts = hostname.split(".");
  return Math.max(0, parts.length - 2);
}

// ---------------------------------------------------------------------------
// Checks externes simulés (à remplacer par de vraies API en prod)
// ---------------------------------------------------------------------------

/**
 * Simule une vérification Google Safe Browsing.
 * En production : appel à https://safebrowsing.googleapis.com/v4/threatMatches:find
 */
async function checkGoogleSafeBrowsing(url: string): Promise<boolean> {
  // TODO: implémenter l'appel réel
  // const response = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_SB_API_KEY}`, { ... });
  return SIMULATED_BLACKLIST.some((blocked) => url.includes(blocked));
}

/**
 * Simule une vérification VirusTotal.
 * En production : appel à https://www.virustotal.com/api/v3/urls
 */
async function checkVirusTotal(_url: string): Promise<boolean> {
  // TODO: implémenter l'appel réel
  return false;
}

/**
 * Simule un lookup WHOIS pour détecter les domaines récemment créés.
 * En production : utiliser un service WHOIS ou l'API whoisxmlapi.com
 */
async function checkWhois(_hostname: string): Promise<{ isNew: boolean }> {
  // TODO: implémenter l'appel réel
  return { isNew: false };
}

// ---------------------------------------------------------------------------
// Fonction principale d'analyse
// ---------------------------------------------------------------------------

export interface UrlAnalysisInput {
  url: string;
}

/**
 * Analyse une URL et retourne un RiskResult.
 * @param input  Objet contenant l'URL à analyser
 */
export async function analyzeUrl(input: UrlAnalysisInput): Promise<RiskResult> {
  const { url } = input;

  if (!url || url.trim().length === 0) {
    return computeRisk(0, ["Aucune URL fournie"]);
  }

  const rawUrl = url.trim();
  const hostname = extractHostname(rawUrl);

  if (!hostname) {
    return computeRisk(30, ["URL invalide ou impossible à analyser"]);
  }

  let rawScore = 0;
  const reasons: string[] = [];

  // 1. Vérification blacklist (simulée)
  const isBlacklisted = await checkGoogleSafeBrowsing(rawUrl);
  if (isBlacklisted) {
    rawScore += 60;
    reasons.push("URL présente dans la blacklist de sécurité (Google Safe Browsing simulé)");
  }

  // 2. VirusTotal (simulé)
  const isVirusTotal = await checkVirusTotal(rawUrl);
  if (isVirusTotal) {
    rawScore += 40;
    reasons.push("Signalée comme malveillante par VirusTotal (simulé)");
  }

  // 3. TLD suspect
  const tld = extractTLD(hostname);
  if (SUSPICIOUS_TLDS.includes(tld)) {
    rawScore += 20;
    reasons.push(`TLD suspect détecté : ${tld}`);
  }

  // 4. Typosquatting
  for (const target of BRAND_TARGETS) {
    if (target.variants.test(hostname)) {
      rawScore += 35;
      reasons.push(`Possible imitation de la marque "${target.brand}" (typosquatting)`);
      break; // On ne pénalise qu'une fois
    }
  }

  // 5. Nombre de sous-domaines excessif
  const subdomainCount = countSubdomains(hostname);
  if (subdomainCount >= 4) {
    rawScore += 25;
    reasons.push(`Structure suspecte : ${subdomainCount} niveaux de sous-domaines (ex : login.secure.bank.xyz.com)`);
  } else if (subdomainCount >= 3) {
    rawScore += 10;
    reasons.push(`Nombre de sous-domaines élevé (${subdomainCount})`);
  }

  // 6. URL excessivement longue
  if (rawUrl.length > 100) {
    rawScore += 10;
    reasons.push(`URL anormalement longue (${rawUrl.length} caractères)`);
  }

  // 7. Présence de mots-clés suspects dans l'URL
  const suspiciousKeywords = [
    "login", "signin", "verify", "secure", "update", "confirm",
    "account", "wallet", "reset", "password", "urgent", "alert",
    "suspended", "limite", "validation", "authentification",
  ];
  const urlLower = rawUrl.toLowerCase();
  const matchedKeywords = suspiciousKeywords.filter((kw) => urlLower.includes(kw));
  if (matchedKeywords.length >= 3) {
    rawScore += 20;
    reasons.push(`Accumulation de mots-clés suspects dans l'URL : ${matchedKeywords.join(", ")}`);
  } else if (matchedKeywords.length >= 1) {
    rawScore += 10;
    reasons.push(`Mots-clés suspects dans l'URL : ${matchedKeywords.join(", ")}`);
  }

  // 8. IP au lieu d'un domaine
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipPattern.test(hostname)) {
    rawScore += 30;
    reasons.push("L'URL utilise une adresse IP au lieu d'un nom de domaine");
  }

  // 9. Caractères encodés ou @ dans l'URL (technique de masquage)
  if (rawUrl.includes("%40") || rawUrl.includes("@")) {
    rawScore += 20;
    reasons.push("Présence d'un caractère '@' dans l'URL (technique de masquage du vrai domaine)");
  }

  // 10. Protocole non sécurisé
  if (rawUrl.startsWith("http://")) {
    rawScore += 10;
    reasons.push("Connexion non sécurisée (HTTP sans HTTPS)");
  }

  // 11. WHOIS — domaine récent (simulé)
  const whois = await checkWhois(hostname);
  if (whois.isNew) {
    rawScore += 20;
    reasons.push("Domaine créé récemment (moins de 30 jours) — signal typique d'arnaque");
  }

  // Aucune anomalie
  if (reasons.length === 0) {
    reasons.push("Aucun signal suspect détecté dans cette URL");
  }

  return computeRisk(rawScore, reasons);
}
