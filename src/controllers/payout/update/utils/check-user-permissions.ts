import { PayoutStatus } from "../../../../generated/prisma-client";
import { UpdatePayoutRequest } from "../../../../types/payout/update";

interface PermissionCheckResult {
  allowed: boolean;
  error?: string;
  isUserSelfCancellation?: boolean;
}

/**
 * Check if user has permission to perform the update
 * Pure function - returns permission result
 */
export function checkUserPermissions(
  userId: number,
  isAdmin: boolean,
  payoutUserId: number,
  currentStatus: PayoutStatus,
  request: UpdatePayoutRequest
): PermissionCheckResult {
  const isPayoutCreator = userId === payoutUserId;

  // Admin can do anything (except modify final states - handled elsewhere)
  if (isAdmin) {
    return { allowed: true };
  }

  // Non-creator, non-admin cannot do anything
  if (!isPayoutCreator) {
    return {
      allowed: false,
      error: "You don't have permission to perform this action",
    };
  }

  // Payout creator can only cancel PENDING payouts
  if (isPayoutCreator) {
    // Check if user is trying to update any field other than status
    const updatingOtherFields = Object.keys(request).some(
      (key) => key !== "status"
    );

    if (updatingOtherFields) {
      return {
        allowed: false,
        error: "You can only cancel your pending withdrawal request",
      };
    }

    // Check if user is trying to change status to something other than CANCELLED
    if (request.status && request.status !== "CANCELLED") {
      return {
        allowed: false,
        error: "You can only cancel your pending withdrawal request",
      };
    }

    // Check if current status is PENDING
    if (currentStatus !== "PENDING") {
      // For other statuses (PROCESSING, ON_HOLD, COMPLETED, FAILED, CANCELLED), return permission error
      return {
        allowed: false,
        error: "You can only cancel pending withdrawal requests",
      };
    }

    // User can cancel their PENDING payout
    return { allowed: true, isUserSelfCancellation: true };
  }

  return {
    allowed: false,
    error: "You don't have permission to perform this action",
  };
}
