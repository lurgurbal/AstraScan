/**
 * riskScorer.ts (enhanced)
 */

export type Verdict = "SCAM" | "SUSPICIOUS" | "SAFE";

export interface RiskResult {
  score: number;       // 0–100
  verdict: Verdict;
  label: string;
  emoji: string;
  reasons: string[];
  color: string;
  confidence: number;  // 🔥 nouveau (fiabilité du verdict)
}

// ---------------------------------------------------------------------------
// CONFIG (facilement modifiable)
// ---------------------------------------------------------------------------

const THRESHOLDS = {
  SCAM: 70,
  SUSPICIOUS: 40,
};

const VERDICT_META = {
  SCAM: {
    label: "Probable arnaque",
    emoji: "🚨",
    color: "red",
  },
  SUSPICIOUS: {
    label: "À vérifier",
    emoji: "⚠️",
    color: "amber",
  },
  SAFE: {
    label: "Rien de flagrant (prudence)",
    emoji: "✅",
    color: "emerald",
  },
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

// Clamp sécurisé
function clamp(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, score));
}

// Supprime doublons + nettoie
function normalizeReasons(reasons: string[]): string[] {
  return [...new Set(reasons.filter(Boolean))];
}

// Calcul de confiance (simple mais efficace)
function computeConfidence(score: number, reasons: string[]): number {
  /**
   * Idée :
   * - plus il y a de signaux → plus confiance ↑
   * - plus score est extrême → plus confiance ↑
   */
  const reasonFactor = Math.min(1, reasons.length / 5);
  const scoreFactor = Math.abs(score - 50) / 50;

  const confidence = (reasonFactor * 0.6 + scoreFactor * 0.4) * 100;

  return Math.round(confidence);
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

export function computeRisk(rawScore: number, reasons: string[]): RiskResult {
  const score = clamp(rawScore);
  const cleanReasons = normalizeReasons(reasons);

  let verdict: Verdict;

  if (score >= THRESHOLDS.SCAM) {
    verdict = "SCAM";
  } else if (score >= THRESHOLDS.SUSPICIOUS) {
    verdict = "SUSPICIOUS";
  } else {
    verdict = "SAFE";
  }

  const meta = VERDICT_META[verdict];

  const confidence = computeConfidence(score, cleanReasons);

  return {
    score,
    verdict,
    label: meta.label,
    emoji: meta.emoji,
    color: meta.color,
    reasons: cleanReasons,
    confidence, // 🔥 super utile pour UI / tri / ML
  };
}