import { UserPlan, AddOnType } from "../../../generated/prisma-client";

/**
 * Centralized utility for calculating funnel allocations per workspace based on workspace plan type and add-ons
 * This is the single source of truth for funnel limits per workspace
 */

// Base funnel allocations per workspace plan type
const BASE_FUNNEL_ALLOCATIONS: Record<UserPlan, number> = {
  [UserPlan.FREE]: 1, // Free workspace: 1 funnel
  [UserPlan.BUSINESS]: 1, // Business workspace: 1 funnel
  [UserPlan.AGENCY]: 10, // Agency workspace: 10 funnels
};

export interface FunnelAllocationInput {
  workspacePlanType: UserPlan; // The plan type of the workspace (not user)
  addOns?: Array<{
    type: AddOnType;
    quantity: number;
    status: string;
  }>;
}

export class WorkspaceFunnelAllocations {
  /**
   * Get base funnel allocation for a workspace plan type (without add-ons)
   */
  static getBaseAllocation(workspacePlanType: UserPlan): number {
    return (
      BASE_FUNNEL_ALLOCATIONS[workspacePlanType] ||
      BASE_FUNNEL_ALLOCATIONS[UserPlan.FREE]
    );
  }

  /**
   * Calculate total funnel allocation including add-ons
   */
  static calculateTotalAllocation(input: FunnelAllocationInput): number {
    const { workspacePlanType, addOns = [] } = input;

    // Start with base allocation from workspace plan type
    let totalFunnels = this.getBaseAllocation(workspacePlanType);

    // Add extra funnels from active add-ons
    const extraFunnels = addOns
      .filter(
        (addon) =>
          addon.type === AddOnType.EXTRA_FUNNEL && addon.status === "ACTIVE"
      )
      .reduce((sum, addon) => sum + addon.quantity, 0);

    totalFunnels += extraFunnels;

    return totalFunnels;
  }

  /**
   * Check if workspace can create more funnels
   */
  static canCreateFunnel(
    currentFunnelCount: number,
    input: FunnelAllocationInput
  ): boolean {
    const totalAllowed = this.calculateTotalAllocation(input);
    return currentFunnelCount < totalAllowed;
  }

  /**
   * Get remaining funnel slots
   */
  static getRemainingSlots(
    currentFunnelCount: number,
    input: FunnelAllocationInput
  ): number {
    const totalAllowed = this.calculateTotalAllocation(input);
    const remaining = totalAllowed - currentFunnelCount;
    return Math.max(0, remaining);
  }

  /**
   * Get funnel allocation summary
   */
  static getAllocationSummary(
    currentFunnelCount: number,
    input: FunnelAllocationInput
  ): {
    baseAllocation: number;
    extraFromAddOns: number;
    totalAllocation: number;
    currentUsage: number;
    remainingSlots: number;
    canCreateMore: boolean;
  } {
    const baseAllocation = this.getBaseAllocation(input.workspacePlanType);
    const totalAllocation = this.calculateTotalAllocation(input);
    const extraFromAddOns = totalAllocation - baseAllocation;

    return {
      baseAllocation,
      extraFromAddOns,
      totalAllocation,
      currentUsage: currentFunnelCount,
      remainingSlots: this.getRemainingSlots(currentFunnelCount, input),
      canCreateMore: this.canCreateFunnel(currentFunnelCount, input),
    };
  }
}

// Export for backward compatibility
export const getFunnelAllocation = (workspacePlanType: UserPlan): number => {
  return WorkspaceFunnelAllocations.getBaseAllocation(workspacePlanType);
};
