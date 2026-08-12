"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Inbox } from "lucide-react";
import toast from "react-hot-toast";
import AppShell from "@/components/AppShell";
import FinancialSummary from "@/components/FinancialSummary";
import GmailAccountCard from "@/components/GmailAccountCard";
import AddGmailModal from "@/components/AddGmailModal";
import AddBusinessCenterModal from "@/components/AddBusinessCenterModal";
import AddAdsAccountModal from "@/components/AddAdsAccountModal";
import AddFundingModal from "@/components/AddFundingModal";
import AddDailyLogModal from "@/components/AddDailyLogModal";
import PasswordDecryptModal from "@/components/PasswordDecryptModal";
import ConfirmModal from "@/components/ConfirmModal";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/lib/AuthContext";
import { computeTotals } from "@/lib/utils";
import {
  GmailAccountPublic,
  BusinessCenter,
  AdsAccount,
} from "@/lib/types";

type DeleteTarget =
  | { type: "gmail"; item: GmailAccountPublic }
  | { type: "businessCenter"; item: BusinessCenter }
  | { type: "adsAccount"; item: AdsAccount }
  | null;

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, getToken } = useAuth();

  const [gmailAccounts, setGmailAccounts] = useState<GmailAccountPublic[]>([]);
  const [businessCenters, setBusinessCenters] = useState<BusinessCenter[]>([]);
  const [adsAccounts, setAdsAccounts] = useState<AdsAccount[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal state
  const [gmailModalOpen, setGmailModalOpen] = useState(false);
  const [editingGmail, setEditingGmail] = useState<GmailAccountPublic | null>(null);

  const [bcModalOpen, setBcModalOpen] = useState(false);
  const [bcParentGmailId, setBcParentGmailId] = useState<string | null>(null);
  const [editingBc, setEditingBc] = useState<BusinessCenter | null>(null);

  const [adsModalOpen, setAdsModalOpen] = useState(false);
  const [adsParentBcId, setAdsParentBcId] = useState<string | null>(null);
  const [editingAds, setEditingAds] = useState<AdsAccount | null>(null);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<GmailAccountPublic | null>(null);

  const [fundingModalOpen, setFundingModalOpen] = useState(false);
  const [fundingTarget, setFundingTarget] = useState<BusinessCenter | null>(null);

  const [dailyLogModalOpen, setDailyLogModalOpen] = useState(false);
  const [dailyLogTarget, setDailyLogTarget] = useState<AdsAccount | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [deleting, setDeleting] = useState(false);

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

      if (!gmailRes.ok || !bcRes.ok || !adsRes.ok) {
        throw new Error("Failed to load account data.");
      }

      const gmailData = await gmailRes.json();
      const bcData = await bcRes.json();
      const adsData = await adsRes.json();

      setGmailAccounts(gmailData.accounts || []);
      setBusinessCenters(bcData.centers || []);
      setAdsAccounts(adsData.accounts || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setDataLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const totals = useMemo(
    () => computeTotals(businessCenters, adsAccounts),
    [businessCenters, adsAccounts]
  );

  const filteredGmailAccounts = useMemo(() => {
    if (!search.trim()) return gmailAccounts;
    const q = search.toLowerCase();
    return gmailAccounts.filter((g) => {
      if (g.email.toLowerCase().includes(q)) return true;
      const centers = businessCenters.filter((bc) => bc.gmailAccountId === g.id);
      if (centers.some((c) => c.name.toLowerCase().includes(q))) return true;
      const bcIds = centers.map((c) => c.id);
      return adsAccounts.some(
        (a) => bcIds.includes(a.businessCenterId) && a.name.toLowerCase().includes(q)
      );
    });
  }, [gmailAccounts, businessCenters, adsAccounts, search]);

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      let url = "";
      if (deleteTarget.type === "gmail") url = `/api/gmail-accounts/${deleteTarget.item.id}`;
      if (deleteTarget.type === "businessCenter") url = `/api/business-centers/${deleteTarget.item.id}`;
      if (deleteTarget.type === "adsAccount") url = `/api/ads-accounts/${deleteTarget.item.id}`;

      const res = await fetch(url, { method: "DELETE", headers });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete.");
      }

      toast.success("Deleted successfully.");
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete.");
    } finally {
      setDeleting(false);
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
    <AppShell>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-davo-navy">Dashboard</h1>
            <p className="text-sm text-davo-muted mt-0.5">
              {gmailAccounts.length} Gmail account{gmailAccounts.length !== 1 ? "s" : ""} · TikTok ads record keeping
            </p>
          </div>
          <button
            onClick={() => {
              setEditingGmail(null);
              setGmailModalOpen(true);
            }}
            className="h-11 px-5 rounded-full bg-davo-blue text-white font-semibold text-sm hover:bg-davo-blue-dark transition-colors flex items-center justify-center gap-2 flex-shrink-0"
          >
            <Plus size={16} /> Add Gmail account
          </button>
        </div>

        <FinancialSummary totals={totals} />

        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-davo-muted" />
          <input
            type="text"
            placeholder="Search by Gmail, business center, or ads account name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-full border border-davo-border bg-white text-sm text-davo-navy placeholder:text-davo-muted focus:border-davo-blue outline-none transition-colors"
          />
        </div>

        {dataLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-davo-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredGmailAccounts.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={gmailAccounts.length === 0 ? "No Gmail accounts yet" : "No matches found"}
            description={
              gmailAccounts.length === 0
                ? "Add your first Gmail account to start tracking business centers and TikTok ads accounts."
                : "Try a different search term."
            }
            action={
              gmailAccounts.length === 0 && (
                <button
                  onClick={() => setGmailModalOpen(true)}
                  className="h-10 px-5 rounded-full bg-davo-blue text-white font-medium text-sm hover:bg-davo-blue-dark transition-colors"
                >
                  Add Gmail account
                </button>
              )
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredGmailAccounts.map((account) => (
              <GmailAccountCard
                key={account.id}
                account={account}
                businessCenters={businessCenters}
                adsAccounts={adsAccounts}
                onEditGmail={(a) => {
                  setEditingGmail(a);
                  setGmailModalOpen(true);
                }}
                onDeleteGmail={(a) => setDeleteTarget({ type: "gmail", item: a })}
                onRevealPassword={(a) => {
                  setPasswordTarget(a);
                  setPasswordModalOpen(true);
                }}
                onAddBusinessCenter={(gmailId) => {
                  setBcParentGmailId(gmailId);
                  setEditingBc(null);
                  setBcModalOpen(true);
                }}
                onEditBusinessCenter={(bc) => {
                  setEditingBc(bc);
                  setBcParentGmailId(bc.gmailAccountId);
                  setBcModalOpen(true);
                }}
                onDeleteBusinessCenter={(bc) => setDeleteTarget({ type: "businessCenter", item: bc })}
                onAddFunding={(bc) => {
                  setFundingTarget(bc);
                  setFundingModalOpen(true);
                }}
                onViewBusinessCenterAnalysis={(bc) =>
                  router.push(`/analytics/business-centers?businessCenterIds=${bc.id}`)
                }
                onAddAdsAccount={(bcId) => {
                  setAdsParentBcId(bcId);
                  setEditingAds(null);
                  setAdsModalOpen(true);
                }}
                onEditAdsAccount={(ads) => {
                  setEditingAds(ads);
                  setAdsParentBcId(ads.businessCenterId);
                  setAdsModalOpen(true);
                }}
                onDeleteAdsAccount={(ads) => setDeleteTarget({ type: "adsAccount", item: ads })}
                onLogDailySpend={(ads) => {
                  setDailyLogTarget(ads);
                  setDailyLogModalOpen(true);
                }}
                onViewAdsAccountAnalysis={(ads) =>
                  router.push(`/analytics/ads-accounts?adsAccountIds=${ads.id}`)
                }
              />
            ))}
          </div>
        )}
      </main>

      <AddGmailModal
        open={gmailModalOpen}
        onClose={() => setGmailModalOpen(false)}
        onSaved={loadData}
        editing={editingGmail}
      />

      <AddBusinessCenterModal
        open={bcModalOpen}
        onClose={() => setBcModalOpen(false)}
        onSaved={loadData}
        gmailAccountId={bcParentGmailId}
        editing={editingBc}
      />

      <AddAdsAccountModal
        open={adsModalOpen}
        onClose={() => setAdsModalOpen(false)}
        onSaved={loadData}
        businessCenterId={adsParentBcId}
        editing={editingAds}
      />

      <AddFundingModal
        open={fundingModalOpen}
        onClose={() => setFundingModalOpen(false)}
        onSaved={loadData}
        businessCenterId={fundingTarget?.id || null}
        businessCenterName={fundingTarget?.name || ""}
      />

      <AddDailyLogModal
        open={dailyLogModalOpen}
        onClose={() => setDailyLogModalOpen(false)}
        onSaved={loadData}
        adsAccountId={dailyLogTarget?.id || null}
        gmailAccountId={
          businessCenters.find((bc) => bc.id === dailyLogTarget?.businessCenterId)?.gmailAccountId || null
        }
        adsAccountName={dailyLogTarget?.name || ""}
      />

      <PasswordDecryptModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        gmailId={passwordTarget?.id || null}
        email={passwordTarget?.email || ""}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        confirming={deleting}
        title={
          deleteTarget?.type === "gmail"
            ? "Delete Gmail account"
            : deleteTarget?.type === "businessCenter"
            ? "Delete business center"
            : "Delete ads account"
        }
        description={
          deleteTarget?.type === "gmail"
            ? "This will permanently delete this Gmail account along with all of its business centers and ads accounts. This cannot be undone."
            : deleteTarget?.type === "businessCenter"
            ? "This will permanently delete this business center along with all of its ads accounts. This cannot be undone."
            : "This will permanently delete this ads account. This cannot be undone."
        }
      />
    </AppShell>
  );
}
