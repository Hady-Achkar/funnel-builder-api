import { $Enums } from "../../../generated/prisma-client";

export interface PlanLimits {
  maximumWorkspaces: number;
}

export interface WorkspaceResourceLimits {
  maximumFunnels: number;
  maximumCustomDomains: number;
  maximumSubdomains: number;
}

export class PlanLimitsHelper {
  // Plan-based workspace limits
  private static readonly PLAN_CONFIGS: Record<$Enums.UserPlan, PlanLimits> = {
    [$Enums.UserPlan.FREE]: {
      maximumWorkspaces: 1,
    },
    [$Enums.UserPlan.BUSINESS]: {
      maximumWorkspaces: 3,
    },
    [$Enums.UserPlan.AGENCY]: {
      maximumWorkspaces: 10,
    },
  };

  // Fixed limits per workspace (same for all plans)
  private static readonly WORKSPACE_RESOURCE_LIMITS: WorkspaceResourceLimits = {
    maximumFunnels: 3,
    maximumCustomDomains: 3,
    maximumSubdomains: 3,
  };

  /**
   * Get default limits for a specific plan
   */
  static getDefaultLimits(plan: $Enums.UserPlan): PlanLimits {
    return this.PLAN_CONFIGS[plan] || this.getBasicLimits();
  }

  /**
   * Get basic/fallback limits
   */
  static getBasicLimits(): PlanLimits {
    return {
      maximumWorkspaces: 1,
    };
  }

  /**
   * Get workspace resource limits (fixed for all plans)
   */
  static getWorkspaceResourceLimits(): WorkspaceResourceLimits {
    return this.WORKSPACE_RESOURCE_LIMITS;
  }

  /**
   * Calculate final limits considering custom overrides
   */
  static calculateFinalLimits(
    plan: $Enums.UserPlan,
    customLimits?: {
      maximumWorkspaces?: number;
    }
  ): PlanLimits {
    const defaultLimits = this.getDefaultLimits(plan);

    return {
      maximumWorkspaces: customLimits?.maximumWorkspaces ?? defaultLimits.maximumWorkspaces,
    };
  }

  /**
   * Validate if custom limits are reasonable
   */
  static validateCustomLimits(
    customLimits: Partial<PlanLimits>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (customLimits.maximumWorkspaces !== undefined) {
      if (customLimits.maximumWorkspaces < 0) {
        errors.push("Maximum workspaces cannot be negative");
      }
      if (customLimits.maximumWorkspaces > 100) {
        errors.push("Maximum workspaces cannot exceed 100");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}