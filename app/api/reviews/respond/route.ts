import { NextRequest, NextResponse } from "next/server";
import type { ReviewResult } from "@/lib/review-search";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export async function POST(req: NextRequest) {
  const { businessName, city, reviews } = await req.json();

  if (!businessName?.trim() || !Array.isArray(reviews) || reviews.length === 0) {
    return NextResponse.json(
      { error: "Business name and reviews are required" },
      { status: 400 }
    );
  }

  if (!GROQ_API_KEY) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const reviewTexts = (reviews as ReviewResult[])
      .map((r) => `- ${r.snippet} (${r.source}, ${r.rating ? r.rating + " stars" : "no rating"})`)
      .join("\n");

    const prompt = `You are a professional business manager responding to customer reviews for ${businessName} in ${city}.

Generate 5 empathetic, professional, and concise response templates to these reviews. Each response should be 1-2 sentences, acknowledge the specific feedback, and invite further dialogue.

Customer Reviews:
${reviewTexts}

Provide exactly 5 responses, one per line, numbered 1-5. Be genuine and local in tone.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", response.status, errorText);
      return NextResponse.json(
        { error: `Groq API error: ${response.status}` },
        { status: 500 }
      );
    }

    const data = (await response.json()) as any;
    const content = data.choices[0]?.message?.content || "";

    // Parse responses (expecting numbered list)
    const responseTexts = content
      .split("\n")
      .filter((line: string) => line.trim().match(/^\d+\./))
      .map((line: string) => line.replace(/^\d+\.\s*/, "").trim())
      .slice(0, 5);

    return NextResponse.json({ responses: responseTexts });
  } catch (error: any) {
    console.error("Review response generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate responses" },
      { status: 500 }
    );
  }
}
