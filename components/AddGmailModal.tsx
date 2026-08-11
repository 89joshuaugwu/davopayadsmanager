"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Modal from "./Modal";
import { useAuth } from "@/lib/AuthContext";
import { GmailAccountPublic } from "@/lib/types";
import { todayISO } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing?: GmailAccountPublic | null;
}

const inputClass =
  "w-full h-11 px-4 rounded-xl border border-davo-border bg-davo-bg/60 text-sm text-davo-navy placeholder:text-davo-muted focus:bg-white focus:border-davo-blue outline-none transition-colors";
const labelClass = "block text-xs font-semibold text-davo-muted mb-1.5 uppercase tracking-wide";

export default function AddGmailModal({ open, onClose, onSaved, editing }: Props) {
  const { getToken } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tiktokAccountName, setTiktokAccountName] = useState("");
  const [tiktokManagerAccountName, setTiktokManagerAccountName] = useState("");
  const [status, setStatus] = useState<"active" | "disabled">("active");
  const [notes, setNotes] = useState("");
  const [dateCreated, setDateCreated] = useState(todayISO());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setEmail(editing.email);
      setPassword("");
      setTiktokAccountName(editing.tiktokAccountName || "");
      setTiktokManagerAccountName(editing.tiktokManagerAccountName || "");
      setStatus(editing.status);
      setNotes(editing.notes || "");
      setDateCreated(editing.dateCreated || todayISO());
    } else {
      setEmail("");
      setPassword("");
      setTiktokAccountName("");
      setTiktokManagerAccountName("");
      setStatus("active");
      setNotes("");
      setDateCreated(todayISO());
    }
  }, [editing, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Email is required.");
      return;
    }
    if (!editing && !password.trim()) {
      toast.error("Password is required for a new Gmail account.");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const body = {
        email,
        password: password || undefined,
        tiktokAccountName,
        tiktokManagerAccountName,
        status,
        notes,
        dateCreated,
      };

      const res = await fetch(
        editing ? `/api/gmail-accounts/${editing.id}` : "/api/gmail-accounts",
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

      toast.success(editing ? "Gmail account updated." : "Gmail account added.");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit Gmail Account" : "Add Gmail Account"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Gmail address</label>
          <input
            type="email"
            className={inputClass}
            placeholder="account@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className={labelClass}>
            Password {editing && <span className="font-normal">(leave blank to keep current)</span>}
          </label>
          <input
            type="text"
            className={inputClass}
            placeholder={editing ? "•••••••• (unchanged)" : "Gmail password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>TikTok account</label>
            <input
              type="text"
              className={inputClass}
              placeholder="e.g. @brandname"
              value={tiktokAccountName}
              onChange={(e) => setTiktokAccountName(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Manager account</label>
            <input
              type="text"
              className={inputClass}
              placeholder="e.g. Manager - Form"
              value={tiktokManagerAccountName}
              onChange={(e) => setTiktokManagerAccountName(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
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
          <div>
            <label className={labelClass}>Date created</label>
            <input
              type="date"
              className={inputClass}
              value={dateCreated}
              onChange={(e) => setDateCreated(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            className={`${inputClass} h-20 py-2 resize-none`}
            placeholder="Optional notes about this account..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full h-12 rounded-full bg-davo-blue text-white font-semibold text-sm hover:bg-davo-blue-dark transition-colors disabled:opacity-60"
        >
          {saving ? "Saving..." : editing ? "Save changes" : "Add Gmail account"}
        </button>
      </form>
    </Modal>
  );
}
