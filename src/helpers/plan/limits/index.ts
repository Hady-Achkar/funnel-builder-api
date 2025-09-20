import { $Enums } from "../../../generated/prisma-client";

export class PlanLimitsHelper {
  /**
   * Get maximum workspaces allowed for a plan
   */
  static getMaximumWorkspaces(plan: $Enums.UserPlan): number {
    switch (plan) {
      case $Enums.UserPlan.FREE:
        return 1;
      case $Enums.UserPlan.BUSINESS:
        return 1;
      case $Enums.UserPlan.AGENCY:
        return 3;
      default:
        return 1;
    }
  }

  /**
   * Check if user can create more workspaces
   */
  static canCreateWorkspace(plan: $Enums.UserPlan, currentWorkspaceCount: number): boolean {
    const maxWorkspaces = this.getMaximumWorkspaces(plan);
    return currentWorkspaceCount < maxWorkspaces;
  }
}