/**
 * app/api/analyze-image/route.ts
 * Analyse une capture d'écran via Claude Vision (claude-haiku-4-5).
 * Reçoit une image en base64 et retourne un RiskResult compatible.
 * Méthode : POST
 * Body    : { imageBase64: string, mediaType: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { computeRisk } from "@/lib/riskScorer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mediaType } = body;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { error: "Le champ 'imageBase64' est requis." },
        { status: 400 }
      );
    }

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(mediaType)) {
      return NextResponse.json(
        { error: "Type d'image non supporté. Utilisez JPG, PNG, GIF ou WEBP." },
        { status: 400 }
      );
    }

    // ── Appel à l'API Claude Vision ──
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: imageBase64,
                },
              },
              {
                type: "text",
                text: `Tu es un expert en cybersécurité et détection d'arnaques. Analyse cette capture d'écran et détermine si elle contient des signes d'arnaque, phishing, fraude ou contenu malveillant.

Réponds UNIQUEMENT en JSON valide avec ce format exact (sans markdown, sans backticks) :
{
  "score": <nombre entre 0 et 100>,
  "reasons": [<liste de raisons détectées en français, max 6>],
  "summary": "<résumé de ce que tu vois dans l'image en 1-2 phrases>"
}

Critères d'évaluation :
- Logos de marques imitées (PayPal, banques, Amazon, etc.)
- Demandes d'informations sensibles visibles (mot de passe, carte bancaire, code SMS)
- Messages d'urgence ou de menace
- URLs suspectes ou mal orthographiées visibles
- Mise en page imitant un site officiel
- Alertes de virus ou faux support technique
- Gains ou loteries fictifs
- Score 0 = aucun signe suspect, Score 100 = arnaque évidente`,
              },
            ],
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.json();
      console.error("[analyze-image] Erreur API Claude:", err);

      // Si pas de clé API configurée, retourner un message d'erreur clair
      if (anthropicRes.status === 401) {
        return NextResponse.json(
          { error: "Clé API Anthropic manquante. Ajoutez ANTHROPIC_API_KEY dans vos variables d'environnement Vercel." },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: "Erreur lors de l'analyse par l'IA." },
        { status: 500 }
      );
    }

    const claudeData = await anthropicRes.json();
    const rawText = claudeData.content?.[0]?.text ?? "";

    // Parser la réponse JSON de Claude
    let parsed: { score: number; reasons: string[]; summary: string };
    try {
      // Nettoyer si Claude ajoute des backticks malgré la consigne
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[analyze-image] Réponse Claude non-JSON:", rawText);
      return NextResponse.json(
        { error: "L'IA n'a pas pu analyser cette image. Essayez avec une image plus nette." },
        { status: 422 }
      );
    }

    // Construire le RiskResult via riskScorer
    const reasons = parsed.reasons ?? [];
    if (parsed.summary) {
      reasons.unshift(`📷 ${parsed.summary}`);
    }

    const result = computeRisk(
      Math.min(100, Math.max(0, Math.round(parsed.score))),
      reasons
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[analyze-image] Erreur interne:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
