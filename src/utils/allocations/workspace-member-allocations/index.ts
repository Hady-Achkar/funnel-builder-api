import { UserPlan, AddOnType } from "../../../generated/prisma-client";
import { SubscriptionValidator } from "../../subscription-utils/subscription-validator";

/**
 * Centralized utility for calculating member allocations per workspace based on workspace plan type and add-ons
 * This is the single source of truth for member limits per workspace
 */

// Base member allocations per workspace plan type
const BASE_MEMBER_ALLOCATIONS: Record<UserPlan, number> = {
  [UserPlan.NO_PLAN]: 0, // No plan: 0 members
  [UserPlan.WORKSPACE_MEMBER]: 0, // Workspace member: 0 members (not applicable)
  [UserPlan.FREE]: 1, // Free workspace: 1 member total
  [UserPlan.BUSINESS]: 2, // Business workspace: 2 members total
  [UserPlan.AGENCY]: 1, // Agency workspace: 1 member total
};

export interface MemberAllocationInput {
  workspacePlanType: UserPlan; // The plan type of the workspace (not user)
  addOns?: Array<{
    type: AddOnType;
    quantity: number;
    status: string;
    endDate?: Date | null;
  }>;
}

export class WorkspaceMemberAllocations {
  /**
   * Get base member allocation for a workspace plan type (without add-ons)
   */
  static getBaseAllocation(workspacePlanType: UserPlan): number {
    return (
      BASE_MEMBER_ALLOCATIONS[workspacePlanType] ||
      BASE_MEMBER_ALLOCATIONS[UserPlan.FREE]
    );
  }

  /**
   * Calculate total member allocation including add-ons
   */
  static calculateTotalAllocation(input: MemberAllocationInput): number {
    const { workspacePlanType, addOns = [] } = input;

    // Start with base allocation from workspace plan type
    let totalMembers = this.getBaseAllocation(workspacePlanType);

    // Add extra member slots from valid EXTRA_ADMIN add-ons (active or cancelled but not expired)
    const extraMembers = addOns
      .filter(
        (addon) =>
          addon.type === AddOnType.EXTRA_ADMIN &&
          SubscriptionValidator.isAddonValid(addon as any)
      )
      .reduce((sum, addon) => sum + addon.quantity, 0);

    totalMembers += extraMembers;

    return totalMembers;
  }

  /**
   * Check if workspace can add more members
   */
  static canAddMember(
    currentMemberCount: number,
    input: MemberAllocationInput
  ): boolean {
    const totalAllowed = this.calculateTotalAllocation(input);
    return currentMemberCount < totalAllowed;
  }

  /**
   * Get remaining member slots
   */
  static getRemainingSlots(
    currentMemberCount: number,
    input: MemberAllocationInput
  ): number {
    const totalAllowed = this.calculateTotalAllocation(input);
    const remaining = totalAllowed - currentMemberCount;
    return Math.max(0, remaining);
  }

  /**
   * Get member allocation summary
   */
  static getAllocationSummary(
    currentMemberCount: number,
    input: MemberAllocationInput
  ): {
    baseAllocation: number;
    extraFromAddOns: number;
    totalAllocation: number;
    currentUsage: number;
    remainingSlots: number;
    canAddMore: boolean;
  } {
    const baseAllocation = this.getBaseAllocation(input.workspacePlanType);
    const totalAllocation = this.calculateTotalAllocation(input);
    const extraFromAddOns = totalAllocation - baseAllocation;

    return {
      baseAllocation,
      extraFromAddOns,
      totalAllocation,
      currentUsage: currentMemberCount,
      remainingSlots: this.getRemainingSlots(currentMemberCount, input),
      canAddMore: this.canAddMember(currentMemberCount, input),
    };
  }
}

// Export for backward compatibility
export const getMemberAllocation = (workspacePlanType: UserPlan): number => {
  return WorkspaceMemberAllocations.getBaseAllocation(workspacePlanType);
};
