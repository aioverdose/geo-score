import { parsePhoneNumberFromString } from "libphonenumber-js";
import Fuse from "fuse.js";
import type { BraveResult } from "./brave-search";

export interface NAPEntry {
  source: string;
  label: string;
  name?: string;
  address?: string;
  phone?: string;
  phoneRaw?: string;
  url: string;
  status: "match" | "mismatch" | "missing";
}

export interface SearchQuery {
  source: string;
  query: string;
  resultCount: number;
}

export interface NAPAudit {
  canonical: { name?: string; address?: string; phone?: string };
  entries: NAPEntry[];
  issues: string[];
  score: number;
  queries: SearchQuery[];
}

const PHONE_RE = /(\+?1[\s.\-]?)?\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}/g;
const ADDRESS_RE = /\d{1,5}\s+[\w\s.]{3,40}(?:St|Ave|Rd|Blvd|Dr|Ln|Way|Ct|Pl|Pkwy|Hwy)[\w\s,#.]*(?:[A-Z]{2})\s+\d{5}/gi;

function normalizePhone(raw: string): string | undefined {
  const parsed = parsePhoneNumberFromString(raw, "US");
  return parsed?.isValid() ? parsed.format("E.164") : undefined;
}

function extractPhone(text: string): { raw: string; normalized: string } | undefined {
  const matches = text.match(PHONE_RE);
  if (!matches) return undefined;
  for (const m of matches) {
    const normalized = normalizePhone(m);
    if (normalized) return { raw: m.trim(), normalized };
  }
  return undefined;
}

function extractAddress(text: string): string | undefined {
  const m = text.match(ADDRESS_RE);
  return m?.[0]?.replace(/\s+/g, " ").trim();
}

function classifySource(url: string): { source: string; label: string } {
  const u = url.toLowerCase();
  if (u.includes("yelp.com")) return { source: "yelp", label: "Yelp" };
  if (u.includes("facebook.com")) return { source: "facebook", label: "Facebook" };
  if (u.includes("linkedin.com")) return { source: "linkedin", label: "LinkedIn" };
  if (u.includes("bbb.org")) return { source: "bbb", label: "BBB" };
  if (u.includes("google.com") || u.includes("goo.gl")) return { source: "google", label: "Google" };
  if (u.includes("yellowpages.com")) return { source: "yellowpages", label: "Yellow Pages" };
  if (u.includes("mapquest.com")) return { source: "mapquest", label: "MapQuest" };
  return { source: "web", label: new URL(url).hostname.replace("www.", "") };
}

function parseResults(results: BraveResult[]): NAPEntry[] {
  return results.map((r) => {
    const text = `${r.title} ${r.description}`;
    const phone = extractPhone(text);
    const address = extractAddress(text);
    const { source, label } = classifySource(r.url);
    return {
      source,
      label,
      address,
      phone: phone?.normalized,
      phoneRaw: phone?.raw,
      url: r.url,
      status: "missing" as const,
    };
  });
}

export function buildAudit(
  businessName: string,
  allResults: Record<string, BraveResult[]>,
  queries?: Record<string, string>
): NAPAudit {
  const allEntries: NAPEntry[] = [];

  for (const [key, results] of Object.entries(allResults)) {
    const parsed = parseResults(results);
    for (const entry of parsed) {
      if (!entry.source) entry.source = key;
      if (!allEntries.find((e) => e.url === entry.url)) {
        allEntries.push(entry);
      }
    }
  }

  // Determine canonical NAP (most common phone/address)
  const phones = allEntries.map((e) => e.phone).filter(Boolean) as string[];
  const addresses = allEntries.map((e) => e.address).filter(Boolean) as string[];

  const canonicalPhone = phones.sort(
    (a, b) => phones.filter((p) => p === b).length - phones.filter((p) => p === a).length
  )[0];

  const canonicalAddress = addresses[0]; // use first match as baseline

  const canonical = {
    name: businessName,
    phone: canonicalPhone,
    address: canonicalAddress,
  };

  const issues: string[] = [];

  // Mark each entry
  for (const entry of allEntries) {
    let statusPoints = 0;
    let total = 0;

    // Phone check
    if (canonicalPhone) {
      total++;
      if (!entry.phone) {
        issues.push(`Phone missing on ${entry.label}`);
      } else if (entry.phone === canonicalPhone) {
        statusPoints++;
      } else {
        issues.push(`Phone mismatch on ${entry.label}: ${entry.phoneRaw} (expected ${canonical.phone})`);
      }
    }

    // Address check
    if (canonicalAddress) {
      total++;
      if (!entry.address) {
        issues.push(`Address missing on ${entry.label}`);
      } else {
        statusPoints++;
      }
    }

    entry.status =
      total === 0 ? "missing" : statusPoints === total ? "match" : statusPoints > 0 ? "mismatch" : "missing";
  }

  // Score: 0-100
  const matchCount = allEntries.filter((e) => e.status === "match").length;
  const mismatchCount = allEntries.filter((e) => e.status === "mismatch").length;
  const total = allEntries.length;

  let score = total === 0 ? 0 : Math.round(((matchCount + mismatchCount * 0.5) / total) * 100);

  // Bonus: more sources found = higher score
  const sourceBonus = Math.min(total * 3, 15);
  score = Math.min(100, score + sourceBonus);

  const uniqueIssues = [...new Set(issues)];

  // Build search queries list
  const queriesList: SearchQuery[] = queries
    ? Object.entries(queries).map(([source, query]) => ({
        source,
        query,
        resultCount: allResults[source]?.length || 0,
      }))
    : [];

  return { canonical, entries: allEntries, issues: uniqueIssues, score, queries: queriesList };
}
