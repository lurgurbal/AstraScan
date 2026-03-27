/**
 * lib/urlHttpTester.ts
 * Testeur HTTP réel pour les URLs suspectes.
 * Effectue un vrai fetch (HEAD puis GET), analyse :
 *   - Code HTTP (200, 301, 302, 403, 404, 500...)
 *   - Chaîne de redirections (détecte les redirecteurs suspects)
 *   - Headers suspects (absence de security headers)
 *   - Temps de réponse
 *   - Domaine final après redirections (différent du domaine initial = suspect)
 */

export interface HttpTestResult {
  reachable: boolean;
  finalUrl: string;
  redirectChain: string[];
  statusCode: number | null;
  responseTimeMs: number;
  findings: string[];
  riskScore: number;
}

function extractDomain(url: string): string {
  try { return new URL(url).hostname.toLowerCase(); }
  catch { return ""; }
}

export async function testUrlHttp(rawUrl: string): Promise<HttpTestResult> {
  const url = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
  const startTime = Date.now();
  const findings: string[] = [];
  let riskScore = 0;

  const result: HttpTestResult = {
    reachable: false,
    finalUrl: url,
    redirectChain: [],
    statusCode: null,
    responseTimeMs: 0,
    findings: [],
    riskScore: 0,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    // HEAD d'abord (plus rapide), puis GET si HEAD échoue
    let res: Response | null = null;
    try {
      res = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AstraScan/3.0)" },
      });
    } catch {
      // Certains serveurs refusent HEAD, essayer GET
      try {
        res = await fetch(url, {
          method: "GET",
          signal: controller.signal,
          redirect: "follow",
          headers: { "User-Agent": "Mozilla/5.0 (compatible; AstraScan/3.0)" },
        });
      } catch { /* inaccessible */ }
    }
    clearTimeout(timeout);

    result.responseTimeMs = Date.now() - startTime;

    if (!res) {
      findings.push("Site inaccessible ou timeout après 8 secondes — le domaine peut ne pas exister ou être temporairement hors ligne");
      riskScore += 15;
      result.reachable = false;
      result.findings = findings;
      result.riskScore = riskScore;
      return result;
    }

    result.reachable = true;
    result.statusCode = res.status;
    result.finalUrl = res.url;

    // ── Analyse des redirections ──
    if (res.url !== url) {
      const initialDomain = extractDomain(url);
      const finalDomain = extractDomain(res.url);
      result.redirectChain = [url, res.url];

      if (initialDomain !== finalDomain && finalDomain !== "") {
        riskScore += 25;
        findings.push(`Redirection vers un domaine différent : "${initialDomain}" → "${finalDomain}" — technique classique pour masquer la destination réelle`);
      } else if (finalDomain === initialDomain) {
        findings.push(`Redirection interne détectée (${url} → ${res.url})`);
      }

      // Redirection vers HTTP depuis HTTPS = downgrade
      if (url.startsWith("https://") && res.url.startsWith("http://")) {
        riskScore += 20;
        findings.push("Downgrade de sécurité : redirection de HTTPS vers HTTP — connexion non chiffrée après redirection");
      }
    }

    // ── Analyse du code HTTP ──
    if (res.status === 200) {
      findings.push(`Serveur accessible (HTTP ${res.status})`);
    } else if (res.status >= 301 && res.status <= 308) {
      findings.push(`Redirection HTTP ${res.status} détectée`);
    } else if (res.status === 403) {
      findings.push("Accès interdit (HTTP 403) — le serveur bloque l'inspection, comportement parfois associé aux sites de phishing");
      riskScore += 10;
    } else if (res.status === 404) {
      findings.push("Page introuvable (HTTP 404) — le contenu a peut-être été supprimé après signalement");
      riskScore += 5;
    } else if (res.status >= 500) {
      findings.push(`Erreur serveur (HTTP ${res.status}) — serveur instable ou mal configuré`);
      riskScore += 8;
    } else if (res.status === 0 || res.status < 100) {
      findings.push("Code HTTP anormal — serveur ne respectant pas le protocole HTTP standard");
      riskScore += 12;
    }

    // ── Analyse des headers de sécurité ──
    const missingSecHeaders: string[] = [];
    const hstsHeader = res.headers.get("strict-transport-security");
    const cspHeader = res.headers.get("content-security-policy");
    const xFrameHeader = res.headers.get("x-frame-options");

    if (!hstsHeader) missingSecHeaders.push("HSTS");
    if (!cspHeader)  missingSecHeaders.push("CSP");
    if (!xFrameHeader) missingSecHeaders.push("X-Frame-Options");

    if (missingSecHeaders.length === 3) {
      riskScore += 12;
      findings.push("Aucun header de sécurité (HSTS, CSP, X-Frame-Options) — configuration serveur négligée, typique des sites créés à la va-vite");
    }

    // ── Temps de réponse ──
    if (result.responseTimeMs < 150) {
      findings.push(`Réponse très rapide (${result.responseTimeMs}ms) — serveur CDN ou hébergement automatisé`);
    } else if (result.responseTimeMs > 5000) {
      findings.push(`Réponse très lente (${result.responseTimeMs}ms) — serveur lointain ou surchargé`);
      riskScore += 5;
    } else {
      findings.push(`Temps de réponse normal (${result.responseTimeMs}ms)`);
    }

    // ── Contenu type suspect ──
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("text/html")) {
      findings.push("Contenu HTML — page web classique");
    } else if (contentType.includes("application/") && !contentType.includes("json")) {
      riskScore += 8;
      findings.push(`Type de contenu inhabituel pour une URL: "${contentType.split(";")[0]}" — peut forcer un téléchargement`);
    }

  } catch (err) {
    result.responseTimeMs = Date.now() - startTime;
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    if (msg.includes("abort") || msg.includes("timeout")) {
      findings.push("Timeout — le site n'a pas répondu dans les 8 secondes");
      riskScore += 10;
    } else if (msg.includes("fetch") || msg.includes("network") || msg.includes("ENOTFOUND")) {
      findings.push("Domaine inaccessible — peut ne pas exister (domaine expiré ou jamais créé)");
      riskScore += 20;
    } else {
      findings.push(`Erreur de connexion : ${msg}`);
      riskScore += 10;
    }
    result.reachable = false;
  }

  result.findings = findings;
  result.riskScore = Math.min(50, riskScore); // cap à 50 pour ce module seul
  return result;
}
