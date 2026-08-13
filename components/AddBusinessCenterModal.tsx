"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Modal from "./Modal";
import { useAuth } from "@/lib/AuthContext";
import { BusinessCenter } from "@/lib/types";
import { todayISO } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  gmailAccountId: string | null;
  editing?: BusinessCenter | null;
}

const inputClass =
  "w-full h-11 px-4 rounded-xl border border-davo-border bg-davo-bg/60 text-sm text-davo-navy placeholder:text-davo-muted focus:bg-white focus:border-davo-blue outline-none transition-colors";
const labelClass = "block text-xs font-semibold text-davo-muted mb-1.5 uppercase tracking-wide";

export default function AddBusinessCenterModal({ open, onClose, onSaved, gmailAccountId, editing }: Props) {
  const { getToken } = useAuth();
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [amountFunded, setAmountFunded] = useState("0");
  const [dateFunded, setDateFunded] = useState(todayISO());
  const [dateCreated, setDateCreated] = useState(todayISO());
  const [status, setStatus] = useState<"active" | "disabled">("active");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setWebsiteUrl(editing.websiteUrl || "");
      setAmountFunded(String(editing.amountFunded));
      setDateFunded(editing.dateFunded || todayISO());
      setDateCreated(editing.dateCreated || todayISO());
      setStatus(editing.status);
    } else {
      setName("");
      setWebsiteUrl("");
      setAmountFunded("0");
      setDateFunded(todayISO());
      setDateCreated(todayISO());
      setStatus("active");
    }
  }, [editing, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Business center name is required.");
      return;
    }
    if (!editing && !gmailAccountId) {
      toast.error("No Gmail account selected.");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const body = {
        gmailAccountId,
        name,
        websiteUrl,
        amountFunded: Number(amountFunded),
        dateFunded,
        dateCreated,
        status,
      };

      const res = await fetch(
        editing ? `/api/business-centers/${editing.id}` : "/api/business-centers",
        {
          method: editing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save.");
      }

      toast.success(editing ? "Business center updated." : "Business center added.");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit Business Center" : "Add Business Center"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Business center name</label>
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. Form Ads Manager"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className={labelClass}>Official website (optional)</label>
          <input
            type="url"
            className={inputClass}
            placeholder="https://example.com"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>Date created (when this account was opened)</label>
          <input
            type="date"
            className={inputClass}
            value={dateCreated}
            onChange={(e) => setDateCreated(e.target.value)}
            max={todayISO()}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Amount funded (₦)</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={amountFunded}
              onChange={(e) => setAmountFunded(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Date funded</label>
            <input
              type="date"
              className={inputClass}
              value={dateFunded}
              onChange={(e) => setDateFunded(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Status</label>
          <select
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as "active" | "disabled")}
          >
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full h-12 rounded-full bg-davo-blue text-white font-semibold text-sm hover:bg-davo-blue-dark transition-colors disabled:opacity-60"
        >
          {saving ? "Saving..." : editing ? "Save changes" : "Add business center"}
        </button>
      </form>
    </Modal>
  );
}
