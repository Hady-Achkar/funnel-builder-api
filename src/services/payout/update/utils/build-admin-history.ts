import { PayoutStatus, Payout } from "../../../../generated/prisma-client";
import { AdminHistoryEntry } from "../../../../types/payout/update";
import { UpdatePayoutRequest } from "../../../../types/payout/update";

/**
 * Build a new admin history entry with full record snapshot
 * Pure function - creates history record from update data and full payout state
 */
export function buildAdminHistoryEntry(
  adminCode: string,
  previousStatus: PayoutStatus,
  newStatus: PayoutStatus | null,
  changes: Record<string, any>,
  fullPayoutRecord: Payout
): AdminHistoryEntry {
  // Serialize the full payout record (convert dates to ISO strings)
  const fullRecord: Record<string, any> = {
    id: fullPayoutRecord.id,
    userId: fullPayoutRecord.userId,
    amount: fullPayoutRecord.amount,
    fees: fullPayoutRecord.fees,
    netAmount: fullPayoutRecord.netAmount,
    currency: fullPayoutRecord.currency,
    status: fullPayoutRecord.status,
    method: fullPayoutRecord.method,
    accountHolderName: fullPayoutRecord.accountHolderName,
    bankName: fullPayoutRecord.bankName,
    accountNumber: fullPayoutRecord.accountNumber,
    swiftCode: fullPayoutRecord.swiftCode,
    bankAddress: fullPayoutRecord.bankAddress,
    usdtWalletAddress: fullPayoutRecord.usdtWalletAddress,
    usdtNetwork: fullPayoutRecord.usdtNetwork,
    documentUrl: fullPayoutRecord.documentUrl,
    documentType: fullPayoutRecord.documentType,
    transactionId: fullPayoutRecord.transactionId,
    transactionProof: fullPayoutRecord.transactionProof,
    adminNotes: fullPayoutRecord.adminNotes,
    userNotes: fullPayoutRecord.userNotes,
    failureReason: fullPayoutRecord.failureReason,
    processedAt: fullPayoutRecord.processedAt?.toISOString() || null,
    failedAt: fullPayoutRecord.failedAt?.toISOString() || null,
    createdAt: fullPayoutRecord.createdAt.toISOString(),
    updatedAt: fullPayoutRecord.updatedAt.toISOString(),
  };

  return {
    adminCode: adminCode as any, // Will be validated by Zod
    timestamp: new Date().toISOString(),
    action: "UPDATE",
    previousStatus,
    newStatus,
    changes,
    fullRecord,
  };
}

/**
 * Append new entry to existing admin history
 * Pure function - merges history arrays
 */
export function appendToAdminHistory(
  existingHistory: any,
  newEntry: AdminHistoryEntry
): AdminHistoryEntry[] {
  // Parse existing history if it's a string or ensure it's an array
  let history: AdminHistoryEntry[] = [];

  if (existingHistory) {
    if (typeof existingHistory === "string") {
      try {
        history = JSON.parse(existingHistory);
      } catch {
        history = [];
      }
    } else if (Array.isArray(existingHistory)) {
      history = existingHistory;
    } else if (typeof existingHistory === "object") {
      // If it's already parsed as an object, wrap it in an array
      history = [existingHistory];
    }
  }

  // Append new entry
  return [...history, newEntry];
}

/**
 * Extract changes from update request
 * Pure function - creates changes object
 */
export function extractChanges(
  request: UpdatePayoutRequest,
  statusChanged: boolean
): Record<string, any> {
  const changes: Record<string, any> = {};

  if (statusChanged && request.status) {
    changes.status = request.status;
  }

  if (request.documentUrl !== undefined) {
    changes.documentUrl = request.documentUrl;
  }

  if (request.documentType !== undefined) {
    changes.documentType = request.documentType;
  }

  if (request.transactionId !== undefined) {
    changes.transactionId = request.transactionId;
  }

  if (request.transactionProof !== undefined) {
    changes.transactionProof = request.transactionProof;
  }

  if (request.adminNotes !== undefined) {
    changes.adminNotes = request.adminNotes;
  }

  if (request.failureReason !== undefined) {
    changes.failureReason = request.failureReason;
  }

  return changes;
}
