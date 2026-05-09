import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface CitationResult {
  provider: "groq-llama";
  query: string;
  queryType: "direct" | "recommendation" | "comparison";
  mentioned: boolean;
  snippet?: string;
  rank?: number;
}

function extractRank(text: string, businessName: string): number | undefined {
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    const nameLower = businessName.toLowerCase();
    if (line.includes(nameLower)) {
      const numberMatch = line.match(/^[\s]*([0-9]+)[.\)]/);
      if (numberMatch) {
        const rank = parseInt(numberMatch[1]);
        if (rank >= 1 && rank <= 5) return rank;
      }
    }
  }
  return undefined;
}

function extractSnippet(text: string, businessName: string): string | undefined {
  const nameLower = businessName.toLowerCase();
  const lines = text.split("\n");

  for (const line of lines) {
    if (line.toLowerCase().includes(nameLower)) {
      return line.trim().substring(0, 120);
    }
  }
  return undefined;
}

function businessMentioned(text: string, businessName: string): boolean {
  const cleaned = businessName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
  const textCleaned = text.toLowerCase().replace(/[^a-z0-9\s]/g, "");

  if (textCleaned.includes(cleaned)) return true;

  const words = cleaned.split(/\s+/);
  if (words.length > 1) {
    const firstWord = words[0];
    const lastWord = words[words.length - 1];
    const bothWordsPresent =
      textCleaned.includes(firstWord) && textCleaned.includes(lastWord);
    if (bothWordsPresent) {
      const distance = textCleaned.indexOf(lastWord) - textCleaned.indexOf(firstWord);
      if (distance < 200) return true;
    }
  }

  return false;
}

export async function checkAICitations(
  businessName: string,
  city: string,
  state: string,
  trade: string
): Promise<CitationResult[]> {
  if (!businessName?.trim() || !city?.trim() || !trade?.trim()) {
    return [];
  }

  const location = `${city}, ${state}`.trim();
  const queries = [
    {
      text: `Who are the best ${trade} in ${location}? Give me your top 5 recommendations.`,
      type: "direct" as const,
    },
    {
      text: `I need a trusted ${trade} near ${city}. Who would you recommend?`,
      type: "recommendation" as const,
    },
    {
      text: `What is the top-rated ${trade} in ${location}?`,
      type: "comparison" as const,
    },
  ];

  const results: CitationResult[] = [];

  try {
    const responses = await Promise.all(
      queries.map((q) =>
        groq.chat.completions.create({
          model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: q.text }],
          temperature: 0.7,
          max_tokens: 300,
        })
      )
    );

    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      const responseText = response.choices[0]?.message?.content || "";
      const query = queries[i];
      const mentioned = businessMentioned(responseText, businessName);

      results.push({
        provider: "groq-llama",
        query: query.text,
        queryType: query.type,
        mentioned,
        snippet: mentioned ? extractSnippet(responseText, businessName) : undefined,
        rank: mentioned ? extractRank(responseText, businessName) : undefined,
      });
    }

    return results;
  } catch (error) {
    console.error("Citation checker error:", error);
    return [];
  }
}
