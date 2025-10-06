import { UserPlan, AddOnType } from "../../generated/prisma-client";

/**
 * Centralized utility for calculating admin allocations per workspace based on workspace plan type and add-ons
 * This is the single source of truth for admin limits per workspace
 */

// Base admin budget allocations per workspace plan type
const BASE_ADMIN_ALLOCATIONS: Record<UserPlan, number> = {
  [UserPlan.FREE]: 1,       // Free workspace: 1 admin
  [UserPlan.BUSINESS]: 2,   // Business workspace: 2 admins
  [UserPlan.AGENCY]: 1,     // Agency workspace: 1 admin (can purchase EXTRA_ADMIN at $5/month)
};

export interface AdminAllocationInput {
  workspacePlanType: UserPlan;  // The plan type of the workspace (not user)
  addOns?: Array<{
    type: AddOnType;
    quantity: number;
    status: string;
  }>;
}

export class WorkspaceAdminAllocations {
  /**
   * Get base admin allocation for a workspace plan type (without add-ons)
   */
  static getBaseAllocation(workspacePlanType: UserPlan): number {
    return BASE_ADMIN_ALLOCATIONS[workspacePlanType] || BASE_ADMIN_ALLOCATIONS[UserPlan.FREE];
  }

  /**
   * Calculate total admin allocation including add-ons
   */
  static calculateTotalAllocation(input: AdminAllocationInput): number {
    const { workspacePlanType, addOns = [] } = input;

    // Start with base allocation from workspace plan type
    let totalAdmins = this.getBaseAllocation(workspacePlanType);

    // Add extra admin slots from active EXTRA_ADMIN add-ons (mainly for Agency plan)
    const extraAdmins = addOns
      .filter(addon =>
        addon.type === AddOnType.EXTRA_ADMIN &&
        addon.status === 'ACTIVE'
      )
      .reduce((sum, addon) => sum + addon.quantity, 0);

    totalAdmins += extraAdmins;

    return totalAdmins;
  }

  /**
   * Check if workspace can promote more members to admin
   */
  static canPromoteToAdmin(
    currentAdminCount: number,
    input: AdminAllocationInput
  ): boolean {
    const totalAllowed = this.calculateTotalAllocation(input);
    return currentAdminCount < totalAllowed;
  }

  /**
   * Get remaining admin slots
   */
  static getRemainingSlots(
    currentAdminCount: number,
    input: AdminAllocationInput
  ): number {
    const totalAllowed = this.calculateTotalAllocation(input);
    const remaining = totalAllowed - currentAdminCount;
    return Math.max(0, remaining);
  }

  /**
   * Get admin allocation summary
   */
  static getAllocationSummary(
    currentAdminCount: number,
    input: AdminAllocationInput
  ): {
    baseAllocation: number;
    extraFromAddOns: number;
    totalAllocation: number;
    currentUsage: number;
    remainingSlots: number;
    canPromoteMore: boolean;
  } {
    const baseAllocation = this.getBaseAllocation(input.workspacePlanType);
    const totalAllocation = this.calculateTotalAllocation(input);
    const extraFromAddOns = totalAllocation - baseAllocation;

    return {
      baseAllocation,
      extraFromAddOns,
      totalAllocation,
      currentUsage: currentAdminCount,
      remainingSlots: this.getRemainingSlots(currentAdminCount, input),
      canPromoteMore: this.canPromoteToAdmin(currentAdminCount, input),
    };
  }
}

// Export for backward compatibility
export const getAdminAllocation = (workspacePlanType: UserPlan): number => {
  return WorkspaceAdminAllocations.getBaseAllocation(workspacePlanType);
};
