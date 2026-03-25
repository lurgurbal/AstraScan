/**
 * urlAnalyzer.ts v2 — Analyse URL avancée
 * Sources : PhishTank (gratuit 500/j), heuristiques avancées, feed RSS, communauté
 */

import { computeRisk, RiskResult } from "./riskScorer";

// ─── Blacklist locale (mise à jour manuelle + feed communautaire) ──────────

const LOCAL_BLACKLIST = [
  "phishing-example.com", "fake-paypal-login.com", "amazon-security-alert.xyz",
  "free-iphone-winner.ru", "banque-securite-alerte.net", "microsoft-support-urgent.tk",
];

// ─── TLD suspects ──────────────────────────────────────────────────────────

const SUSPICIOUS_TLDS = [
  ".xyz",".ru",".tk",".top",".club",".icu",".gq",".cf",".ml",".ga",".pw",
  ".men",".win",".loan",".bid",".stream",".download",".work",".click",".link",
  ".monster",".cyou",".buzz",".hair",".beauty",".makeup",".skin",
];

// ─── Marques souvent imitées — détection par distance de Levenshtein ──────

const BRAND_DOMAINS = [
  "paypal", "google", "amazon", "apple", "microsoft", "netflix", "facebook",
  "instagram", "twitter", "linkedin", "laposte", "impots", "ameli", "caf",
  "creditagricole", "bnpparibas", "societegenerale", "lcl", "boursorama",
  "caissedepargne", "banquepopulaire", "orange", "sfr", "free", "bouygues",
  "edf", "engie", "chronopost", "colissimo", "fedex", "dhl", "ups",
];

// Levenshtein distance pour détecter le typosquatting
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[m][n];
}

function detectTyposquatting(hostname: string): { brand: string; distance: number } | null {
  // Extraire le domaine principal (sans www, sans TLD)
  const parts = hostname.replace(/^www\./, "").split(".");
  const domain = parts.slice(0, -1).join("").toLowerCase().replace(/[^a-z0-9]/g, "");

  for (const brand of BRAND_DOMAINS) {
    if (domain === brand) return null; // domaine officiel
    const dist = levenshtein(domain, brand);
    // Distance 1-2 = forte suspicion, même longueur = très suspect
    if (dist <= 2 && Math.abs(domain.length - brand.length) <= 2 && domain.length >= 4) {
      return { brand, distance: dist };
    }
    // Homoglyphes (0→o, 1→l, etc.)
    const normalized = domain.replace(/0/g,"o").replace(/1/g,"l").replace(/3/g,"e").replace(/4/g,"a").replace(/5/g,"s");
    if (normalized === brand && domain !== brand) return { brand, distance: 1 };
  }
  return null;
}

// ─── PhishTank API (gratuit, 500 req/jour sans clé) ──────────────────────

async function checkPhishTank(url: string): Promise<{ isPhishing: boolean; reason?: string }> {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 4000);

    const formData = new URLSearchParams();
    formData.append("url", url);
    formData.append("format", "json");
    formData.append("app_key", ""); // Clé optionnelle (sans clé = 500 req/j)

    const res = await fetch("https://checkurl.phishtank.com/checkurl/", {
      method: "POST",
      body: formData.toString(),
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "AstraScan/2.0" },
      signal: controller.signal,
    });

    if (!res.ok) return { isPhishing: false };
    const data = await res.json();
    const result = data?.results;
    if (result?.in_database && result?.valid) {
      return { isPhishing: true, reason: "URL répertoriée dans la base PhishTank (base collaborative mondiale de sites de phishing)" };
    }
    return { isPhishing: false };
  } catch {
    return { isPhishing: false }; // timeout ou erreur réseau
  }
}

// ─── Analyse structurelle avancée ─────────────────────────────────────────

