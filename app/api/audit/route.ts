import { NextRequest, NextResponse } from "next/server";
import { searchBusiness } from "@/lib/brave-search";
import { buildAudit } from "@/lib/nap-parser";

export async function POST(req: NextRequest) {
  const { businessName, city, state } = await req.json();

  if (!businessName?.trim()) {
    return NextResponse.json({ error: "Business name is required" }, { status: 400 });
  }

  try {
    const { results, queries } = await searchBusiness(businessName, city ?? "", state ?? "");
    const audit = buildAudit(businessName, results, queries);
    return NextResponse.json(audit);
  } catch (error: any) {
    console.error("Audit error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
