"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Mail,
  KeyRound,
  Pencil,
  Trash2,
  Plus,
  Building2,
  Megaphone,
  ExternalLink,
  StickyNote,
} from "lucide-react";
import {
  GmailAccountPublic,
  BusinessCenter,
  AdsAccount,
  MAX_BUSINESS_CENTERS_PER_GMAIL,
  MAX_ADS_ACCOUNTS_PER_BUSINESS_CENTER,
} from "@/lib/types";
import { formatCurrency, formatDate, isHighCpa, statusBadgeClasses } from "@/lib/utils";

interface Props {
  account: GmailAccountPublic;
  businessCenters: BusinessCenter[];
  adsAccounts: AdsAccount[];
  onEditGmail: (account: GmailAccountPublic) => void;
  onDeleteGmail: (account: GmailAccountPublic) => void;
  onRevealPassword: (account: GmailAccountPublic) => void;
  onAddBusinessCenter: (gmailAccountId: string) => void;
  onEditBusinessCenter: (bc: BusinessCenter) => void;
  onDeleteBusinessCenter: (bc: BusinessCenter) => void;
  onAddAdsAccount: (businessCenterId: string) => void;
  onEditAdsAccount: (ads: AdsAccount) => void;
  onDeleteAdsAccount: (ads: AdsAccount) => void;
}

