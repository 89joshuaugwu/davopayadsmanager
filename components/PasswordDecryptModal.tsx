"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "./Modal";
import { useAuth } from "@/lib/AuthContext";

interface Props {
  open: boolean;
  onClose: () => void;
  gmailId: string | null;
  email: string;
}

export default function PasswordDecryptModal({ open, onClose, gmailId, email }: Props) {
  const { getToken } = useAuth();
  const [password, setPassword] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && gmailId) {
      reveal(gmailId);
    } else {
      setPassword(null);
      setVisible(false);
      setCopied(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, gmailId]);

  async function reveal(id: string) {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/gmail-accounts/${id}/reveal`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to decrypt password.");
      setPassword(data.password);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to decrypt password.");
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    toast.success("Password copied.");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal open={open} onClose={onClose} title="Gmail Password">
      <div className="space-y-4">
        <p className="text-sm text-davo-muted">{email}</p>

        {loading ? (
          <div className="h-12 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-davo-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-12 px-4 rounded-xl border border-davo-border bg-davo-bg flex items-center font-mono text-sm text-davo-navy overflow-x-auto">
              {visible ? password : "•".repeat(password?.length || 10)}
            </div>
            <button
              onClick={() => setVisible((v) => !v)}
              className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl border border-davo-border text-davo-muted hover:bg-davo-bg transition-colors"
              aria-label={visible ? "Hide password" : "Show password"}
            >
              {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <button
              onClick={handleCopy}
              className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl bg-davo-blue text-white hover:bg-davo-blue-dark transition-colors"
              aria-label="Copy password"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        )}

        <p className="text-xs text-davo-muted">
          This password is decrypted only for this view and never stored in plaintext.
        </p>
      </div>
    </Modal>
  );
}
