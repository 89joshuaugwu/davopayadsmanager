"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Modal from "./Modal";
import { useAuth } from "@/lib/AuthContext";
import { todayISO } from "@/lib/utils";
import { PaymentCard } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  businessCenterId: string | null;
  businessCenterName: string;
}

const inputClass =
  "w-full h-11 px-4 rounded-xl border border-davo-border bg-davo-bg/60 text-sm text-davo-navy placeholder:text-davo-muted focus:bg-white focus:border-davo-blue outline-none transition-colors";
const labelClass = "block text-xs font-semibold text-davo-muted mb-1.5 uppercase tracking-wide";

export default function AddFundingModal({
  open,
  onClose,
  onSaved,
  businessCenterId,
  businessCenterName,
}: Props) {
  const { getToken } = useAuth();
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState("0");
  const [note, setNote] = useState("");
  const [cardId, setCardId] = useState("");
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(todayISO());
      setAmount("0");
      setNote("");
      setCardId("");
      loadCards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function loadCards() {
    try {
      const token = await getToken();
      const res = await fetch("/api/cards", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setCards(data.cards || []);
    } catch {
      // Non-fatal — funding can still be recorded without a card selected.
    }
  }

  // Cards dedicated to this business center float to the top of the list.
  const sortedCards = [...cards].sort((a, b) => {
    const aMatch = a.businessCenterId === businessCenterId ? 0 : 1;
    const bMatch = b.businessCenterId === businessCenterId ? 0 : 1;
    return aMatch - bMatch;
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!businessCenterId) return;

    if (!Number(amount) || Number(amount) <= 0) {
      toast.error("Enter an amount greater than zero.");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/business-centers/${businessCenterId}/funding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ date, amount: Number(amount), note, cardId: cardId || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save funding entry.");
      }

      toast.success("Funding recorded.");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Add funding — ${businessCenterName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Date funded</label>
          <input
            type="date"
            className={inputClass}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={todayISO()}
            required
          />
        </div>

        <div>
          <label className={labelClass}>Amount (₦)</label>
          <input
            type="number"
            step="0.01"
            className={inputClass}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div>
          <label className={labelClass}>Card used (optional)</label>
          <select className={inputClass} value={cardId} onChange={(e) => setCardId(e.target.value)}>
            <option value="">No card selected</option>
            {sortedCards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} •••• {c.lastFour}
                {c.businessCenterId === businessCenterId ? " (linked to this account)" : ""}
              </option>
            ))}
          </select>
          <p className="text-xs text-davo-muted mt-1">
            Track this top-up against a card's total expenses. Manage cards from the Cards page.
          </p>
        </div>

        <div>
          <label className={labelClass}>Note (optional)</label>
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. top-up via card"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full h-12 rounded-full bg-davo-blue text-white font-semibold text-sm hover:bg-davo-blue-dark transition-colors disabled:opacity-60"
        >
          {saving ? "Saving..." : "Add funding"}
        </button>
      </form>
    </Modal>
  );
}