function Badge({ status }: { status: string }) {
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${statusBadgeClasses(status)}`}>
      {status}
    </span>
  );
}

export default function GmailAccountCard({
  account,
  businessCenters,
  adsAccounts,
  onEditGmail,
  onDeleteGmail,
  onRevealPassword,
  onAddBusinessCenter,
  onEditBusinessCenter,
  onDeleteBusinessCenter,
  onAddAdsAccount,
  onEditAdsAccount,
  onDeleteAdsAccount,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const centers = businessCenters.filter((bc) => bc.gmailAccountId === account.id);
  const totalAdsUnderGmail = adsAccounts.filter((a) =>
    centers.some((c) => c.id === a.businessCenterId)
  ).length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-davo-card border border-davo-border rounded-xl2 shadow-card overflow-hidden"
    >
      {/* Gmail account row */}
      <div className="flex items-center gap-3 p-4 sm:p-5">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-davo-blue/10 text-davo-blue"
          aria-label="Toggle business centers"
        >
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={18} />
          </motion.span>
        </button>

        <div className="w-10 h-10 flex-shrink-0 rounded-full bg-davo-navy/5 flex items-center justify-center">
          <Mail size={18} className="text-davo-navy" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-davo-navy text-sm sm:text-base truncate">{account.email}</p>
            <Badge status={account.status} />
          </div>
          <p className="text-xs text-davo-muted mt-0.5">
            {centers.length}/{MAX_BUSINESS_CENTERS_PER_GMAIL} business centers · {totalAdsUnderGmail} ads accounts
            {account.tiktokAccountName ? ` · ${account.tiktokAccountName}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onRevealPassword(account)}
            className="w-9 h-9 flex items-center justify-center rounded-full text-davo-blue hover:bg-davo-blue/10 transition-colors"
            aria-label="View password"
            title="View password"
          >
            <KeyRound size={16} />
          </button>
          <button
            onClick={() => onEditGmail(account)}
            className="w-9 h-9 flex items-center justify-center rounded-full text-davo-muted hover:bg-davo-bg transition-colors"
            aria-label="Edit"
            title="Edit"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => onDeleteGmail(account)}
            className="w-9 h-9 flex items-center justify-center rounded-full text-davo-danger hover:bg-davo-danger-bg transition-colors"
            aria-label="Delete"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {account.notes && (
        <div className="px-5 pb-3 -mt-2 flex items-start gap-2 text-xs text-davo-muted">
          <StickyNote size={13} className="flex-shrink-0 mt-0.5" />
          <span>{account.notes}</span>
        </div>
      )}

      {/* Business centers (expandable) */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-davo-border bg-davo-bg/40"
          >
            <div className="pl-6 sm:pl-10 pr-4 sm:pr-5 py-4 space-y-3">
              {centers.map((bc) => {
                const ads = adsAccounts.filter((a) => a.businessCenterId === bc.id);
                return (
                  <div
                    key={bc.id}
                    className="relative border-l-2 border-davo-blue/20 pl-4 sm:pl-5"
                  >
                    <div className="bg-white border border-davo-border rounded-xl p-3.5 sm:p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 flex-shrink-0 rounded-full bg-davo-dark/10 flex items-center justify-center">
                          <Building2 size={14} className="text-davo-dark" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm text-davo-navy">{bc.name}</p>
                            <Badge status={bc.status} />
                          </div>
                          <p className="text-xs text-davo-muted mt-0.5">
                            Funded {formatCurrency(bc.amountFunded)} on {formatDate(bc.dateFunded)}
                          </p>
                          {bc.websiteUrl && (
                            <a
                              href={bc.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-davo-blue inline-flex items-center gap-1 mt-1 hover:underline"
                            >
                              {bc.websiteUrl.replace(/^https?:\/\//, "")} <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => onEditBusinessCenter(bc)}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-davo-muted hover:bg-davo-bg transition-colors"
                            aria-label="Edit business center"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => onDeleteBusinessCenter(bc)}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-davo-danger hover:bg-davo-danger-bg transition-colors"
                            aria-label="Delete business center"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Ads accounts under this business center */}
                      <div className="mt-3 space-y-2">
                        {ads.map((ad) => {
                          const flagged = isHighCpa(ad.cpa);
                          return (
                            <div
                              key={ad.id}
                              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border ${
                                flagged ? "border-davo-danger/30 bg-davo-danger-bg" : "border-davo-border bg-davo-bg/60"
                              }`}
                            >
                              <Megaphone
                                size={14}
                                className={flagged ? "text-davo-danger flex-shrink-0" : "text-davo-muted flex-shrink-0"}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-xs sm:text-sm font-medium text-davo-navy truncate">
                                    {ad.name}
                                  </p>
                                  <Badge status={ad.status} />
                                  {!ad.hasAd && (
                                    <span className="text-[10px] text-davo-muted italic">no ad yet</span>
                                  )}
                                </div>
                                <p className="text-[11px] text-davo-muted mt-0.5">
                                  Spent {formatCurrency(ad.amountSpent)} · CPA{" "}
                                  <span className={flagged ? "text-davo-danger font-semibold" : ""}>
                                    {formatCurrency(ad.cpa)}
                                  </span>
                                  {ad.fundsLost > 0 && ` · Lost ${formatCurrency(ad.fundsLost)}`}
                                </p>
                                {flagged && (
                                  <p className="text-[11px] font-semibold text-davo-danger mt-0.5">
                                    HIGH CPA — ACTION REQUIRED: PAUSE
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => onEditAdsAccount(ad)}
                                  className="w-7 h-7 flex items-center justify-center rounded-full text-davo-muted hover:bg-white transition-colors"
                                  aria-label="Edit ads account"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  onClick={() => onDeleteAdsAccount(ad)}
                                  className="w-7 h-7 flex items-center justify-center rounded-full text-davo-danger hover:bg-white transition-colors"
                                  aria-label="Delete ads account"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {ads.length < MAX_ADS_ACCOUNTS_PER_BUSINESS_CENTER && (
                          <button
                            onClick={() => onAddAdsAccount(bc.id)}
                            className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg border border-dashed border-davo-border text-xs font-medium text-davo-muted hover:border-davo-blue hover:text-davo-blue transition-colors"
                          >
                            <Plus size={13} /> Add ads account ({ads.length}/{MAX_ADS_ACCOUNTS_PER_BUSINESS_CENTER})
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {centers.length < MAX_BUSINESS_CENTERS_PER_GMAIL && (
                <button
                  onClick={() => onAddBusinessCenter(account.id)}
                  className="w-full flex items-center justify-center gap-1.5 h-10 rounded-xl border border-dashed border-davo-border text-sm font-medium text-davo-muted hover:border-davo-blue hover:text-davo-blue transition-colors"
                >
                  <Plus size={14} /> Add business center ({centers.length}/{MAX_BUSINESS_CENTERS_PER_GMAIL})
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
