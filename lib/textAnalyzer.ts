/**
 * textAnalyzer.ts
 * Analyse un texte libre pour détecter des patterns d'arnaque :
 *  - Vocabulaire de pression / urgence
 *  - Demandes d'informations sensibles
 *  - Menaces / intimidation
 *  - Promesses irréalistes
 *
 * Chaque règle contribue à un score pondéré et produit une raison lisible.
 */

import { computeRisk, RiskResult } from "./riskScorer";

// ---------------------------------------------------------------------------
// Définition des règles d'analyse
// ---------------------------------------------------------------------------

interface Rule {
  id: string;
  label: string;        // Raison affichée à l'utilisateur
  score: number;        // Points ajoutés si la règle matche
  pattern: RegExp;      // Expression régulière (flag 'i' recommandé)
}

const TEXT_RULES: Rule[] = [
  // --- Urgence & pression temporelle ---
  {
    id: "urgency_urgent",
    label: "Mot d'urgence détecté (urgent, immédiatement, maintenant…)",
    score: 20,
    pattern: /\b(urgent|urgente|immédiatement|tout de suite|maintenant|dès que possible|dans les \d+\s*h|dans les 24h?|expire|expiré|expirera)\b/i,
  },
  {
    id: "urgency_deadline",
    label: "Pression par délai (dernière chance, plus que X heures…)",
    score: 15,
    pattern: /\b(dernière chance|dernier délai|plus que|seulement \d+|limité dans le temps|offre expire)\b/i,
  },

  // --- Compte / accès menacé ---
  {
    id: "account_suspended",
    label: "Menace de suspension ou blocage de compte",
    score: 25,
    pattern: /\b(compte (suspendu|bloqué|désactivé|fermé|clôturé)|accès (suspendu|bloqué|révoqué)|votre (compte|accès) (a été|sera|est))\b/i,
  },
  {
    id: "account_verify",
    label: "Demande de vérification / confirmation de compte",
    score: 15,
    pattern: /\b(vérifi(er|ez|cation)|confirm(er|ez|ation)|valider|validez|authentifi(er|ez))\b.*\b(compte|identité|informations?|coordonnées)\b/i,
  },

  // --- Données sensibles ---
  {
    id: "sensitive_banking",
    label: "Demande d'informations bancaires (RIB, IBAN, carte…)",
    score: 30,
    pattern: /\b(rib|iban|bic|carte bancaire|numéro de carte|cvv|cvc|code secret|pin|code bancaire|coordonnées bancaires)\b/i,
  },
  {
    id: "sensitive_password",
    label: "Demande de mot de passe ou identifiants",
    score: 30,
    pattern: /\b(mot de passe|password|identifiant|login|nom d'utilisateur|username|code d'accès)\b/i,
  },
  {
    id: "sensitive_personal",
    label: "Demande de données personnelles (CNI, passeport, NIR…)",
    score: 20,
    pattern: /\b(numéro (de )?(sécurité sociale|sécu|nir)|carte (nationale|d'identité|vitale)|passeport|date de naissance|adresse complète)\b/i,
  },
  {
    id: "sensitive_code",
    label: "Demande d'un code de validation / SMS",
    score: 25,
    pattern: /\b(code (reçu|sms|par sms|de validation|temporaire|otp|unique|à usage unique)|entrez? (le )?code)\b/i,
  },

  // --- Crypto & investissement douteux ---
  {
    id: "crypto",
    label: "Demande de paiement en cryptomonnaie",
    score: 25,
    pattern: /\b(bitcoin|btc|ethereum|eth|crypto(monnaie)?|wallet|portefeuille (crypto|numérique)|payer en (btc|eth|crypto)|virement (crypto|en crypto))\b/i,
  },
  {
    id: "investment",
    label: "Promesse de gains/investissement suspect",
    score: 20,
    pattern: /\b(investissement (garanti|sûr|sans risque)|rendement (garanti|exceptionnel)|gain(s)? (assurés?|garantis?)|doublez? (votre|vos)|profit(s)? (assuré|garanti))\b/i,
  },

  // --- Paiement immédiat ---
  {
    id: "payment_now",
    label: "Demande de paiement immédiat",
    score: 20,
    pattern: /\b(payer (maintenant|immédiatement|tout de suite|dans les \d+h?)|règlement (immédiat|urgent|sous \d+)|viremen?t (urgent|immédiat))\b/i,
  },
  {
    id: "payment_prize",
    label: "Annonce d'un gain ou d'un prix (loterie, concours…)",
    score: 25,
    pattern: /\b(vous avez gagné|félicitations|tirage au sort|loterie|heureux gagnant|sélectionné|prize|jackpot|lot d'une valeur)\b/i,
  },

  // --- Menaces légales ou techniques ---
  {
    id: "threat_legal",
    label: "Menace légale ou judiciaire",
    score: 25,
    pattern: /\b(poursuites? (judiciaires?|pénales?|légales?)|tribunal|huissier|saisie|recouvrement|amende (immédiate|obligatoire)|arrestation)\b/i,
  },
  {
    id: "threat_virus",
    label: "Alerte virus / piratage (faux support technique)",
    score: 20,
    pattern: /\b(virus détecté|piraté|hacké|logiciel espion|malware|spyware|votre (pc|ordinateur|appareil) (est|a été) (infecté|compromis|piraté))\b/i,
  },

  // --- Liens suspects dans le texte ---
  {
    id: "link_click",
    label: "Incitation à cliquer sur un lien (phishing potentiel)",
    score: 15,
    pattern: /\b(cliquez? (ici|sur ce lien|le lien|maintenant)|accéd(ez?|er) (ici|maintenant|au lien)|ouvrez? (ce lien|le lien))\b/i,
  },

  // --- Demande de discrétion ---
  {
    id: "secrecy",
    label: "Demande de discrétion ou de confidentialité suspecte",
    score: 20,
    pattern: /\b(n'en parlez? (à personne|pas à|pas)|gardez? (le )?secret|confidentiellement|sans en parler|entre nous)\b/i,
  },
];

// ---------------------------------------------------------------------------
// Fonction principale d'analyse
// ---------------------------------------------------------------------------

export interface TextAnalysisInput {
  text: string;
}

/**
 * Analyse un message texte et retourne un RiskResult.
 * @param input  Objet contenant le texte à analyser
 */
export function analyzeText(input: TextAnalysisInput): RiskResult {
  const { text } = input;

  if (!text || text.trim().length === 0) {
    return computeRisk(0, ["Aucun texte fourni"]);
  }

  let rawScore = 0;
  const reasons: string[] = [];

  // Appliquer chaque règle
  for (const rule of TEXT_RULES) {
    if (rule.pattern.test(text)) {
      rawScore += rule.score;
      reasons.push(rule.label);
    }
  }

  // Bonus si le texte est très court et contient un lien (smishing typique)
  const urlPattern = /https?:\/\/[^\s]+/i;
  const isShortWithLink = text.trim().split(/\s+/).length < 20 && urlPattern.test(text);
  if (isShortWithLink) {
    rawScore += 10;
    reasons.push("Texte très court contenant un lien (format SMS suspect)");
  }

  // Si aucune raison détectée, message rassurant
  if (reasons.length === 0) {
    reasons.push("Aucun marqueur suspect détecté dans le texte");
  }

  return computeRisk(rawScore, reasons);
}
