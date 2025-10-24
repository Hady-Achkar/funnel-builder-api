import { UserPlan, AddOnType } from "../../../generated/prisma-client";
import { SubscriptionValidator } from "../../subscription-utils/subscription-validator";

/**
 * Centralized utility for calculating custom domain allocations per workspace based on workspace plan type and add-ons
 * This is the single source of truth for custom domain limits per workspace
 */

// Base custom domain allocations per workspace plan type
const BASE_CUSTOM_DOMAIN_ALLOCATIONS: Record<UserPlan, number> = {
  [UserPlan.NO_PLAN]: 0, // No plan: 0 custom domains
  [UserPlan.WORKSPACE_MEMBER]: 0, // Workspace member: 0 custom domains (not applicable)
  [UserPlan.FREE]: 0, // Free workspace: 0 custom domains
  [UserPlan.BUSINESS]: 1, // Business workspace: 1 custom domain
  [UserPlan.AGENCY]: 0, // Agency workspace: 0 custom domains
};

export interface CustomDomainAllocationInput {
  workspacePlanType: UserPlan; // The plan type of the workspace (not user)
  addOns?: Array<{
    type: AddOnType;
    quantity: number;
    status: string;
    endDate?: Date | null;
  }>;
}

export class WorkspaceCustomDomainAllocations {
  /**
   * Get base custom domain allocation for a workspace plan type (without add-ons)
   */
  static getBaseAllocation(workspacePlanType: UserPlan): number {
    return (
      BASE_CUSTOM_DOMAIN_ALLOCATIONS[workspacePlanType] ||
      BASE_CUSTOM_DOMAIN_ALLOCATIONS[UserPlan.FREE]
    );
  }

  /**
   * Calculate total custom domain allocation including add-ons
   */
  static calculateTotalAllocation(input: CustomDomainAllocationInput): number {
    const { workspacePlanType, addOns = [] } = input;

    // Start with base allocation from workspace plan type
    let totalCustomDomains = this.getBaseAllocation(workspacePlanType);

    // Add extra custom domains from valid EXTRA_CUSTOM_DOMAIN add-ons (active or cancelled but not expired)
    const extraCustomDomains = addOns
      .filter(
        (addon) =>
          addon.type === AddOnType.EXTRA_CUSTOM_DOMAIN &&
          SubscriptionValidator.isAddonValid(addon as any)
      )
      .reduce((sum, addon) => sum + addon.quantity, 0);

    totalCustomDomains += extraCustomDomains;

    return totalCustomDomains;
  }

  /**
   * Check if workspace can create more custom domains
   */
  static canCreateCustomDomain(
    currentCustomDomainCount: number,
    input: CustomDomainAllocationInput
  ): boolean {
    const totalAllowed = this.calculateTotalAllocation(input);
    return currentCustomDomainCount < totalAllowed;
  }

  /**
   * Get remaining custom domain slots
   */
  static getRemainingSlots(
    currentCustomDomainCount: number,
    input: CustomDomainAllocationInput
  ): number {
    const totalAllowed = this.calculateTotalAllocation(input);
    const remaining = totalAllowed - currentCustomDomainCount;
    return Math.max(0, remaining);
  }

  /**
   * Get custom domain allocation summary
   */
  static getAllocationSummary(
    currentCustomDomainCount: number,
    input: CustomDomainAllocationInput
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
      currentUsage: currentCustomDomainCount,
      remainingSlots: this.getRemainingSlots(currentCustomDomainCount, input),
      canCreateMore: this.canCreateCustomDomain(
        currentCustomDomainCount,
        input
      ),
    };
  }
}

// Export for backward compatibility
export const getCustomDomainAllocation = (
  workspacePlanType: UserPlan
): number => {
  return WorkspaceCustomDomainAllocations.getBaseAllocation(workspacePlanType);
};
