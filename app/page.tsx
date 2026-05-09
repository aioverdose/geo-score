"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Loader2, Copy, Check, ChevronRight, AlertTriangle, CheckCircle, XCircle, MapPin, Phone, Building2, Code2, Zap, TrendingUp, Download, Sparkles } from "lucide-react";
import type { NAPAudit, NAPEntry } from "@/lib/nap-parser";
import type { GMBContent } from "@/lib/llm";
import type { Competitor } from "@/lib/competitor-search";
import type { ActionItem } from "@/lib/action-items";
import type { ReviewResult } from "@/lib/review-search";
import type { Alert, HistoryEntry } from "@/lib/alert-store";
import type { CitationResult } from "@/lib/citation-checker";
import { buildActionItems } from "@/lib/action-items";
import { buildLocalBusinessSchema } from "@/lib/schema-builder";
import { saveAudit, loadAudit, getAlerts, saveAuditHistory, loadAuditHistory } from "@/lib/alert-store";
import { saveBusinessAudit } from "@/lib/business-store";
import QuickFixWizard from "@/app/components/QuickFixWizard";
import MembershipModal from "@/app/components/MembershipModal";
import { getMockUser, incrementAuditCount, canAudit, getAuditRemaining, upgradeToPro, downgradeToFree } from "@/lib/mock-auth";
import type { MockUser } from "@/lib/mock-auth";

