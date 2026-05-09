import { NextRequest, NextResponse } from "next/server";
import { searchReviews } from "@/lib/review-search";

export async function POST(req: NextRequest) {
  const { businessName, city, state } = await req.json();

  if (!businessName?.trim() || !city?.trim()) {
    return NextResponse.json(
      { error: "Business name and city are required" },
      { status: 400 }
    );
  }

  try {
    const reviews = await searchReviews(businessName, city);
    return NextResponse.json(reviews);
  } catch (error: any) {
    console.error("Reviews search error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search reviews" },
      { status: 500 }
    );
  }
}
