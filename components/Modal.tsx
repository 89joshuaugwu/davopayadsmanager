"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-davo-navy/50 backdrop-blur-sm p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-lg bg-davo-card rounded-t-xl2 sm:rounded-xl2 shadow-card-hover max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-davo-border sticky top-0 bg-davo-card z-10">
              <h2 className="text-base sm:text-lg font-semibold text-davo-navy">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-9 h-9 flex items-center justify-center rounded-full text-davo-muted hover:bg-davo-bg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-5 sm:px-6 py-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
