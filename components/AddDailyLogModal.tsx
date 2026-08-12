"use client";

import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";
import { useAuth } from "@/lib/AuthContext";
import { isHighCpa, todayISO } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  adsAccountId: string | null;
  gmailAccountId: string | null;
  adsAccountName: string;
}

const inputClass =
  "w-full h-11 px-4 rounded-xl border border-davo-border bg-davo-bg/60 text-sm text-davo-navy placeholder:text-davo-muted focus:bg-white focus:border-davo-blue outline-none transition-colors";
const labelClass = "block text-xs font-semibold text-davo-muted mb-1.5 uppercase tracking-wide";

export default function AddDailyLogModal({
  open,
  onClose,
  onSaved,
  adsAccountId,
  gmailAccountId,
  adsAccountName,
}: Props) {
  const { getToken } = useAuth();
  const [date, setDate] = useState(todayISO());
  const [amountSpent, setAmountSpent] = useState("0");
  const [cpa, setCpa] = useState("0");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(todayISO());
      setAmountSpent("0");
      setCpa("0");
    }
  }, [open]);

  const cpaFlag = useMemo(() => isHighCpa(Number(cpa) || 0), [cpa]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!adsAccountId) return;

    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/ads-accounts/${adsAccountId}/daily-logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date,
          amountSpent: Number(amountSpent),
          cpa: Number(cpa),
          gmailAccountId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save log.");
      }

      toast.success("Daily log saved.");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Log daily spend — ${adsAccountName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-davo-muted -mt-1">
          Logging again for the same date updates that day's entry instead of adding a duplicate.
        </p>

        <div>
          <label className={labelClass}>Date</label>
          <input
            type="date"
            className={inputClass}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={todayISO()}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Amount spent (₦)</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={amountSpent}
              onChange={(e) => setAmountSpent(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Cost per result (₦)</label>
            <input
              type="number"
              step="0.01"
              className={`${inputClass} ${cpaFlag ? "border-davo-danger text-davo-danger" : ""}`}
              value={cpa}
              onChange={(e) => setCpa(e.target.value)}
            />
          </div>
        </div>

        {cpaFlag && (
          <div className="flex items-center gap-2 bg-davo-danger-bg border border-davo-danger/20 rounded-xl px-4 py-3">
            <AlertTriangle size={16} className="text-davo-danger flex-shrink-0" />
            <p className="text-sm text-davo-danger font-medium">HIGH CPA — ACTION REQUIRED: PAUSE</p>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full h-12 rounded-full bg-davo-blue text-white font-semibold text-sm hover:bg-davo-blue-dark transition-colors disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save daily log"}
        </button>
      </form>
    </Modal>
  );
}
