/**
 * textAnalyzer.ts v2 — Moteur d'analyse linguistique avancé
 * Analyse SANS listes de mots-clés fixes.
 * Utilise : syntaxe, sémantique, psychologie, structure, cohérence.
 */

import { computeRisk, RiskResult } from "./riskScorer";

// ─── Types internes ────────────────────────────────────────────────────────

interface LinguisticProfile {
  actionVerbDensity: number;      // ratio verbes d'action
  sentenceAvgLength: number;      // longueur moy phrases
  exclamationRatio: number;       // ratio !
  questionRatio: number;          // ratio ?
  capsRatio: number;              // ratio MAJUSCULES
  escalationScore: number;        // urgence augmente vers la fin
  imperativeCount: number;        // nombre d'impératifs
  negationCount: number;          // négations (ne...pas, jamais)
  conditionalThreats: number;     // structure "si X alors Y"
  repetitionScore: number;        // mots répétés anormalement
  ellipsisCount: number;          // points de suspension (pression)
  numberDensity: number;          // ratio chiffres/mots (montants, codes)
}

interface SemanticProfile {
  financialFieldScore: number;    // champ lexical finance
  legalFieldScore: number;        // champ lexical juridique
  medicalFieldScore: number;      // champ lexical médical
  technicalFieldScore: number;    // champ lexical technique
  socialEngineering: number;      // manipulation sociale détectée
  senderContentCoherence: number; // cohérence expéditeur/contenu
  promiseQuality: string[];       // type de promesses détectées
  threatQuality: string[];        // type de menaces détectées
}

// ─── Champs lexicaux sémantiques (familles, pas listes exactes) ───────────

const SEMANTIC_FIELDS = {
  financial: {
    roots: ["banqu", "compt", "virement", "paiement", "pay", "crédit", "débit", "solde",
            "rib", "iban", "carte", "factur", "remboursement", "cotisation", "prélèv",
            "crypto", "bitcoin", "wallet", "invest", "gain", "rendement", "bours"],
    weight: 1.0
  },
  legal: {
    roots: ["tribunal", "justic", "judiciair", "huissier", "saisie", "poursuit", "plainte",
            "amende", "pénalité", "contravention", "recouvrement", "contentieux", "arrêt"],
    weight: 1.2
  },
  medical: {
    roots: ["santé", "médecin", "hospital", "assur maladie", "ameli", "sécu", "remboursement",
            "ordonnance", "prescription", "cpam", "mutuelle", "vitale"],
    weight: 0.8
  },
  technical: {
    roots: ["virus", "piraté", "hacké", "malware", "logiciel", "système", "mise à jour",
            "sécurité", "firewall", "microsoft", "apple", "support", "technicien"],
    weight: 1.0
  },
  identity: {
    roots: ["identité", "passport", "cni", "carte national", "vérifi", "confirm", "valider",
            "authentifi", "connexion", "mot de pass", "identifiant", "login", "code"],
    weight: 1.3
  }
};

// ─── Patterns de manipulation psychologique (MICE model) ──────────────────
// Money, Ideology, Coercion, Ego

const PSYCH_PATTERNS = [
  // Coercition — menace si inaction
  { pattern: /si.{0,30}(pas|ne.{0,10}pas|sans).{0,40}(alors|votre|compte|accès|service)/i, type: "coercition", score: 28 },
  { pattern: /(faute de quoi|dans le cas contraire|à défaut|sinon).{0,60}/i, type: "coercition", score: 25 },
  // Argent — gain facile
  { pattern: /(sans.{0,15}effort|facilement|automatiquement).{0,30}(gagn|recev|obtenir)/i, type: "gain_facile", score: 22 },
  { pattern: /\d+\s*[€$]\s*(par|\/)\s*(jour|semaine|mois|heure)/i, type: "gain_récurrent", score: 25 },
  // Ego — vous êtes spécial
  { pattern: /(sélectionné|choisi|élu|désigné).{0,30}(parmi|sur|exclusivement)/i, type: "ego", score: 20 },
  { pattern: /(offre|proposition).{0,20}(exclusive|réservée|personnalisée|unique).{0,20}(vous|votre)/i, type: "ego", score: 18 },
  // Fausse urgence temporelle
  { pattern: /dans les?\s*\d+\s*(heure|minute|jour|h\b)/i, type: "urgence_temporelle", score: 22 },
  { pattern: /(expire|expirera|expiration).{0,30}(aujourd|demain|ce soir|dans)/i, type: "urgence_temporelle", score: 20 },
  // Fausse autorité
  { pattern: /(direction|service\s+(?:fraude|sécurité|conformité)|département).{0,20}(vous informe|vous contacte|vous notifie)/i, type: "fausse_autorité", score: 18 },
  { pattern: /(police|gendarmerie|interpol|dgfip|fisc).{0,30}(dossier|enquête|convocation)/i, type: "fausse_autorité", score: 30 },
  // Isolation — demande de discrétion
  { pattern: /(sans\s+en\s+parler|confidentiellement|entre\s+nous|n.{0,5}en\s+parlez?\s+(à personne|pas))/i, type: "isolation", score: 28 },
  // Réciprocité — cadeau d'abord
  { pattern: /(offert|cadeau|gratuit).{0,40}(en échange|contre|pour que|si vous)/i, type: "réciprocité", score: 18 },
];

