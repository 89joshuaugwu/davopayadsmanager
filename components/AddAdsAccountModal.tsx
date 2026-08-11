"use client";

import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";
import { useAuth } from "@/lib/AuthContext";
import { AdsAccount, AdsAccountStatus } from "@/lib/types";
import { isHighCpa, todayISO } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  businessCenterId: string | null;
  editing?: AdsAccount | null;
}

const inputClass =
  "w-full h-11 px-4 rounded-xl border border-davo-border bg-davo-bg/60 text-sm text-davo-navy placeholder:text-davo-muted focus:bg-white focus:border-davo-blue outline-none transition-colors";
const labelClass = "block text-xs font-semibold text-davo-muted mb-1.5 uppercase tracking-wide";

export default function AddAdsAccountModal({ open, onClose, onSaved, businessCenterId, editing }: Props) {
  const { getToken } = useAuth();
  const [name, setName] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [amountSpent, setAmountSpent] = useState("0");
  const [cpa, setCpa] = useState("0");
  const [hasAd, setHasAd] = useState(false);
  const [status, setStatus] = useState<AdsAccountStatus>("active");
  const [fundsLost, setFundsLost] = useState("0");
  const [dateUpdated, setDateUpdated] = useState(todayISO());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setDestinationUrl(editing.destinationUrl || "");
      setAmountSpent(String(editing.amountSpent));
      setCpa(String(editing.cpa));
      setHasAd(editing.hasAd);
      setStatus(editing.status);
      setFundsLost(String(editing.fundsLost));
      setDateUpdated(editing.dateUpdated || todayISO());
    } else {
      setName("");
      setDestinationUrl("");
      setAmountSpent("0");
      setCpa("0");
      setHasAd(false);
      setStatus("active");
      setFundsLost("0");
      setDateUpdated(todayISO());
    }
  }, [editing, open]);

  const cpaFlag = useMemo(() => isHighCpa(Number(cpa) || 0), [cpa]);
  const needsLossTracking = status === "blocked" || status === "closed";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Ads account name is required.");
      return;
    }
    if (!editing && !businessCenterId) {
      toast.error("No business center selected.");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const body = {
        businessCenterId,
        name,
        destinationUrl,
        amountSpent: Number(amountSpent),
        cpa: Number(cpa),
        hasAd,
        status,
        fundsLost: Number(fundsLost),
        dateUpdated,
      };

      const res = await fetch(
        editing ? `/api/ads-accounts/${editing.id}` : "/api/ads-accounts",
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

      toast.success(editing ? "Ads account updated." : "Ads account added.");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit Ads Account" : "Add Ads Account"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Ads account name</label>
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. Form1, Go Offer 1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className={labelClass}>Destination / bridge URL</label>
          <input
            type="url"
            className={inputClass}
            placeholder="https://landing-page.com"
            value={destinationUrl}
            onChange={(e) => setDestinationUrl(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            id="hasAd"
            type="checkbox"
            checked={hasAd}
            onChange={(e) => setHasAd(e.target.checked)}
            className="w-5 h-5 rounded accent-davo-blue"
          />
          <label htmlFor="hasAd" className="text-sm font-medium text-davo-navy">
            Ad has been created on this account
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Amount spent ($)</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={amountSpent}
              onChange={(e) => setAmountSpent(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Cost per conversion ($)</label>
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
            <p className="text-sm text-davo-danger font-medium">
              HIGH CPA — ACTION REQUIRED: PAUSE
            </p>
          </div>
        )}

        <div>
          <label className={labelClass}>Status</label>
          <select
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as AdsAccountStatus)}
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="blocked">Blocked</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {needsLossTracking && (
          <div>
            <label className={labelClass}>Funds lost / locked ($)</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={fundsLost}
              onChange={(e) => setFundsLost(e.target.value)}
            />
            <p className="text-xs text-davo-muted mt-1">
              Unrecoverable balance on this account — counted in Total Funds Lost.
            </p>
          </div>
        )}

        <div>
          <label className={labelClass}>Last updated</label>
          <input
            type="date"
            className={inputClass}
            value={dateUpdated}
            onChange={(e) => setDateUpdated(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full h-12 rounded-full bg-davo-blue text-white font-semibold text-sm hover:bg-davo-blue-dark transition-colors disabled:opacity-60"
        >
          {saving ? "Saving..." : editing ? "Save changes" : "Add ads account"}
        </button>
      </form>
    </Modal>
  );
}
