import { PayoutStatus } from "../../../../generated/prisma-client";

/**
 * Type for payout data needed for pending calculations
 */
type PayoutForPendingCalc = {
  amount: number;
  status: PayoutStatus;
};

/**
 * Calculate total amount in pending payouts
 * Pure function - no Prisma, no error throwing
 */
export function calculatePendingAmount(payouts: PayoutForPendingCalc[]): number {
  // Consider PENDING, PROCESSING, and ON_HOLD as pending
  const pendingStatuses: PayoutStatus[] = ["PENDING", "PROCESSING", "ON_HOLD"];

  const totalPending = payouts
    .filter((payout) => pendingStatuses.includes(payout.status))
    .reduce((sum, payout) => sum + payout.amount, 0);

  return Math.round(totalPending * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate available balance after pending payouts
 * Pure function - no Prisma, no error throwing
 */
export function calculateAvailableBalance(
  userBalance: number,
  pendingAmount: number
): number {
  const available = userBalance - pendingAmount;
  return Math.round(available * 100) / 100; // Round to 2 decimal places
}