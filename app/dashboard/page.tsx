"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllBusinesses, deleteBusinessAudit, exportAllBusinesses, type SavedBusiness } from "@/lib/business-store";
import { loadAuditHistory, type HistoryEntry } from "@/lib/alert-store";
import { scoreToColor } from "@/lib/geo-visibility-score";
import TrendsChart from "@/app/components/TrendsChart";

export default function DashboardPage() {
  const [businesses, setBusinesses] = useState<SavedBusiness[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<Record<string, HistoryEntry[]>>({});

  useEffect(() => {
    const allBusinesses = getAllBusinesses();
    setBusinesses(allBusinesses);

    // Load history for each business
    const historyMap: Record<string, HistoryEntry[]> = {};
    for (const business of allBusinesses) {
      historyMap[business.id] = loadAuditHistory(
        business.businessName,
        business.city,
        business.state
      );
    }
    setHistory(historyMap);
    setIsLoading(false);
  }, []);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this business?")) {
      deleteBusinessAudit(id);
      setBusinesses(getAllBusinesses());
    }
  };

  const handleExport = () => {
    const json = exportAllBusinesses();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `geo-score-audits-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReAudit = (business: SavedBusiness) => {
    const params = new URLSearchParams({
      businessName: business.businessName,
      city: business.city,
      state: business.state,
      ...(business.trade && { trade: business.trade }),
    });
    window.location.href = `/?${params.toString()}`;
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-600">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">📊 Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage and track your business audits</p>
          </div>
          <div className="flex gap-4">
            {businesses.length > 0 && (
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                📥 Export All
              </button>
            )}
            <Link
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              + New Audit
            </Link>
          </div>
        </div>

        {/* Empty State */}
        {businesses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-lg text-gray-600 mb-4">No audits yet. Start by auditing your first business.</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Run Your First Audit
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((business) => {
              const colorClass = scoreToColor(business.score);
              const daysAgo = Math.floor((Date.now() - business.savedAt) / (1000 * 60 * 60 * 24));
              const businessHistory = history[business.id] || [];
              const trendArrow =
                businessHistory.length >= 2
                  ? businessHistory[businessHistory.length - 1].score > businessHistory[businessHistory.length - 2].score
                    ? "↑"
                    : "↓"
                  : null;

              return (
                <div key={business.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                  {/* Card Header */}
                  <div className={`bg-gradient-to-r from-${colorClass}-500 to-${colorClass}-600 p-4 text-white`}>
                    <h2 className="text-xl font-bold truncate">{business.businessName}</h2>
                    <p className="text-sm opacity-90">
                      {business.city}, {business.state}
                    </p>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-4">
                    {/* Score Ring Mini with Trend */}
                    <div className="flex items-center justify-between">
                      <div className="relative w-24 h-24">
                        <svg viewBox="0 0 200 200" className="w-full h-full">
                          <circle cx="100" cy="100" r="95" fill="none" stroke="#f0f0f0" strokeWidth="15" />
                          <circle
                            cx="100"
                            cy="100"
                            r="95"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="15"
                            strokeDasharray={`${(business.score / 100) * (2 * Math.PI * 95)} ${
                              2 * Math.PI * 95
                            }`}
                            strokeLinecap="round"
                            className={`text-${colorClass}-500`}
                          />
                          <text
                            x="100"
                            y="100"
                            textAnchor="middle"
                            dy="0.3em"
                            className="text-2xl font-bold"
                            fill="currentColor"
                          >
                            {Math.round(business.score)}
                          </text>
                        </svg>
                      </div>
                      {trendArrow && (
                        <span className={`text-3xl font-bold ${trendArrow === "↑" ? "text-emerald-500" : "text-red-500"}`}>
                          {trendArrow}
                        </span>
                      )}
                    </div>

                    {/* Trends Chart */}
                    {businessHistory.length > 1 && <TrendsChart history={businessHistory} />}

                    {/* Stats */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Issues:</span>
                        <span className="font-semibold text-gray-900">{business.issueCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Trade:</span>
                        <span className="font-semibold text-gray-900">{business.trade || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Audited:</span>
                        <span className="font-semibold text-gray-900">
                          {daysAgo === 0 ? "today" : `${daysAgo}d ago`}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                      <button
                        onClick={() => handleReAudit(business)}
                        className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-sm font-medium"
                      >
                        Re-audit
                      </button>
                      <button
                        onClick={() => handleDelete(business.id)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
