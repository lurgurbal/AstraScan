/**
 * lib/threatFeed.ts v2 — Sources OFFICIELLES françaises uniquement.
 *
 * Sources retenues (RSS réels vérifiés) :
 *   ✅ Cybermalveillance.gouv.fr  — https://www.cybermalveillance.gouv.fr/feed/
 *   ✅ SignalConso (DGCCRF)       — https://signal.conso.gouv.fr  (pas de RSS → mock structuré)
 *   ✅ CNIL                       — https://www.cnil.fr/fr/rss.xml
 *
 * Sources supprimées (non fiables / RSS inexistant) :
 *   ❌ Zataz.com  — RSS bloqué côté serveur, contenu non officiel
 *   ❌ ANSSI      — https://www.ssi.gouv.fr/feed/ retourne 404
 *
 * Toutes les sources avec fallback structuré si échec réseau.
 */

export interface ThreatEntry {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  category: "phishing" | "arnaque" | "fraude" | "alerte" | "info";
  keywords: string[];
}

export interface ThreatFeed {
  entries: ThreatEntry[];
  lastUpdated: string;
  sources: string[];
  fromCache: boolean;
}

// Cache in-memory serveur (1h)
let _cache: ThreatFeed | null = null;
let _cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000;

// ─── Sources RSS officielles ───────────────────────────────────────────────

const RSS_SOURCES: { name: string; url: string; category: ThreatEntry["category"] }[] = [
  {
    name: "Cybermalveillance.gouv.fr",
    url: "https://www.cybermalveillance.gouv.fr/feed/",
    category: "phishing",
  },
  {
    name: "CNIL",
    url: "https://www.cnil.fr/fr/rss.xml",
    category: "alerte",
  },
];

// ─── Parser RSS robuste ───────────────────────────────────────────────────

const SCAM_KEYWORDS = [
  "phishing","arnaque","fraude","hameçonnage","escroquerie","vishing",
  "smishing","ransomware","malware","usurpation","spoofing","faux","piratage",
  "credential","deepfake","sextorsion","chantage","crypto","investment",
];

function parseRSS(xml: string, source: string, category: ThreatEntry["category"]): ThreatEntry[] {
  const entries: ThreatEntry[] = [];
  try {
    const items = xml.match(/<item[^>]*>([\s\S]*?)<\/item>/gi) ?? [];
    for (const item of items.slice(0, 10)) {
      const getField = (tag: string) => {
        const m = item.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i"));
        return m?.[1]?.trim() ?? "";
      };
      const title = getField("title");
      const rawDesc = getField("description");
      const link = getField("link") || getField("guid");
      const pub = getField("pubDate");
      const desc = rawDesc.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim().slice(0, 280);
      const combined = (title + " " + desc).toLowerCase();
      const keywords = SCAM_KEYWORDS.filter(kw => combined.includes(kw));

      if (title.length > 8) {
        entries.push({ title, description: desc, link, pubDate: pub, source, category, keywords });
      }
    }
  } catch { /* silencieux */ }
  return entries;
}

// ─── Fetcher avec timeout ──────────────────────────────────────────────────

async function fetchRSS(url: string, source: string, category: ThreatEntry["category"]): Promise<ThreatEntry[]> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": "AstraScan/3.0 (outil-detection-arnaques; contact: https://github.com)",
        "Accept": "application/rss+xml, application/xml, text/xml",
      },
      next: { revalidate: 3600 }, // Next.js ISR cache
    });
    clearTimeout(t);
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSS(xml, source, category);
  } catch {
    return [];
  }
}

// ─── Données intégrées structurées (fallback officiel) ────────────────────
// Basées sur les vraies alertes publiées par Cybermalveillance.gouv.fr

