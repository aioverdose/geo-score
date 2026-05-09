import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const directory = {
    tool: "GEO Score",
    description: "AI Local Visibility Auditor — audits how visible local businesses are to AI search engines (ChatGPT, Perplexity, Gemini, Google AI) by checking NAP consistency across directories and generating optimized content.",
    version: "1.0",
    api_endpoints: [
      {
        path: "/api/audit",
        method: "POST",
        description: "Audit a business's NAP consistency across 5 sources",
        request: {
          businessName: "string",
          city: "string",
          state: "string (optional)",
        },
        response: {
          score: "number 0-100",
          issues: "array of string descriptions",
          entries: "array of NAP entries per source",
          canonical: "detected canonical NAP",
        },
      },
      {
        path: "/api/generate",
        method: "POST",
        description: "Generate optimized Google My Business content using AI",
        request: {
          businessName: "string",
          city: "string",
          state: "string (optional)",
          audit: "NAPAudit object from /api/audit",
        },
        response: {
          description: "750-character optimized GMB description",
          shortDescription: "250-character version",
          keywords: "array of 10 relevant keywords",
          reviewTemplates: "array of 5 customer response templates",
          schema: "JSON-LD LocalBusiness schema",
        },
      },
      {
        path: "/api/schema",
        method: "POST",
        description: "Generate LocalBusiness JSON-LD schema for structured data",
        request: {
          businessName: "string",
          city: "string",
          state: "string (optional)",
          audit: "NAPAudit object from /api/audit",
        },
        response: {
          schemaJson: "JSON-LD formatted LocalBusiness schema",
        },
      },
      {
        path: "/api/competitors",
        method: "POST",
        description: "Find and rank competitor businesses in the same trade/location",
        request: {
          trade: "string (e.g., 'plumber')",
          city: "string",
          state: "string (optional)",
        },
        response: {
          rank: "number",
          name: "string",
          url: "string",
          snippet: "string description",
          source: "domain name",
        },
      },
      {
        path: "/api/reviews",
        method: "POST",
        description: "Search for customer reviews from major platforms",
        request: {
          businessName: "string",
          city: "string",
          state: "string (optional)",
        },
        response: "array of ReviewResult with source, snippet, rating, url",
      },
      {
        path: "/api/reviews/respond",
        method: "POST",
        description: "Generate professional response templates for customer reviews",
        request: {
          businessName: "string",
          city: "string",
          reviews: "array of ReviewResult from /api/reviews",
        },
        response: {
          responses: "array of 5 professional response templates",
        },
      },
    ],
    example_queries: [
      {
        scenario: "Complete audit flow",
        steps: [
          "POST /api/audit with businessName, city, state",
          "POST /api/generate with audit result",
          "POST /api/schema with audit result",
          "POST /api/competitors with trade, city, state",
          "POST /api/reviews with businessName, city",
          "POST /api/reviews/respond with reviews result",
        ],
      },
      {
        scenario: "Quick NAP check",
        steps: ["POST /api/audit", "Review score and issues"],
      },
      {
        scenario: "Content generation only",
        steps: [
          "POST /api/audit",
          "POST /api/generate",
          "Use generated description, keywords, and review templates",
        ],
      },
    ],
  };

  return NextResponse.json(directory);
}
