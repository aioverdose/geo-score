export interface BraveResult {
  title: string;
  description: string;
  url: string;
}

export async function search(query: string, count: number = 5): Promise<BraveResult[]> {
  const apiKey = process.env.BRAVE_API_KEY;

  if (!apiKey) {
    console.warn("BRAVE_API_KEY not set, returning empty results");
    return [];
  }

  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`,
    {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": apiKey,
      },
    }
  );

  if (!res.ok) {
    console.error("Brave Search error:", res.status, await res.text());
    return [];
  }

  const json = await res.json();
  return (json.web?.results ?? []).map((r: any) => ({
    title: r.title ?? "",
    description: r.description ?? "",
    url: r.url ?? "",
  }));
}

export async function searchBusiness(name: string, city: string, state: string) {
  const location = `${city} ${state}`.trim();
  const q = (suffix: string) => `"${name}" ${location} ${suffix}`;

  const queries = {
    general: q("address phone contact"),
    yelp: `"${name}" site:yelp.com ${location}`,
    facebook: `"${name}" site:facebook.com ${location}`,
    linkedin: `"${name}" site:linkedin.com`,
    bbb: `"${name}" site:bbb.org ${location}`,
  };

  const [general, yelp, facebook, linkedin, bbb] = await Promise.all([
    search(queries.general),
    search(queries.yelp),
    search(queries.facebook),
    search(queries.linkedin),
    search(queries.bbb),
  ]);

  return {
    results: { general, yelp, facebook, linkedin, bbb },
    queries,
  };
}
