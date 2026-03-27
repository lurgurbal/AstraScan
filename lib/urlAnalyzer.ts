/**
 * lib/urlAnalyzer.ts v3 — Analyse URL complète.
 * Intègre le testeur HTTP réel + Levenshtein + PhishTank + analyse structurelle.
 */

import { computeRisk, RiskResult } from "./riskScorer";
import { testUrlHttp } from "./urlHttpTester";

const LOCAL_BLACKLIST = [
  "phishing-example.com","fake-paypal-login.com","amazon-security-alert.xyz",
  "free-iphone-winner.ru","banque-securite-alerte.net","microsoft-support-urgent.tk",
];

const SUSPICIOUS_TLDS = [
  ".xyz",".ru",".tk",".top",".club",".icu",".gq",".cf",".ml",".ga",".pw",
  ".men",".win",".loan",".bid",".stream",".download",".work",".click",".link",
  ".monster",".cyou",".buzz",
];

const BRAND_DOMAINS = [
  "paypal","google","amazon","apple","microsoft","netflix","facebook","instagram",
  "twitter","linkedin","laposte","impots","ameli","caf","creditagricole","bnpparibas",
  "societegenerale","lcl","boursorama","caissedepargne","banquepopulaire",
  "orange","sfr","free","bouygues","edf","engie","chronopost","colissimo",
  "fedex","dhl","ups","leboncoin","airbnb","booking",
];

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m+1 }, (_, i) =>
    Array.from({ length: n+1 }, (_, j) => i===0 ? j : j===0 ? i : 0)
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1]===b[j-1] ? dp[i-1][j-1] : 1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  return dp[m][n];
}

function detectTyposquatting(hostname: string): { brand: string; distance: number } | null {
  const domain = hostname.replace(/^www\./, "").split(".").slice(0,-1).join("").toLowerCase().replace(/[^a-z0-9]/g,"");
  for (const brand of BRAND_DOMAINS) {
    if (domain === brand) return null;
    const dist = levenshtein(domain, brand);
    if (dist <= 2 && Math.abs(domain.length - brand.length) <= 2 && domain.length >= 4) return { brand, distance: dist };
    const norm = domain.replace(/0/g,"o").replace(/1/g,"l").replace(/3/g,"e").replace(/4/g,"a").replace(/5/g,"s");
    if (norm === brand && domain !== brand) return { brand, distance: 1 };
  }
  return null;
}

async function checkPhishTank(url: string): Promise<{ isPhishing: boolean; reason?: string }> {
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 5000);
    const body = new URLSearchParams({ url, format: "json", app_key: "" });
    const res = await fetch("https://checkurl.phishtank.com/checkurl/", {
      method: "POST", body: body.toString(),
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "AstraScan/3.0" },
      signal: ctrl.signal,
    });
    if (!res.ok) return { isPhishing: false };
    const data = await res.json();
    if (data?.results?.in_database && data?.results?.valid)
      return { isPhishing: true, reason: "URL répertoriée dans PhishTank (base collaborative mondiale)" };
    return { isPhishing: false };
  } catch { return { isPhishing: false }; }
}

function extractHostname(url: string): string | null {
  try { return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.toLowerCase(); }
  catch { return null; }
}

