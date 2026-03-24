/**
 * app/api/analyze-text/route.ts
 * Route Handler Next.js pour l'analyse de texte.
 * Méthode : POST
 * Body    : { text: string }
 * Retour  : RiskResult (JSON)
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeText } from "@/lib/textAnalyzer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    // Validation basique
    if (typeof text !== "string") {
      return NextResponse.json(
        { error: "Le champ 'text' est requis et doit être une chaîne de caractères." },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: "Le texte ne doit pas dépasser 5 000 caractères." },
        { status: 400 }
      );
    }

    // Analyse
    const result = analyzeText({ text });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[analyze-text] Erreur :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
