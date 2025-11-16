import { describe, it, expect } from "vitest";
import { $Enums } from "../../../generated/prisma-client";
import { PaymentLinkPricing } from "../../../utils/pricing";

describe("Pricing Utility", () => {
  // ========== PLAN PURCHASE PRICING ==========
  describe("getPlanPurchasePricing", () => {
    describe("DIRECT registration source", () => {
      it("should return BUSINESS plan pricing", () => {
        const pricing = PaymentLinkPricing.getPlanPurchasePricing(
          $Enums.RegistrationSource.DIRECT,
          $Enums.UserPlan.BUSINESS
        );

        expect(pricing).toEqual({
          amount: 499,
          title: "Business Plan",
          description: "Create a mobile optimized site with advanced analytics",
          isSubscription: false,
          frequency: "annually",
          frequencyInterval: 1000,
          freeTrialPeriodInDays: 0,
        });
      });

      it("should return AGENCY plan pricing", () => {
        const pricing = PaymentLinkPricing.getPlanPurchasePricing(
          $Enums.RegistrationSource.DIRECT,
          $Enums.UserPlan.AGENCY
        );

        expect(pricing).toEqual({
          amount: 59.99,
          title: "Partner Plan",
          description: "Create unlimited websites with all Digitalsite features",
          isSubscription: false,
          frequency: "annually",
          frequencyInterval: 1000,
          freeTrialPeriodInDays: 0,
        });
      });
    });

    describe("AFFILIATE registration source", () => {
      it("should return BUSINESS plan pricing with affiliate discount", () => {
        const pricing = PaymentLinkPricing.getPlanPurchasePricing(
          $Enums.RegistrationSource.AFFILIATE,
          $Enums.UserPlan.BUSINESS
        );

        expect(pricing).toEqual({
          amount: 299,
          title: "Business Plan",
          description: "Create a mobile optimized site with advanced analytics",
          isSubscription: true,
          frequency: "annually",
          frequencyInterval: 1,
          freeTrialPeriodInDays: 0,
        });
      });

      it("should return null for AGENCY plan (not allowed for affiliates)", () => {
        const pricing = PaymentLinkPricing.getPlanPurchasePricing(
          $Enums.RegistrationSource.AFFILIATE,
          $Enums.UserPlan.AGENCY
        );

        expect(pricing).toBeNull();
      });
    });

    describe("Invalid combinations", () => {
      it("should return null for NO_PLAN", () => {
        const pricing = PaymentLinkPricing.getPlanPurchasePricing(
          $Enums.RegistrationSource.DIRECT,
          $Enums.UserPlan.NO_PLAN
        );

        expect(pricing).toBeNull();
      });

      it("should return null for FREE plan", () => {
        const pricing = PaymentLinkPricing.getPlanPurchasePricing(
          $Enums.RegistrationSource.DIRECT,
          $Enums.UserPlan.FREE
        );

        expect(pricing).toBeNull();
      });

      it("should return null for WORKSPACE_MEMBER", () => {
        const pricing = PaymentLinkPricing.getPlanPurchasePricing(
          $Enums.RegistrationSource.DIRECT,
          $Enums.UserPlan.WORKSPACE_MEMBER
        );

        expect(pricing).toBeNull();
      });
    });
  });

  // ========== WORKSPACE-LEVEL ADDON PRICING ==========
  describe("getWorkspaceAddonPricing", () => {
    describe("BUSINESS workspace", () => {
      it("should return EXTRA_ADMIN pricing", () => {
        const pricing = PaymentLinkPricing.getWorkspaceAddonPricing(
          $Enums.UserPlan.BUSINESS,
          $Enums.AddOnType.EXTRA_ADMIN
        );

        expect(pricing).toEqual({
          amount: 10,
          title: "Extra Team Member",
          description:
            "Add an additional team member to your Business workspace",
          isSubscription: true,
          frequency: "monthly",
          frequencyInterval: 1,
          freeTrialPeriodInDays: 0,
          effectDescription: "+1 member slot",
        });
      });

      it("should return EXTRA_FUNNEL pricing", () => {
        const pricing = PaymentLinkPricing.getWorkspaceAddonPricing(
          $Enums.UserPlan.BUSINESS,
          $Enums.AddOnType.EXTRA_FUNNEL
        );

        expect(pricing?.amount).toBe(15);
        expect(pricing?.frequency).toBe("monthly");
      });

      it("should return EXTRA_PAGE pricing", () => {
        const pricing = PaymentLinkPricing.getWorkspaceAddonPricing(
          $Enums.UserPlan.BUSINESS,
          $Enums.AddOnType.EXTRA_PAGE
        );

        expect(pricing?.amount).toBe(10);
        expect(pricing?.effectDescription).toBe("+100 pages per funnel");
      });

      it("should return EXTRA_SUBDOMAIN pricing", () => {
        const pricing = PaymentLinkPricing.getWorkspaceAddonPricing(
          $Enums.UserPlan.BUSINESS,
          $Enums.AddOnType.EXTRA_SUBDOMAIN
        );

        expect(pricing?.amount).toBe(15);
        expect(pricing?.effectDescription).toBe("+1 subdomain slot");
      });

      it("should return EXTRA_CUSTOM_DOMAIN pricing", () => {
        const pricing = PaymentLinkPricing.getWorkspaceAddonPricing(
          $Enums.UserPlan.BUSINESS,
          $Enums.AddOnType.EXTRA_CUSTOM_DOMAIN
        );

        expect(pricing?.amount).toBe(50);
        expect(pricing?.effectDescription).toBe("+1 custom domain slot");
      });

      it("should return null for EXTRA_WORKSPACE (user-level addon)", () => {
        const pricing = PaymentLinkPricing.getWorkspaceAddonPricing(
          $Enums.UserPlan.BUSINESS,
          $Enums.AddOnType.EXTRA_WORKSPACE
        );

        expect(pricing).toBeNull();
      });
    });

    describe("AGENCY workspace", () => {
      it("should return EXTRA_ADMIN pricing (ONLY addon allowed)", () => {
        const pricing = PaymentLinkPricing.getWorkspaceAddonPricing(
          $Enums.UserPlan.AGENCY,
          $Enums.AddOnType.EXTRA_ADMIN
        );

        expect(pricing?.amount).toBe(10); // Same as BUSINESS
      });

      it("should return null for EXTRA_FUNNEL (not allowed)", () => {
        const pricing = PaymentLinkPricing.getWorkspaceAddonPricing(
          $Enums.UserPlan.AGENCY,
          $Enums.AddOnType.EXTRA_FUNNEL
        );

        expect(pricing).toBeNull(); // Not available for AGENCY
      });

      it("should return null for EXTRA_PAGE (not allowed)", () => {
        const pricing = PaymentLinkPricing.getWorkspaceAddonPricing(
          $Enums.UserPlan.AGENCY,
          $Enums.AddOnType.EXTRA_PAGE
        );

        expect(pricing).toBeNull(); // Not available for AGENCY
      });

      it("should return null for EXTRA_SUBDOMAIN (not allowed)", () => {
        const pricing = PaymentLinkPricing.getWorkspaceAddonPricing(
          $Enums.UserPlan.AGENCY,
          $Enums.AddOnType.EXTRA_SUBDOMAIN
        );

        expect(pricing).toBeNull(); // Not available for AGENCY
      });

      it("should return null for EXTRA_CUSTOM_DOMAIN (not allowed)", () => {
        const pricing = PaymentLinkPricing.getWorkspaceAddonPricing(
          $Enums.UserPlan.AGENCY,
          $Enums.AddOnType.EXTRA_CUSTOM_DOMAIN
        );

        expect(pricing).toBeNull(); // Not available for AGENCY
      });
    });

    describe("Price comparison", () => {
      it("should have AGENCY and BUSINESS workspace EXTRA_ADMIN at same price", () => {
        const businessAdmin = PaymentLinkPricing.getWorkspaceAddonPricing(
          $Enums.UserPlan.BUSINESS,
          $Enums.AddOnType.EXTRA_ADMIN
        );
        const agencyAdmin = PaymentLinkPricing.getWorkspaceAddonPricing(
          $Enums.UserPlan.AGENCY,
          $Enums.AddOnType.EXTRA_ADMIN
        );

        expect(agencyAdmin?.amount).toBe(businessAdmin?.amount);
      });
    });
  });

  // ========== USER-LEVEL ADDON PRICING ==========
  describe("getUserAddonPricing", () => {
    it("should return EXTRA_WORKSPACE pricing for BUSINESS user", () => {
      const pricing = PaymentLinkPricing.getUserAddonPricing(
        $Enums.UserPlan.BUSINESS,
        $Enums.AddOnType.EXTRA_WORKSPACE
      );

      expect(pricing).toEqual({
        amount: 499,
        title: "Extra Workspace",
        description:
          "Add an additional workspace slot to your Business account",
        isSubscription: true,
        frequency: "monthly",
        frequencyInterval: 1,
        freeTrialPeriodInDays: 0,
        effectDescription: "+1 workspace slot",
      });
    });

    it("should return null for AGENCY user (unlimited workspaces)", () => {
      const pricing = PaymentLinkPricing.getUserAddonPricing(
        $Enums.UserPlan.AGENCY,
        $Enums.AddOnType.EXTRA_WORKSPACE
      );

      expect(pricing).toBeNull(); // AGENCY users have unlimited workspaces
    });

    it("should return null for workspace-level addons", () => {
      const pricing = PaymentLinkPricing.getUserAddonPricing(
        $Enums.UserPlan.BUSINESS,
        $Enums.AddOnType.EXTRA_ADMIN
      );

      expect(pricing).toBeNull();
    });

    it("should return null for FREE plan", () => {
      const pricing = PaymentLinkPricing.getUserAddonPricing(
        $Enums.UserPlan.FREE,
        $Enums.AddOnType.EXTRA_WORKSPACE
      );

      expect(pricing).toBeNull();
    });
  });

  // ========== GENERIC ADDON PRICING (AUTO-DETECTION) ==========
  describe("getAddonPurchasePricing", () => {
    it("should auto-detect and return workspace-level addon (EXTRA_ADMIN)", () => {
      const pricing = PaymentLinkPricing.getAddonPurchasePricing(
        $Enums.UserPlan.BUSINESS,
        $Enums.AddOnType.EXTRA_ADMIN
      );

      expect(pricing?.amount).toBe(10);
      expect(pricing?.effectDescription).toBe("+1 member slot");
    });

    it("should auto-detect and return user-level addon (EXTRA_WORKSPACE)", () => {
      const pricing = PaymentLinkPricing.getAddonPurchasePricing(
        $Enums.UserPlan.BUSINESS,
        $Enums.AddOnType.EXTRA_WORKSPACE
      );

      expect(pricing?.amount).toBe(499);
      expect(pricing?.effectDescription).toBe("+1 workspace slot");
    });

    it("should only return EXTRA_ADMIN for AGENCY workspace addons", () => {
      const admin = PaymentLinkPricing.getAddonPurchasePricing(
        $Enums.UserPlan.AGENCY,
        $Enums.AddOnType.EXTRA_ADMIN
      );
      const funnel = PaymentLinkPricing.getAddonPurchasePricing(
        $Enums.UserPlan.AGENCY,
        $Enums.AddOnType.EXTRA_FUNNEL
      );
      const page = PaymentLinkPricing.getAddonPurchasePricing(
        $Enums.UserPlan.AGENCY,
        $Enums.AddOnType.EXTRA_PAGE
      );
      const subdomain = PaymentLinkPricing.getAddonPurchasePricing(
        $Enums.UserPlan.AGENCY,
        $Enums.AddOnType.EXTRA_SUBDOMAIN
      );
      const customDomain = PaymentLinkPricing.getAddonPurchasePricing(
        $Enums.UserPlan.AGENCY,
        $Enums.AddOnType.EXTRA_CUSTOM_DOMAIN
      );

      // Only EXTRA_ADMIN is allowed for AGENCY
      expect(admin).not.toBeNull();
      expect(funnel).toBeNull();
      expect(page).toBeNull();
      expect(subdomain).toBeNull();
      expect(customDomain).toBeNull();
    });
  });

  // ========== METADATA ==========
  describe("getMetadata", () => {
    it("should return payment link metadata", () => {
      const metadata = PaymentLinkPricing.getMetadata();

      // Metadata uses FRONTEND_URL from environment
      expect(metadata).toHaveProperty("returnUrl");
      expect(metadata).toHaveProperty("failureReturnUrl");
      expect(metadata).toHaveProperty("termsAndConditionsUrl");
      expect(metadata.returnUrl).toContain("/payment-success");
      expect(metadata.failureReturnUrl).toContain("/payment-failure");
      expect(metadata.termsAndConditionsUrl).toContain("/terms");
    });

    it("should always return consistent metadata", () => {
      const metadata1 = PaymentLinkPricing.getMetadata();
      const metadata2 = PaymentLinkPricing.getMetadata();

      expect(metadata1).toEqual(metadata2);
    });
  });

  // ========== VALIDATION METHODS ==========
  describe("isPlanAllowed", () => {
    it("should return true for DIRECT + BUSINESS", () => {
      const allowed = PaymentLinkPricing.isPlanAllowed(
        $Enums.RegistrationSource.DIRECT,
        $Enums.UserPlan.BUSINESS
      );

      expect(allowed).toBe(true);
    });

    it("should return true for DIRECT + AGENCY", () => {
      const allowed = PaymentLinkPricing.isPlanAllowed(
        $Enums.RegistrationSource.DIRECT,
        $Enums.UserPlan.AGENCY
      );

      expect(allowed).toBe(true);
    });

    it("should return true for AFFILIATE + BUSINESS", () => {
      const allowed = PaymentLinkPricing.isPlanAllowed(
        $Enums.RegistrationSource.AFFILIATE,
        $Enums.UserPlan.BUSINESS
      );

      expect(allowed).toBe(true);
    });

    it("should return false for AFFILIATE + AGENCY", () => {
      const allowed = PaymentLinkPricing.isPlanAllowed(
        $Enums.RegistrationSource.AFFILIATE,
        $Enums.UserPlan.AGENCY
      );

      expect(allowed).toBe(false);
    });

    it("should return false for NO_PLAN", () => {
      const allowed = PaymentLinkPricing.isPlanAllowed(
        $Enums.RegistrationSource.DIRECT,
        $Enums.UserPlan.NO_PLAN
      );

      expect(allowed).toBe(false);
    });

    it("should return false for FREE", () => {
      const allowed = PaymentLinkPricing.isPlanAllowed(
        $Enums.RegistrationSource.DIRECT,
        $Enums.UserPlan.FREE
      );

      expect(allowed).toBe(false);
    });
  });

  describe("isAddonAllowedForPlan", () => {
    it("should return true for BUSINESS + EXTRA_ADMIN", () => {
      const allowed = PaymentLinkPricing.isAddonAllowedForPlan(
        $Enums.UserPlan.BUSINESS,
        $Enums.AddOnType.EXTRA_ADMIN
      );

      expect(allowed).toBe(true);
    });

    it("should return true for BUSINESS + EXTRA_WORKSPACE", () => {
      const allowed = PaymentLinkPricing.isAddonAllowedForPlan(
        $Enums.UserPlan.BUSINESS,
        $Enums.AddOnType.EXTRA_WORKSPACE
      );

      expect(allowed).toBe(true);
    });

    it("should only return true for AGENCY + EXTRA_ADMIN (other workspace addons not allowed)", () => {
      // EXTRA_ADMIN is the ONLY allowed workspace addon for AGENCY
      expect(
        PaymentLinkPricing.isAddonAllowedForPlan(
          $Enums.UserPlan.AGENCY,
          $Enums.AddOnType.EXTRA_ADMIN
        )
      ).toBe(true);

      // Other workspace addons are NOT allowed for AGENCY
      expect(
        PaymentLinkPricing.isAddonAllowedForPlan(
          $Enums.UserPlan.AGENCY,
          $Enums.AddOnType.EXTRA_FUNNEL
        )
      ).toBe(false);
      expect(
        PaymentLinkPricing.isAddonAllowedForPlan(
          $Enums.UserPlan.AGENCY,
          $Enums.AddOnType.EXTRA_PAGE
        )
      ).toBe(false);
      expect(
        PaymentLinkPricing.isAddonAllowedForPlan(
          $Enums.UserPlan.AGENCY,
          $Enums.AddOnType.EXTRA_SUBDOMAIN
        )
      ).toBe(false);
      expect(
        PaymentLinkPricing.isAddonAllowedForPlan(
          $Enums.UserPlan.AGENCY,
          $Enums.AddOnType.EXTRA_CUSTOM_DOMAIN
        )
      ).toBe(false);
    });

    it("should return false for AGENCY + EXTRA_WORKSPACE (unlimited workspaces)", () => {
      const allowed = PaymentLinkPricing.isAddonAllowedForPlan(
        $Enums.UserPlan.AGENCY,
        $Enums.AddOnType.EXTRA_WORKSPACE
      );

      expect(allowed).toBe(false); // AGENCY users have unlimited workspaces
    });

    it("should return false for FREE + EXTRA_WORKSPACE", () => {
      const allowed = PaymentLinkPricing.isAddonAllowedForPlan(
        $Enums.UserPlan.FREE,
        $Enums.AddOnType.EXTRA_WORKSPACE
      );

      expect(allowed).toBe(false);
    });
  });

  describe("getDisallowedPlanMessage", () => {
    it("should return specific message for AFFILIATE + AGENCY", () => {
      const message = PaymentLinkPricing.getDisallowedPlanMessage(
        $Enums.RegistrationSource.AFFILIATE,
        $Enums.UserPlan.AGENCY
      );

      expect(message).toBe(
        "Users who registered via affiliate link can only purchase the Business Plan. Please select the Business Plan to continue."
      );
    });

    it("should return generic message for other combinations", () => {
      const message = PaymentLinkPricing.getDisallowedPlanMessage(
        $Enums.RegistrationSource.DIRECT,
        $Enums.UserPlan.NO_PLAN
      );

      expect(message).toBe(
        "This plan is not available for your registration type. Please contact support for assistance."
      );
    });
  });

  // ========== PRICING SUMMARY ==========
  describe("getPricingSummary", () => {
    it("should return complete pricing summary", () => {
      const summary = PaymentLinkPricing.getPricingSummary();

      expect(summary).toHaveProperty("plans");
      expect(summary).toHaveProperty("workspaceAddons");
      expect(summary).toHaveProperty("userAddons");
      expect(summary).toHaveProperty("metadata");
    });

    it("should include all registration sources in plans", () => {
      const summary = PaymentLinkPricing.getPricingSummary();

      expect(summary.plans).toHaveProperty("DIRECT");
      expect(summary.plans).toHaveProperty("AFFILIATE");
    });

    it("should include BUSINESS and AGENCY in workspaceAddons", () => {
      const summary = PaymentLinkPricing.getPricingSummary();

      expect(summary.workspaceAddons).toHaveProperty("BUSINESS");
      expect(summary.workspaceAddons).toHaveProperty("AGENCY");
    });

    it("should include BUSINESS and AGENCY in userAddons", () => {
      const summary = PaymentLinkPricing.getPricingSummary();

      expect(summary.userAddons).toHaveProperty("BUSINESS");
      expect(summary.userAddons).toHaveProperty("AGENCY");
    });

    it("should have EXTRA_WORKSPACE only in userAddons", () => {
      const summary = PaymentLinkPricing.getPricingSummary();

      // Should NOT be in workspaceAddons
      expect(summary.workspaceAddons.BUSINESS).not.toHaveProperty(
        "EXTRA_WORKSPACE"
      );
      expect(summary.workspaceAddons.AGENCY).not.toHaveProperty(
        "EXTRA_WORKSPACE"
      );

      // Should be in userAddons for BUSINESS only (AGENCY has unlimited workspaces)
      expect(summary.userAddons.BUSINESS).toHaveProperty("EXTRA_WORKSPACE");
      expect(summary.userAddons.AGENCY).not.toHaveProperty("EXTRA_WORKSPACE");
    });
  });

  // ========== INTEGRATION TESTS ==========
  describe("Integration Tests", () => {
    it("should handle complete DIRECT BUSINESS plan purchase flow", () => {
      // Check if plan is allowed
      const allowed = PaymentLinkPricing.isPlanAllowed(
        $Enums.RegistrationSource.DIRECT,
        $Enums.UserPlan.BUSINESS
      );
      expect(allowed).toBe(true);

      // Get pricing
      const pricing = PaymentLinkPricing.getPlanPurchasePricing(
        $Enums.RegistrationSource.DIRECT,
        $Enums.UserPlan.BUSINESS
      );
      expect(pricing?.amount).toBe(499);

      // Get metadata
      const metadata = PaymentLinkPricing.getMetadata();
      expect(metadata.returnUrl).toBeDefined();
    });

    it("should handle complete AFFILIATE BUSINESS plan purchase with addon flow", () => {
      // Check if plan is allowed
      const planAllowed = PaymentLinkPricing.isPlanAllowed(
        $Enums.RegistrationSource.AFFILIATE,
        $Enums.UserPlan.BUSINESS
      );
      expect(planAllowed).toBe(true);

      // Get plan pricing
      const planPricing = PaymentLinkPricing.getPlanPurchasePricing(
        $Enums.RegistrationSource.AFFILIATE,
        $Enums.UserPlan.BUSINESS
      );
      expect(planPricing?.amount).toBe(299); // Discounted price

      // Get user-level addon pricing
      const workspaceAddonAllowed = PaymentLinkPricing.isAddonAllowedForPlan(
        $Enums.UserPlan.BUSINESS,
        $Enums.AddOnType.EXTRA_WORKSPACE
      );
      expect(workspaceAddonAllowed).toBe(true);

      const workspaceAddonPricing = PaymentLinkPricing.getUserAddonPricing(
        $Enums.UserPlan.BUSINESS,
        $Enums.AddOnType.EXTRA_WORKSPACE
      );
      expect(workspaceAddonPricing?.amount).toBe(499);
    });

    it("should reject AFFILIATE + AGENCY combination", () => {
      // Check if plan is allowed
      const allowed = PaymentLinkPricing.isPlanAllowed(
        $Enums.RegistrationSource.AFFILIATE,
        $Enums.UserPlan.AGENCY
      );
      expect(allowed).toBe(false);

      // Get pricing should return null
      const pricing = PaymentLinkPricing.getPlanPurchasePricing(
        $Enums.RegistrationSource.AFFILIATE,
        $Enums.UserPlan.AGENCY
      );
      expect(pricing).toBeNull();

      // Get error message
      const message = PaymentLinkPricing.getDisallowedPlanMessage(
        $Enums.RegistrationSource.AFFILIATE,
        $Enums.UserPlan.AGENCY
      );
      expect(message).toContain("Business Plan");
    });

    it("should correctly differentiate workspace vs user addons", () => {
      // Workspace addons (tied to workspace plan)
      const workspaceAdmin = PaymentLinkPricing.getWorkspaceAddonPricing(
        $Enums.UserPlan.BUSINESS,
        $Enums.AddOnType.EXTRA_ADMIN
      );
      expect(workspaceAdmin).not.toBeNull();

      // User addon (tied to user plan)
      const userWorkspace = PaymentLinkPricing.getUserAddonPricing(
        $Enums.UserPlan.BUSINESS,
        $Enums.AddOnType.EXTRA_WORKSPACE
      );
      expect(userWorkspace).not.toBeNull();

      // Cross-check: workspace addon should not be in user addons
      const wrongCheck1 = PaymentLinkPricing.getUserAddonPricing(
        $Enums.UserPlan.BUSINESS,
        $Enums.AddOnType.EXTRA_ADMIN
      );
      expect(wrongCheck1).toBeNull();

      // Cross-check: user addon should not be in workspace addons
      const wrongCheck2 = PaymentLinkPricing.getWorkspaceAddonPricing(
        $Enums.UserPlan.BUSINESS,
        $Enums.AddOnType.EXTRA_WORKSPACE
      );
      expect(wrongCheck2).toBeNull();
    });
  });

  // ========== EDGE CASES ==========
  describe("Edge Cases", () => {
    it("should handle all UserPlan enum values", () => {
      const planTypes = [
        $Enums.UserPlan.NO_PLAN,
        $Enums.UserPlan.WORKSPACE_MEMBER,
        $Enums.UserPlan.FREE,
        $Enums.UserPlan.BUSINESS,
        $Enums.UserPlan.AGENCY,
      ];

      planTypes.forEach((planType) => {
        const pricing = PaymentLinkPricing.getPlanPurchasePricing(
          $Enums.RegistrationSource.DIRECT,
          planType
        );
        // Should either return valid pricing or null, no errors
        expect(pricing === null || typeof pricing === "object").toBe(true);
      });
    });

    it("should handle all AddOnType enum values", () => {
      const addonTypes = [
        $Enums.AddOnType.EXTRA_ADMIN,
        $Enums.AddOnType.EXTRA_FUNNEL,
        $Enums.AddOnType.EXTRA_PAGE,
        $Enums.AddOnType.EXTRA_SUBDOMAIN,
        $Enums.AddOnType.EXTRA_CUSTOM_DOMAIN,
        $Enums.AddOnType.EXTRA_WORKSPACE,
      ];

      addonTypes.forEach((addonType) => {
        const pricing = PaymentLinkPricing.getAddonPurchasePricing(
          $Enums.UserPlan.BUSINESS,
          addonType
        );
        // Should either return valid pricing or null, no errors
        expect(pricing === null || typeof pricing === "object").toBe(true);
      });
    });

    it("should return consistent results for multiple calls", () => {
      const call1 = PaymentLinkPricing.getPlanPurchasePricing(
        $Enums.RegistrationSource.DIRECT,
        $Enums.UserPlan.BUSINESS
      );
      const call2 = PaymentLinkPricing.getPlanPurchasePricing(
        $Enums.RegistrationSource.DIRECT,
        $Enums.UserPlan.BUSINESS
      );

      expect(call1).toEqual(call2);
    });

    it("should have all addon frequencies as monthly", () => {
      const businessAdmin = PaymentLinkPricing.getWorkspaceAddonPricing(
        $Enums.UserPlan.BUSINESS,
        $Enums.AddOnType.EXTRA_ADMIN
      );
      const agencyAdmin = PaymentLinkPricing.getWorkspaceAddonPricing(
        $Enums.UserPlan.AGENCY,
        $Enums.AddOnType.EXTRA_ADMIN
      );
      const userWorkspace = PaymentLinkPricing.getUserAddonPricing(
        $Enums.UserPlan.BUSINESS,
        $Enums.AddOnType.EXTRA_WORKSPACE
      );

      expect(businessAdmin?.frequency).toBe("monthly");
      expect(agencyAdmin?.frequency).toBe("monthly");
      expect(userWorkspace?.frequency).toBe("monthly");
    });

    it("should have all plan frequencies as annually", () => {
      const directBusiness = PaymentLinkPricing.getPlanPurchasePricing(
        $Enums.RegistrationSource.DIRECT,
        $Enums.UserPlan.BUSINESS
      );
      const directAgency = PaymentLinkPricing.getPlanPurchasePricing(
        $Enums.RegistrationSource.DIRECT,
        $Enums.UserPlan.AGENCY
      );
      const affiliateBusiness = PaymentLinkPricing.getPlanPurchasePricing(
        $Enums.RegistrationSource.AFFILIATE,
        $Enums.UserPlan.BUSINESS
      );

      expect(directBusiness?.frequency).toBe("annually");
      expect(directAgency?.frequency).toBe("annually");
      expect(affiliateBusiness?.frequency).toBe("annually");
    });
  });

  // ========== MAMOPAY API CONSTRAINTS ==========
  describe("MamoPay API Constraints", () => {
    const MAX_DESCRIPTION_LENGTH = 75;
    const MAX_TITLE_LENGTH = 50;

    describe("Description Length Validation", () => {
      it("should have all plan descriptions under 75 characters (MamoPay limit)", () => {
        const pricingSummary = PaymentLinkPricing.getPricingSummary();

        // Check DIRECT plans
        Object.entries(pricingSummary.plans.DIRECT).forEach(
          ([planType, config]: [string, any]) => {
            expect(
              config.description.length,
              `DIRECT ${planType} description is too long: "${config.description}" (${config.description.length} chars, max ${MAX_DESCRIPTION_LENGTH})`
            ).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
          }
        );

        // Check AFFILIATE plans
        Object.entries(pricingSummary.plans.AFFILIATE).forEach(
          ([planType, config]: [string, any]) => {
            expect(
              config.description.length,
              `AFFILIATE ${planType} description is too long: "${config.description}" (${config.description.length} chars, max ${MAX_DESCRIPTION_LENGTH})`
            ).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
          }
        );
      });

      it("should have all workspace addon descriptions under 75 characters", () => {
        const pricingSummary = PaymentLinkPricing.getPricingSummary();

        // Check BUSINESS workspace addons
        Object.entries(pricingSummary.workspaceAddons.BUSINESS || {}).forEach(
          ([addonType, config]: [string, any]) => {
            expect(
              config.description.length,
              `BUSINESS ${addonType} description is too long: "${config.description}" (${config.description.length} chars, max ${MAX_DESCRIPTION_LENGTH})`
            ).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
          }
        );

        // Check AGENCY workspace addons
        Object.entries(pricingSummary.workspaceAddons.AGENCY || {}).forEach(
          ([addonType, config]: [string, any]) => {
            expect(
              config.description.length,
              `AGENCY ${addonType} description is too long: "${config.description}" (${config.description.length} chars, max ${MAX_DESCRIPTION_LENGTH})`
            ).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
          }
        );
      });

      it("should have all user addon descriptions under 75 characters", () => {
        const pricingSummary = PaymentLinkPricing.getPricingSummary();

        // Check BUSINESS user addons
        Object.entries(pricingSummary.userAddons.BUSINESS || {}).forEach(
          ([addonType, config]: [string, any]) => {
            expect(
              config.description.length,
              `BUSINESS user ${addonType} description is too long: "${config.description}" (${config.description.length} chars, max ${MAX_DESCRIPTION_LENGTH})`
            ).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
          }
        );

        // Check AGENCY user addons
        Object.entries(pricingSummary.userAddons.AGENCY || {}).forEach(
          ([addonType, config]: [string, any]) => {
            expect(
              config.description.length,
              `AGENCY user ${addonType} description is too long: "${config.description}" (${config.description.length} chars, max ${MAX_DESCRIPTION_LENGTH})`
            ).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
          }
        );
      });
    });

    describe("Title Length Validation", () => {
      it("should have all plan titles under 50 characters", () => {
        const pricingSummary = PaymentLinkPricing.getPricingSummary();

        // Check DIRECT plans
        Object.entries(pricingSummary.plans.DIRECT).forEach(
          ([planType, config]: [string, any]) => {
            expect(
              config.title.length,
              `DIRECT ${planType} title is too long: "${config.title}" (${config.title.length} chars, max ${MAX_TITLE_LENGTH})`
            ).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
          }
        );

        // Check AFFILIATE plans
        Object.entries(pricingSummary.plans.AFFILIATE).forEach(
          ([planType, config]: [string, any]) => {
            expect(
              config.title.length,
              `AFFILIATE ${planType} title is too long: "${config.title}" (${config.title.length} chars, max ${MAX_TITLE_LENGTH})`
            ).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
          }
        );
      });

      it("should have all addon titles under 50 characters", () => {
        const pricingSummary = PaymentLinkPricing.getPricingSummary();

        // Check all workspace addons
        Object.values(pricingSummary.workspaceAddons).forEach((planAddons) => {
          Object.entries(planAddons).forEach(
            ([addonType, config]: [string, any]) => {
              expect(
                config.title.length,
                `${addonType} title is too long: "${config.title}" (${config.title.length} chars, max ${MAX_TITLE_LENGTH})`
              ).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
            }
          );
        });

        // Check all user addons
        Object.values(pricingSummary.userAddons).forEach((planAddons) => {
          Object.entries(planAddons).forEach(
            ([addonType, config]: [string, any]) => {
              expect(
                config.title.length,
                `${addonType} title is too long: "${config.title}" (${config.title.length} chars, max ${MAX_TITLE_LENGTH})`
              ).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
            }
          );
        });
      });
    });
  });
});
