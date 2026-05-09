import type { NAPAudit } from "./nap-parser";
import { randomUUID } from "crypto";

export interface SavedBusiness {
  id: string;
  businessName: string;
  city: string;
  state: string;
  trade?: string;
  score: number;
  issueCount: number;
  savedAt: number;
  audit: NAPAudit;
}

const STORAGE_KEY = "geo_saved_businesses";

export function getAllBusinesses(): SavedBusiness[] {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load businesses from localStorage:", error);
    return [];
  }
}

export function saveBusinessAudit(
  businessName: string,
  city: string,
  state: string,
  trade: string | undefined,
  audit: NAPAudit
): SavedBusiness {
  if (typeof window === "undefined") {
    throw new Error("saveBusinessAudit can only be called in the browser");
  }

  const businesses = getAllBusinesses();

  // Check if business already exists (same name, city, state)
  const existingIndex = businesses.findIndex(
    (b) =>
      b.businessName.toLowerCase() === businessName.toLowerCase() &&
      b.city.toLowerCase() === city.toLowerCase() &&
      b.state.toLowerCase() === state.toLowerCase()
  );

  const savedBusiness: SavedBusiness = {
    id: existingIndex >= 0 ? businesses[existingIndex].id : randomUUID(),
    businessName,
    city,
    state,
    trade,
    score: audit.score,
    issueCount: audit.issues.length,
    savedAt: Date.now(),
    audit,
  };

  if (existingIndex >= 0) {
    businesses[existingIndex] = savedBusiness;
  } else {
    businesses.push(savedBusiness);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(businesses));
  } catch (error) {
    console.error("Failed to save businesses to localStorage:", error);
  }

  return savedBusiness;
}

export function deleteBusinessAudit(id: string): void {
  if (typeof window === "undefined") return;

  const businesses = getAllBusinesses();
  const filtered = businesses.filter((b) => b.id !== id);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to delete business from localStorage:", error);
  }
}

export function getBusinessById(id: string): SavedBusiness | null {
  const businesses = getAllBusinesses();
  return businesses.find((b) => b.id === id) || null;
}

export function exportAllBusinesses(): string {
  const businesses = getAllBusinesses();
  return JSON.stringify(businesses, null, 2);
}
