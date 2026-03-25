/**
 * threatFeed.ts
 * Agrège les alertes d'arnaques en temps réel depuis :
 * - Cybermalveillance.gouv.fr (RSS officiel)
 * - Zataz.com (RSS cybersécurité FR)
 * - Cache local (revalidé toutes les heures)
 * Entièrement gratuit, aucune clé API.
 */

export interface ThreatEntry {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  keywords: string[];
}

export interface ThreatFeed {
  entries: ThreatEntry[];
  lastUpdated: string;
  sources: string[];
}

// Cache in-memory (revalidé côté serveur toutes les heures)
let _cache: ThreatFeed | null = null;
let _cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 heure

const RSS_SOURCES = [
  {
    name: "Cybermalveillance.gouv.fr",
    url: "https://www.cybermalveillance.gouv.fr/feed/",
    fallback: true
  },
  {
    name: "Zataz.com",
    url: "https://www.zataz.com/feed/",
    fallback: true
  },
  {
    name: "ANSSI",
    url: "https://www.ssi.gouv.fr/feed/",
    fallback: true
  }
];

// ─── Parser RSS minimaliste ────────────────────────────────────────────────

function parseRSS(xml: string, sourceName: string): ThreatEntry[] {
  const entries: ThreatEntry[] = [];
  try {
    // Extraire les items
    const itemMatches = xml.match(/<item[^>]*>([\s\S]*?)<\/item>/gi) ?? [];

    for (const item of itemMatches.slice(0, 8)) {
      const title = (item.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>/i) ??
                     item.match(/<title[^>]*>(.*?)<\/title>/i))?.[1]?.trim() ?? "";
      const desc  = (item.match(/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) ??
                     item.match(/<description[^>]*>([\s\S]*?)<\/description>/i))?.[1]?.trim() ?? "";
      const link  = (item.match(/<link[^>]*>(.*?)<\/link>/i) ??
                     item.match(/<guid[^>]*>(.*?)<\/guid>/i))?.[1]?.trim() ?? "";
      const pub   = item.match(/<pubDate[^>]*>(.*?)<\/pubDate>/i)?.[1]?.trim() ?? "";

      // Nettoyer HTML dans la description
      const cleanDesc = desc.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/gi, " ").trim().slice(0, 300);

      // Extraire les mots-clés pertinents
      const combined = (title + " " + cleanDesc).toLowerCase();
      const keywords: string[] = [];
      const kwPatterns = [
        "phishing", "arnaque", "fraude", "hameçonnage", "escroquerie",
        "vishing", "smishing", "ransomware", "malware", "faux",
        "usurpation", "spoofing", "deepfake", "credential"
      ];
      kwPatterns.forEach(kw => { if (combined.includes(kw)) keywords.push(kw); });

      if (title.length > 5) {
        entries.push({ title, description: cleanDesc, link, pubDate: pub, source: sourceName, keywords });
      }
    }
  } catch { /* silencieux */ }
  return entries;
}

// ─── Fetcher RSS avec timeout ──────────────────────────────────────────────

async function fetchRSS(url: string, sourceName: string): Promise<ThreatEntry[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "AstraScan/2.0 (threat-feed-aggregator)" }
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSS(xml, sourceName);
  } catch {
    return [];
  }
}

// ─── Données de fallback (si tous les flux échouent) ──────────────────────

function getFallbackData(): ThreatEntry[] {
  return [
    {
      title: "Arnaques aux faux conseillers bancaires en hausse",
      description: "Des escrocs se font passer pour des conseillers bancaires et demandent aux victimes de valider des virements frauduleux ou de communiquer leurs codes d'accès.",
      link: "https://www.cybermalveillance.gouv.fr",
      pubDate: new Date().toISOString(),
      source: "AstraScan (données intégrées)",
      keywords: ["arnaque", "fraude", "usurpation"]
    },
    {
      title: "Phishing CPF — usurpation de Mon Compte Formation",
      description: "Campagne d'hameçonnage usurpant l'identité de Mon Compte Formation (CPF) pour voler les identifiants et vider les comptes de formation.",
      link: "https://www.cybermalveillance.gouv.fr",
      pubDate: new Date().toISOString(),
      source: "AstraScan (données intégrées)",
      keywords: ["phishing", "hameçonnage", "arnaque"]
    },
    {
      title: "Faux SMS Ameli / Assurance maladie",
      description: "SMS frauduleux imitant l'Assurance maladie, invitant à mettre à jour une carte Vitale via un lien de phishing.",
      link: "https://www.cybermalveillance.gouv.fr",
      pubDate: new Date().toISOString(),
      source: "AstraScan (données intégrées)",
      keywords: ["smishing", "phishing", "arnaque", "faux"]
    },
    {
      title: "Arnaque au faux support technique Microsoft",
      description: "Pop-ups alarmistes sur ordinateur prétendant que le système est infecté, invitant à appeler un faux numéro de support technique surtaxé.",
      link: "https://www.cybermalveillance.gouv.fr",
      pubDate: new Date().toISOString(),
      source: "AstraScan (données intégrées)",
      keywords: ["arnaque", "faux", "malware"]
    },
    {
      title: "Vishing — arnaques téléphoniques aux crypto-monnaies",
      description: "Des escrocs appellent les victimes en prétendant être des conseillers en investissement et les incitent à investir dans de fausses plateformes crypto.",
      link: "https://www.cybermalveillance.gouv.fr",
      pubDate: new Date().toISOString(),
      source: "AstraScan (données intégrées)",
      keywords: ["vishing", "arnaque", "fraude", "credential"]
    }
  ];
}

// ─── Fonction principale ───────────────────────────────────────────────────

export async function getThreatFeed(): Promise<ThreatFeed> {
  // Retourner le cache si valide
  if (_cache && (Date.now() - _cacheTime) < CACHE_TTL) return _cache;

  const allEntries: ThreatEntry[] = [];
  const successSources: string[] = [];

  // Fetch parallèle de toutes les sources
  const results = await Promise.allSettled(
    RSS_SOURCES.map(src => fetchRSS(src.url, src.name))
  );

  results.forEach((result, i) => {
    if (result.status === "fulfilled" && result.value.length > 0) {
      allEntries.push(...result.value);
      successSources.push(RSS_SOURCES[i].name);
    }
  });

  // Si aucune source n'a répondu, utiliser les données intégrées
  if (allEntries.length === 0) {
    allEntries.push(...getFallbackData());
    successSources.push("AstraScan (données intégrées)");
  }

  // Trier par date (plus récent en premier)
  allEntries.sort((a, b) => {
    const da = new Date(a.pubDate).getTime() || 0;
    const db = new Date(b.pubDate).getTime() || 0;
    return db - da;
  });

  _cache = { entries: allEntries.slice(0, 20), lastUpdated: new Date().toISOString(), sources: successSources };
  _cacheTime = Date.now();
  return _cache;
}

// ─── Vérification si un texte matche une alerte récente ───────────────────

export async function matchThreatFeed(text: string): Promise<{ matched: boolean; entries: ThreatEntry[] }> {
  const feed = await getThreatFeed();
  const lowerText = text.toLowerCase();
  const matched = feed.entries.filter(entry => {
    return entry.keywords.some(kw => lowerText.includes(kw)) ||
           lowerText.includes(entry.title.toLowerCase().slice(0, 20));
  });
  return { matched: matched.length > 0, entries: matched.slice(0, 3) };
}
