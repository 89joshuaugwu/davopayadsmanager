"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Modal from "./Modal";
import { useAuth } from "@/lib/AuthContext";
import { PaymentCard, BusinessCenter } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  businessCenters: BusinessCenter[];
  editing?: PaymentCard | null;
}

const inputClass =
  "w-full h-11 px-4 rounded-xl border border-davo-border bg-davo-bg/60 text-sm text-davo-navy placeholder:text-davo-muted focus:bg-white focus:border-davo-blue outline-none transition-colors";
const labelClass = "block text-xs font-semibold text-davo-muted mb-1.5 uppercase tracking-wide";

export default function AddCardModal({ open, onClose, onSaved, businessCenters, editing }: Props) {
  const { getToken } = useAuth();
  const [name, setName] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [businessCenterId, setBusinessCenterId] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setLastFour(editing.lastFour);
      setBusinessCenterId(editing.businessCenterId || "");
      setStatus(editing.status);
      setNotes(editing.notes || "");
    } else {
      setName("");
      setLastFour("");
      setBusinessCenterId("");
      setStatus("active");
      setNotes("");
    }
  }, [editing, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Card name is required.");
      return;
    }
    if (!/^\d{4}$/.test(lastFour)) {
      toast.error("Last 4 digits must be exactly 4 numbers.");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const body = { name, lastFour, businessCenterId, status, notes };

      const res = await fetch(editing ? `/api/cards/${editing.id}` : "/api/cards", {
        method: editing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save.");
      }

      toast.success(editing ? "Card updated." : "Card added.");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit Card" : "Add Card"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Card name</label>
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. GTBank Debit, Access Mastercard"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className={labelClass}>Last 4 digits</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            className={`${inputClass} font-mono tracking-widest`}
            placeholder="1234"
            value={lastFour}
            onChange={(e) => setLastFour(e.target.value.replace(/\D/g, "").slice(0, 4))}
            required
          />
          <p className="text-xs text-davo-muted mt-1">Only the last 4 digits — never store full card numbers.</p>
        </div>

        <div>
          <label className={labelClass}>Connected business account</label>
          <select
            className={inputClass}
            value={businessCenterId}
            onChange={(e) => setBusinessCenterId(e.target.value)}
          >
            <option value="">Not connected — funds any account</option>
            {businessCenters.map((bc) => (
              <option key={bc.id} value={bc.id}>
                {bc.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-davo-muted mt-1">
            Leave as "Not connected" if this card is used flexibly across accounts.
          </p>
        </div>

        <div>
          <label className={labelClass}>Status</label>
          <select
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            className={`${inputClass} h-20 py-2 resize-none`}
            placeholder="Optional notes about this card..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full h-12 rounded-full bg-davo-blue text-white font-semibold text-sm hover:bg-davo-blue-dark transition-colors disabled:opacity-60"
        >
          {saving ? "Saving..." : editing ? "Save changes" : "Add card"}
        </button>
      </form>
    </Modal>
  );
}
