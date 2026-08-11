"use client";

import { motion } from "framer-motion";
import { Wallet, TrendingDown, PiggyBank, AlertTriangle } from "lucide-react";
import { FinancialTotals } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface Props {
  totals: FinancialTotals;
}

export default function FinancialSummary({ totals }: Props) {
  const cards = [
    {
      label: "Total Funded",
      value: totals.totalFunded,
      icon: Wallet,
      accent: "text-davo-blue",
      bg: "bg-davo-blue/10",
    },
    {
      label: "Total Spent",
      value: totals.totalSpent,
      icon: TrendingDown,
      accent: "text-davo-warn",
      bg: "bg-davo-warn-bg",
    },
    {
      label: "Net Active Balance",
      value: totals.remainingBalance,
      icon: PiggyBank,
      accent: totals.remainingBalance >= 0 ? "text-davo-success" : "text-davo-danger",
      bg: totals.remainingBalance >= 0 ? "bg-davo-success-bg" : "bg-davo-danger-bg",
    },
    {
      label: "Total Funds Lost",
      value: totals.totalLost,
      icon: AlertTriangle,
      accent: "text-davo-danger",
      bg: "bg-davo-danger-bg",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className="bg-davo-card border border-davo-border rounded-xl2 p-4 sm:p-5 shadow-card"
        >
          <div className={`w-9 h-9 rounded-full ${card.bg} flex items-center justify-center mb-3`}>
            <card.icon size={18} className={card.accent} />
          </div>
          <p className="text-xs sm:text-sm text-davo-muted font-medium mb-1">{card.label}</p>
          <p className={`text-lg sm:text-2xl font-bold ${card.accent} tracking-tight`}>
            {formatCurrency(card.value)}
          </p>
        </motion.div>
      ))}

      {totals.highCpaCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="col-span-2 lg:col-span-4 flex items-center gap-2 bg-davo-danger-bg border border-davo-danger/20 rounded-xl px-4 py-3"
        >
          <AlertTriangle size={16} className="text-davo-danger flex-shrink-0" />
          <p className="text-sm text-davo-danger font-medium">
            {totals.highCpaCount} ads account{totals.highCpaCount > 1 ? "s" : ""} above ₦100 CPA —
            action required: pause.
          </p>
        </motion.div>
      )}
    </div>
  );
}
