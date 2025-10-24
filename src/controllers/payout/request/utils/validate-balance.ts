/**
 * Validate user balance for withdrawal
 * Pure function - no Prisma, no error throwing
 */
export function validateBalance(
  userBalance: number,
  requestedAmount: number,
  availableBalance: number
): { isValid: boolean; error?: string } {
  // Check if user has minimum $50 balance
  if (userBalance < 50) {
    return {
      isValid: false,
      error: "Your balance must be at least $50 to request a withdrawal",
    };
  }

  // Check if requested amount exceeds available balance (considering pending payouts)
  if (requestedAmount > availableBalance) {
    if (availableBalance !== userBalance) {
      // There are pending payouts
      return {
        isValid: false,
        error: `You don't have enough funds. Your available balance is $${availableBalance.toFixed(2)} after pending withdrawals`,
      };
    } else {
      // No pending payouts, just insufficient balance
      return {
        isValid: false,
        error: `You don't have enough funds. Your available balance is $${userBalance.toFixed(2)}`,
      };
    }
  }

  return { isValid: true };
}