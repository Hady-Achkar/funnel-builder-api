import { AddOnType } from "../../generated/prisma-client";

/**
 * Result from processing a single expired addon
 */
export interface ExpiredAddonResult {
  addonId: number;
  addonType: AddOnType;
  userId: number;
  workspaceId: number | null;
  success: boolean;
  resourcesAffected: {
    workspaces?: number;
    funnels?: number;
    pages?: number;
    domains?: number;
    members?: number;
  };
  error?: string;
}

/**
 * Summary of entire addon expiration cron run
 */
export interface AddonExpirationSummary {
  success: boolean;
  totalExpired: number;
  totalProcessed: number;
  totalFailed: number;
  results: ExpiredAddonResult[];
  errors: Array<{
    addonId: number;
    error: string;
  }>;
  executionTime: number;
}

/**
 * Result from sending a single warning email
 */
export interface EmailReminderResult {
  addonId: number;
  addonType: AddOnType;
  userId: number;
  userEmail: string;
  daysUntilExpiration: number;
  emailSent: boolean;
  error?: string;
}

/**
 * Summary of warning email cron run
 */
export interface EmailReminderSummary {
  success: boolean;
  totalEligible: number;
  day7Sent: number;
  day3Sent: number;
  day1Sent: number;
  totalFailed: number;
  results: EmailReminderResult[];
  errors: Array<{
    addonId: number;
    error: string;
  }>;
  executionTime: number;
}

/**
 * Standard return type for all handlers
 */
export interface HandlerResult {
  success: boolean;
  resourcesAffected: {
    workspaces?: number;
    funnels?: number;
    pages?: number;
    domains?: number;
    members?: number;
  };
  details?: Record<string, any>;
  error?: string;
}

/**
 * Data for addon expiration emails
 */
export interface AddonExpirationEmailData {
  recipientName: string;
  addonTypeName: string; // User-friendly name (e.g., "Extra Website")
  quantity: number;
  expirationDate: Date;
  daysUntilExpiration?: number; // For warning emails
  whatWillHappen: string; // Specific description of what will be disabled
  renewalUrl: string;
}

/**
 * Expiration reminder tracking
 */
export interface ExpirationReminders {
  day7?: boolean;
  day3?: boolean;
  day1?: boolean;
  resourcesProcessed?: boolean; // Track if addon resources have been disabled
}

/**
 * Result from marking a subscription as expired
 */
export interface ExpiredSubscriptionResult {
  subscriptionId: number;
  userId: number;
  planType: string;
  previousStatus: string;
  endDate: Date;
  success: boolean;
  error?: string;
}

/**
 * Result from marking an addon as expired (without processing)
 */
export interface ExpiredAddonMarkResult {
  addonId: number;
  addonType: AddOnType;
  userId: number;
  workspaceId: number | null;
  previousStatus: string;
  endDate: Date;
  success: boolean;
  error?: string;
}

/**
 * Summary of subscription and addon expiration marking
 */
export interface ExpirationMarkingSummary {
  success: boolean;
  subscriptions: {
    totalMarked: number;
    results: ExpiredSubscriptionResult[];
  };
  addons: {
    totalMarked: number;
    results: ExpiredAddonMarkResult[];
  };
  errors: Array<{
    id: number;
    type: "subscription" | "addon";
    error: string;
  }>;
  executionTime: number;
}
