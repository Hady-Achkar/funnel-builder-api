import { UserPlan, AddOnType } from "../../generated/prisma-client";

/**
 * Centralized utility for calculating page allocations per funnel based on workspace plan type and add-ons
 * This is the single source of truth for page limits per funnel
 */

// Base page allocations per funnel (same for all workspace plan types)
const BASE_PAGE_ALLOCATIONS: Record<UserPlan, number> = {
  [UserPlan.FREE]: 35,       // Free workspace: 35 pages per funnel
  [UserPlan.BUSINESS]: 35,   // Business workspace: 35 pages per funnel
  [UserPlan.AGENCY]: 35,     // Agency workspace: 35 pages per funnel
};

export interface PageAllocationInput {
  workspacePlanType: UserPlan;  // The plan type of the workspace (not user)
  addOns?: Array<{
    type: AddOnType;
    quantity: number;
    status: string;
  }>;
}

export class FunnelPageAllocations {
  /**
   * Get base page allocation for a workspace plan type (without add-ons)
   */
  static getBaseAllocation(workspacePlanType: UserPlan): number {
    return BASE_PAGE_ALLOCATIONS[workspacePlanType] || BASE_PAGE_ALLOCATIONS[UserPlan.FREE];
  }

  /**
   * Calculate total page allocation including add-ons
   * Each EXTRA_PAGE add-on adds 5 pages per funnel
   */
  static calculateTotalAllocation(input: PageAllocationInput): number {
    const { workspacePlanType, addOns = [] } = input;

    // Start with base allocation from workspace plan type
    let totalPages = this.getBaseAllocation(workspacePlanType);

    // Add extra pages from active EXTRA_PAGE add-ons
    // Each add-on quantity represents units, where each unit gives 5 extra pages
    const extraPages = addOns
      .filter(addon =>
        addon.type === AddOnType.EXTRA_PAGE &&
        addon.status === 'ACTIVE'
      )
      .reduce((sum, addon) => sum + (addon.quantity * 5), 0); // 5 pages per add-on unit

    totalPages += extraPages;

    return totalPages;
  }

  /**
   * Check if funnel can have more pages
   */
  static canCreatePage(
    currentPageCount: number,
    input: PageAllocationInput
  ): boolean {
    const totalAllowed = this.calculateTotalAllocation(input);
    return currentPageCount < totalAllowed;
  }

  /**
   * Get remaining page slots
   */
  static getRemainingSlots(
    currentPageCount: number,
    input: PageAllocationInput
  ): number {
    const totalAllowed = this.calculateTotalAllocation(input);
    const remaining = totalAllowed - currentPageCount;
    return Math.max(0, remaining);
  }

  /**
   * Get page allocation summary
   */
  static getAllocationSummary(
    currentPageCount: number,
    input: PageAllocationInput
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
      currentUsage: currentPageCount,
      remainingSlots: this.getRemainingSlots(currentPageCount, input),
      canCreateMore: this.canCreatePage(currentPageCount, input),
    };
  }
}

// Export for backward compatibility
export const getPageAllocation = (workspacePlanType: UserPlan): number => {
  return FunnelPageAllocations.getBaseAllocation(workspacePlanType);
};
