import { PayoutStatus } from "../../../../generated/prisma-client";

/**
 * Validate if status transition is allowed
 * Pure function - returns error message or null
 */
export function validateStatusTransition(
  currentStatus: PayoutStatus,
  newStatus: PayoutStatus
): string | null {
  // Cannot modify final states
  if (currentStatus === "COMPLETED") {
    return "Cannot modify a completed payout";
  }
  if (currentStatus === "FAILED") {
    return "Cannot modify a failed payout";
  }
  if (currentStatus === "CANCELLED") {
    return "Cannot modify a cancelled payout";
  }

  // All other transitions from PENDING, PROCESSING, ON_HOLD are allowed
  return null;
}
