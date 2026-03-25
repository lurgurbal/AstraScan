import { NextRequest, NextResponse } from "next/server";
import { analyzePhone } from "@/lib/phoneAnalyzer";
export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone || typeof phone !== "string") return NextResponse.json({ error: "Champ 'phone' requis." }, { status: 400 });
    if (phone.length > 30) return NextResponse.json({ error: "Numéro trop long." }, { status: 400 });
    return NextResponse.json(analyzePhone({ phone }), { status: 200 });
  } catch { return NextResponse.json({ error: "Erreur interne." }, { status: 500 }); }
}
