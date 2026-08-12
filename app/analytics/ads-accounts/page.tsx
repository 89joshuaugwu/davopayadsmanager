"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Printer, SlidersHorizontal, Wallet, TrendingDown, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";
import MultiSelectCheckbox from "@/components/MultiSelectCheckbox";
import { useAuth } from "@/lib/AuthContext";
import {
  GmailAccountPublic,
  BusinessCenter,
  AdsAccount,
  AdsDailyLog,
  AdsAccountStatus,
  ADS_STATUS_OPTIONS,
} from "@/lib/types";
import { formatCurrency, formatDate, isHighCpa } from "@/lib/utils";
import { aggregateSpendByDate, sumByKey, STATUS_CHART_COLORS, CHART_LINE_COLOR, CHART_SECONDARY_COLOR } from "@/lib/chartUtils";

function parseCsv(value: string | null): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

function AdsAccountsAnalyticsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, getToken } = useAuth();

  const [gmailAccounts, setGmailAccounts] = useState<GmailAccountPublic[]>([]);
  const [businessCenters, setBusinessCenters] = useState<BusinessCenter[]>([]);
  const [adsAccounts, setAdsAccounts] = useState<AdsAccount[]>([]);
  const [dailyLogs, setDailyLogs] = useState<AdsDailyLog[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [gmailIds, setGmailIds] = useState<string[]>(parseCsv(searchParams.get("gmailAccountIds")));
  const [bcIds, setBcIds] = useState<string[]>(parseCsv(searchParams.get("businessCenterIds")));
  const [adsIds, setAdsIds] = useState<string[]>(parseCsv(searchParams.get("adsAccountIds")));
  const [statuses, setStatuses] = useState<AdsAccountStatus[]>(
    parseCsv(searchParams.get("statuses")) as AdsAccountStatus[]
  );
  const [start, setStart] = useState(searchParams.get("start") || "");
  const [end, setEnd] = useState(searchParams.get("end") || "");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const loadData = useCallback(async () => {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [gmailRes, bcRes, adsRes, logsRes] = await Promise.all([
        fetch("/api/gmail-accounts", { headers }),
        fetch("/api/business-centers", { headers }),
        fetch("/api/ads-accounts", { headers }),
        fetch("/api/ads-daily-logs", { headers }),
      ]);
      setGmailAccounts((await gmailRes.json()).accounts || []);
      setBusinessCenters((await bcRes.json()).centers || []);
      setAdsAccounts((await adsRes.json()).accounts || []);
      setDailyLogs((await logsRes.json()).logs || []);
    } catch {
      toast.error("Failed to load analytics data.");
    } finally {
      setDataLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  // Business centers narrow to the selected Gmail accounts; ads accounts narrow
  // to the selected business centers — so each filter level respects the ones above it.
  const availableBcs = useMemo(
    () => (gmailIds.length ? businessCenters.filter((bc) => gmailIds.includes(bc.gmailAccountId)) : businessCenters),
    [businessCenters, gmailIds]
  );
  const availableAds = useMemo(() => {
    const scopedBcIds = bcIds.length ? bcIds : availableBcs.map((bc) => bc.id);
    return adsAccounts.filter((a) => scopedBcIds.includes(a.businessCenterId));
  }, [adsAccounts, bcIds, availableBcs]);

  const filteredAccounts = useMemo(() => {
    return adsAccounts.filter((a) => {
      const bc = businessCenters.find((b) => b.id === a.businessCenterId);
      if (gmailIds.length && (!bc || !gmailIds.includes(bc.gmailAccountId))) return false;
      if (bcIds.length && !bcIds.includes(a.businessCenterId)) return false;
      if (adsIds.length && !adsIds.includes(a.id)) return false;
      if (statuses.length && !statuses.includes(a.status)) return false;
      return true;
    });
  }, [adsAccounts, businessCenters, gmailIds, bcIds, adsIds, statuses]);

  const filteredAccountIds = useMemo(() => new Set(filteredAccounts.map((a) => a.id)), [filteredAccounts]);

  const filteredLogs = useMemo(() => {
    return dailyLogs.filter((log) => {
      if (!filteredAccountIds.has(log.adsAccountId)) return false;
      if (start && log.date < start) return false;
      if (end && log.date > end) return false;
      return true;
    });
  }, [dailyLogs, filteredAccountIds, start, end]);

  const hasDateFilter = Boolean(start || end);

  const totalSpent = hasDateFilter
    ? filteredLogs.reduce((sum, l) => sum + l.amountSpent, 0)
    : filteredAccounts.reduce((sum, a) => sum + a.amountSpent, 0);

  const totalLost = filteredAccounts
    .filter((a) => a.status === "blocked" || a.status === "closed")
    .reduce((sum, a) => sum + a.fundsLost, 0);

  const highCpaCount = filteredAccounts.filter((a) => isHighCpa(a.cpa)).length;

  const spendTimeSeries = useMemo(() => aggregateSpendByDate(filteredLogs), [filteredLogs]);

  const spendByAccount = useMemo(() => {
    const base = hasDateFilter
      ? sumByKey(filteredLogs, (l) => l.adsAccountId, (l) => l.amountSpent)
      : filteredAccounts.map((a) => ({ name: a.id, value: a.amountSpent }));
    return base
      .map((b) => ({
        name: adsAccounts.find((a) => a.id === b.name)?.name || "—",
        value: b.value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredLogs, filteredAccounts, adsAccounts, hasDateFilter]);

  const statusBreakdown = useMemo(
    () =>
      ADS_STATUS_OPTIONS.map((s) => ({
        name: s,
        value: filteredAccounts.filter((a) => a.status === s).length,
      })).filter((s) => s.value > 0),
    [filteredAccounts]
  );

  function clearFilters() {
    setGmailIds([]);
    setBcIds([]);
    setAdsIds([]);
    setStatuses([]);
    setStart("");
    setEnd("");
  }

  const activeFilterCount =
    gmailIds.length + bcIds.length + adsIds.length + statuses.length + (start ? 1 : 0) + (end ? 1 : 0);

  const filterContent = (
    <>
      <MultiSelectCheckbox
        label="Gmail accounts"
        options={gmailAccounts.map((g) => ({ id: g.id, label: g.email }))}
        selected={gmailIds}
        onChange={setGmailIds}
        searchable
      />
      <MultiSelectCheckbox
        label="Business centers"
        options={availableBcs.map((bc) => ({ id: bc.id, label: bc.name }))}
        selected={bcIds}
        onChange={setBcIds}
        searchable
      />
      <MultiSelectCheckbox
        label="Ads accounts"
        options={availableAds.map((a) => ({ id: a.id, label: a.name }))}
        selected={adsIds}
        onChange={setAdsIds}
        searchable
      />
      <MultiSelectCheckbox
        label="Status"
        options={ADS_STATUS_OPTIONS.map((s) => ({ id: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
        selected={statuses}
        onChange={(ids) => setStatuses(ids as AdsAccountStatus[])}
      />
      <div>
        <p className="text-xs font-semibold text-davo-navy uppercase tracking-wide mb-2">Date range</p>
        <div className="space-y-2 mb-2">
          <div>
            <label className="text-[10px] text-davo-muted block mb-1">From</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full min-w-0 h-9 px-2 rounded-lg border border-davo-border text-xs outline-none focus:border-davo-blue"
            />
          </div>
          <div>
            <label className="text-[10px] text-davo-muted block mb-1">To</label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full min-w-0 h-9 px-2 rounded-lg border border-davo-border text-xs outline-none focus:border-davo-blue"
            />
          </div>
        </div>
      </div>
      {activeFilterCount > 0 && (
        <button
          onClick={clearFilters}
          className="w-full h-9 rounded-lg border border-davo-border text-xs font-medium text-davo-danger hover:bg-davo-danger-bg transition-colors"
        >
          Clear all filters
        </button>
      )}
    </>
  );

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-davo-bg">
        <div className="w-8 h-8 border-3 border-davo-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppShell>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 no-print">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-davo-navy">Ads Account Analysis</h1>
            <p className="text-sm text-davo-muted mt-0.5">
              {filteredAccounts.length} account{filteredAccounts.length !== 1 ? "s" : ""} matched
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFiltersOpen(true)}
              className="lg:hidden h-11 px-4 rounded-full border border-davo-border text-davo-navy font-medium text-sm hover:bg-white transition-colors flex items-center gap-2"
            >
              <SlidersHorizontal size={16} /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
            <button
              onClick={() => window.print()}
              className="h-11 px-5 rounded-full bg-davo-blue text-white font-semibold text-sm hover:bg-davo-blue-dark transition-colors flex items-center gap-2"
            >
              <Printer size={16} /> Print / Export PDF
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          {/* Desktop filter panel */}
          <aside className="hidden lg:block min-w-0 bg-white border border-davo-border rounded-xl2 p-4 h-fit sticky top-24 no-print">
            {filterContent}
          </aside>

          <div id="report-print-area" className="space-y-4 sm:space-y-6 print-page">
            {dataLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-3 border-davo-blue border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-white border border-davo-border rounded-xl2 p-4 sm:p-5 shadow-card">
                    <div className="w-9 h-9 rounded-full bg-davo-blue/10 flex items-center justify-center mb-3">
                      <Wallet size={18} className="text-davo-blue" />
                    </div>
                    <p className="text-xs sm:text-sm text-davo-muted font-medium mb-1">
                      Total Spent {hasDateFilter ? "(range)" : "(all time)"}
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-davo-blue tracking-tight">
                      {formatCurrency(totalSpent)}
                    </p>
                  </div>
                  <div className="bg-white border border-davo-border rounded-xl2 p-4 sm:p-5 shadow-card">
                    <div className="w-9 h-9 rounded-full bg-davo-danger-bg flex items-center justify-center mb-3">
                      <TrendingDown size={18} className="text-davo-danger" />
                    </div>
                    <p className="text-xs sm:text-sm text-davo-muted font-medium mb-1">Total Lost</p>
                    <p className="text-lg sm:text-2xl font-bold text-davo-danger tracking-tight">
                      {formatCurrency(totalLost)}
                    </p>
                  </div>
                  <div className="bg-white border border-davo-border rounded-xl2 p-4 sm:p-5 shadow-card col-span-2 lg:col-span-1">
                    <div className="w-9 h-9 rounded-full bg-davo-warn-bg flex items-center justify-center mb-3">
                      <AlertTriangle size={18} className="text-davo-warn" />
                    </div>
                    <p className="text-xs sm:text-sm text-davo-muted font-medium mb-1">High-CPA Accounts</p>
                    <p className="text-lg sm:text-2xl font-bold text-davo-warn tracking-tight">{highCpaCount}</p>
                  </div>
                </div>

                <div className="bg-white border border-davo-border rounded-xl2 p-4 sm:p-5 shadow-card">
                  <h3 className="text-sm font-semibold text-davo-navy mb-4">Daily spend & CPA over time</h3>
                  {spendTimeSeries.length === 0 ? (
                    <p className="text-sm text-davo-muted py-8 text-center">
                      No daily logs yet for these filters. Use "Log daily spend" on an ads account to start tracking.
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={spendTimeSeries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F5" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => formatDate(d)} />
                        <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                        <Tooltip
                          labelFormatter={(d) => formatDate(String(d))}
                          formatter={(value: number, name: string) => [formatCurrency(value), name]}
                        />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="spend" name="Spend" stroke={CHART_LINE_COLOR} strokeWidth={2} dot={false} />
                        <Line yAxisId="right" type="monotone" dataKey="cpa" name="Avg CPA" stroke={CHART_SECONDARY_COLOR} strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-white border border-davo-border rounded-xl2 p-4 sm:p-5 shadow-card">
                    <h3 className="text-sm font-semibold text-davo-navy mb-4">Top accounts by spend</h3>
                    {spendByAccount.length === 0 ? (
                      <p className="text-sm text-davo-muted py-8 text-center">No data for these filters.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={spendByAccount} layout="vertical" margin={{ left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F5" />
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Bar dataKey="value" fill={CHART_LINE_COLOR} radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div className="bg-white border border-davo-border rounded-xl2 p-4 sm:p-5 shadow-card">
                    <h3 className="text-sm font-semibold text-davo-navy mb-4">Status breakdown</h3>
                    {statusBreakdown.length === 0 ? (
                      <p className="text-sm text-davo-muted py-8 text-center">No data for these filters.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={statusBreakdown}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            label={(entry) => `${entry.name} (${entry.value})`}
                          >
                            {statusBreakdown.map((entry) => (
                              <Cell key={entry.name} fill={STATUS_CHART_COLORS[entry.name] || "#5B6785"} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Mobile filter drawer */}
      <Modal open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters">
        <div className="space-y-1">{filterContent}</div>
        <button
          onClick={() => setFiltersOpen(false)}
          className="w-full h-11 mt-4 rounded-full bg-davo-blue text-white font-semibold text-sm hover:bg-davo-blue-dark transition-colors"
        >
          Apply filters
        </button>
      </Modal>
    </AppShell>
  );
}

export default function AdsAccountsAnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-davo-bg">
          <div className="w-8 h-8 border-3 border-davo-blue border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AdsAccountsAnalyticsInner />
    </Suspense>
  );
}
