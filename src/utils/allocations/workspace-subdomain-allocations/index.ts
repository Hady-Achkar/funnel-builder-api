import { UserPlan, AddOnType } from "../../../generated/prisma-client";

/**
 * Centralized utility for calculating subdomain allocations per workspace based on workspace plan type and add-ons
 * This is the single source of truth for subdomain limits per workspace
 */

// Base subdomain allocations per workspace plan type
const BASE_SUBDOMAIN_ALLOCATIONS: Record<UserPlan, number> = {
  [UserPlan.FREE]: 1, // Free workspace: 1 subdomain
  [UserPlan.BUSINESS]: 1, // Business workspace: 1 subdomain
  [UserPlan.AGENCY]: 1, // Agency workspace: 1 subdomain
};

export interface SubdomainAllocationInput {
  workspacePlanType: UserPlan; // The plan type of the workspace (not user)
  addOns?: Array<{
    type: AddOnType;
    quantity: number;
    status: string;
  }>;
}

export class WorkspaceSubdomainAllocations {
  /**
   * Get base subdomain allocation for a workspace plan type (without add-ons)
   */
  static getBaseAllocation(workspacePlanType: UserPlan): number {
    return (
      BASE_SUBDOMAIN_ALLOCATIONS[workspacePlanType] ||
      BASE_SUBDOMAIN_ALLOCATIONS[UserPlan.FREE]
    );
  }

  /**
   * Calculate total subdomain allocation including add-ons
   */
  static calculateTotalAllocation(input: SubdomainAllocationInput): number {
    const { workspacePlanType, addOns = [] } = input;

    // Start with base allocation from workspace plan type
    let totalSubdomains = this.getBaseAllocation(workspacePlanType);

    // Add extra subdomains from active EXTRA_DOMAIN add-ons
    const extraSubdomains = addOns
      .filter(
        (addon) =>
          addon.type === AddOnType.EXTRA_DOMAIN && addon.status === "ACTIVE"
      )
      .reduce((sum, addon) => sum + addon.quantity, 0);

    totalSubdomains += extraSubdomains;

    return totalSubdomains;
  }

  /**
   * Check if workspace can create more subdomains
   */
  static canCreateSubdomain(
    currentSubdomainCount: number,
    input: SubdomainAllocationInput
  ): boolean {
    const totalAllowed = this.calculateTotalAllocation(input);
    return currentSubdomainCount < totalAllowed;
  }

  /**
   * Get remaining subdomain slots
   */
  static getRemainingSlots(
    currentSubdomainCount: number,
    input: SubdomainAllocationInput
  ): number {
    const totalAllowed = this.calculateTotalAllocation(input);
    const remaining = totalAllowed - currentSubdomainCount;
    return Math.max(0, remaining);
  }

  /**
   * Get subdomain allocation summary
   */
  static getAllocationSummary(
    currentSubdomainCount: number,
    input: SubdomainAllocationInput
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
      currentUsage: currentSubdomainCount,
      remainingSlots: this.getRemainingSlots(currentSubdomainCount, input),
      canCreateMore: this.canCreateSubdomain(currentSubdomainCount, input),
    };
  }
}

// Export for backward compatibility
export const getSubdomainAllocation = (workspacePlanType: UserPlan): number => {
  return WorkspaceSubdomainAllocations.getBaseAllocation(workspacePlanType);
};
