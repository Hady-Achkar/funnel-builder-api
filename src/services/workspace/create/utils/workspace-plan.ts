import { UserPlan } from "../../../../generated/prisma-client";

/**
 * Pure utility function to determine workspace plan type
 * NO Prisma, NO error throwing - just business logic
 */

/**
 * Determine the workspace plan type based on user's plan and optional override
 * If explicit planType is provided, use it. Otherwise, inherit from user's plan.
 *
 * @param userPlan - The user's current plan
 * @param explicitPlanType - Optional explicit plan type from request
 * @returns The plan type to use for the workspace
 */
export function determineWorkspacePlanType(
  userPlan: UserPlan,
  explicitPlanType?: UserPlan
): UserPlan {
  // If explicit planType provided, use it (allows downgrade/upgrade per workspace)
  if (explicitPlanType) {
    return explicitPlanType;
  }

  // Otherwise, inherit user's plan
  return userPlan;
}
