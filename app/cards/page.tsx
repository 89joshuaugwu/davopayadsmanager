"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, CreditCard, Pencil, Trash2, Link2, Link2Off } from "lucide-react";
import toast from "react-hot-toast";
import AppShell from "@/components/AppShell";
import AddCardModal from "@/components/AddCardModal";
import ConfirmModal from "@/components/ConfirmModal";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/lib/AuthContext";
import { PaymentCard, BusinessCenter, BusinessCenterFunding } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function CardsPage() {
  const router = useRouter();
  const { user, loading: authLoading, getToken } = useAuth();

  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [businessCenters, setBusinessCenters] = useState<BusinessCenter[]>([]);
  const [fundingEntries, setFundingEntries] = useState<BusinessCenterFunding[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentCard | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PaymentCard | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const loadData = useCallback(async () => {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [cardsRes, bcRes, fundingRes] = await Promise.all([
        fetch("/api/cards", { headers }),
        fetch("/api/business-centers", { headers }),
        fetch("/api/business-center-funding", { headers }),
      ]);
      setCards((await cardsRes.json()).cards || []);
      setBusinessCenters((await bcRes.json()).centers || []);
      setFundingEntries((await fundingRes.json()).entries || []);
    } catch {
      toast.error("Failed to load cards.");
    } finally {
      setDataLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const totalsByCard = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const entry of fundingEntries) {
      if (!entry.cardId) continue;
      const bucket = map.get(entry.cardId) || { total: 0, count: 0 };
      bucket.total += entry.amount;
      bucket.count += 1;
      map.set(entry.cardId, bucket);
    }
    return map;
  }, [fundingEntries]);

  const totalAcrossAllCards = useMemo(
    () => Array.from(totalsByCard.values()).reduce((sum, v) => sum + v.total, 0),
    [totalsByCard]
  );

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/cards/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete card.");
      }
      toast.success("Card deleted.");
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete card.");
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-davo-navy">Cards</h1>
            <p className="text-sm text-davo-muted mt-0.5">
              {cards.length} card{cards.length !== 1 ? "s" : ""} · {formatCurrency(totalAcrossAllCards)} funded in total
            </p>
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="h-11 px-5 rounded-full bg-davo-blue text-white font-semibold text-sm hover:bg-davo-blue-dark transition-colors flex items-center justify-center gap-2 flex-shrink-0"
          >
            <Plus size={16} /> Add card
          </button>
        </div>

        {dataLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-davo-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cards.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No cards yet"
            description="Add a card to track which account it funds and how much has gone through it — with or without linking it to a specific business account."
            action={
              <button
                onClick={() => setModalOpen(true)}
                className="h-10 px-5 rounded-full bg-davo-blue text-white font-medium text-sm hover:bg-davo-blue-dark transition-colors"
              >
                Add card
              </button>
            }
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card, i) => {
              const linkedBc = businessCenters.find((bc) => bc.id === card.businessCenterId);
              const stats = totalsByCard.get(card.id) || { total: 0, count: 0 };

              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-davo-navy rounded-xl2 p-5 shadow-card relative overflow-hidden"
                >
                  <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-davo-blue/20 blur-2xl" />

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{card.name}</p>
                        <p className="text-white/50 text-xs mt-0.5 font-mono tracking-widest">
                          •••• {card.lastFour}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0 ${
                          card.status === "active" ? "bg-davo-success-bg text-davo-success" : "bg-white/10 text-white/60"
                        }`}
                      >
                        {card.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mb-4">
                      {linkedBc ? (
                        <>
                          <Link2 size={13} className="text-davo-blue-light flex-shrink-0" />
                          <p className="text-xs text-white/70 truncate">{linkedBc.name}</p>
                        </>
                      ) : (
                        <>
                          <Link2Off size={13} className="text-white/40 flex-shrink-0" />
                          <p className="text-xs text-white/40">Not linked — funds any account</p>
                        </>
                      )}
                    </div>

                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[10px] text-white/40 uppercase tracking-wide mb-0.5">Total funded</p>
                        <p className="text-lg font-bold text-white tracking-tight">{formatCurrency(stats.total)}</p>
                        <p className="text-[10px] text-white/40 mt-0.5">
                          {stats.count} top-up{stats.count !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditing(card);
                            setModalOpen(true);
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:bg-white/10 transition-colors"
                          aria-label="Edit card"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(card)}
                          className="w-8 h-8 flex items-center justify-center rounded-full text-davo-danger hover:bg-white/10 transition-colors"
                          aria-label="Delete card"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <AddCardModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadData}
        businessCenters={businessCenters}
        editing={editing}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        confirming={deleting}
        title="Delete card"
        description="This removes the card record. Funding entries already made with this card keep their amount and date — the card reference is just cleared."
      />
    </AppShell>
  );
}
