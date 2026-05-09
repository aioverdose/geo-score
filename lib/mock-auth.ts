// Mock authentication system for testing monetization UX
// Uses localStorage to simulate user plan and audit count

export type UserPlan = "free" | "pro";

export interface MockUser {
  plan: UserPlan;
  auditCount: number;
  auditResetDate: number;
  email?: string;
}

const STORAGE_KEY = "geo_mock_user";
const AUDITS_PER_MONTH = 5;

function getResetDate(): number {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.getTime();
}

export function initMockUser(): MockUser {
  if (typeof window === "undefined") {
    return { plan: "free", auditCount: 0, auditResetDate: getResetDate() };
  }

  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    return JSON.parse(existing);
  }

  const newUser: MockUser = {
    plan: "free",
    auditCount: 0,
    auditResetDate: getResetDate(),
    email: undefined,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
  return newUser;
}

export function getMockUser(): MockUser {
  if (typeof window === "undefined") {
    return { plan: "free", auditCount: 0, auditResetDate: getResetDate() };
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return initMockUser();

  const user = JSON.parse(stored) as MockUser;

  // Reset audit count if month has passed
  if (Date.now() > user.auditResetDate) {
    user.auditCount = 0;
    user.auditResetDate = getResetDate();
    saveMockUser(user);
  }

  return user;
}

export function saveMockUser(user: MockUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function incrementAuditCount(): void {
  const user = getMockUser();
  user.auditCount += 1;
  saveMockUser(user);
}

export function upgradeToPro(): void {
  const user = getMockUser();
  user.plan = "pro";
  saveMockUser(user);
}

export function downgradeToFree(): void {
  const user = getMockUser();
  user.plan = "free";
  user.auditCount = 0;
  saveMockUser(user);
}

export function canAudit(user: MockUser): boolean {
  if (user.plan === "pro") return true;
  return user.auditCount < AUDITS_PER_MONTH;
}

export function getAuditRemaining(user: MockUser): number {
  if (user.plan === "pro") return Infinity;
  return Math.max(0, AUDITS_PER_MONTH - user.auditCount);
}

export function resetMockUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  initMockUser();
}