export default function GeoScore() {
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [trade, setTrade] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loadingCompetitors, setLoadingCompetitors] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [generatingResponses, setGeneratingResponses] = useState(false);
  const [audit, setAudit] = useState<NAPAudit | null>(null);
  const [content, setContent] = useState<GMBContent | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[] | null>(null);
  const [schema, setSchema] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewResult[] | null>(null);
  const [reviewResponses, setReviewResponses] = useState<string[] | null>(null);
  const [citations, setCitations] = useState<CitationResult[] | null>(null);
  const [loadingCitations, setLoadingCitations] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeTab, setActiveTab] = useState<"audit" | "content" | "actions" | "timeline" | "schema" | "competitors" | "reviews" | "citations">("audit");
  const [contentTab, setContentTab] = useState<"description" | "keywords" | "reviews" | "schema">("description");
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mockUser, setMockUser] = useState<MockUser | null>(null);
  const [membershipModalOpen, setMembershipModalOpen] = useState(false);
  const [membershipModalReason, setMembershipModalReason] = useState<"limit-reached" | "pro-feature">("limit-reached");

  // Initialize mock user on mount
  useEffect(() => {
    const user = getMockUser();
    setMockUser(user);
  }, []);

  // Pre-fill form from URL parameters
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const paramBusinessName = params.get("businessName");
    const paramCity = params.get("city");
    const paramState = params.get("state");
    const paramTrade = params.get("trade");

    if (paramBusinessName) setBusinessName(paramBusinessName);
    if (paramCity) setCity(paramCity);
    if (paramState) setState(paramState);
    if (paramTrade) setTrade(paramTrade);
  }, []);

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyButton = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => copyToClipboard(text, id)}
      className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
    >
      {copied === id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
      {copied === id ? "Copied" : "Copy"}
    </button>
  );

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) return;

    // Check audit limit
    if (mockUser && !canAudit(mockUser)) {
      setMembershipModalReason("limit-reached");
      setMembershipModalOpen(true);
      return;
    }

    setLoading(true);
    setError(null);
    setAudit(null);
    setContent(null);
    setCompetitors(null);
    setSchema(null);
    setReviews(null);
    setReviewResponses(null);
    setCitations(null);
    setAlerts([]);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, city, state }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAudit(data);
      setActiveTab("audit");

      // Save audit and show alerts
      saveAudit(businessName, city, state, data);
      const priorAudit = loadAudit(businessName, city, state);
      if (priorAudit && priorAudit.timestamp < Date.now()) {
        const newAlerts = getAlerts(data, priorAudit);
        setAlerts(newAlerts);
      }

      // Increment audit count
      incrementAuditCount();
      const updatedUser = getMockUser();
      setMockUser(updatedUser);

      // Save to audit history
      saveAuditHistory(businessName, city, state, data.score, data.issues.length);

      // Auto-save to business dashboard
      try {
        saveBusinessAudit(businessName, city, state, trade, data);
      } catch (err) {
        console.error("Failed to save business:", err);
      }

      // Auto-fetch schema from audit data
      const schemaRes = await fetch("/api/schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, city, state, audit: data }),
      });
      if (schemaRes.ok) {
        const schemaData = await schemaRes.json();
        setSchema(schemaData.schemaJson);
      }

      // Auto-fetch competitors if trade is provided
      if (trade.trim()) {
        setLoadingCompetitors(true);
        try {
          const compRes = await fetch("/api/competitors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ trade, city, state }),
          });
          if (compRes.ok) {
            const compData = await compRes.json();
            setCompetitors(compData);
          }
        } catch (err) {
          console.error("Failed to fetch competitors:", err);
        } finally {
          setLoadingCompetitors(false);
        }
      }

      // Fetch reviews (fire-and-forget, non-blocking)
      setLoadingReviews(true);
      try {
        const reviewRes = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessName, city, state }),
        });
        if (reviewRes.ok) {
          const reviewData = await reviewRes.json();
          setReviews(reviewData);
        }
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      } finally {
        setLoadingReviews(false);
      }

      // Fetch citations if trade is provided (fire-and-forget, non-blocking)
      if (trade.trim()) {
        setLoadingCitations(true);
        try {
          const citRes = await fetch("/api/citations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ businessName, city, state, trade }),
          });
          if (citRes.ok) {
            const citData = await citRes.json();
            setCitations(citData);
          }
        } catch (err) {
          console.error("Failed to fetch citations:", err);
        } finally {
          setLoadingCitations(false);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!audit) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, city, state, audit }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setContent(data);
      setActiveTab("content");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateReviewResponses = async () => {
    if (!reviews || reviews.length === 0) return;
    setGeneratingResponses(true);
    try {
      const res = await fetch("/api/reviews/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, city, reviews }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setReviewResponses(data.responses);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGeneratingResponses(false);
    }
  };

  const handleDownloadReport = () => {
    if (!audit) return;
    const reportData = {
      businessName,
      city,
      state,
      audit,
      content,
      schema,
    };
    sessionStorage.setItem("geo_report_data", JSON.stringify(reportData));
    window.open("/report", "_blank");
  };

  const scoreColor = (s: number) =>
    s >= 75 ? "text-emerald-400" : s >= 50 ? "text-yellow-400" : "text-red-400";

  const scoreRingStroke = (s: number) =>
    s >= 75 ? "#34d399" : s >= 50 ? "#facc15" : "#f87171";

  const ScoreRing = ({ score }: { score: number }) => {
    const r = 52;
    const circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;
    return (
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#1e293b" strokeWidth="12" />
        <circle cx="64" cy="64" r={r} fill="none" stroke={scoreRingStroke(score)}
          strokeWidth="12" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 64 64)" style={{ transition: "stroke-dasharray 0.8s ease" }} />
        <text x="64" y="60" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold">{score}</text>
        <text x="64" y="78" textAnchor="middle" fill="#94a3b8" fontSize="11">/ 100</text>
      </svg>
    );
  };

  const StatusIcon = ({ status }: { status: NAPEntry["status"] }) => {
    if (status === "match") return <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />;
    if (status === "mismatch") return <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0" />;
    return <XCircle size={16} className="text-red-400 flex-shrink-0" />;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <MapPin size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">GEO Score</h1>
              <p className="text-xs text-slate-400">AI Local Visibility Auditor</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {mockUser && (
              <div className="flex items-center gap-3">
                {/* Audit Count */}
                <div className="text-xs text-slate-400">
                  {mockUser.plan === "pro" ? (
                    <span className="text-cyan-400 font-semibold">Pro</span>
                  ) : (
                    <span>
                      {getAuditRemaining(mockUser)}/{5} audits
                    </span>
                  )}
                </div>
                {/* Plan Toggle (Demo Only) */}
                <button
                  onClick={() => {
                    if (mockUser.plan === "pro") {
                      downgradeToFree();
                    } else {
                      upgradeToPro();
                    }
                    const updated = getMockUser();
                    setMockUser(updated);
                  }}
                  className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 rounded transition"
                  title="Demo: Toggle plan to test paywall"
                >
                  {mockUser.plan === "pro" ? "→ Free" : "→ Pro"}
                </button>
              </div>
            )}
            <a
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              📊 Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Search Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-1">Audit Your GEO Visibility</h2>
          <p className="text-sm text-slate-400 mb-5">
            See how AI search engines and Google find your business — then fix it.
          </p>
          <form onSubmit={handleAudit} className="flex flex-wrap gap-3">
            <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Business name" required
              className="flex-1 min-w-48 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm" />
            <input type="text" value={trade} onChange={(e) => setTrade(e.target.value)}
              placeholder="Trade (e.g., plumber)"
              className="w-32 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm" />
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="w-40 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm" />
            <input type="text" value={state} onChange={(e) => setState(e.target.value)}
              placeholder="State" maxLength={2}
              className="w-20 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm" />
            <button type="submit" disabled={loading || !businessName.trim()}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              {loading ? "Scanning..." : "Run GEO Audit"}
            </button>
          </form>
          {error && (
            <div className="mt-4 px-4 py-3 bg-red-900/30 border border-red-700/50 rounded-lg text-sm text-red-300">{error}</div>
          )}
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`border-l-4 p-4 rounded-lg ${
                  alert.type === "improvement"
                    ? "bg-emerald-900/20 border-emerald-600 text-emerald-200"
                    : alert.type === "decline"
                      ? "bg-red-900/20 border-red-600 text-red-200"
                      : "bg-yellow-900/20 border-yellow-600 text-yellow-200"
                }`}
              >
                <p className="text-sm font-medium">
                  {alert.type === "improvement" && "🟢"}
                  {alert.type === "decline" && "🔴"}
                  {alert.type === "new_issues" && "⚠️"}
                  {alert.type === "stale" && "🟡"} {alert.message}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {audit && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">GEO Score</h3>
                <div className="flex justify-center"><ScoreRing score={audit.score} /></div>
                <p className={`text-center text-sm font-medium mt-2 ${scoreColor(audit.score)}`}>
                  {audit.score >= 75 ? "Strong visibility" : audit.score >= 50 ? "Needs improvement" : "Critical issues found"}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Sources found</span>
                  <span className="font-medium">{audit.entries.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 flex items-center gap-1"><CheckCircle size={12} className="text-emerald-400" /> Matching</span>
                  <span className="font-medium text-emerald-400">{audit.entries.filter((e) => e.status === "match").length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 flex items-center gap-1"><AlertTriangle size={12} className="text-yellow-400" /> Mismatch</span>
                  <span className="font-medium text-yellow-400">{audit.entries.filter((e) => e.status === "mismatch").length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 flex items-center gap-1"><XCircle size={12} className="text-red-400" /> Missing</span>
                  <span className="font-medium text-red-400">{audit.entries.filter((e) => e.status === "missing").length}</span>
                </div>
              </div>

              {(audit.canonical.phone || audit.canonical.address) && (
                <div className="border-t border-slate-800 pt-4 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Canonical NAP</p>
                  {audit.canonical.address && (
                    <div className="flex gap-2 text-xs text-slate-300">
                      <MapPin size={12} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span>{audit.canonical.address}</span>
                    </div>
                  )}
                  {audit.canonical.phone && (
                    <div className="flex gap-2 text-xs text-slate-300">
                      <Phone size={12} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span>{audit.canonical.phone}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <button onClick={handleGenerate} disabled={generating}
                  className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                  {generating ? <Loader2 size={14} className="animate-spin" /> : <Building2 size={14} />}
                  {generating ? "Generating..." : "Generate GMB Content"}
                </button>
                <button
                  onClick={() => {
                    if (mockUser?.plan !== "pro") {
                      setMembershipModalReason("pro-feature");
                      setMembershipModalOpen(true);
                    } else {
                      handleDownloadReport();
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors relative"
                >
                  <Download size={14} />
                  Download Report
                  {mockUser?.plan !== "pro" && (
                    <span className="absolute right-3 bg-cyan-500 text-white px-2 py-0.5 rounded text-xs font-bold">PRO</span>
                  )}
                </button>
              </div>
            </div>

            {/* Audit + Content Tabs */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="flex border-b border-slate-800 overflow-x-auto">
                {[
                  { id: "audit" as const, label: "NAP Audit" },
                  { id: "actions" as const, label: "Quick Fixes" },
                  { id: "timeline" as const, label: "Timeline" },
                  { id: "citations" as const, label: "AI Visibility", disabled: !citations || citations.length === 0 },
                  { id: "schema" as const, label: "Schema", disabled: !schema },
                  { id: "competitors" as const, label: "Competitors", disabled: !competitors || competitors.length === 0 },
                  { id: "reviews" as const, label: "Reviews", disabled: !reviews || reviews.length === 0 },
                  { id: "content" as const, label: "GMB Content", disabled: !content }
                ].map((tab) => (
                  <button key={tab.id} onClick={() => !("disabled" in tab && tab.disabled) && setActiveTab(tab.id)}
                    disabled={"disabled" in tab && tab.disabled}
                    className={`px-5 py-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? "text-cyan-400 border-b-2 border-cyan-400" : ("disabled" in tab && tab.disabled) ? "text-slate-600 cursor-not-allowed" : "text-slate-400 hover:text-slate-200"}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* NAP Audit */}
              {activeTab === "audit" && (
                <div className="p-5 space-y-4">
                  {/* Search Terms Used */}
                  {audit.queries && audit.queries.length > 0 && (
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Search Queries Used</p>
                      <div className="space-y-2">
                        {audit.queries.map((q, i) => (
                          <div key={i} className="text-xs space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-slate-300 capitalize">{q.source}</span>
                              <span className="text-slate-500 text-xs">{q.resultCount} results</span>
                            </div>
                            <code className="text-slate-400 block bg-slate-900/50 p-2 rounded text-xs break-all">
                              {q.query}
                            </code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {audit.issues.length > 0 && (
                    <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-lg p-4 space-y-1">
                      <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-2">Issues Found</p>
                      {audit.issues.map((issue, i) => (
                        <div key={i} className="flex gap-2 text-xs text-yellow-200">
                          <ChevronRight size={12} className="flex-shrink-0 mt-0.5" />
                          <span>{issue}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="space-y-2">
                    {audit.entries.length === 0 ? (
                      <div className="text-center py-10 space-y-2">
                        <p className="text-sm text-slate-400">No live results — Brave Search API key not set.</p>
                        <p className="text-xs text-slate-500">Add <code className="bg-slate-800 px-1 rounded">BRAVE_API_KEY</code> to <code className="bg-slate-800 px-1 rounded">.env.local</code> to enable live NAP scanning.</p>
                      </div>
                    ) : (
                      audit.entries.map((entry, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                          <StatusIcon status={entry.status} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-slate-200">{entry.label}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${entry.status === "match" ? "bg-emerald-900/40 text-emerald-400" : entry.status === "mismatch" ? "bg-yellow-900/40 text-yellow-400" : "bg-red-900/40 text-red-400"}`}>
                                {entry.status}
                              </span>
                            </div>
                            {entry.address && (
                              <div className="flex gap-1.5 text-xs text-slate-400 mb-0.5">
                                <MapPin size={10} className="flex-shrink-0 mt-0.5" />
                                <span className="truncate">{entry.address}</span>
                              </div>
                            )}
                            {entry.phoneRaw && (
                              <div className="flex gap-1.5 text-xs mb-0.5">
                                <Phone size={10} className="flex-shrink-0 mt-0.5 text-slate-400" />
                                <span className={entry.status === "mismatch" ? "text-yellow-400" : "text-slate-400"}>{entry.phoneRaw}</span>
                              </div>
                            )}
                            <a href={entry.url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-600 hover:text-cyan-400 truncate block">
                              {entry.url.slice(0, 55)}…
                            </a>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Quick Fix Wizard */}
              {activeTab === "actions" && audit && (() => {
                const actionItems = buildActionItems(audit);
                return <QuickFixWizard actionItems={actionItems} audit={audit} />;
              })()}

              {/* Citation Timeline */}
              {activeTab === "timeline" && audit && (() => {
                const sourceStatus = audit.entries.reduce(
                  (acc, entry) => {
                    acc[entry.source] = entry.status;
                    return acc;
                  },
                  {} as Record<string, "match" | "mismatch" | "missing">
                );
                const allSources = ["google", "yelp", "facebook", "bbb", "linkedin"];
                return (
                  <div className="p-5 space-y-6">
                    <div className="relative">
                      {allSources.map((source, idx) => {
                        const status = sourceStatus[source];
                        const found = status !== undefined;
                        const isMatch = status === "match";
                        const isMismatch = status === "mismatch";
                        return (
                          <div key={source} className="flex gap-4 pb-6">
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full ${isMatch ? "bg-emerald-400" : isMismatch ? "bg-yellow-400" : found ? "bg-red-400" : "bg-slate-600"}`} />
                              {idx < allSources.length - 1 && <div className="w-0.5 h-12 bg-slate-700 mt-2" />}
                            </div>
                            <div className="flex-1 pt-0.5">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-slate-200 capitalize">{source}</span>
                                {found && (
                                  <span className={`text-xs px-2 py-0.5 rounded ${isMatch ? "bg-emerald-900/40 text-emerald-400" : "bg-yellow-900/40 text-yellow-400"}`}>
                                    {status}
                                  </span>
                                )}
                                {!found && <span className="text-xs px-2 py-0.5 rounded bg-slate-700/40 text-slate-400">Not found</span>}
                              </div>
                              {audit.entries.find((e) => e.source === source)?.url && (
                                <a href={audit.entries.find((e) => e.source === source)?.url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-600 hover:text-cyan-400">
                                  Visit listing →
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="border-t border-slate-800 pt-4 text-xs text-slate-400 space-y-2">
                      <p className="font-medium text-slate-300">📈 Next Steps:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Check the "Action Items" tab for specific fixes</li>
                        <li>Come back weekly to track citation growth</li>
                        <li>Use the schema and content above to optimize new listings</li>
                      </ul>
                    </div>
                  </div>
                );
              })()}

              {/* Schema */}
              {activeTab === "schema" && schema && (
                <div className="p-5 space-y-4">
                  <div className="bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <div className="flex justify-between items-center p-3 border-b border-slate-700/50">
                      <div className="flex items-center gap-2">
                        <Code2 size={14} className="text-cyan-400" />
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">LocalBusiness JSON-LD Schema</span>
                      </div>
                      <CopyButton text={`<script type="application/ld+json">\n${schema}\n</script>`} id="schema-standalone" />
                    </div>
                    <pre className="p-4 text-xs text-emerald-300 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap max-h-96">
                      {`<script type="application/ld+json">\n${schema}\n</script>`}
                    </pre>
                  </div>
                  <div className="bg-blue-900/20 border border-blue-700/40 rounded-lg p-4 space-y-2 text-sm">
                    <p className="font-medium text-blue-300">💡 How to use:</p>
                    <ol className="text-xs text-blue-200 space-y-1 list-decimal list-inside">
                      <li>Copy the schema code above</li>
                      <li>Paste it in your website's <code className="bg-slate-800 px-1 rounded">&lt;head&gt;</code> section</li>
                      <li>Google will use this to understand your business better</li>
                      <li>Improves visibility in search results and AI citations</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Competitors */}
              {activeTab === "competitors" && competitors && competitors.length > 0 && (
                <div className="p-5 space-y-4">
                  <div className="space-y-3">
                    {competitors.map((comp, i) => (
                      <div key={i} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                        <div className="flex items-start gap-4">
                          <div className="text-2xl font-bold text-cyan-400 w-8 flex-shrink-0">#{comp.rank}</div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-slate-200 mb-1">{comp.name}</h3>
                            <p className="text-xs text-slate-400 mb-2">{comp.snippet}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">{comp.source}</span>
                              <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-600 hover:text-cyan-400">
                                View listing →
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-lg p-4 space-y-2 text-sm">
                    <p className="font-medium text-yellow-300">🎯 Competitor Analysis:</p>
                    <p className="text-xs text-yellow-200">These are the top businesses showing up in AI search results for <strong>"{trade}" in {city}, {state}</strong>. Compare your NAP consistency with theirs to identify opportunities.</p>
                  </div>
                </div>
              )}

              {/* AI Visibility Citations */}
              {activeTab === "citations" && citations && citations.length > 0 && (
                <div className="p-5 space-y-4">
                  <div className="space-y-3">
                    {citations.map((cit, i) => (
                      <div key={i} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                        <div className="flex items-start gap-3 mb-2">
                          <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-400 font-medium">
                            {cit.queryType}
                          </span>
                          {cit.mentioned ? (
                            <span className="text-xs px-2 py-1 rounded bg-emerald-900/40 text-emerald-400 font-medium flex items-center gap-1">
                              ✓ Mentioned
                              {cit.rank && <span>#{cit.rank}</span>}
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded bg-red-900/40 text-red-400 font-medium">
                              ✗ Not Found
                            </span>
                          )}
                        </div>
                        <p className="text-xs italic text-slate-500 mb-2">"{cit.query}"</p>
                        {cit.snippet && <p className="text-sm text-slate-300">{cit.snippet}</p>}
                      </div>
                    ))}
                  </div>
                  <div className="bg-blue-900/20 border border-blue-700/40 rounded-lg p-4 text-sm">
                    <p className="text-blue-300 font-medium mb-1">💡 AI Visibility Score</p>
                    <p className="text-xs text-blue-200">
                      Your business appears in {citations.filter((c) => c.mentioned).length} of {citations.length} AI search
                      recommendations. Improve your visibility by fixing NAP inconsistencies above.
                    </p>
                  </div>
                </div>
              )}

              {/* Reviews */}
              {activeTab === "reviews" && reviews && reviews.length > 0 && (
                <div className="p-5 space-y-4">
                  <div className="space-y-3">
                    {reviews.map((review, i) => (
                      <div key={i} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                        <div className="flex items-start gap-3 mb-2">
                          <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-400">{review.source}</span>
                          {review.rating && <span className="text-xs px-2 py-1 rounded bg-yellow-900/40 text-yellow-400">⭐ {review.rating}/5</span>}
                        </div>
                        <p className="text-sm text-slate-200 mb-3">{review.snippet}</p>
                        <a href={review.url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-600 hover:text-cyan-400">
                          Read full review →
                        </a>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      if (mockUser?.plan !== "pro") {
                        setMembershipModalReason("pro-feature");
                        setMembershipModalOpen(true);
                      } else {
                        handleGenerateReviewResponses();
                      }
                    }}
                    disabled={generatingResponses && mockUser?.plan === "pro"}
                    className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors relative"
                  >
                    {generatingResponses ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Sparkles size={14} />
                    )}
                    {generatingResponses ? "Generating..." : "Generate Responses"}
                    {mockUser?.plan !== "pro" && (
                      <span className="absolute right-3 bg-cyan-500 text-white px-2 py-0.5 rounded text-xs font-bold">PRO</span>
                    )}
                  </button>
                  {reviewResponses && reviewResponses.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-slate-700">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Response Templates</p>
                      {reviewResponses.map((response, i) => (
                        <div key={i} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <span className="text-xs text-slate-400">Response {i + 1}</span>
                            <CopyButton text={response} id={`response-${i}`} />
                          </div>
                          <p className="text-sm text-slate-200">{response}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* GMB Content */}
              {activeTab === "content" && content && (
                <div className="p-5 space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    {[{ id: "description" as const, label: "Description" }, { id: "keywords" as const, label: "Keywords" }, { id: "reviews" as const, label: "Review Responses" }, { id: "schema" as const, label: "Schema JSON" }].map((tab) => (
                      <button key={tab.id} onClick={() => setContentTab(tab.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${contentTab === tab.id ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}>
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {contentTab === "description" && (
                    <div className="space-y-4">
                      {[{ label: "GMB Description (750 chars)", text: content.description, id: "desc" }, { label: "Short Description (250 chars)", text: content.shortDescription, id: "short" }].map((item) => (
                        <div key={item.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">{item.text.length} chars</span>
                              <CopyButton text={item.text} id={item.id} />
                            </div>
                          </div>
                          <p className="text-sm text-slate-200 leading-relaxed">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {contentTab === "keywords" && (
                    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
                      <div className="flex justify-between items-center p-3 border-b border-slate-700/50">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Local SEO Keywords</span>
                        <CopyButton text={content.keywords.map((k) => `${k.keyword} | ${k.intent} | ${k.geoModifier}`).join("\n")} id="keywords" />
                      </div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700/50">
                            {["Keyword", "Intent", "GEO Modifier"].map((h) => (
                              <th key={h} className="text-left px-3 py-2 text-xs text-slate-500 font-medium">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {content.keywords.map((kw, i) => (
                            <tr key={i} className="border-b border-slate-800/50 last:border-0">
                              <td className="px-3 py-2 text-slate-200 font-medium">{kw.keyword}</td>
                              <td className="px-3 py-2 text-slate-400 text-xs">{kw.intent}</td>
                              <td className="px-3 py-2 text-cyan-400 text-xs">{kw.geoModifier}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {contentTab === "reviews" && (
                    <div className="space-y-3">
                      {content.reviewTemplates.map((template, i) => (
                        <div key={i} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-slate-400">Template {i + 1}</span>
                            <CopyButton text={template} id={`review-${i}`} />
                          </div>
                          <p className="text-sm text-slate-200 leading-relaxed">{template}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {contentTab === "schema" && (
                    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50">
                      <div className="flex justify-between items-center p-3 border-b border-slate-700/50">
                        <div className="flex items-center gap-2">
                          <Code2 size={14} className="text-cyan-400" />
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">LocalBusiness JSON-LD Schema</span>
                        </div>
                        <CopyButton text={`<script type="application/ld+json">\n${content.schemaJson}\n</script>`} id="schema" />
                      </div>
                      <pre className="p-4 text-xs text-emerald-300 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">
                        {`<script type="application/ld+json">\n${content.schemaJson}\n</script>`}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {!audit && !loading && (
          <div className="text-center py-16 text-slate-600">
            <MapPin size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Enter a business name above to run your GEO audit</p>
          </div>
        )}
      </main>

      {/* Membership Modal */}
      <MembershipModal
        isOpen={membershipModalOpen}
        onClose={() => setMembershipModalOpen(false)}
        reason={membershipModalReason}
        auditRemaining={mockUser ? getAuditRemaining(mockUser) : 5}
      />
    </div>
  );
}