// ─── Verbes d'action en français (impératifs typiques d'arnaque) ───────────

const ACTION_VERB_ROOTS = [
  "cliqu", "appel", "contac", "envoy", "transfèr", "virement", "pay", "régl",
  "valid", "confirm", "vérifi", "connect", "télécharg", "install", "ouvr",
  "répond", "rappel", "composez", "composé", "renseign", "communiqu", "fournis"
];

// ─── Helpers linguistiques ──────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[\s\n\r,;:!?.()\[\]{}"']+/).filter(w => w.length > 2);
}

function sentences(text: string): string[] {
  return text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 5);
}

function profileLinguistics(text: string): LinguisticProfile {
  const words = tokenize(text);
  const sents = sentences(text);
  const totalWords = words.length || 1;
  const totalSents = sents.length || 1;

  // Action verb density
  const actionVerbs = words.filter(w => ACTION_VERB_ROOTS.some(r => w.startsWith(r)));
  const actionVerbDensity = actionVerbs.length / totalWords;

  // Sentence average length
  const sentenceAvgLength = totalWords / totalSents;

  // Punctuation ratios
  const exclamations = (text.match(/!/g) || []).length;
  const questions = (text.match(/\?/g) || []).length;
  const exclamationRatio = exclamations / totalSents;
  const questionRatio = questions / totalSents;

  // CAPS ratio (mots entièrement en majuscules)
  const capsWords = (text.match(/\b[A-ZÀÉÈÊËÎÏÔÙÛÜ]{3,}\b/g) || []).length;
  const capsRatio = capsWords / totalWords;

  // Escalation: comparer urgence 1ère moitié vs 2ème moitié
  const mid = Math.floor(text.length / 2);
  const firstHalf = text.slice(0, mid).toLowerCase();
  const secondHalf = text.slice(mid).toLowerCase();
  const urgencyWords = ["urgent", "immédiat", "maintenant", "vite", "rapidement", "délai", "expiré", "suspendu"];
  const urgFirst = urgencyWords.filter(w => firstHalf.includes(w)).length;
  const urgSecond = urgencyWords.filter(w => secondHalf.includes(w)).length;
  const escalationScore = Math.max(0, urgSecond - urgFirst);

  // Imperatives (verbes à l'impératif 2ème personne)
  const imperativePattern = /\b(cliquez|appelez|contactez|envoyez|payez|réglez|validez|confirmez|vérifiez|connectez|téléchargez|installez|ouvrez|répondez|rappellez|composez|renseignez|fournissez)\b/gi;
  const imperativeCount = (text.match(imperativePattern) || []).length;

  // Negations
  const negationPattern = /\b(ne\s+\w+\s+pas|n'\w+\s+pas|jamais|aucun|sans)\b/gi;
  const negationCount = (text.match(negationPattern) || []).length;

  // Conditional threats (Si...alors)
  const conditionalPattern = /\b(si|unless|in case)\b.{5,50}\b(alors|sinon|otherwise)\b/gi;
  const conditionalThreats = (text.match(conditionalPattern) || []).length;

  // Word repetition
  const wordFreq: Record<string, number> = {};
  words.forEach(w => { if (w.length > 4) wordFreq[w] = (wordFreq[w] || 0) + 1; });
  const repeated = Object.values(wordFreq).filter(c => c >= 3).length;
  const repetitionScore = repeated / (Object.keys(wordFreq).length || 1);

  // Ellipsis
  const ellipsisCount = (text.match(/\.\.\.|…/g) || []).length;

  // Number density (montants, codes, références)
  const numbers = (text.match(/\d+/g) || []).length;
  const numberDensity = numbers / totalWords;

  return {
    actionVerbDensity,
    sentenceAvgLength,
    exclamationRatio,
    questionRatio,
    capsRatio,
    escalationScore,
    imperativeCount,
    negationCount,
    conditionalThreats,
    repetitionScore,
    ellipsisCount,
    numberDensity
  };
}

function profileSemantics(text: string): SemanticProfile {
  const lower = text.toLowerCase();
  const words = tokenize(text);
  const totalWords = words.length || 1;

  // Score par champ lexical (matching par racines)
  const scores: Record<string, number> = {};
  for (const [field, config] of Object.entries(SEMANTIC_FIELDS)) {
    const matches = config.roots.filter(root => lower.includes(root)).length;
    scores[field] = (matches / config.roots.length) * config.weight * 100;
  }

  // Social engineering patterns
  let socialEngineering = 0;
  const psychMatches: string[] = [];
  const threatTypes: string[] = [];

  for (const pp of PSYCH_PATTERNS) {
    if (pp.pattern.test(text)) {
      socialEngineering += pp.score;
      psychMatches.push(pp.type);
    }
  }

  // Promesses détectées
  const promisePatterns = [
    { re: /\d+\s*€/i, label: "Montant d'argent mentionné" },
    { re: /(rembours|cashback|bonus|prime|récompense)/i, label: "Promesse de remboursement/bonus" },
    { re: /(gagné|gagnant|lot|prix|cadeau|offert)/i, label: "Promesse de gain ou cadeau" },
    { re: /(régularis|résoudre|débloquer|réactiver)/i, label: "Promesse de résolution de problème" },
  ];
  const promiseQuality = promisePatterns.filter(p => p.re.test(text)).map(p => p.label);

  // Menaces détectées
  const threatPatterns = [
    { re: /(suspendu|bloqué|désactivé|fermé|clôturé)/i, label: "Menace de suspension de compte/service" },
    { re: /(poursuit|tribunal|huissier|saisie|arrestation)/i, label: "Menace de poursuites judiciaires" },
    { re: /(amende|pénalité|majoration|frais supplémentaire)/i, label: "Menace d'amende ou frais" },
    { re: /(divulgu|publié|exposé|révélé).{0,30}(si|unless)/i, label: "Menace de divulgation (chantage)" },
    { re: /(virus|infecté|piraté|compromis)/i, label: "Fausse alerte de sécurité" },
  ];
  const threatQuality = threatPatterns.filter(p => p.re.test(text)).map(p => p.label);

  // Cohérence expéditeur/contenu
  const senderMentions = /(paypal|amazon|banque|crédit agricole|bnp|société générale|lcl|boursorama|caf|ameli|cpam|impôts|dgfip|la poste|dhl|chronopost|sfr|orange|free|bouygues)/i;
  const sensitiveRequest = /(rib|iban|mot de passe|code|pin|carte bancaire|identifiant)/i;
  const senderContentCoherence = (senderMentions.test(text) && sensitiveRequest.test(text)) ? -30 : 0;

  return {
    financialFieldScore: scores.financial || 0,
    legalFieldScore: scores.legal || 0,
    medicalFieldScore: scores.medical || 0,
    technicalFieldScore: scores.technical || 0,
    socialEngineering,
    senderContentCoherence,
    promiseQuality,
    threatQuality
  };
}

// ─── Générateur d'explication naturelle ────────────────────────────────────

function generateNaturalExplanation(
  ling: LinguisticProfile,
  sem: SemanticProfile,
  score: number
): string[] {
  const reasons: string[] = [];

  // Explication basée sur linguistique
  if (ling.imperativeCount >= 3) {
    reasons.push(`Ton très directif : ${ling.imperativeCount} verbes à l'impératif détectés — typique des messages qui cherchent à forcer une action immédiate`);
  }
  if (ling.capsRatio > 0.08) {
    reasons.push(`Usage excessif de MAJUSCULES (${Math.round(ling.capsRatio * 100)}% des mots) — technique classique pour créer un sentiment d'alarme`);
  }
  if (ling.escalationScore >= 2) {
    reasons.push(`Escalade émotionnelle détectée : le message devient de plus en plus urgent vers la fin — structure typique de manipulation`);
  }
  if (ling.sentenceAvgLength < 8 && ling.imperativeCount > 1) {
    reasons.push(`Phrases courtes et percutantes (moyenne ${Math.round(ling.sentenceAvgLength)} mots) combinées à des injonctions — rythme conçu pour empêcher la réflexion`);
  }
  if (ling.exclamationRatio > 1) {
    reasons.push(`Ponctuation émotionnelle abusive (${Math.round(ling.exclamationRatio * 10) / 10} point(s) d'exclamation par phrase en moyenne)`);
  }
  if (ling.conditionalThreats > 0) {
    reasons.push(`Structure de chantage conditionnel : "Si vous ne faites pas X, alors Y" — mécanique de coercition classique`);
  }
  if (ling.numberDensity > 0.12) {
    reasons.push(`Densité élevée de chiffres et montants — création d'une fausse impression de précision et d'officialité`);
  }

  // Explication basée sur sémantique
  if (sem.socialEngineering > 40) {
    const techniques = [];
    if (sem.threatQuality.length > 0) techniques.push("menaces");
    if (sem.promiseQuality.length > 0) techniques.push("promesses");
    if (techniques.length > 0) {
      reasons.push(`Manipulation psychologique avancée via ${techniques.join(" et ")} : ${[...sem.threatQuality, ...sem.promiseQuality].slice(0, 2).join(", ")}`);
    }
  }
  if (sem.financialFieldScore > 25) {
    reasons.push(`Champ lexical financier dominant (score ${Math.round(sem.financialFieldScore)}/100) — convergence de termes bancaires inhabituels dans un même message`);
  }
  if (sem.legalFieldScore > 20) {
    reasons.push(`Vocabulaire juridique intimidant détecté (score ${Math.round(sem.legalFieldScore)}/100) — usage de termes légaux pour créer une fausse pression officielle`);
  }
  if (sem.senderContentCoherence < 0) {
    reasons.push(`Incohérence critique : un organisme officiel ou entreprise connue demande des informations sensibles — les vraies organisations ne font jamais ça par message`);
  }
  if (sem.technicalFieldScore > 20) {
    reasons.push(`Vocabulaire technique alarmiste détecté — possible arnaque au faux support technique (vishing/scam)`);
  }

  // Explication globale selon score
  if (score >= 70 && reasons.length === 0) {
    reasons.push("Combinaison suspecte de plusieurs signaux de manipulation détectés simultanément");
  }
  if (reasons.length === 0) {
    reasons.push("Aucun signal de manipulation linguistique ou sémantique détecté — le message semble authentique");
  }

  return reasons;
}

// ─── Fonction principale ───────────────────────────────────────────────────

export interface TextAnalysisInput { text: string }

export function analyzeText(input: TextAnalysisInput): RiskResult {
  const { text } = input;
  if (!text || text.trim().length < 3) return computeRisk(0, ["Texte trop court pour être analysé"]);

  const ling = profileLinguistics(text);
  const sem = profileSemantics(text);

  let rawScore = 0;

  // ── Score linguistique ──
  rawScore += Math.min(25, ling.actionVerbDensity * 200);
  rawScore += Math.min(15, ling.capsRatio * 150);
  rawScore += Math.min(20, ling.imperativeCount * 5);
  rawScore += Math.min(15, ling.escalationScore * 8);
  rawScore += Math.min(10, ling.exclamationRatio * 8);
  rawScore += Math.min(20, ling.conditionalThreats * 15);
  rawScore += Math.min(10, ling.repetitionScore * 50);
  rawScore += Math.min(10, ling.ellipsisCount * 4);
  rawScore += Math.min(15, ling.numberDensity * 80);
  if (ling.sentenceAvgLength < 6 && ling.imperativeCount > 0) rawScore += 10;

  // ── Score sémantique ──
  rawScore += Math.min(35, sem.socialEngineering * 0.6);
  rawScore += Math.min(20, sem.financialFieldScore * 0.4);
  rawScore += Math.min(20, sem.legalFieldScore * 0.5);
  rawScore += Math.min(15, sem.technicalFieldScore * 0.4);
  rawScore += Math.min(15, sem.medicalFieldScore * 0.3);
  rawScore -= sem.senderContentCoherence; // négatif = ajoute des points

  // Bonus menaces/promesses multiples
  rawScore += sem.threatQuality.length * 8;
  rawScore += sem.promiseQuality.length * 6;

  // URL suspecte dans le texte
  const suspiciousUrlInText = /https?:\/\/[^\s]{5,}/i.test(text);
  const shortText = text.trim().split(/\s+/).length < 25;
  if (suspiciousUrlInText && shortText) rawScore += 15;

  const reasons = generateNaturalExplanation(ling, sem, Math.min(100, rawScore));
  return computeRisk(rawScore, reasons);
}
