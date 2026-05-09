import type { NAPAudit } from "./nap-parser";

export interface StoredAudit {
  businessName: string;
  city: string;
  state: string;
  score: number;
  issueCount: number;
  timestamp: number;
}

export interface Alert {
  type: "improvement" | "decline" | "stale" | "new_issues";
  message: string;
  delta?: number;
}

const STORAGE_KEY_PREFIX = "geo_audit_";
const HISTORY_KEY_PREFIX = "geo_audit_history_";
const DAYS_THRESHOLD = 14;
const MAX_HISTORY_ENTRIES = 12;

export interface HistoryEntry {
  score: number;
  issueCount: number;
  timestamp: number;
}

export function getStorageKey(businessName: string, city: string, state: string): string {
  return `${STORAGE_KEY_PREFIX}${businessName}_${city}_${state}`;
}

export function saveAudit(
  businessName: string,
  city: string,
  state: string,
  audit: NAPAudit
): void {
  if (typeof window === "undefined") return;

  const key = getStorageKey(businessName, city, state);
  const storedAudit: StoredAudit = {
    businessName,
    city,
    state,
    score: audit.score,
    issueCount: audit.issues.length,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(key, JSON.stringify(storedAudit));
  } catch (error) {
    console.error("Failed to save audit to localStorage:", error);
  }
}

export function loadAudit(
  businessName: string,
  city: string,
  state: string
): StoredAudit | null {
  if (typeof window === "undefined") return null;

  const key = getStorageKey(businessName, city, state);
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Failed to load audit from localStorage:", error);
    return null;
  }
}

export function getAlerts(currentAudit: NAPAudit, storedAudit: StoredAudit | null): Alert[] {
  if (!storedAudit) return [];

  const alerts: Alert[] = [];
  const daysSinceLastAudit = (Date.now() - storedAudit.timestamp) / (1000 * 60 * 60 * 24);
  const scoreDelta = currentAudit.score - storedAudit.score;
  const issuesAdded = currentAudit.issues.length - storedAudit.issueCount;

  if (daysSinceLastAudit > DAYS_THRESHOLD) {
    alerts.push({
      type: "stale",
      message: `Last scanned ${Math.floor(daysSinceLastAudit)} days ago — time for a fresh audit`,
    });
  }

  if (scoreDelta > 0) {
    alerts.push({
      type: "improvement",
      message: `Score improved by +${scoreDelta} points since last scan`,
      delta: scoreDelta,
    });
  } else if (scoreDelta < 0) {
    alerts.push({
      type: "decline",
      message: `Score dropped ${Math.abs(scoreDelta)} points since last scan`,
      delta: scoreDelta,
    });
  }

  if (issuesAdded > 0) {
    alerts.push({
      type: "new_issues",
      message: `${issuesAdded} new issue${issuesAdded > 1 ? "s" : ""} detected`,
    });
  }

  return alerts;
}

export function getHistoryKey(
  businessName: string,
  city: string,
  state: string
): string {
  return `${HISTORY_KEY_PREFIX}${businessName}_${city}_${state}`;
}

export function saveAuditHistory(
  businessName: string,
  city: string,
  state: string,
  score: number,
  issueCount: number
): void {
  if (typeof window === "undefined") return;

  const key = getHistoryKey(businessName, city, state);
  try {
    const existing = localStorage.getItem(key);
    const history: HistoryEntry[] = existing ? JSON.parse(existing) : [];

    history.push({
      score,
      issueCount,
      timestamp: Date.now(),
    });

    // Keep only last 12 entries
    if (history.length > MAX_HISTORY_ENTRIES) {
      history.shift();
    }

    localStorage.setItem(key, JSON.stringify(history));
  } catch (error) {
    console.error("Failed to save audit history:", error);
  }
}

export function loadAuditHistory(
  businessName: string,
  city: string,
  state: string
): HistoryEntry[] {
  if (typeof window === "undefined") return [];

  const key = getHistoryKey(businessName, city, state);
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load audit history:", error);
    return [];
  }
}
