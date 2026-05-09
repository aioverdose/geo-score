interface GeoScoreResult {
  overall: number;
  visibility: number;
  authority: number;
  momentum: number;
  benchmark: string;
}

export function calculateGeoVisibilityScore(
  mentions: number,
  top3: number,
  rank1: number,
  totalQueries: number,
  directRecs: number,
  listed: number,
  contextual: number,
  last30dRate: number,
  prev30dRate: number
): GeoScoreResult {
  // VISIBILITY (40%): Are you showing up?
  const mentionRate = mentions / totalQueries;
  const top3Rate = top3 / totalQueries;
  const rank1Rate = rank1 / totalQueries;

  const visibility = Math.min(
    100,
    mentionRate * 100 * 0.4 + top3Rate * 100 * 0.35 + rank1Rate * 100 * 0.25
  );

  // AUTHORITY (35%): How strong are mentions?
  const totalMentions = directRecs + listed + contextual;
  let authority = 0;

  if (totalMentions > 0) {
    const quality = (directRecs * 1.0 + listed * 0.7 + contextual * 0.3) / totalMentions;
    authority = quality * 100;
  }

  // MOMENTUM (25%): Are you trending up?
  const trendVelocity = last30dRate - prev30dRate;
  const momentum = Math.max(0, Math.min(100, 50 + trendVelocity * 500));

  // OVERALL: Weighted composite
  const overall = Math.round(
    (visibility * 0.4 + authority * 0.35 + momentum * 0.25) * 10
  ) / 10;

  return {
    overall,
    visibility: Math.round(visibility * 10) / 10,
    authority: Math.round(authority * 10) / 10,
    momentum: Math.round(momentum * 10) / 10,
    benchmark: getBenchmark(overall),
  };
}

export function getBenchmark(score: number): string {
  if (score >= 91) return "Dominant — Category leader";
  if (score >= 76) return "Authority — Frequently recommended";
  if (score >= 51) return "Solid — Regularly cited";
  if (score >= 26) return "Inconsistent — Occasional mentions";
  return "Invisible — Critical problem";
}

export function scoreToColor(score: number): string {
  if (score >= 91) return "#10b981"; // emerald (dominant)
  if (score >= 76) return "#3b82f6"; // blue (authority)
  if (score >= 51) return "#f59e0b"; // amber (solid)
  if (score >= 26) return "#f97316"; // orange (inconsistent)
  return "#ef4444"; // red (invisible)
}

export function getScoreTier(score: number): "dominant" | "authority" | "solid" | "inconsistent" | "invisible" {
  if (score >= 91) return "dominant";
  if (score >= 76) return "authority";
  if (score >= 51) return "solid";
  if (score >= 26) return "inconsistent";
  return "invisible";
}
