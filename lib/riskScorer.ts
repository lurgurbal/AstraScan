/**
 * riskScorer.ts
 * Centralise le calcul du score de risque et produit un verdict lisible.
 * Peut être branché sur une API de réputation externe ultérieurement.
 */

export type Verdict = "SCAM" | "SUSPICIOUS" | "SAFE";

export interface RiskResult {
  score: number;       // 0–100
  verdict: Verdict;
  label: string;       // libellé affiché à l'utilisateur
  emoji: string;
  reasons: string[];   // liste des raisons détectées
  color: string;       // classe Tailwind pour la couleur du badge
}

/**
 * Calcule le score final plafonné à 100 et retourne un RiskResult complet.
 * @param rawScore   Score brut accumulé par les analyseurs
 * @param reasons    Raisons collectées pendant l'analyse
 */
export function computeRisk(rawScore: number, reasons: string[]): RiskResult {
  // Plafonner le score entre 0 et 100
  const score = Math.min(100, Math.max(0, rawScore));

  let verdict: Verdict;
  let label: string;
  let emoji: string;
  let color: string;

  if (score >= 70) {
    verdict = "SCAM";
    label = "Probable arnaque";
    emoji = "🚨";
    color = "red";
  } else if (score >= 40) {
    verdict = "SUSPICIOUS";
    label = "À vérifier";
    emoji = "⚠️";
    color = "amber";
  } else {
    verdict = "SAFE";
    label = "Rien de flagrant (prudence)";
    emoji = "✅";
    color = "emerald";
  }

  return { score, verdict, label, emoji, reasons, color };
}
