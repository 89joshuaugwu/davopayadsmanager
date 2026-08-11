import {
  AdsAccount,
  BusinessCenter,
  CPA_ALERT_THRESHOLD,
  FinancialTotals,
} from "./types";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isHighCpa(cpa: number): boolean {
  return cpa > CPA_ALERT_THRESHOLD;
}

export function isLossStatus(status: string): boolean {
  return status === "blocked" || status === "closed";
}

/**
 * Aggregate totals across all business centers + ads accounts.
 * Total Funded = sum(businessCenters.amountFunded)
 * Total Spent = sum(adsAccounts.amountSpent)
 * Total Lost = sum(adsAccounts.fundsLost) where status is blocked/closed
 * Remaining Balance = Total Funded - Total Spent - Total Lost
 */
export function computeTotals(
  businessCenters: BusinessCenter[],
  adsAccounts: AdsAccount[]
): FinancialTotals {
  const totalFunded = businessCenters.reduce(
    (sum, bc) => sum + (bc.amountFunded || 0),
    0
  );
  const totalSpent = adsAccounts.reduce(
    (sum, a) => sum + (a.amountSpent || 0),
    0
  );
  const totalLost = adsAccounts.reduce((sum, a) => {
    return isLossStatus(a.status) ? sum + (a.fundsLost || 0) : sum;
  }, 0);
  const highCpaCount = adsAccounts.filter((a) => isHighCpa(a.cpa)).length;

  return {
    totalFunded,
    totalSpent,
    totalLost,
    remainingBalance: totalFunded - totalSpent - totalLost,
    highCpaCount,
  };
}

export function filterByDateRange<T extends { dateFunded?: string; dateUpdated?: string; dateCreated?: string }>(
  items: T[],
  start: string | null,
  end: string | null,
  dateField: "dateFunded" | "dateUpdated" | "dateCreated"
): T[] {
  if (!start && !end) return items;
  return items.filter((item) => {
    const raw = item[dateField];
    if (!raw) return false;
    const t = new Date(raw).getTime();
    if (start && t < new Date(start).getTime()) return false;
    if (end && t > new Date(end).getTime() + 86399999) return false;
    return true;
  });
}

export function getPresetRange(
  preset: "today" | "week" | "month"
): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  let start = end;

  if (preset === "today") {
    start = end;
  } else if (preset === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    start = d.toISOString().slice(0, 10);
  } else if (preset === "month") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    start = d.toISOString().slice(0, 10);
  }
  return { start, end };
}

export function statusBadgeClasses(status: string): string {
  switch (status) {
    case "active":
      return "bg-davo-success-bg text-davo-success";
    case "paused":
      return "bg-davo-warn-bg text-davo-warn";
    case "blocked":
    case "closed":
    case "disabled":
      return "bg-davo-danger-bg text-davo-danger";
    default:
      return "bg-davo-border text-davo-muted";
  }
}
