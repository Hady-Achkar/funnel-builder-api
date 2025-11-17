import { $Enums } from "../../generated/prisma-client";

// ============================================================================
// 📋 SINGLE SOURCE OF TRUTH FOR ALL PRICING
// ============================================================================
// Edit prices, titles, and descriptions HERE ONLY
// All prices are in USD

const PRICING = {
  // 💰 PLAN PRICES
  plans: {
    DIRECT: {
      BUSINESS: {
        amount: 499,
        title: "Business Plan",
        description: "Create a mobile optimized site with advanced analytics",
        isSubscription: false, // One-time payment
        frequency: "annually" as const,
        frequencyInterval: 1000,
        freeTrialPeriodInDays: 0,
      },
      // partner plan
      AGENCY: {
        amount: 59.99,
        title: "Partner Plan",
        description: "Create unlimited websites with all Digitalsite features",
        isSubscription: false, // One-time payment
        frequency: "annually" as const,
        frequencyInterval: 1000,
        freeTrialPeriodInDays: 0,
      },
    },
    AFFILIATE: {
      BUSINESS: {
        amount: 299,
        title: "Business Plan",
        description: "Create a mobile optimized site with advanced analytics",
        isSubscription: true, // Yearly subscription
        frequency: "annually" as const,
        frequencyInterval: 1,
        freeTrialPeriodInDays: 0,
      },
    },
  },

  // 🔌 WORKSPACE-LEVEL ADD-ON PRICES (based on workspace's plan type)
  workspaceAddons: {
    BUSINESS: {
      EXTRA_ADMIN: {
        amount: 10,
        title: "Extra Team Member",
        description: "Add an additional team member to your Business workspace",
        isSubscription: true, // Always monthly subscription
        frequency: "monthly" as const,
        frequencyInterval: 1,
        freeTrialPeriodInDays: 0,
        effectDescription: "+1 member slot",
      },
      EXTRA_FUNNEL: {
        amount: 15,
        title: "Extra Funnel",
        description: "Add an additional funnel to your Business workspace",
        isSubscription: true, // Always monthly subscription
        frequency: "monthly" as const,
        frequencyInterval: 1,
        freeTrialPeriodInDays: 0,
        effectDescription: "+1 funnel",
      },
      EXTRA_PAGE: {
        amount: 10,
        title: "Extra Pages",
        description:
          "Add 100 additional pages per funnel to your Business workspace",
        frequency: "monthly" as const,
        frequencyInterval: 1,
        freeTrialPeriodInDays: 0,
        effectDescription: "+100 pages per funnel",
      },
      EXTRA_SUBDOMAIN: {
        amount: 15,
        title: "Extra Subdomain",
        description: "Add an additional subdomain to your Business workspace",
        isSubscription: true, // Always monthly subscription
        frequency: "annually" as const,
        frequencyInterval: 1,
        freeTrialPeriodInDays: 0,
        effectDescription: "+1 subdomain slot",
      },
      EXTRA_CUSTOM_DOMAIN: {
        amount: 50,
        title: "Extra Custom Domain",
        description:
          "Add an additional custom domain to your Business workspace",
        isSubscription: true, // Always monthly subscription
        frequency: "annually" as const,
        frequencyInterval: 1,
        freeTrialPeriodInDays: 0,
        effectDescription: "+1 custom domain slot",
      },
    },
    AGENCY: {
      // AGENCY workspaces can ONLY purchase EXTRA_ADMIN add-on
      EXTRA_ADMIN: {
        amount: 10,
        title: "Extra Team Member",
        description: "Add an additional team member to your Agency workspace",
        isSubscription: true, // Always monthly subscription
        frequency: "monthly" as const,
        frequencyInterval: 1,
        freeTrialPeriodInDays: 0,
        effectDescription: "+1 member slot",
      },
    },
    OLD_MEMBER: {
      // OLD_MEMBER workspaces can purchase specific add-ons at legacy prices
      EXTRA_ADMIN: {
        amount: 10,
        title: "Extra Team Member",
        description: "Add an additional team member to your workspace",
        isSubscription: true,
        frequency: "annually" as const,
        frequencyInterval: 1,
        freeTrialPeriodInDays: 0,
        effectDescription: "+1 member slot",
      },
      EXTRA_FUNNEL: {
        amount: 1,
        title: "Extra Funnel",
        description: "Add an additional funnel to your workspace",
        isSubscription: true,
        frequency: "annually" as const,
        frequencyInterval: 1,
        freeTrialPeriodInDays: 0,
        effectDescription: "+1 funnel",
      },
    },
  },

  // 👤 USER-LEVEL ADD-ON PRICES (based on user's plan type)
  userAddons: {
    BUSINESS: {
      EXTRA_WORKSPACE: {
        amount: 499,
        title: "Extra Workspace",
        description:
          "Add an additional workspace slot to your Business account",
        isSubscription: true, // Always monthly subscription
        frequency: "monthly" as const,
        frequencyInterval: 1,
        freeTrialPeriodInDays: 0,
        effectDescription: "+1 workspace slot",
      },
    },
    OLD_MEMBER: {
      EXTRA_WORKSPACE: {
        amount: 10,
        title: "Extra Workspace",
        description: "Add an additional workspace slot to your account",
        isSubscription: true,
        frequency: "annually" as const,
        frequencyInterval: 1,
        freeTrialPeriodInDays: 0,
        effectDescription: "+1 workspace slot",
      },
    },
    // AGENCY and ADMIN users have unlimited workspaces, so no EXTRA_WORKSPACE addon needed
    AGENCY: {},
    ADMIN: {},
  },

  // 🔗 METADATA
  metadata: {
    returnUrl: `${process.env.FRONTEND_URL}/payment-success`,
    failureReturnUrl: `${process.env.FRONTEND_URL}/payment-failure`,
    termsAndConditionsUrl: `${process.env.FRONTEND_URL}/terms`,
  },
} as const;

