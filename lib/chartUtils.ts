import { AdsDailyLog, BusinessCenterFunding } from "./types";

export interface DailySpendPoint {
  date: string;
  spend: number;
  cpa: number;
}

/**
 * Aggregate ads daily logs into one point per date (sum of spend, average CPA
 * across whichever accounts logged that day), sorted oldest -> newest for charts.
 */
export function aggregateSpendByDate(logs: AdsDailyLog[]): DailySpendPoint[] {
  const map = new Map<string, { spend: number; cpaSum: number; cpaCount: number }>();

  for (const log of logs) {
    const bucket = map.get(log.date) || { spend: 0, cpaSum: 0, cpaCount: 0 };
    bucket.spend += log.amountSpent || 0;
    if (log.cpa) {
      bucket.cpaSum += log.cpa;
      bucket.cpaCount += 1;
    }
    map.set(log.date, bucket);
  }

  return Array.from(map.entries())
    .map(([date, v]) => ({
      date,
      spend: Math.round(v.spend * 100) / 100,
      cpa: v.cpaCount ? Math.round((v.cpaSum / v.cpaCount) * 100) / 100 : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface FundingPoint {
  date: string;
  amount: number;
}

/** Aggregate funding entries into one point per date (sum), oldest -> newest. */
export function aggregateFundingByDate(entries: BusinessCenterFunding[]): FundingPoint[] {
  const map = new Map<string, number>();
  for (const e of entries) {
    map.set(e.date, (map.get(e.date) || 0) + (e.amount || 0));
  }
  return Array.from(map.entries())
    .map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface NamedTotal {
  name: string;
  value: number;
}

export function sumByKey<T>(
  items: T[],
  keyFn: (item: T) => string,
  valueFn: (item: T) => number
): NamedTotal[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    map.set(key, (map.get(key) || 0) + valueFn(item));
  }
  return Array.from(map.entries()).map(([name, value]) => ({
    name,
    value: Math.round(value * 100) / 100,
  }));
}

export const STATUS_CHART_COLORS: Record<string, string> = {
  active: "#12B76A",
  paused: "#F5A623",
  blocked: "#E23744",
  closed: "#5B6785",
};

export const CHART_LINE_COLOR = "#0051CF";
export const CHART_SECONDARY_COLOR = "#F5A623";
