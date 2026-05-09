import { NextRequest, NextResponse } from "next/server";
import { checkAICitations } from "@/lib/citation-checker";

export async function POST(req: NextRequest) {
  const { businessName, city, state, trade } = await req.json();

  if (!businessName?.trim() || !city?.trim() || !trade?.trim()) {
    return NextResponse.json(
      { error: "Business name, city, and trade are required" },
      { status: 400 }
    );
  }

  try {
    const citations = await checkAICitations(businessName, city, state, trade);
    return NextResponse.json(citations);
  } catch (error: any) {
    console.error("Citations API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check citations" },
      { status: 500 }
    );
  }
}
