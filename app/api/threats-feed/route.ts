import { NextResponse } from "next/server";
import { getThreatFeed } from "@/lib/threatFeed";
export async function GET() {
  try {
    const feed = await getThreatFeed();
    return NextResponse.json(feed, {
      status: 200,
      headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate" }
    });
  } catch { return NextResponse.json({ error: "Erreur lors de la récupération du flux." }, { status: 500 }); }
}
