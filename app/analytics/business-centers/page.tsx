"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Printer, SlidersHorizontal, Wallet, Building2, ListChecks } from "lucide-react";
import toast from "react-hot-toast";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";
import MultiSelectCheckbox from "@/components/MultiSelectCheckbox";
import { useAuth } from "@/lib/AuthContext";
import { GmailAccountPublic, BusinessCenter, BusinessCenterFunding } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { aggregateFundingByDate, CHART_LINE_COLOR } from "@/lib/chartUtils";

function parseCsv(value: string | null): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

function BusinessCenterAnalyticsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, getToken } = useAuth();

  const [gmailAccounts, setGmailAccounts] = useState<GmailAccountPublic[]>([]);
  const [businessCenters, setBusinessCenters] = useState<BusinessCenter[]>([]);
  const [fundingEntries, setFundingEntries] = useState<BusinessCenterFunding[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [gmailIds, setGmailIds] = useState<string[]>(parseCsv(searchParams.get("gmailAccountIds")));
  const [bcIds, setBcIds] = useState<string[]>(parseCsv(searchParams.get("businessCenterIds")));
  const [start, setStart] = useState(searchParams.get("start") || "");
  const [end, setEnd] = useState(searchParams.get("end") || "");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const loadData = useCallback(async () => {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [gmailRes, bcRes, fundingRes] = await Promise.all([
        fetch("/api/gmail-accounts", { headers }),
        fetch("/api/business-centers", { headers }),
        fetch("/api/business-center-funding", { headers }),
      ]);
      setGmailAccounts((await gmailRes.json()).accounts || []);
      setBusinessCenters((await bcRes.json()).centers || []);
      setFundingEntries((await fundingRes.json()).entries || []);
    } catch {
      toast.error("Failed to load analytics data.");
    } finally {
      setDataLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const availableBcs = useMemo(
    () => (gmailIds.length ? businessCenters.filter((bc) => gmailIds.includes(bc.gmailAccountId)) : businessCenters),
    [businessCenters, gmailIds]
  );

  const filteredCenters = useMemo(() => {
    return businessCenters.filter((bc) => {
      if (gmailIds.length && !gmailIds.includes(bc.gmailAccountId)) return false;
      if (bcIds.length && !bcIds.includes(bc.id)) return false;
      return true;
    });
  }, [businessCenters, gmailIds, bcIds]);

  const filteredBcIds = useMemo(() => new Set(filteredCenters.map((bc) => bc.id)), [filteredCenters]);

  const filteredEntries = useMemo(() => {
    return fundingEntries.filter((e) => {
      if (!filteredBcIds.has(e.businessCenterId)) return false;
      if (start && e.date < start) return false;
      if (end && e.date > end) return false;
      return true;
    });
  }, [fundingEntries, filteredBcIds, start, end]);

  const hasDateFilter = Boolean(start || end);

  const totalFunded = hasDateFilter
    ? filteredEntries.reduce((sum, e) => sum + e.amount, 0)
    : filteredCenters.reduce((sum, bc) => sum + bc.amountFunded, 0);

  const fundingTimeSeries = useMemo(() => aggregateFundingByDate(filteredEntries), [filteredEntries]);

  const fundedByBc = useMemo(() => {
    return filteredCenters
      .map((bc) => ({
        name: bc.name,
        value: hasDateFilter
          ? filteredEntries.filter((e) => e.businessCenterId === bc.id).reduce((s, e) => s + e.amount, 0)
          : bc.amountFunded,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredCenters, filteredEntries, hasDateFilter]);

  function clearFilters() {
    setGmailIds([]);
    setBcIds([]);
    setStart("");
    setEnd("");
  }

  const activeFilterCount = gmailIds.length + bcIds.length + (start ? 1 : 0) + (end ? 1 : 0);

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
            <h1 className="text-xl sm:text-2xl font-bold text-davo-navy">Business Center Analysis</h1>
            <p className="text-sm text-davo-muted mt-0.5">
              {filteredCenters.length} business center{filteredCenters.length !== 1 ? "s" : ""} matched
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
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-white border border-davo-border rounded-xl2 p-4 sm:p-5 shadow-card">
                    <div className="w-9 h-9 rounded-full bg-davo-blue/10 flex items-center justify-center mb-3">
                      <Wallet size={18} className="text-davo-blue" />
                    </div>
                    <p className="text-xs sm:text-sm text-davo-muted font-medium mb-1">
                      Total Funded {hasDateFilter ? "(range)" : "(all time)"}
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-davo-blue tracking-tight">
                      {formatCurrency(totalFunded)}
                    </p>
                  </div>
                  <div className="bg-white border border-davo-border rounded-xl2 p-4 sm:p-5 shadow-card">
                    <div className="w-9 h-9 rounded-full bg-davo-dark/10 flex items-center justify-center mb-3">
                      <Building2 size={18} className="text-davo-dark" />
                    </div>
                    <p className="text-xs sm:text-sm text-davo-muted font-medium mb-1">Business Centers</p>
                    <p className="text-lg sm:text-2xl font-bold text-davo-navy tracking-tight">
                      {filteredCenters.length}
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-davo-border rounded-xl2 p-4 sm:p-5 shadow-card">
                  <h3 className="text-sm font-semibold text-davo-navy mb-4">Funding over time</h3>
                  {fundingTimeSeries.length === 0 ? (
                    <p className="text-sm text-davo-muted py-8 text-center">
                      No funding entries yet for these filters. Use "Add funding" on a business center to start tracking.
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={fundingTimeSeries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F5" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => formatDate(d)} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          labelFormatter={(d) => formatDate(String(d))}
                          formatter={(value: number) => [formatCurrency(value), "Funded"]}
                        />
                        <Line type="monotone" dataKey="amount" stroke={CHART_LINE_COLOR} strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="bg-white border border-davo-border rounded-xl2 p-4 sm:p-5 shadow-card">
                  <h3 className="text-sm font-semibold text-davo-navy mb-4">Total funded by business center</h3>
                  {fundedByBc.length === 0 ? (
                    <p className="text-sm text-davo-muted py-8 text-center">No data for these filters.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={Math.max(200, fundedByBc.length * 40)}>
                      <BarChart data={fundedByBc} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F5" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Bar dataKey="value" fill={CHART_LINE_COLOR} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="bg-white border border-davo-border rounded-xl2 p-4 sm:p-5 shadow-card">
                  <div className="flex items-center gap-2 mb-4">
                    <ListChecks size={16} className="text-davo-muted" />
                    <h3 className="text-sm font-semibold text-davo-navy">Funding entries</h3>
                  </div>
                  <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                    <table className="w-full text-xs sm:text-sm min-w-[420px]">
                      <thead>
                        <tr className="text-left text-davo-muted border-b border-davo-border">
                          <th className="py-2 pr-3 font-medium">Business center</th>
                          <th className="py-2 pr-3 font-medium">Amount</th>
                          <th className="py-2 pr-3 font-medium">Date</th>
                          <th className="py-2 font-medium">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEntries.map((e) => (
                          <tr key={e.id} className="border-b border-davo-border/60">
                            <td className="py-2 pr-3 text-davo-navy font-medium">
                              {businessCenters.find((bc) => bc.id === e.businessCenterId)?.name || "—"}
                            </td>
                            <td className="py-2 pr-3 text-davo-navy">{formatCurrency(e.amount)}</td>
                            <td className="py-2 pr-3 text-davo-muted">{formatDate(e.date)}</td>
                            <td className="py-2 text-davo-muted">{e.note || "—"}</td>
                          </tr>
                        ))}
                        {filteredEntries.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-davo-muted">
                              No funding entries in this range.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

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

export default function BusinessCenterAnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-davo-bg">
          <div className="w-8 h-8 border-3 border-davo-blue border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BusinessCenterAnalyticsInner />
    </Suspense>
  );
}
