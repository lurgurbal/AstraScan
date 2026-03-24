/**
 * app/api/analyze-url/route.ts
 * Route Handler Next.js pour l'analyse d'URL.
 * Méthode : POST
 * Body    : { url: string }
 * Retour  : RiskResult (JSON)
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeUrl } from "@/lib/urlAnalyzer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    // Validation basique
    if (typeof url !== "string") {
      return NextResponse.json(
        { error: "Le champ 'url' est requis et doit être une chaîne de caractères." },
        { status: 400 }
      );
    }

    if (url.length > 2000) {
      return NextResponse.json(
        { error: "L'URL ne doit pas dépasser 2 000 caractères." },
        { status: 400 }
      );
    }

    // Analyse (async car elle peut appeler des APIs externes)
    const result = await analyzeUrl({ url });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[analyze-url] Erreur :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
