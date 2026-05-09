import { NextRequest, NextResponse } from "next/server";
import { searchCompetitors } from "@/lib/competitor-search";

export async function POST(req: NextRequest) {
  const { trade, city, state } = await req.json();

  if (!trade?.trim() || !city?.trim()) {
    return NextResponse.json(
      { error: "Trade and city are required" },
      { status: 400 }
    );
  }

  try {
    const competitors = await searchCompetitors(trade, city, state ?? "");
    return NextResponse.json(competitors);
  } catch (error: any) {
    console.error("Competitors error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search competitors" },
      { status: 500 }
    );
  }
}
