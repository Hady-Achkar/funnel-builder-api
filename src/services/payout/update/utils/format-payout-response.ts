import { Payout } from "../../../../generated/prisma-client";
import { UpdatePayoutResponse } from "../../../../types/payout/update";

/**
 * Format payout data into response structure
 * Pure function - no side effects
 */
export function formatPayoutResponse(
  payout: Payout,
  message: string
): UpdatePayoutResponse {
  return {
    success: true,
    message,
    payout: {
      id: payout.id,
      userId: payout.userId,
      amount: payout.amount,
      fees: payout.fees,
      netAmount: payout.netAmount,
      status: payout.status,
      method: payout.method,
      accountHolderName: payout.accountHolderName,
      bankName: payout.bankName,
      accountNumber: payout.accountNumber,
      swiftCode: payout.swiftCode,
      bankAddress: payout.bankAddress,
      usdtWalletAddress: payout.usdtWalletAddress,
      usdtNetwork: payout.usdtNetwork,
      userNotes: payout.userNotes,
      documentUrl: payout.documentUrl,
      documentType: payout.documentType,
      transactionId: payout.transactionId,
      transactionProof: payout.transactionProof,
      adminNotes: payout.adminNotes,
      failureReason: payout.failureReason,
      processedAt: payout.processedAt,
      failedAt: payout.failedAt,
      createdAt: payout.createdAt,
      updatedAt: payout.updatedAt,
    },
  };
}
