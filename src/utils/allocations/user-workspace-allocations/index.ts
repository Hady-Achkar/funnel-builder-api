import { UserPlan, AddOnType } from "../../../generated/prisma-client";

/**
 * Centralized utility for calculating workspace allocations based on user plan and add-ons
 * This is the single source of truth for workspace limits
 */

// Base workspace allocations per plan
const BASE_WORKSPACE_ALLOCATIONS: Record<UserPlan, number> = {
  [UserPlan.FREE]: 1, // Free plan: 1 workspace
  [UserPlan.BUSINESS]: 1, // Business plan: 1 workspaces
  [UserPlan.AGENCY]: 10000, // Agency plan: 10000 workspaces
};

export interface WorkspaceAllocationInput {
  plan: UserPlan;
  addOns?: Array<{
    type: AddOnType;
    quantity: number;
    status: string;
  }>;
}

export class UserWorkspaceAllocations {
  /**
   * Get base workspace allocation for a plan (without add-ons)
   */
  static getBaseAllocation(plan: UserPlan): number {
    return (
      BASE_WORKSPACE_ALLOCATIONS[plan] ||
      BASE_WORKSPACE_ALLOCATIONS[UserPlan.FREE]
    );
  }

  /**
   * Calculate total workspace allocation including add-ons
   */
  static calculateTotalAllocation(input: WorkspaceAllocationInput): number {
    const { plan, addOns = [] } = input;

    // Start with base allocation
    let totalWorkspaces = this.getBaseAllocation(plan);

    // Add extra workspaces from active add-ons
    const extraWorkspaces = addOns
      .filter(
        (addon) =>
          addon.type === AddOnType.EXTRA_WORKSPACE && addon.status === "ACTIVE"
      )
      .reduce((sum, addon) => sum + addon.quantity, 0);

    totalWorkspaces += extraWorkspaces;

    return totalWorkspaces;
  }

  /**
   * Check if user can create more workspaces
   */
  static canCreateWorkspace(
    currentWorkspaceCount: number,
    input: WorkspaceAllocationInput
  ): boolean {
    const totalAllowed = this.calculateTotalAllocation(input);
    return currentWorkspaceCount < totalAllowed;
  }

  /**
   * Get remaining workspace slots
   */
  static getRemainingSlots(
    currentWorkspaceCount: number,
    input: WorkspaceAllocationInput
  ): number {
    const totalAllowed = this.calculateTotalAllocation(input);
    const remaining = totalAllowed - currentWorkspaceCount;
    return Math.max(0, remaining);
  }

  /**
   * Get workspace allocation summary
   */
  static getAllocationSummary(
    currentWorkspaceCount: number,
    input: WorkspaceAllocationInput
  ): {
    baseAllocation: number;
    extraFromAddOns: number;
    totalAllocation: number;
    currentUsage: number;
    remainingSlots: number;
    canCreateMore: boolean;
  } {
    const baseAllocation = this.getBaseAllocation(input.plan);
    const totalAllocation = this.calculateTotalAllocation(input);
    const extraFromAddOns = totalAllocation - baseAllocation;

    return {
      baseAllocation,
      extraFromAddOns,
      totalAllocation,
      currentUsage: currentWorkspaceCount,
      remainingSlots: this.getRemainingSlots(currentWorkspaceCount, input),
      canCreateMore: this.canCreateWorkspace(currentWorkspaceCount, input),
    };
  }
}

// Export for backward compatibility
export const getWorkspaceAllocation = (plan: UserPlan): number => {
  return UserWorkspaceAllocations.getBaseAllocation(plan);
};
