import { PayoutMethod } from "../../../../generated/prisma-client";

/**
 * Type for payout data needed for duplicate checking
 */
type PayoutForDuplicateCheck = {
  amount: number;
  method: PayoutMethod;
  createdAt: Date;
};

/**
 * Check if there's a duplicate submission within the last 5 seconds
 * Pure function - no Prisma, no error throwing
 */
export function checkDuplicateSubmission(
  recentPayouts: PayoutForDuplicateCheck[],
  amount: number,
  method: PayoutMethod
): boolean {
  const fiveSecondsAgo = new Date(Date.now() - 5000);

  // Check if there's a payout with same amount and method within last 5 seconds
  const hasDuplicate = recentPayouts.some(
    (payout) =>
      payout.amount === amount &&
      payout.method === method &&
      payout.createdAt >= fiveSecondsAgo
  );

  return hasDuplicate;
}