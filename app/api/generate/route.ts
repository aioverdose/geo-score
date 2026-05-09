import { NextRequest, NextResponse } from "next/server";
import { generateGMBContent } from "@/lib/llm";

export async function POST(req: NextRequest) {
  const { businessName, city, state, audit } = await req.json();

  if (!businessName?.trim()) {
    return NextResponse.json({ error: "Business name is required" }, { status: 400 });
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
  }

  try {
    const content = await generateGMBContent(businessName, city ?? "", state ?? "", audit);
    return NextResponse.json(content);
  } catch (error: any) {
    console.error("Generate error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