function getBuiltinAlerts(): ThreatEntry[] {
  const now = new Date().toISOString();
  return [
    {
      title: "Arnaques aux faux conseillers bancaires — vigilance accrue",
      description: "Des escrocs se font passer pour des conseillers de votre banque, prétextent une fraude sur votre compte et vous demandent de valider des opérations ou de communiquer vos codes.",
      link: "https://www.cybermalveillance.gouv.fr/tous-nos-contenus/actualites/arnaques-faux-conseillers-bancaires",
      pubDate: now, source: "Cybermalveillance.gouv.fr (intégré)", category: "arnaque",
      keywords: ["arnaque", "fraude", "usurpation"],
    },
    {
      title: "Phishing CPF — faux e-mails Mon Compte Formation",
      description: "Campagne d'hameçonnage usurpant Mon Compte Formation (CPF). Les victimes sont redirigées vers un faux site pour voler leurs identifiants et vider leur compte de formation.",
      link: "https://www.cybermalveillance.gouv.fr/tous-nos-contenus/actualites/hameconnage-cpf",
      pubDate: now, source: "Cybermalveillance.gouv.fr (intégré)", category: "phishing",
      keywords: ["phishing", "hameçonnage", "arnaque"],
    },
    {
      title: "Faux SMS Ameli — mise à jour carte Vitale",
      description: "SMS frauduleux imitant l'Assurance maladie invitant à mettre à jour votre carte Vitale via un lien de phishing. Vos données personnelles et bancaires sont alors volées.",
      link: "https://www.cybermalveillance.gouv.fr/tous-nos-contenus/actualites/smishing-ameli",
      pubDate: now, source: "Cybermalveillance.gouv.fr (intégré)", category: "phishing",
      keywords: ["smishing", "phishing", "faux"],
    },
    {
      title: "Arnaque au faux support technique (vishing)",
      description: "Pop-ups ou appels prétendant que votre ordinateur est infecté. On vous demande d'appeler un numéro surtaxé ou d'installer un logiciel permettant la prise de contrôle à distance.",
      link: "https://www.cybermalveillance.gouv.fr/tous-nos-contenus/actualites/faux-support-technique",
      pubDate: now, source: "Cybermalveillance.gouv.fr (intégré)", category: "arnaque",
      keywords: ["arnaque", "malware", "vishing"],
    },
    {
      title: "Escroqueries aux cryptomonnaies — fausses plateformes d'investissement",
      description: "Des escrocs proposent des investissements crypto garantis avec des rendements exceptionnels. Une fois l'argent versé, la plateforme disparaît et les retraits sont impossibles.",
      link: "https://www.cybermalveillance.gouv.fr/tous-nos-contenus/actualites/escroqueries-cryptomonnaies",
      pubDate: now, source: "Cybermalveillance.gouv.fr (intégré)", category: "fraude",
      keywords: ["fraude", "arnaque", "crypto"],
    },
    {
      title: "Signalements DGCCRF — arnaques e-commerce en hausse",
      description: "La DGCCRF signale une augmentation des faux sites marchands et des arnaques à la livraison. Vérifiez toujours l'authenticité d'un site avant tout achat.",
      link: "https://signal.conso.gouv.fr",
      pubDate: now, source: "SignalConso / DGCCRF (intégré)", category: "alerte",
      keywords: ["arnaque", "fraude"],
    },
    {
      title: "Sextorsion — chantage à la webcam",
      description: "Des e-mails prétendent avoir enregistré des vidéos compromettantes via votre webcam et menacent de les divulguer. C'est une arnaque massive. Ne payez jamais.",
      link: "https://www.cybermalveillance.gouv.fr/tous-nos-contenus/actualites/sextorsion",
      pubDate: now, source: "Cybermalveillance.gouv.fr (intégré)", category: "arnaque",
      keywords: ["chantage", "arnaque", "sextorsion"],
    },
  ];
}

// ─── Fonction principale ───────────────────────────────────────────────────

export async function getThreatFeed(): Promise<ThreatFeed> {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) {
    return { ..._cache, fromCache: true };
  }

  const allEntries: ThreatEntry[] = [];
  const successSources: string[] = [];

  const results = await Promise.allSettled(
    RSS_SOURCES.map(s => fetchRSS(s.url, s.name, s.category))
  );

  results.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value.length > 0) {
      allEntries.push(...r.value);
      successSources.push(RSS_SOURCES[i].name);
    }
  });

  // Toujours ajouter les données intégrées (contenu garanti)
  const builtin = getBuiltinAlerts();
  // Éviter les doublons par titre
  const existingTitles = new Set(allEntries.map(e => e.title.toLowerCase().slice(0, 30)));
  builtin.forEach(b => {
    if (!existingTitles.has(b.title.toLowerCase().slice(0, 30))) {
      allEntries.push(b);
    }
  });
  if (!successSources.includes("Données intégrées")) {
    successSources.push("Données intégrées");
  }

  allEntries.sort((a, b) => (new Date(b.pubDate).getTime() || 0) - (new Date(a.pubDate).getTime() || 0));

  _cache = { entries: allEntries.slice(0, 20), lastUpdated: new Date().toISOString(), sources: successSources, fromCache: false };
  _cacheTime = Date.now();
  return _cache;
}

export async function matchThreatFeed(text: string): Promise<{ matched: boolean; entries: ThreatEntry[] }> {
  const feed = await getThreatFeed();
  const lower = text.toLowerCase();
  const matched = feed.entries.filter(e =>
    e.keywords.some(kw => lower.includes(kw)) || lower.includes(e.title.toLowerCase().slice(0, 20))
  );
  return { matched: matched.length > 0, entries: matched.slice(0, 3) };
}
