"use client";

import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirming?: boolean;
}

export default function ConfirmModal({ open, onClose, onConfirm, title, description, confirming }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-davo-danger-bg flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-davo-danger" />
          </div>
          <p className="text-sm text-davo-muted leading-relaxed pt-1.5">{description}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-full border border-davo-border text-davo-navy font-medium text-sm hover:bg-davo-bg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={confirming}
            className="flex-1 h-11 rounded-full bg-davo-danger text-white font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {confirming ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
