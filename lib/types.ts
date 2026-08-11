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
  dateFunded: string; // ISO date
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
  dateUpdated: string; // ISO date
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
