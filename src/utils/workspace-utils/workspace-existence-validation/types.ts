import { UserPlan, AddOnType, WorkspaceStatus } from "../../../generated/prisma-client";

/**
 * Workspace existence validation types
 */

/**
 * Options for workspace validation queries
 */
export interface WorkspaceValidationOptions {
  /**
   * Include owner plan information (required for allocation checks)
   */
  includePlan?: boolean;

  /**
   * Include owner add-ons (required for allocation checks)
   */
  includeAddOns?: boolean;

  /**
   * Include workspace members
   */
  includeMembers?: boolean;

  /**
   * Custom select fields (overrides default selection)
   */
  customSelect?: Record<string, unknown>;
}

/**
 * Base workspace info returned by validation
 */
export interface BaseWorkspaceInfo {
  id: number;
  name: string;
  ownerId: number;
  status: WorkspaceStatus;
}

/**
 * Workspace with plan information
 */
export interface WorkspaceWithPlan extends BaseWorkspaceInfo {
  owner: {
    plan: UserPlan;
  };
}

/**
 * Workspace with plan and add-ons
 */
export interface WorkspaceWithAllocation extends BaseWorkspaceInfo {
  owner: {
    plan: UserPlan;
    addOns: Array<{
      type: AddOnType;
      quantity: number;
      status: string;
    }>;
  };
}

/**
 * Union type for all possible workspace validation results
 */
export type ValidatedWorkspace =
  | BaseWorkspaceInfo
  | WorkspaceWithPlan
  | WorkspaceWithAllocation;
