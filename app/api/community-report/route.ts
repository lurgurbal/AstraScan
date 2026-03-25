/**
 * community-report — Signalements communautaires stockés en mémoire serveur.
 * En production, remplacer par Vercel KV ou une base de données.
 */
import { NextRequest, NextResponse } from "next/server";

interface Report { type: string; content: string; score: number; date: string; count: number }
const reports: Map<string, Report> = new Map();

export async function POST(req: NextRequest) {
  try {
    const { type, content, score } = await req.json();
    if (!type || !content) return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
    const key = `${type}:${content.slice(0, 100).toLowerCase().trim()}`;
    const existing = reports.get(key);
    if (existing) {
      existing.count += 1;
      existing.score = Math.max(existing.score, score ?? 0);
      reports.set(key, existing);
    } else {
      reports.set(key, { type, content: content.slice(0, 200), score: score ?? 0, date: new Date().toISOString(), count: 1 });
    }
    return NextResponse.json({ success: true, totalReports: reports.size }, { status: 200 });
  } catch { return NextResponse.json({ error: "Erreur interne." }, { status: 500 }); }
}

export async function GET() {
  const top = Array.from(reports.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  return NextResponse.json({ reports: top, total: reports.size }, { status: 200 });
}