// ============================================================================
// 🛠️ HELPER FUNCTIONS (Simple & Clean)
// ============================================================================

export class PaymentLinkPricing {
  static getPlanPurchasePricing(
    registrationSource: $Enums.RegistrationSource,
    planType: $Enums.UserPlan
  ) {
    return PRICING.plans[registrationSource]?.[planType] || null;
  }

  /**
   * Get workspace-level addon pricing (EXTRA_ADMIN, EXTRA_FUNNEL, EXTRA_PAGE, EXTRA_DOMAIN)
   * Based on the workspace's plan type
   */
  static getWorkspaceAddonPricing(
    workspacePlanType: $Enums.UserPlan,
    addonType: $Enums.AddOnType
  ) {
    return PRICING.workspaceAddons[workspacePlanType]?.[addonType] || null;
  }

  /**
   * Get user-level addon pricing (EXTRA_WORKSPACE)
   * Based on the user's plan type
   */
  static getUserAddonPricing(
    userPlanType: $Enums.UserPlan,
    addonType: $Enums.AddOnType
  ) {
    return PRICING.userAddons[userPlanType]?.[addonType] || null;
  }

  /**
   * Get addon pricing - automatically determines if workspace-level or user-level
   * @deprecated Use getWorkspaceAddonPricing() or getUserAddonPricing() directly for clarity
   */
  static getAddonPurchasePricing(
    planType: $Enums.UserPlan,
    addonType: $Enums.AddOnType
  ) {
    // Check if it's a user-level addon (EXTRA_WORKSPACE)
    if (addonType === $Enums.AddOnType.EXTRA_WORKSPACE) {
      return this.getUserAddonPricing(planType, addonType);
    }

    // Otherwise it's a workspace-level addon
    return this.getWorkspaceAddonPricing(planType, addonType);
  }

  static getMetadata() {
    return PRICING.metadata;
  }

  static isPlanAllowed(
    registrationSource: $Enums.RegistrationSource,
    planType: $Enums.UserPlan
  ): boolean {
    return this.getPlanPurchasePricing(registrationSource, planType) !== null;
  }

  static isAddonAllowedForPlan(
    planType: $Enums.UserPlan,
    addonType: $Enums.AddOnType
  ): boolean {
    return this.getAddonPurchasePricing(planType, addonType) !== null;
  }

  static getDisallowedPlanMessage(
    registrationSource: $Enums.RegistrationSource,
    planType: $Enums.UserPlan
  ): string {
    if (
      (registrationSource === $Enums.RegistrationSource.AFFILIATE ||
        registrationSource === $Enums.RegistrationSource.AD) &&
      planType === $Enums.UserPlan.AGENCY
    ) {
      return "Users who registered via affiliate link can only purchase the Business Plan. Please select the Business Plan to continue.";
    }
    return "This plan is not available for your registration type. Please contact support for assistance.";
  }

  /**
   * Get user-friendly error message when an addon is not allowed for a workspace
   */
  static getDisallowedAddonMessage(
    workspacePlanType: $Enums.UserPlan,
    addonType: $Enums.AddOnType
  ): string {
    // AGENCY workspaces can only purchase EXTRA_ADMIN
    if (workspacePlanType === $Enums.UserPlan.AGENCY) {
      if (addonType === $Enums.AddOnType.EXTRA_ADMIN) {
        return ""; // This should be allowed, no error
      }

      // User-friendly messages for disallowed addons
      const addonMessages: Record<$Enums.AddOnType, string> = {
        [$Enums.AddOnType.EXTRA_FUNNEL]:
          "Additional funnels are not available for your workspace.",
        [$Enums.AddOnType.EXTRA_PAGE]:
          "Additional pages are not available for your workspace.",
        [$Enums.AddOnType.EXTRA_SUBDOMAIN]:
          "Additional subdomains are not available for your workspace.",
        [$Enums.AddOnType.EXTRA_CUSTOM_DOMAIN]:
          "Additional custom domains are not available for your workspace.",
        [$Enums.AddOnType.EXTRA_WORKSPACE]:
          "Agency plan users already have unlimited workspaces. No need to purchase additional workspace slots.",
        [$Enums.AddOnType.EXTRA_ADMIN]: "",
      };

      return (
        addonMessages[addonType] ||
        "This add-on is not available for your workspace."
      );
    }
    if (workspacePlanType === $Enums.UserPlan.BUSINESS) {
      return "This add-on is not available for your plan.";
    }

    // For other workspace types, generic message
    return "This add-on is not available for your workspace. Please contact support for assistance.";
  }

  static getPricingSummary() {
    return {
      plans: PRICING.plans,
      workspaceAddons: PRICING.workspaceAddons,
      userAddons: PRICING.userAddons,
      metadata: PRICING.metadata,
    };
  }
}
