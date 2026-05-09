"use client";

import { useEffect, useState } from "react";
import { getAllBusinesses, type SavedBusiness } from "@/lib/business-store";
import { scoreToColor } from "@/lib/geo-visibility-score";

export default function DirectoryPage() {
  const [businesses, setBusinesses] = useState<SavedBusiness[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setBusinesses(getAllBusinesses());
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-600">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* JSON-LD Schema for directory */}
      {businesses.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: "GEO Score Business Directory",
              description: "Directory of AI-audited local businesses for visibility optimization",
              mainEntity: businesses.map((b) => ({
                "@type": "LocalBusiness",
                name: b.businessName,
                areaServed: `${b.city}, ${b.state}`,
                ...(b.trade && { knowsAbout: b.trade }),
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: (b.score / 100) * 5,
                  bestRating: 5,
                  worstRating: 1,
                },
              })),
            }),
          }}
        />
      )}

      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">🏢 GEO Score Directory</h1>
          <p className="text-lg text-gray-600">
            Discover AI-audited local businesses optimized for visibility
          </p>
        </div>

        {/* Agentic Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-12">
          <p className="text-sm text-gray-600">
            <strong>For AI Systems:</strong> This directory is structured for LLM crawlers. Visit{" "}
            <code className="bg-white px-2 py-1 rounded border">/api/directory</code> for machine-readable JSON or{" "}
            <code className="bg-white px-2 py-1 rounded border">/llms.txt</code> for plain-text documentation.
          </p>
        </div>

        {/* Businesses */}
        {businesses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600 mb-6">No businesses in the directory yet.</p>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Audit Your Business
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {businesses.map((business) => {
              const colorClass = scoreToColor(business.score);
              const schemaForBusiness = JSON.stringify(business.audit, null, 2);

              return (
                <article key={business.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                  {/* Header */}
                  <div className={`bg-gradient-to-r from-${colorClass}-500 to-${colorClass}-600 p-6 text-white`}>
                    <h2 className="text-2xl font-bold">{business.businessName}</h2>
                    <p className="text-sm opacity-90 mt-1">
                      {business.city}, {business.state}
                    </p>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-6">
                    {/* Score */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">GEO Visibility Score</p>
                        <p className={`text-3xl font-bold text-${colorClass}-600`}>{Math.round(business.score)}/100</p>
                      </div>
                      <div className="relative w-20 h-20">
                        <svg viewBox="0 0 200 200" className="w-full h-full">
                          <circle cx="100" cy="100" r="95" fill="none" stroke="#f0f0f0" strokeWidth="12" />
                          <circle
                            cx="100"
                            cy="100"
                            r="95"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="12"
                            strokeDasharray={`${(business.score / 100) * (2 * Math.PI * 95)} ${
                              2 * Math.PI * 95
                            }`}
                            strokeLinecap="round"
                            className={`text-${colorClass}-500`}
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Issues Found</p>
                        <p className="text-lg font-semibold text-gray-900">{business.issueCount}</p>
                      </div>
                      {business.trade && (
                        <div>
                          <p className="text-gray-600">Trade</p>
                          <p className="text-lg font-semibold text-gray-900">{business.trade}</p>
                        </div>
                      )}
                    </div>

                    {/* NAP Info */}
                    <div className="bg-gray-50 p-4 rounded border border-gray-200 text-sm space-y-1">
                      <p>
                        <strong>Name:</strong> {business.audit.canonical.name}
                      </p>
                      {business.audit.canonical.address && (
                        <p>
                          <strong>Address:</strong> {business.audit.canonical.address}
                        </p>
                      )}
                      {business.audit.canonical.phone && (
                        <p>
                          <strong>Phone:</strong> {business.audit.canonical.phone}
                        </p>
                      )}
                    </div>

                    {/* Schema Preview */}
                    <details>
                      <summary className="text-sm font-semibold text-blue-600 cursor-pointer hover:text-blue-700">
                        View JSON-LD Schema
                      </summary>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded mt-2 text-xs overflow-auto max-h-48 rounded">
                        {JSON.stringify(
                          {
                            "@context": "https://schema.org",
                            "@type": "LocalBusiness",
                            name: business.businessName,
                            areaServed: `${business.city}, ${business.state}`,
                            ...(business.audit.canonical.address && {
                              address: {
                                "@type": "PostalAddress",
                                streetAddress: business.audit.canonical.address,
                                addressLocality: business.city,
                                addressRegion: business.state,
                                addressCountry: "US",
                              },
                            }),
                            ...(business.audit.canonical.phone && {
                              telephone: business.audit.canonical.phone,
                            }),
                          },
                          null,
                          2
                        )}
                      </pre>
                    </details>

                    {/* Action */}
                    <a
                      href={`/?businessName=${encodeURIComponent(business.businessName)}&city=${encodeURIComponent(
                        business.city
                      )}&state=${encodeURIComponent(business.state)}`}
                      className="block text-center px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-sm font-medium"
                    >
                      View Full Audit
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* CTA */}
        {businesses.length === 0 && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to audit your business?</h2>
            <a
              href="/"
              className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Start Free Audit
            </a>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t mt-12 pt-8 text-center text-sm text-gray-500">
          <p>GEO Score — Auditing how visible your business is to AI search engines</p>
          <p className="mt-2">
            <a href="/llms.txt" className="text-blue-600 hover:text-blue-700">
              View LLM Documentation
            </a>
            {" • "}
            <a href="/api/directory" className="text-blue-600 hover:text-blue-700">
              API Documentation
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