function analyzeStructure(url: string, hostname: string): Array<{ reason: string; score: number }> {
  const findings: Array<{ reason: string; score: number }> = [];
  const parts = hostname.split(".");
  const tld = "." + parts[parts.length-1];
  const subdomains = parts.length - 2;

  if (SUSPICIOUS_TLDS.includes(tld))
    findings.push({ reason: `Extension "${tld}" fréquemment utilisée dans les arnaques`, score: 22 });
  if (subdomains >= 4)
    findings.push({ reason: `Architecture suspecte : ${subdomains} niveaux de sous-domaines (technique pour masquer le vrai domaine)`, score: 28 });
  else if (subdomains >= 3)
    findings.push({ reason: `Nombre inhabituel de sous-domaines (${subdomains})`, score: 12 });
  if (url.length > 120)
    findings.push({ reason: `URL très longue (${url.length} caractères) — souvent utilisée pour noyer le vrai domaine`, score: 12 });
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname))
    findings.push({ reason: "Adresse IP directe — les sites légitimes n'utilisent jamais une IP", score: 32 });
  if (url.includes("@"))
    findings.push({ reason: "Caractère '@' dans l'URL — masque la vraie destination (tout avant @ est ignoré)", score: 25 });

  const phishKws = ["login","signin","verify","secure","update","confirm","account","wallet",
                    "reset","password","urgent","alert","suspended","validate","authentification"];
  const matched = phishKws.filter(kw => url.toLowerCase().includes(kw));
  if (matched.length >= 3)
    findings.push({ reason: `${matched.length} mots-clés de phishing dans l'URL : "${matched.slice(0,3).join('", "')}"`, score: 25 });
  else if (matched.length >= 1)
    findings.push({ reason: `Mot-clé sensible dans l'URL : "${matched[0]}"`, score: 10 });

  if (url.startsWith("http://"))
    findings.push({ reason: "HTTP sans HTTPS — les sites légitimes demandant des données utilisent toujours HTTPS", score: 12 });

  const domainPart = parts[parts.length-2] ?? "";
  if ((domainPart.match(/-/g) ?? []).length >= 3)
    findings.push({ reason: `Domaine avec ${(domainPart.match(/-/g)?.length ?? 0)} tirets — structure typique des faux sites (secure-bank-verify.xyz)`, score: 15 });

  return findings;
}

export interface UrlAnalysisInput { url: string; skipHttpTest?: boolean }

export async function analyzeUrl(input: UrlAnalysisInput): Promise<RiskResult & { httpTest?: ReturnType<typeof testUrlHttp> extends Promise<infer T> ? T : never }> {
  const { url, skipHttpTest = false } = input;
  if (!url?.trim()) return computeRisk(0, ["Aucune URL fournie"]) as any;

  const rawUrl = url.trim();
  const hostname = extractHostname(rawUrl);
  if (!hostname) return computeRisk(30, ["URL invalide ou impossible à analyser"]) as any;

  let rawScore = 0;
  const reasons: string[] = [];

  // 1. Blacklist locale
  if (LOCAL_BLACKLIST.some(b => rawUrl.includes(b))) {
    rawScore += 65; reasons.push("URL présente dans la blacklist AstraScan");
  }

  // 2. PhishTank + testeur HTTP en parallèle
  const [phishResult, httpResult] = await Promise.all([
    checkPhishTank(rawUrl),
    skipHttpTest ? Promise.resolve(null) : testUrlHttp(rawUrl),
  ]);

  if (phishResult.isPhishing) {
    rawScore += 70; reasons.push(phishResult.reason ?? "URL signalée dans PhishTank");
  }

  // 3. Résultats HTTP réels
  if (httpResult) {
    rawScore += httpResult.riskScore;
    reasons.push(...httpResult.findings);
    if (!httpResult.reachable) {
      reasons.push("⚠️ Site inaccessible au moment de l'analyse — possiblement hors ligne ou domaine inexistant");
    }
  }

  // 4. Typosquatting
  const typo = detectTyposquatting(hostname);
  if (typo) {
    rawScore += typo.distance === 1 ? 45 : 30;
    reasons.push(`Imitation probable de "${typo.brand}" — ${typo.distance === 1 ? "1 seul caractère" : "2 caractères"} de différence (typosquatting)`);
  }

  // 5. Structure
  const structural = analyzeStructure(rawUrl, hostname);
  for (const s of structural) { rawScore += s.score; reasons.push(s.reason); }

  if (reasons.length === 0) {
    reasons.push("Aucun signal suspect détecté — URL structurellement saine");
    reasons.push("Rappel : même une URL propre peut mener vers un site frauduleux — vérifiez l'expéditeur");
  }

  const riskResult = computeRisk(rawScore, reasons);
  return { ...riskResult, httpTest: httpResult } as any;
}
