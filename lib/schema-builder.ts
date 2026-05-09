import type { NAPAudit } from "./nap-parser";

export interface LocalBusinessSchema {
  "@context": string;
  "@type": string;
  name: string;
  address: {
    "@type": string;
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode?: string;
    addressCountry: string;
  };
  telephone: string;
  url?: string;
  sameAs?: string[];
  areaServed?: string;
}

export function buildLocalBusinessSchema(
  businessName: string,
  city: string,
  state: string,
  audit: NAPAudit
): string {
  const schema: LocalBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: audit.canonical.name || businessName,
    address: {
      "@type": "PostalAddress",
      streetAddress: audit.canonical.address || "",
      addressLocality: city,
      addressRegion: state,
      addressCountry: "US",
    },
    telephone: audit.canonical.phone || "",
    areaServed: `${city}, ${state}`,
  };

  // Add main website URL
  const websiteEntry = audit.entries.find((e) => e.source === "website" || e.source === "web");
  if (websiteEntry?.url) {
    schema.url = websiteEntry.url;
  }

  // Collect all directory URLs as sameAs
  const sameAs = audit.entries
    .filter((e) => e.url && e.source !== "website" && e.source !== "web")
    .map((e) => e.url)
    .filter((url, idx, self) => self.indexOf(url) === idx); // deduplicate

  if (sameAs.length > 0) {
    schema.sameAs = sameAs;
  }

  return JSON.stringify(schema, null, 2);
}
