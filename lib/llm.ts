import Groq from "groq-sdk";
import type { NAPAudit } from "./nap-parser";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export interface GMBContent {
  description: string;
  shortDescription: string;
  keywords: Array<{ keyword: string; intent: string; geoModifier: string }>;
  reviewTemplates: string[];
  schemaJson: string;
}

export async function generateGMBContent(
  businessName: string,
  city: string,
  state: string,
  audit: NAPAudit
): Promise<GMBContent> {
  const location = `${city}, ${state}`;
  const napSummary = audit.entries
    .slice(0, 5)
    .map((e) => `${e.label}: ${e.address ?? "no address"} | ${e.phoneRaw ?? "no phone"}`)
    .join("\n");

  const prompt = `You are an expert local SEO consultant and GEO (Generative Engine Optimization) specialist.

Business: "${businessName}"
Location: ${location}
NAP Data Found:
${napSummary}

Generate optimized Google My Business content. Respond in EXACTLY this format with no extra text:

GMB_DESCRIPTION:
[Write a 750-character max business description. Naturally embed "${city}", "${state}", and local landmarks/neighborhoods. Include primary service, unique value proposition, years in business (if known), and a call to action. Make it conversational and trustworthy.]

SHORT_DESCRIPTION:
[Write a 250-character max version of the description above.]

KEYWORDS:
[List exactly 10 local SEO keywords, one per line, in format: keyword | search intent | geo modifier]

REVIEW_TEMPLATES:
[Write exactly 5 review response templates. Each template should thank the reviewer, mention the business name, reference ${city} naturally, and invite them back. Separate each template with ---]

SCHEMA_JSON:
[Write a complete LocalBusiness JSON-LD schema object for this business with all known fields filled in. Use the NAP data provided.]`;

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 2048,
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  return parseGMBResponse(raw, businessName, city, state, audit);
}

function parseGMBResponse(
  raw: string,
  businessName: string,
  city: string,
  state: string,
  audit: NAPAudit
): GMBContent {
  const extract = (label: string, nextLabel?: string): string => {
    const start = raw.indexOf(`${label}:`);
    if (start === -1) return "";
    const from = start + label.length + 1;
    const end = nextLabel ? raw.indexOf(`${nextLabel}:`, from) : raw.length;
    return raw.slice(from, end === -1 ? undefined : end).trim();
  };

  const descriptionRaw = extract("GMB_DESCRIPTION", "SHORT_DESCRIPTION");
  const shortRaw = extract("SHORT_DESCRIPTION", "KEYWORDS");
  const keywordsRaw = extract("KEYWORDS", "REVIEW_TEMPLATES");
  const reviewsRaw = extract("REVIEW_TEMPLATES", "SCHEMA_JSON");
  const schemaRaw = extract("SCHEMA_JSON");

  const keywords = keywordsRaw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 10)
    .map((line) => {
      const [keyword = "", intent = "", geoModifier = ""] = line.split("|").map((s) => s.trim());
      return { keyword, intent, geoModifier };
    });

  const reviewTemplates = reviewsRaw
    .split("---")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 5);

  // Build schema fallback if AI didn't produce one
  const schemaJson = schemaRaw.includes("{")
    ? schemaRaw.slice(schemaRaw.indexOf("{"), schemaRaw.lastIndexOf("}") + 1)
    : JSON.stringify(
        {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: businessName,
          address: {
            "@type": "PostalAddress",
            addressLocality: city,
            addressRegion: state,
            addressCountry: "US",
            streetAddress: audit.canonical.address ?? "",
          },
          telephone: audit.canonical.phone ?? "",
          url: audit.entries.find((e) => e.source === "web")?.url ?? "",
        },
        null,
        2
      );

  return {
    description: descriptionRaw.slice(0, 750),
    shortDescription: shortRaw.slice(0, 250),
    keywords,
    reviewTemplates,
    schemaJson,
  };
}
