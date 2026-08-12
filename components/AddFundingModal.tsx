"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Modal from "./Modal";
import { useAuth } from "@/lib/AuthContext";
import { todayISO } from "@/lib/utils";

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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(todayISO());
      setAmount("0");
      setNote("");
    }
  }, [open]);

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
        body: JSON.stringify({ date, amount: Number(amount), note }),
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
