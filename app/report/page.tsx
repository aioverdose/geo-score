"use client";

import { useEffect, useState } from "react";
import type { NAPAudit } from "@/lib/nap-parser";
import type { GMBContent } from "@/lib/llm";
import { scoreToColor } from "@/lib/geo-visibility-score";
import { buildActionItems } from "@/lib/action-items";

interface ReportData {
  businessName: string;
  city: string;
  state: string;
  audit: NAPAudit;
  content?: GMBContent;
  schema?: string;
}

export default function ReportPage() {
  const [data, setData] = useState<ReportData | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = sessionStorage.getItem("geo_report_data");
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to parse report data:", error);
      }
    }

    // Auto-trigger print after a short delay
    const timer = setTimeout(() => {
      window.print();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (!data) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">No report data available. Please run an audit first.</p>
      </div>
    );
  }

  const { businessName, city, state, audit, content, schema } = data;
  const actionItems = buildActionItems(audit);
  const colorClass = scoreToColor(audit.score);

  return (
    <div className="min-h-screen bg-white p-8 print:p-4">
      <div className="max-w-4xl mx-auto space-y-8 print:space-y-4">
        {/* Header */}
        <div className="text-center border-b-2 border-gray-300 pb-6 print:pb-3">
          <h1 className="text-4xl font-bold print:text-2xl text-gray-900">{businessName}</h1>
          <p className="text-xl text-gray-600 print:text-base mt-2">
            {city}, {state}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Generated on {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Score Ring */}
        <div className="flex justify-center">
          <div className="relative w-40 h-40 print:w-32 print:h-32">
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-lg print:drop-shadow-none">
              <circle cx="100" cy="100" r="95" fill="none" stroke="#f0f0f0" strokeWidth="20" />
              <circle
                cx="100"
                cy="100"
                r="95"
                fill="none"
                stroke="currentColor"
                strokeWidth="20"
                strokeDasharray={`${(audit.score / 100) * (2 * Math.PI * 95)} ${
                  2 * Math.PI * 95
                }`}
                strokeLinecap="round"
                className={`text-${colorClass}-500 transition-all`}
              />
              <text
                x="100"
                y="100"
                textAnchor="middle"
                dy="0.3em"
                className="text-4xl print:text-2xl font-bold"
                fill="currentColor"
              >
                {Math.round(audit.score)}
              </text>
            </svg>
          </div>
        </div>

        {/* Executive Summary */}
        <section>
          <h2 className="text-2xl print:text-lg font-bold text-gray-900 mb-4">Executive Summary</h2>
          <div className="space-y-2 text-gray-700 print:text-sm">
            <p>
              <strong>NAP Consistency Score:</strong> {Math.round(audit.score)}/100 ({audit.issues.length} issues found)
            </p>
            <p>
              <strong>Sources Audited:</strong> {audit.entries.length} directory listings
            </p>
            <p>
              <strong>Canonical NAP:</strong> {audit.canonical.name} • {audit.canonical.address || "—"} •{" "}
              {audit.canonical.phone || "—"}
            </p>
          </div>
        </section>

        {/* NAP Audit Table */}
        <section className="print:page-break-inside-avoid">
          <h2 className="text-2xl print:text-lg font-bold text-gray-900 mb-4">NAP Audit Results</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm print:text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 print:bg-gray-200">
                  <th className="border border-gray-300 p-2 text-left font-semibold">Source</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Name</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Address</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Phone</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {audit.entries.map((entry, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border border-gray-300 p-2 font-medium">{entry.source}</td>
                    <td className="border border-gray-300 p-2">{entry.name}</td>
                    <td className="border border-gray-300 p-2">{entry.address || "—"}</td>
                    <td className="border border-gray-300 p-2">{entry.phone || "—"}</td>
                    <td className="border border-gray-300 p-2">
                      <span
                        className={
                          entry.status === "match"
                            ? "text-green-600 font-semibold print:text-green-700"
                            : entry.status === "mismatch"
                              ? "text-red-600 font-semibold print:text-red-700"
                              : "text-gray-500"
                        }
                      >
                        {entry.status === "match" ? "✓" : entry.status === "mismatch" ? "✗" : "—"}{" "}
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Action Items */}
        {actionItems.length > 0 && (
          <section className="print:page-break-inside-avoid">
            <h2 className="text-2xl print:text-lg font-bold text-gray-900 mb-4">Recommended Actions</h2>
            <div className="space-y-3">
              {actionItems.map((item, idx) => (
                <div key={idx} className="border-l-4 border-blue-500 bg-blue-50 p-4 print:p-2">
                  <div className="flex justify-between items-start print:flex-col">
                    <div>
                      <h3 className="font-semibold text-gray-900 print:text-xs">
                        [{item.priority.toUpperCase()}] {item.platform} — {item.fix}
                      </h3>
                      <p className="text-sm text-gray-700 print:text-xs mt-1">{item.instruction}</p>
                    </div>
                    <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded print:ml-0 ml-2">
                      +{item.impactPoints} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Content Recommendations */}
        {content && (
          <section className="print:page-break-inside-avoid">
            <h2 className="text-2xl print:text-lg font-bold text-gray-900 mb-4">GMB Content</h2>
            <div className="space-y-4 print:space-y-2">
              <div>
                <h3 className="font-semibold text-gray-900 print:text-xs">Description</h3>
                <p className="text-gray-700 print:text-xs mt-1">{content.description}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 print:text-xs">Keywords</h3>
                <p className="text-gray-700 print:text-xs mt-1">{content.keywords.join(" • ")}</p>
              </div>
            </div>
          </section>
        )}

        {/* JSON-LD Schema */}
        {schema && (
          <section className="print:page-break-inside-avoid">
            <h2 className="text-2xl print:text-lg font-bold text-gray-900 mb-4">JSON-LD Schema</h2>
            <pre className="bg-gray-100 p-4 print:p-2 rounded text-xs overflow-auto max-h-40 print:max-h-24">
              {schema}
            </pre>
          </section>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 border-t pt-4 print:pt-2">
          <p>GEO Score — AI Local Visibility Auditor</p>
          <p>www.geo-score.com</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .print\\:page-break-inside-avoid {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
