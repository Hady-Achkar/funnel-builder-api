import { $Enums } from "../../../generated/prisma-client";

export interface PlanLimits {
  maximumFunnels: number;
  maximumCustomDomains: number;
  maximumSubdomains: number;
}

export class PlanLimitsHelper {
  private static readonly PLAN_CONFIGS: Record<$Enums.UserPlan, PlanLimits> = {
    [$Enums.UserPlan.BUSINESS]: {
      maximumFunnels: 10,
      maximumCustomDomains: 2,
      maximumSubdomains: 5,
    },
    [$Enums.UserPlan.AGENCY]: {
      maximumFunnels: 50,
      maximumCustomDomains: 10,
      maximumSubdomains: 25,
    },
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
      maximumFunnels: 5,
      maximumCustomDomains: 1,
      maximumSubdomains: 3,
    };
  }

  /**
   * Calculate final limits considering custom overrides
   */
  static calculateFinalLimits(
    plan: $Enums.UserPlan,
    customLimits?: {
      maximumFunnels?: number;
      maximumCustomDomains?: number;
      maximumSubdomains?: number;
    }
  ): PlanLimits {
    const defaultLimits = this.getDefaultLimits(plan);
    
    return {
      maximumFunnels: customLimits?.maximumFunnels ?? defaultLimits.maximumFunnels,
      maximumCustomDomains: customLimits?.maximumCustomDomains ?? defaultLimits.maximumCustomDomains,
      maximumSubdomains: customLimits?.maximumSubdomains ?? defaultLimits.maximumSubdomains,
    };
  }

  /**
   * Validate if custom limits are reasonable
   */
  static validateCustomLimits(
    customLimits: Partial<PlanLimits>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (customLimits.maximumFunnels !== undefined) {
      if (customLimits.maximumFunnels < 0) {
        errors.push("Maximum funnels cannot be negative");
      }
      if (customLimits.maximumFunnels > 1000) {
        errors.push("Maximum funnels cannot exceed 1000");
      }
    }

    if (customLimits.maximumCustomDomains !== undefined) {
      if (customLimits.maximumCustomDomains < 0) {
        errors.push("Maximum custom domains cannot be negative");
      }
      if (customLimits.maximumCustomDomains > 100) {
        errors.push("Maximum custom domains cannot exceed 100");
      }
    }

    if (customLimits.maximumSubdomains !== undefined) {
      if (customLimits.maximumSubdomains < 0) {
        errors.push("Maximum subdomains cannot be negative");
      }
      if (customLimits.maximumSubdomains > 500) {
        errors.push("Maximum subdomains cannot exceed 500");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}