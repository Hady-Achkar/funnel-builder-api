/**
 * Check if user has sufficient balance to complete payout
 * Pure function - returns boolean
 */
export function hasSufficientBalance(
  userBalance: number,
  payoutAmount: number
): boolean {
  return userBalance >= payoutAmount;
}
