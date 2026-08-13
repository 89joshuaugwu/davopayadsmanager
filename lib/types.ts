export type GmailStatus = "active" | "disabled";
export type BusinessCenterStatus = "active" | "disabled";
export type AdsAccountStatus = "active" | "paused" | "blocked" | "closed";

export interface GmailAccount {
  id: string;
  email: string;
  encryptedPassword: string; // AES-256, never sent to client in plaintext
  tiktokAccountName?: string;
  tiktokManagerAccountName?: string;
  status: GmailStatus;
  notes?: string;
  dateCreated: string; // ISO date
  createdAt: number; // epoch ms, for sorting
}

// Shape returned to the client — password is masked, never the ciphertext
export interface GmailAccountPublic extends Omit<GmailAccount, "encryptedPassword"> {
  hasPassword: boolean;
}

export interface BusinessCenter {
  id: string;
  gmailAccountId: string;
  name: string;
  websiteUrl?: string;
  amountFunded: number;
  dateFunded: string; // ISO date — most recent funding top-up
  dateCreated: string; // ISO date — when this business center was actually opened
  status: BusinessCenterStatus;
  createdAt: number;
}

export interface AdsAccount {
  id: string;
  businessCenterId: string;
  name: string;
  destinationUrl?: string;
  amountSpent: number;
  cpa: number; // cost per conversion/action
  hasAd: boolean;
  status: AdsAccountStatus;
  invalidationReason?: string;
  fundsLost: number;
  dateUpdated: string; // ISO date — most recent spend/CPA log
  dateCreated: string; // ISO date — when this ads account was actually opened
  createdAt: number;
}

export interface AdsDailyLog {
  id: string;
  adsAccountId: string;
  businessCenterId: string; // denormalized, for fast filtering
  gmailAccountId: string; // denormalized, for fast filtering
  date: string; // ISO date, one entry per account per day (upserted)
  amountSpent: number;
  cpa: number;
  createdAt: number;
}

export interface PaymentCard {
  id: string;
  name: string;
  lastFour: string; // last 4 digits only — never store full card numbers
  businessCenterId?: string; // if set, this card is dedicated to one business center
  status: "active" | "inactive";
  notes?: string;
  createdAt: number;
}

export interface BusinessCenterFunding {
  id: string;
  businessCenterId: string;
  gmailAccountId: string; // denormalized, for fast filtering
  cardId?: string; // which card funded this top-up, if any
  amount: number;
  date: string; // ISO date
  note?: string;
  createdAt: number;
}

export interface FinancialTotals {
  totalFunded: number;
  totalSpent: number;
  totalLost: number;
  remainingBalance: number;
  highCpaCount: number;
}

export const CPA_ALERT_THRESHOLD = 100;
export const MAX_BUSINESS_CENTERS_PER_GMAIL = 3;
export const MAX_ADS_ACCOUNTS_PER_BUSINESS_CENTER = 3;

export const ADS_STATUS_OPTIONS: AdsAccountStatus[] = ["active", "paused", "blocked", "closed"];

export interface AdsAccountFilters {
  gmailAccountIds: string[];
  businessCenterIds: string[];
  adsAccountIds: string[];
  statuses: AdsAccountStatus[];
  start: string; // ISO date, "" = no lower bound
  end: string; // ISO date, "" = no upper bound
}
