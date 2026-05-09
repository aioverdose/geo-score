import type { NAPAudit } from "./nap-parser";

export interface ActionItem {
  priority: "high" | "medium" | "low";
  issue: string;
  platform: string;
  fix: string;
  impactPoints: number;
  directUrl: string;
  steps: string[];
}

const PLATFORM_PRIORITY: Record<string, number> = {
  yelp: 3,
  google: 3,
  bbb: 3,
  facebook: 2,
  linkedin: 2,
  website: 1,
  web: 1,
  other: 1,
};

const PLATFORM_DIRECT_URLS: Record<string, string> = {
  yelp: "https://biz.yelp.com/",
  google: "https://business.google.com/",
  bbb: "https://www.bbb.org/business/",
  facebook: "https://www.facebook.com/business/",
  linkedin: "https://www.linkedin.com/company/",
};

const PLATFORM_STEPS: Record<string, string[]> = {
  google: [
    "Go to business.google.com and sign in with your Google account",
    "Search for and select your business listing",
    "Click 'Edit Profile' in the left menu",
    "Update your Name, Address, and Phone number",
    "Click 'Save' — changes appear within 3 days",
  ],
  yelp: [
    "Go to biz.yelp.com and sign in",
    "Search for your business",
    "Click 'Edit' on your business information",
    "Update Name, Address, Phone to match your canonical NAP",
    "Click 'Save changes' — live immediately",
  ],
  bbb: [
    "Go to bbb.org and search for your business",
    "Request to claim or update your listing",
    "Verify your business ownership",
    "Update your Name, Address, Phone",
    "Confirm changes — live within 24 hours",
  ],
  facebook: [
    "Go to facebook.com and find your business page",
    "Click 'Settings' → 'Page Info'",
    "Update your Name, Address, Phone",
    "Save changes — live immediately",
  ],
  linkedin: [
    "Go to linkedin.com/company/ and search for your business",
    "Click 'Edit' on the company page",
    "Update headquarters location, phone, website",
    "Save and publish — live immediately",
  ],
};

const PLATFORM_URLS: Record<string, string> = {
  yelp: "yelp.com",
  google: "google.com/business",
  bbb: "bbb.org",
  facebook: "facebook.com",
  linkedin: "linkedin.com",
};

export function buildActionItems(audit: NAPAudit): ActionItem[] {
  const items: ActionItem[] = [];

  // Parse issues into structured action items
  for (const issue of audit.issues) {
    const match = issue.match(/(\w+).*?(phone|address|name)/i);
    if (!match) continue;

    const platform = match[1].toLowerCase();
    const field = match[2].toLowerCase();
    const isMissing = issue.includes("missing");
    const isMismatch = issue.includes("mismatch");

    if (!isMissing && !isMismatch) continue;

    const platformPriority = PLATFORM_PRIORITY[platform] || 1;
    const isCritical = isMissing || (isMismatch && field === "phone");
    const basePriority = isCritical ? 2 : 1;
    const impactPoints = basePriority * platformPriority * (field === "phone" ? 1.5 : 1);

    const url = PLATFORM_URLS[platform] || platform;
    const fixText = isMissing
      ? `Add ${field} to ${platform} listing`
      : `Update ${field} mismatch on ${platform}`;

    const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
    const directUrl = PLATFORM_DIRECT_URLS[platform] || `https://${url}`;
    const steps = PLATFORM_STEPS[platform] || [
      `Visit ${platformName} and sign in`,
      `Find your business listing`,
      `Edit your information`,
      `Update the ${field}`,
      `Save changes`,
    ];

    items.push({
      priority: impactPoints >= 6 ? "high" : impactPoints >= 3 ? "medium" : "low",
      issue,
      platform: platformName,
      fix: `${fixText} (${url})`,
      impactPoints: Math.round(impactPoints * 10) / 10,
      directUrl,
      steps,
    });
  }

  // Sort by impact points descending
  items.sort((a, b) => b.impactPoints - a.impactPoints);

  // Deduplicate by (platform, field) if needed
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.platform}:${item.issue}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
