import { Payout } from "../../../../generated/prisma-client";
import { RequestPayoutResponse } from "../../../../types/payout/request";

/**
 * Format payout data for response
 * Pure function - no Prisma, no error throwing
 */
export function formatPayoutResponse(
  payout: Payout,
  amount: number
): RequestPayoutResponse {
  return {
    success: true,
    message: `Your withdrawal request for $${amount.toFixed(2)} has been submitted successfully`,
    payout: {
      id: payout.id,
      amount: Math.round(payout.amount * 100) / 100, // Ensure 2 decimal places
      fees: Math.round(payout.fees * 100) / 100,
      netAmount: Math.round(payout.netAmount * 100) / 100,
      method: payout.method,
      status: payout.status,
      accountHolderName: payout.accountHolderName,
      bankName: payout.bankName,
      accountNumber: payout.accountNumber,
      swiftCode: payout.swiftCode,
      bankAddress: payout.bankAddress,
      usdtWalletAddress: payout.usdtWalletAddress,
      usdtNetwork: payout.usdtNetwork,
      userNotes: payout.userNotes,
      createdAt: payout.createdAt,
    },
  };
}