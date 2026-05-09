import { search } from "./brave-search";

export interface ReviewResult {
  source: string;
  snippet: string;
  rating?: number;
  url: string;
}

export async function searchReviews(
  businessName: string,
  city: string
): Promise<ReviewResult[]> {
  if (!businessName?.trim() || !city?.trim()) {
    return [];
  }

  try {
    // Search for reviews on major platforms
    const query = `"${businessName}" reviews ${city} site:yelp.com OR site:google.com OR site:trustpilot.com`;
    const results = await search(query, 10);

    const reviews: ReviewResult[] = [];
    const seen = new Set<string>();

    for (const result of results) {
      // Extract meaningful review text from snippet
      const snippet = result.description.slice(0, 150).trim();

      if (!snippet || snippet.length < 20 || seen.has(snippet)) {
        continue;
      }

      seen.add(snippet);

      // Try to extract rating if present (e.g., "4 out of 5 stars")
      let rating: number | undefined;
      const ratingMatch = result.description.match(/(\d)\s*(?:out of|\/)\s*5\s*(?:stars?)?/i);
      if (ratingMatch) {
        rating = parseInt(ratingMatch[1]);
      }

      reviews.push({
        source: new URL(result.url).hostname.replace("www.", ""),
        snippet,
        rating,
        url: result.url,
      });

      if (reviews.length >= 5) break;
    }

    return reviews;
  } catch (error) {
    console.error("Review search error:", error);
    return [];
  }
}