function analyzeStructure(url: string, hostname: string): Array<{ reason: string; score: number }> {
  const findings: Array<{ reason: string; score: number }> = [];
  const parts = hostname.split(".");
  const tld = "." + parts[parts.length - 1];
  const subdomains = parts.length - 2;

  // TLD suspect
  if (SUSPICIOUS_TLDS.includes(tld)) {
    findings.push({ reason: `TLD "${tld}" fréquemment utilisé dans les arnaques — peu de sites légitimes utilisent cette extension`, score: 22 });
  }

  // Sous-domaines excessifs
  if (subdomains >= 4) {
    findings.push({ reason: `Architecture de sous-domaines très profonde (${subdomains} niveaux) — technique pour faire croire que l'URL pointe vers un domaine légitime`, score: 28 });
  } else if (subdomains >= 3) {
    findings.push({ reason: `Nombre inhabituel de sous-domaines (${subdomains}) — vérifiez le domaine réel (la partie avant le premier .com/.fr/etc.)`, score: 12 });
  }

  // URL très longue
  if (url.length > 120) {
    findings.push({ reason: `URL anormalement longue (${url.length} caractères) — longueur excessive souvent utilisée pour masquer le vrai domaine`, score: 12 });
  }

  // Adresse IP
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    findings.push({ reason: "L'URL utilise une adresse IP au lieu d'un nom de domaine — les sites légitimes n'utilisent jamais des IP directement", score: 32 });
  }

  // @ dans l'URL (masquage)
  if (url.includes("@")) {
    findings.push({ reason: "Caractère '@' dans l'URL — technique de masquage : tout avant @ est ignoré par le navigateur mais trompe l'œil", score: 25 });
  }

  // Mots-clés de phishing dans l'URL
  const phishingKws = ["login", "signin", "verify", "secure", "update", "confirm", "account",
                       "wallet", "reset", "password", "urgent", "alert", "suspended", "validate",
                       "authentification", "verification", "connexion", "espace-client"];
  const urlLower = url.toLowerCase();
  const matched = phishingKws.filter(kw => urlLower.includes(kw));
  if (matched.length >= 3) {
    findings.push({ reason: `Accumulation de ${matched.length} mots-clés de phishing dans l'URL : "${matched.slice(0,3).join('", "')}" — URL construite pour paraître officielle`, score: 25 });
  } else if (matched.length >= 1) {
    findings.push({ reason: `Mot-clé sensible dans l'URL : "${matched[0]}" — contexte à vérifier`, score: 10 });
  }

  // HTTP sans HTTPS
  if (url.startsWith("http://")) {
    findings.push({ reason: "Connexion non chiffrée (HTTP) — les sites légitimes demandant des informations utilisent toujours HTTPS", score: 12 });
  }

  // Double encodage ou caractères suspects
  if (url.includes("%2F%2F") || url.includes("%00") || url.includes("javascript:")) {
    findings.push({ reason: "Encodage suspect dans l'URL — technique d'obfuscation pour masquer la destination réelle", score: 30 });
  }

  // Tirets excessifs dans le domaine (légitimité douteuse)
  const domainPart = parts[parts.length - 2] ?? "";
  const dashCount = (domainPart.match(/-/g) || []).length;
  if (dashCount >= 3) {
    findings.push({ reason: `Domaine avec ${dashCount} tirets (ex: secure-bank-login-verify.xyz) — structure typique des faux sites`, score: 15 });
  }

  return findings;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function extractHostname(url: string): string | null {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.toLowerCase();
  } catch { return null; }
}

// ─── Fonction principale ───────────────────────────────────────────────────

export interface UrlAnalysisInput { url: string }

export async function analyzeUrl(input: UrlAnalysisInput): Promise<RiskResult> {
  const { url } = input;
  if (!url?.trim()) return computeRisk(0, ["Aucune URL fournie"]);

  const rawUrl = url.trim();
  const hostname = extractHostname(rawUrl);
  if (!hostname) return computeRisk(30, ["URL invalide ou impossible à analyser"]);

  let rawScore = 0;
  const reasons: string[] = [];

  // 1. Blacklist locale
  if (LOCAL_BLACKLIST.some(b => rawUrl.includes(b))) {
    rawScore += 65;
    reasons.push("URL présente dans la blacklist locale AstraScan — signalée comme malveillante");
  }

  // 2. PhishTank (async, avec fallback si timeout)
  const phishResult = await checkPhishTank(rawUrl);
  if (phishResult.isPhishing) {
    rawScore += 70;
    reasons.push(phishResult.reason ?? "URL signalée dans PhishTank");
  }

  // 3. Typosquatting via Levenshtein
  const typo = detectTyposquatting(hostname);
  if (typo) {
    const distLabel = typo.distance === 1 ? "très proche (1 caractère de différence)" : "proche (2 caractères de différence)";
    rawScore += typo.distance === 1 ? 45 : 30;
    reasons.push(`Possible imitation de "${typo.brand}" — domaine ${distLabel} de la marque officielle (technique de typosquatting)`);
  }

  // 4. Analyse structurelle
  const structural = analyzeStructure(rawUrl, hostname);
  for (const s of structural) {
    rawScore += s.score;
    reasons.push(s.reason);
  }

  // Aucun signal
  if (reasons.length === 0) {
    reasons.push("Aucun signal suspect détecté — URL structurellement saine");
    reasons.push("Rappel : même une URL propre peut mener vers un site frauduleux — vérifiez toujours l'expéditeur");
  }

  return computeRisk(rawScore, reasons);
}
