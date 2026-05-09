import { search } from "./brave-search";

export interface Competitor {
  rank: number;
  name: string;
  url: string;
  snippet: string;
  source: string;
}

export async function searchCompetitors(
  trade: string,
  city: string,
  state: string
): Promise<Competitor[]> {
  if (!trade?.trim() || !city?.trim()) {
    return [];
  }

  try {
    // Search for "best {trade} in {city}, {state}"
    const query = `best ${trade} in ${city} ${state}`;
    const results = await search(query, 10);

    // Extract competitor names from titles and descriptions
    const competitors: Competitor[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < results.length; i++) {
      const result = results[i];

      // Extract business name from title (usually first part before " - " or " |")
      let businessName = result.title.split(" - ")[0]?.trim() || result.title;
      businessName = businessName.split(" | ")[0]?.trim() || businessName;
      businessName = businessName.split(" •")[0]?.trim() || businessName;

      // Skip generic or irrelevant titles
      if (
        businessName.toLowerCase().includes("best") ||
        businessName.toLowerCase().includes("top rated") ||
        businessName.length < 3
      ) {
        businessName = extractNameFromSnippet(result.description);
      }

      if (!businessName || seen.has(businessName.toLowerCase())) {
        continue;
      }

      seen.add(businessName.toLowerCase());

      competitors.push({
        rank: competitors.length + 1,
        name: businessName,
        url: result.url,
        snippet: result.description.slice(0, 120),
        source: new URL(result.url).hostname,
      });

      if (competitors.length >= 5) break;
    }

    return competitors;
  } catch (error) {
    console.error("Competitor search error:", error);
    return [];
  }
}

function extractNameFromSnippet(snippet: string): string {
  // Try to extract a business name from the snippet
  // Look for capitalized phrases that might be business names
  const words = snippet.split(/[.,\-•]/);
  for (const word of words) {
    const trimmed = word.trim();
    if (trimmed.length > 3 && /^[A-Z]/.test(trimmed) && !trimmed.toLowerCase().includes("the best")) {
      return trimmed.split(" ").slice(0, 4).join(" ");
    }
  }
  return "";
}
