import { Payout } from "../../../../generated/prisma-client";

/**
 * Check if transaction ID is unique (excluding current payout)
 * Pure function - checks against existing payouts
 */
export function isTransactionIdUnique(
  transactionId: string,
  currentPayoutId: number,
  existingPayouts: Payout[]
): boolean {
  return !existingPayouts.some(
    (payout) =>
      payout.transactionId === transactionId && payout.id !== currentPayoutId
  );
}
