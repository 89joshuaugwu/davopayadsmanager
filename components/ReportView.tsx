"use client";

import { GmailAccountPublic, BusinessCenter, AdsAccount, FinancialTotals } from "@/lib/types";
import { formatCurrency, formatDate, isHighCpa } from "@/lib/utils";
import Logo from "./Logo";

interface Props {
  gmailAccounts: GmailAccountPublic[];
  businessCenters: BusinessCenter[];
  adsAccounts: AdsAccount[];
  totals: FinancialTotals;
  rangeLabel: string;
}

export default function ReportView({ gmailAccounts, businessCenters, adsAccounts, totals, rangeLabel }: Props) {
  const gmailById = new Map(gmailAccounts.map((g) => [g.id, g]));
  const bcById = new Map(businessCenters.map((b) => [b.id, b]));

  return (
    <div id="report-print-area" className="bg-white border border-davo-border rounded-xl2 shadow-card print-page p-4 sm:p-8 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-davo-border mb-6">
        <Logo className="h-7 w-auto" />
        <div className="text-left sm:text-right">
          <p className="text-sm font-semibold text-davo-navy">Financial Report</p>
          <p className="text-xs text-davo-muted">{rangeLabel}</p>
          <p className="text-xs text-davo-muted">Generated {formatDate(new Date().toISOString())}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-8">
        {[
          { label: "Total Funded", value: totals.totalFunded },
          { label: "Total Spent", value: totals.totalSpent },
          { label: "Net Balance", value: totals.remainingBalance },
          { label: "Total Lost", value: totals.totalLost },
        ].map((c) => (
          <div key={c.label} className="border border-davo-border rounded-xl p-3 sm:p-4 bg-davo-bg/30">
            <p className="text-[10px] sm:text-[11px] text-davo-muted uppercase tracking-wide mb-1">{c.label}</p>
            <p className="text-xs sm:text-base font-bold text-davo-navy truncate">{formatCurrency(c.value)}</p>
          </div>
        ))}
      </div>

      <h3 className="text-sm font-semibold text-davo-navy mb-3">Business Centers</h3>
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 mb-8 scrollbar-thin">
        <table className="w-full text-xs sm:text-sm border-collapse min-w-[500px]">
          <thead>
            <tr className="text-left text-davo-muted border-b border-davo-border">
              <th className="py-2 pr-3 font-medium">Gmail account</th>
              <th className="py-2 pr-3 font-medium">Business center</th>
              <th className="py-2 pr-3 font-medium">Funded</th>
              <th className="py-2 pr-3 font-medium">Date funded</th>
              <th className="py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {businessCenters.map((bc) => (
              <tr key={bc.id} className="border-b border-davo-border/60">
                <td className="py-2 pr-3 text-davo-navy">{gmailById.get(bc.gmailAccountId)?.email || "—"}</td>
                <td className="py-2 pr-3 text-davo-navy font-medium">{bc.name}</td>
                <td className="py-2 pr-3 text-davo-navy">{formatCurrency(bc.amountFunded)}</td>
                <td className="py-2 pr-3 text-davo-muted">{formatDate(bc.dateFunded)}</td>
                <td className="py-2 capitalize text-davo-muted">{bc.status}</td>
              </tr>
            ))}
            {businessCenters.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-davo-muted">
                  No business centers in this range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h3 className="text-sm font-semibold text-davo-navy mb-3">Ads Accounts</h3>
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-thin">
        <table className="w-full text-xs sm:text-sm border-collapse min-w-[550px]">
          <thead>
            <tr className="text-left text-davo-muted border-b border-davo-border">
              <th className="py-2 pr-3 font-medium">Business center</th>
              <th className="py-2 pr-3 font-medium">Ads account</th>
              <th className="py-2 pr-3 font-medium">Spent</th>
              <th className="py-2 pr-3 font-medium">CPA</th>
              <th className="py-2 pr-3 font-medium">Lost</th>
              <th className="py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {adsAccounts.map((ad) => (
              <tr key={ad.id} className="border-b border-davo-border/60">
                <td className="py-2 pr-3 text-davo-navy">{bcById.get(ad.businessCenterId)?.name || "—"}</td>
                <td className="py-2 pr-3 text-davo-navy font-medium">{ad.name}</td>
                <td className="py-2 pr-3 text-davo-navy">{formatCurrency(ad.amountSpent)}</td>
                <td className={`py-2 pr-3 ${isHighCpa(ad.cpa) ? "text-davo-danger font-semibold" : "text-davo-navy"}`}>
                  {formatCurrency(ad.cpa)}
                </td>
                <td className="py-2 pr-3 text-davo-navy">{ad.fundsLost > 0 ? formatCurrency(ad.fundsLost) : "—"}</td>
                <td className="py-2 capitalize text-davo-muted">{ad.status}</td>
              </tr>
            ))}
            {adsAccounts.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-davo-muted">
                  No ads accounts in this range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
