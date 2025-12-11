import { UpdatePayoutRequest } from "../../../../types/payout/update";
import { PayoutStatus } from "../../../../generated/prisma-client";

interface UpdateData {
  status?: PayoutStatus;
  documentUrl?: string | null;
  documentType?: string | null;
  transactionId?: string | null;
  transactionProof?: string | null;
  adminNotes?: string | null;
  failureReason?: string | null;
  processedAt?: Date;
  failedAt?: Date;
}

/**
 * Prepare update data based on request and status changes
 * Pure function - handles timestamp logic and field trimming
 */
export function prepareUpdateData(
  request: UpdatePayoutRequest,
  currentStatus: PayoutStatus,
  currentProcessedAt: Date | null
): UpdateData {
  const updateData: UpdateData = {};

  // Handle status update
  if (request.status && request.status !== currentStatus) {
    updateData.status = request.status;

    // Set processedAt when transitioning to PROCESSING (only if not already set)
    if (request.status === "PROCESSING" && !currentProcessedAt) {
      updateData.processedAt = new Date();
    }

    // Set processedAt when transitioning to COMPLETED (only if not already set)
    if (request.status === "COMPLETED" && !currentProcessedAt) {
      updateData.processedAt = new Date();
    }

    // Set failedAt when transitioning to FAILED
    if (request.status === "FAILED") {
      updateData.failedAt = new Date();
    }
  }

  // Handle admin fields - trim strings but keep empty strings as empty strings
  if (request.documentUrl !== undefined) {
    updateData.documentUrl =
      request.documentUrl === "" ? "" : request.documentUrl.trim();
  }

  if (request.documentType !== undefined) {
    updateData.documentType =
      request.documentType === "" ? "" : request.documentType.trim();
  }

  if (request.transactionId !== undefined) {
    updateData.transactionId =
      request.transactionId === "" ? "" : request.transactionId.trim();
  }

  if (request.transactionProof !== undefined) {
    updateData.transactionProof =
      request.transactionProof === ""
        ? ""
        : request.transactionProof.trim();
  }

  if (request.adminNotes !== undefined) {
    updateData.adminNotes =
      request.adminNotes === "" ? "" : request.adminNotes.trim();
  }

  if (request.failureReason !== undefined) {
    updateData.failureReason =
      request.failureReason === "" ? "" : request.failureReason.trim();
  }

  return updateData;
}
