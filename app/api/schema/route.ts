import { NextRequest, NextResponse } from "next/server";
import { buildLocalBusinessSchema } from "@/lib/schema-builder";
import type { NAPAudit } from "@/lib/nap-parser";

export async function POST(req: NextRequest) {
  const { businessName, city, state, audit } = await req.json();

  if (!businessName?.trim() || !city?.trim() || !audit) {
    return NextResponse.json(
      { error: "Business name, city, and audit data are required" },
      { status: 400 }
    );
  }

  try {
    const schemaJson = buildLocalBusinessSchema(
      businessName,
      city,
      state ?? "",
      audit as NAPAudit
    );

    return NextResponse.json({ schemaJson });
  } catch (error: any) {
    console.error("Schema generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate schema" },
      { status: 500 }
    );
  }
}
