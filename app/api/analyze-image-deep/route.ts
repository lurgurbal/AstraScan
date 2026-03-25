import { NextRequest, NextResponse } from "next/server";
import { analyzeImageDeep } from "@/lib/imageDeepAnalyzer";
export async function POST(req: NextRequest) {
  try {
    const { imageBase64, fileName, mimeType } = await req.json();
    if (!imageBase64 || !fileName || !mimeType) return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
    const buffer = Buffer.from(imageBase64, "base64");
    if (buffer.length > 15 * 1024 * 1024) return NextResponse.json({ error: "Image trop grande (max 15 Mo)." }, { status: 400 });
    const result = await analyzeImageDeep({ imageBuffer: buffer, fileName, mimeType });
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur analyse image." }, { status: 500 });
  }
}
