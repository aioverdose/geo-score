import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/directory", "/api/directory", "/llms.txt"],
      disallow: ["/report", "/api/audit", "/api/generate", "/api/reviews", "/api/competitors"],
    },
    sitemap: "https://geo-score.com/sitemap.xml",
  };
}
