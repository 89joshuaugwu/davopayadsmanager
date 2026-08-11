"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Printer, UploadCloud, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DateRangeFilter from "@/components/DateRangeFilter";
import ReportView from "@/components/ReportView";
import { useAuth } from "@/lib/AuthContext";
import { computeTotals, filterByDateRange, formatDate } from "@/lib/utils";
import { GmailAccountPublic, BusinessCenter, AdsAccount } from "@/lib/types";

export default function ReportsPage() {
  const router = useRouter();
  const { user, loading: authLoading, getToken } = useAuth();

  const [gmailAccounts, setGmailAccounts] = useState<GmailAccountPublic[]>([]);
  const [businessCenters, setBusinessCenters] = useState<BusinessCenter[]>([]);
  const [adsAccounts, setAdsAccounts] = useState<AdsAccount[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  const loadData = useCallback(async () => {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [gmailRes, bcRes, adsRes] = await Promise.all([
        fetch("/api/gmail-accounts", { headers }),
        fetch("/api/business-centers", { headers }),
        fetch("/api/ads-accounts", { headers }),
      ]);

      const gmailData = await gmailRes.json();
      const bcData = await bcRes.json();
      const adsData = await adsRes.json();

      setGmailAccounts(gmailData.accounts || []);
      setBusinessCenters(bcData.centers || []);
      setAdsAccounts(adsData.accounts || []);
    } catch {
      toast.error("Failed to load report data.");
    } finally {
      setDataLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const filteredCenters = useMemo(
    () => filterByDateRange(businessCenters, start || null, end || null, "dateFunded"),
    [businessCenters, start, end]
  );
  const filteredAds = useMemo(
    () => filterByDateRange(adsAccounts, start || null, end || null, "dateUpdated"),
    [adsAccounts, start, end]
  );
  const totals = useMemo(
    () => computeTotals(filteredCenters, filteredAds),
    [filteredCenters, filteredAds]
  );

  const rangeLabel =
    start && end
      ? `${formatDate(start)} — ${formatDate(end)}`
      : "All time";

  function handlePrint() {
    window.print();
  }

  async function handleSaveToCloudinary() {
    setUploading(true);
    try {
      const token = await getToken();

      // Capture the report area as a simple HTML snapshot encoded as a data URL.
      // For a pixel-perfect PDF, print to PDF via the browser's print dialog (handlePrint);
      // this path is for keeping a quick record copy alongside client documents in Cloudinary.
      const reportEl = document.getElementById("report-print-area");
      if (!reportEl) throw new Error("Report not found.");

      const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>DavoPay Report ${rangeLabel}</title></head><body>${reportEl.outerHTML}</body></html>`;
      const base64 = `data:text/html;base64,${btoa(unescape(encodeURIComponent(htmlContent)))}`;

      const res = await fetch("/api/cloudinary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          file: base64,
          filename: `davopay-report-${start || "all"}-to-${end || "all"}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");

      toast.success("Report saved to Cloudinary.");
      window.open(data.url, "_blank");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save report.");
    } finally {
      setUploading(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-davo-bg">
        <div className="w-8 h-8 border-3 border-davo-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-davo-bg">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-davo-navy">Reports</h1>
            <p className="text-sm text-davo-muted mt-0.5">
              Filter by date and export for your bosses.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleSaveToCloudinary}
              disabled={uploading}
              className="flex-1 sm:flex-initial h-11 px-4 rounded-full border border-davo-border text-davo-navy font-medium text-sm hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
              Save copy
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial h-11 px-5 rounded-full bg-davo-blue text-white font-semibold text-sm hover:bg-davo-blue-dark transition-colors flex items-center justify-center gap-2"
            >
              <Printer size={16} /> Print / Export PDF
            </button>
          </div>
        </div>

        <DateRangeFilter start={start} end={end} onChange={(s, e) => { setStart(s); setEnd(e); }} />

        {dataLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-davo-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ReportView
            gmailAccounts={gmailAccounts}
            businessCenters={filteredCenters}
            adsAccounts={filteredAds}
            totals={totals}
            rangeLabel={rangeLabel}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
