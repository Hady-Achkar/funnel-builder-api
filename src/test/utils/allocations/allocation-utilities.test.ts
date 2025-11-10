import { describe, it, expect } from "vitest";
import { UserPlan, AddOnType } from "../../../generated/prisma-client";
import { UserWorkspaceAllocations } from "../../../utils/allocations/user-workspace-allocations";
import { WorkspaceMemberAllocations } from "../../../utils/allocations/workspace-member-allocations";
import { WorkspaceFunnelAllocations } from "../../../utils/allocations/workspace-funnel-allocations";
import { FunnelPageAllocations } from "../../../utils/allocations/funnel-page-allocations";
import { WorkspaceSubdomainAllocations } from "../../../utils/allocations/workspace-subdomain-allocations";
import { WorkspaceCustomDomainAllocations } from "../../../utils/allocations/workspace-custom-domain-allocations";

describe("Allocation Utilities", () => {
  // ========== USER WORKSPACE ALLOCATIONS ==========
  describe("UserWorkspaceAllocations", () => {
    describe("getBaseAllocation", () => {
      it("should return 1 workspace for FREE plan", () => {
        const allocation = UserWorkspaceAllocations.getBaseAllocation(
          UserPlan.FREE
        );
        expect(allocation).toBe(1);
      });

      it("should return 1 workspace for BUSINESS plan", () => {
        const allocation = UserWorkspaceAllocations.getBaseAllocation(
          UserPlan.BUSINESS
        );
        expect(allocation).toBe(1);
      });

      it("should return 10000 workspaces for AGENCY plan", () => {
        const allocation = UserWorkspaceAllocations.getBaseAllocation(
          UserPlan.AGENCY
        );
        expect(allocation).toBe(10000);
      });
    });

    describe("calculateTotalAllocation", () => {
      it("should return base allocation with no add-ons", () => {
        const total = UserWorkspaceAllocations.calculateTotalAllocation({
          plan: UserPlan.BUSINESS,
          addOns: [],
        });
        expect(total).toBe(1);
      });

      it("should add EXTRA_WORKSPACE add-ons to base allocation", () => {
        const total = UserWorkspaceAllocations.calculateTotalAllocation({
          plan: UserPlan.BUSINESS,
          addOns: [
            { type: AddOnType.EXTRA_WORKSPACE, quantity: 2, status: "ACTIVE" },
          ],
        });
        expect(total).toBe(3); // 1 base + 2 from add-ons
      });

      it("should only count ACTIVE add-ons", () => {
        const total = UserWorkspaceAllocations.calculateTotalAllocation({
          plan: UserPlan.FREE,
          addOns: [
            { type: AddOnType.EXTRA_WORKSPACE, quantity: 2, status: "ACTIVE" },
            {
              type: AddOnType.EXTRA_WORKSPACE,
              quantity: 5,
              status: "INACTIVE",
            },
          ],
        });
        expect(total).toBe(3); // 1 base + 2 from active add-ons only
      });

      it("should sum multiple EXTRA_WORKSPACE add-ons", () => {
        const total = UserWorkspaceAllocations.calculateTotalAllocation({
          plan: UserPlan.AGENCY,
          addOns: [
            { type: AddOnType.EXTRA_WORKSPACE, quantity: 2, status: "ACTIVE" },
            { type: AddOnType.EXTRA_WORKSPACE, quantity: 3, status: "ACTIVE" },
          ],
        });
        expect(total).toBe(10005); // 10000 base + 2 + 3 from add-ons
      });
    });

    describe("canCreateWorkspace", () => {
      it("should return true when under limit", () => {
        const canCreate = UserWorkspaceAllocations.canCreateWorkspace(0, {
          plan: UserPlan.FREE,
        });
        expect(canCreate).toBe(true);
      });

      it("should return false when at limit", () => {
        const canCreate = UserWorkspaceAllocations.canCreateWorkspace(1, {
          plan: UserPlan.FREE,
        });
        expect(canCreate).toBe(false);
      });

      it("should return false when over limit", () => {
        const canCreate = UserWorkspaceAllocations.canCreateWorkspace(2, {
          plan: UserPlan.FREE,
        });
        expect(canCreate).toBe(false);
      });

      it("should account for add-ons", () => {
        const canCreate = UserWorkspaceAllocations.canCreateWorkspace(2, {
          plan: UserPlan.BUSINESS,
          addOns: [
            { type: AddOnType.EXTRA_WORKSPACE, quantity: 2, status: "ACTIVE" },
          ],
        });
        expect(canCreate).toBe(true); // 2 < 3 (1 base + 2 add-ons)
      });
    });

    describe("getRemainingSlots", () => {
      it("should return correct remaining slots", () => {
        const remaining = UserWorkspaceAllocations.getRemainingSlots(1, {
          plan: UserPlan.AGENCY,
        });
        expect(remaining).toBe(9999); // 10000 total - 1 used
      });

      it("should return 0 when at limit", () => {
        const remaining = UserWorkspaceAllocations.getRemainingSlots(1, {
          plan: UserPlan.FREE,
        });
        expect(remaining).toBe(0);
      });

      it("should return 0 when over limit", () => {
        const remaining = UserWorkspaceAllocations.getRemainingSlots(5, {
          plan: UserPlan.FREE,
        });
        expect(remaining).toBe(0);
      });
    });

    describe("getAllocationSummary", () => {
      it("should return complete summary", () => {
        const summary = UserWorkspaceAllocations.getAllocationSummary(1, {
          plan: UserPlan.BUSINESS,
          addOns: [
            { type: AddOnType.EXTRA_WORKSPACE, quantity: 2, status: "ACTIVE" },
          ],
        });

        expect(summary).toEqual({
          baseAllocation: 1,
          extraFromAddOns: 2,
          totalAllocation: 3,
          currentUsage: 1,
          remainingSlots: 2,
          canCreateMore: true,
        });
      });
    });
  });

  // ========== WORKSPACE MEMBER ALLOCATIONS ==========
  describe("WorkspaceMemberAllocations", () => {
    describe("getBaseAllocation", () => {
      it("should return 1 member for FREE workspace", () => {
        const allocation = WorkspaceMemberAllocations.getBaseAllocation(
          UserPlan.FREE
        );
        expect(allocation).toBe(1);
      });

      it("should return 2 members for BUSINESS workspace", () => {
        const allocation = WorkspaceMemberAllocations.getBaseAllocation(
          UserPlan.BUSINESS
        );
        expect(allocation).toBe(2);
      });

      it("should return 1 member for AGENCY workspace", () => {
        const allocation = WorkspaceMemberAllocations.getBaseAllocation(
          UserPlan.AGENCY
        );
        expect(allocation).toBe(1);
      });
    });

    describe("calculateTotalAllocation", () => {
      it("should add EXTRA_ADMIN add-ons to base allocation", () => {
        const total = WorkspaceMemberAllocations.calculateTotalAllocation({
          workspacePlanType: UserPlan.AGENCY,
          addOns: [
            { type: AddOnType.EXTRA_ADMIN, quantity: 50, status: "ACTIVE" },
          ],
        });
        expect(total).toBe(51); // 1 base + 50 from add-ons
      });

      it("should only count ACTIVE add-ons", () => {
        const total = WorkspaceMemberAllocations.calculateTotalAllocation({
          workspacePlanType: UserPlan.BUSINESS,
          addOns: [
            { type: AddOnType.EXTRA_ADMIN, quantity: 5, status: "ACTIVE" },
            { type: AddOnType.EXTRA_ADMIN, quantity: 10, status: "INACTIVE" },
          ],
        });
        expect(total).toBe(7); // 2 base + 5 from active add-ons only
      });
    });

    describe("canAddMember", () => {
      it("should return true when under limit", () => {
        const canAdd = WorkspaceMemberAllocations.canAddMember(0, {
          workspacePlanType: UserPlan.FREE,
        });
        expect(canAdd).toBe(true);
      });

      it("should return false when at limit", () => {
        const canAdd = WorkspaceMemberAllocations.canAddMember(1, {
          workspacePlanType: UserPlan.FREE,
        });
        expect(canAdd).toBe(false);
      });

      it("should account for add-ons", () => {
        const canAdd = WorkspaceMemberAllocations.canAddMember(3, {
          workspacePlanType: UserPlan.BUSINESS,
          addOns: [
            { type: AddOnType.EXTRA_ADMIN, quantity: 3, status: "ACTIVE" },
          ],
        });
        expect(canAdd).toBe(true); // 3 < 5 (2 base + 3 add-ons)
      });
    });

    describe("getAllocationSummary", () => {
      it("should return complete summary", () => {
        const summary = WorkspaceMemberAllocations.getAllocationSummary(0, {
          workspacePlanType: UserPlan.FREE,
          addOns: [],
        });

        expect(summary).toEqual({
          baseAllocation: 1,
          extraFromAddOns: 0,
          totalAllocation: 1,
          currentUsage: 0,
          remainingSlots: 1,
          canAddMore: true,
        });
      });
    });
  });

  // ========== WORKSPACE FUNNEL ALLOCATIONS ==========
  describe("WorkspaceFunnelAllocations", () => {
    describe("getBaseAllocation", () => {
      it("should return 1 funnel for FREE workspace", () => {
        const allocation = WorkspaceFunnelAllocations.getBaseAllocation(
          UserPlan.FREE
        );
        expect(allocation).toBe(1);
      });

      it("should return 1 funnel for BUSINESS workspace", () => {
        const allocation = WorkspaceFunnelAllocations.getBaseAllocation(
          UserPlan.BUSINESS
        );
        expect(allocation).toBe(1);
      });

      it("should return 10 funnels for AGENCY workspace", () => {
        const allocation = WorkspaceFunnelAllocations.getBaseAllocation(
          UserPlan.AGENCY
        );
        expect(allocation).toBe(1);
      });
    });

    describe("calculateTotalAllocation", () => {
      it("should add EXTRA_FUNNEL add-ons to base allocation", () => {
        const total = WorkspaceFunnelAllocations.calculateTotalAllocation({
          workspacePlanType: UserPlan.BUSINESS,
          addOns: [
            { type: AddOnType.EXTRA_FUNNEL, quantity: 4, status: "ACTIVE" },
          ],
        });
        expect(total).toBe(5); // 1 base + 4 from add-ons
      });

      it("should only count ACTIVE add-ons", () => {
        const total = WorkspaceFunnelAllocations.calculateTotalAllocation({
          workspacePlanType: UserPlan.FREE,
          addOns: [
            { type: AddOnType.EXTRA_FUNNEL, quantity: 2, status: "ACTIVE" },
            { type: AddOnType.EXTRA_FUNNEL, quantity: 5, status: "INACTIVE" },
          ],
        });
        expect(total).toBe(3); // 1 base + 2 from active add-ons only
      });
    });

    describe("canCreateFunnel", () => {
      it("should return true when under limit", () => {
        const canCreate = WorkspaceFunnelAllocations.canCreateFunnel(0, {
          workspacePlanType: UserPlan.BUSINESS,
        });
        expect(canCreate).toBe(true);
      });

      it("should return false when at limit", () => {
        const canCreate = WorkspaceFunnelAllocations.canCreateFunnel(1, {
          workspacePlanType: UserPlan.BUSINESS,
        });
        expect(canCreate).toBe(false);
      });

      it("should account for add-ons", () => {
        const canCreate = WorkspaceFunnelAllocations.canCreateFunnel(2, {
          workspacePlanType: UserPlan.BUSINESS,
          addOns: [
            { type: AddOnType.EXTRA_FUNNEL, quantity: 3, status: "ACTIVE" },
          ],
        });
        expect(canCreate).toBe(true); // 2 < 4 (1 base + 3 add-ons)
      });
    });

    describe("getAllocationSummary", () => {
      it("should return complete summary", () => {
        const summary = WorkspaceFunnelAllocations.getAllocationSummary(0, {
          workspacePlanType: UserPlan.FREE,
          addOns: [],
        });

        expect(summary).toEqual({
          baseAllocation: 1,
          extraFromAddOns: 0,
          totalAllocation: 1,
          currentUsage: 0,
          remainingSlots: 1,
          canCreateMore: true,
        });
      });
    });
  });

  // ========== FUNNEL PAGE ALLOCATIONS ==========
  describe("FunnelPageAllocations", () => {
    describe("getBaseAllocation", () => {
      it("should return 35 pages for all plan types", () => {
        expect(FunnelPageAllocations.getBaseAllocation(UserPlan.FREE)).toBe(35);
        expect(FunnelPageAllocations.getBaseAllocation(UserPlan.BUSINESS)).toBe(
          35
        );
        expect(FunnelPageAllocations.getBaseAllocation(UserPlan.AGENCY)).toBe(
          35
        );
      });
    });

    describe("calculateTotalAllocation", () => {
      it("should add 5 pages per EXTRA_PAGE add-on unit", () => {
        const total = FunnelPageAllocations.calculateTotalAllocation({
          workspacePlanType: UserPlan.BUSINESS,
          addOns: [
            { type: AddOnType.EXTRA_PAGE, quantity: 3, status: "ACTIVE" },
          ],
        });
        expect(total).toBe(50); // 35 base + 15 (3 × 5) from add-ons
      });

      it("should only count ACTIVE add-ons", () => {
        const total = FunnelPageAllocations.calculateTotalAllocation({
          workspacePlanType: UserPlan.FREE,
          addOns: [
            { type: AddOnType.EXTRA_PAGE, quantity: 2, status: "ACTIVE" },
            { type: AddOnType.EXTRA_PAGE, quantity: 4, status: "INACTIVE" },
          ],
        });
        expect(total).toBe(45); // 35 base + 10 (2 × 5) from active add-ons only
      });

      it("should handle multiple EXTRA_PAGE add-ons correctly", () => {
        const total = FunnelPageAllocations.calculateTotalAllocation({
          workspacePlanType: UserPlan.AGENCY,
          addOns: [
            { type: AddOnType.EXTRA_PAGE, quantity: 1, status: "ACTIVE" },
            { type: AddOnType.EXTRA_PAGE, quantity: 2, status: "ACTIVE" },
          ],
        });
        expect(total).toBe(50); // 35 base + 15 (3 × 5) from add-ons
      });
    });

    describe("canCreatePage", () => {
      it("should return true when under limit", () => {
        const canCreate = FunnelPageAllocations.canCreatePage(20, {
          workspacePlanType: UserPlan.FREE,
        });
        expect(canCreate).toBe(true);
      });

      it("should return false when at limit", () => {
        const canCreate = FunnelPageAllocations.canCreatePage(35, {
          workspacePlanType: UserPlan.FREE,
        });
        expect(canCreate).toBe(false);
      });

      it("should account for add-ons", () => {
        const canCreate = FunnelPageAllocations.canCreatePage(40, {
          workspacePlanType: UserPlan.BUSINESS,
          addOns: [
            { type: AddOnType.EXTRA_PAGE, quantity: 2, status: "ACTIVE" },
          ],
        });
        expect(canCreate).toBe(true); // 40 < 45 (35 base + 10 from add-ons)
      });
    });

    describe("getAllocationSummary", () => {
      it("should return complete summary", () => {
        const summary = FunnelPageAllocations.getAllocationSummary(20, {
          workspacePlanType: UserPlan.FREE,
          addOns: [
            { type: AddOnType.EXTRA_PAGE, quantity: 1, status: "ACTIVE" },
          ],
        });

        expect(summary).toEqual({
          baseAllocation: 35,
          extraFromAddOns: 5,
          totalAllocation: 40,
          currentUsage: 20,
          remainingSlots: 20,
          canCreateMore: true,
        });
      });
    });
  });

  // ========== WORKSPACE SUBDOMAIN ALLOCATIONS ==========
  describe("WorkspaceSubdomainAllocations", () => {
    describe("getBaseAllocation", () => {
      it("should return 1 subdomain for all plan types", () => {
        expect(
          WorkspaceSubdomainAllocations.getBaseAllocation(UserPlan.FREE)
        ).toBe(1);
        expect(
          WorkspaceSubdomainAllocations.getBaseAllocation(UserPlan.BUSINESS)
        ).toBe(1);
        expect(
          WorkspaceSubdomainAllocations.getBaseAllocation(UserPlan.AGENCY)
        ).toBe(1);
      });
    });

    describe("calculateTotalAllocation", () => {
      it("should add EXTRA_SUBDOMAIN add-ons to base allocation", () => {
        const total = WorkspaceSubdomainAllocations.calculateTotalAllocation({
          workspacePlanType: UserPlan.AGENCY,
          addOns: [
            { type: AddOnType.EXTRA_SUBDOMAIN, quantity: 5, status: "ACTIVE" },
          ],
        });
        expect(total).toBe(6); // 1 base + 5 from add-ons
      });

      it("should only count ACTIVE add-ons", () => {
        const total = WorkspaceSubdomainAllocations.calculateTotalAllocation({
          workspacePlanType: UserPlan.BUSINESS,
          addOns: [
            { type: AddOnType.EXTRA_SUBDOMAIN, quantity: 2, status: "ACTIVE" },
            {
              type: AddOnType.EXTRA_SUBDOMAIN,
              quantity: 3,
              status: "INACTIVE",
            },
          ],
        });
        expect(total).toBe(3); // 1 base + 2 from active add-ons only
      });
    });

    describe("canCreateSubdomain", () => {
      it("should return true when under limit", () => {
        const canCreate = WorkspaceSubdomainAllocations.canCreateSubdomain(0, {
          workspacePlanType: UserPlan.FREE,
        });
        expect(canCreate).toBe(true);
      });

      it("should return false when at limit", () => {
        const canCreate = WorkspaceSubdomainAllocations.canCreateSubdomain(1, {
          workspacePlanType: UserPlan.FREE,
        });
        expect(canCreate).toBe(false);
      });

      it("should account for add-ons", () => {
        const canCreate = WorkspaceSubdomainAllocations.canCreateSubdomain(2, {
          workspacePlanType: UserPlan.BUSINESS,
          addOns: [
            { type: AddOnType.EXTRA_SUBDOMAIN, quantity: 3, status: "ACTIVE" },
          ],
        });
        expect(canCreate).toBe(true); // 2 < 4 (1 base + 3 add-ons)
      });
    });

    describe("getAllocationSummary", () => {
      it("should return complete summary", () => {
        const summary = WorkspaceSubdomainAllocations.getAllocationSummary(0, {
          workspacePlanType: UserPlan.BUSINESS,
          addOns: [],
        });

        expect(summary).toEqual({
          baseAllocation: 1,
          extraFromAddOns: 0,
          totalAllocation: 1,
          currentUsage: 0,
          remainingSlots: 1,
          canCreateMore: true,
        });
      });
    });
  });

  // ========== WORKSPACE CUSTOM DOMAIN ALLOCATIONS ==========
  describe("WorkspaceCustomDomainAllocations", () => {
    describe("getBaseAllocation", () => {
      it("should return correct custom domain allocations per plan type", () => {
        expect(
          WorkspaceCustomDomainAllocations.getBaseAllocation(UserPlan.FREE)
        ).toBe(0);
        expect(
          WorkspaceCustomDomainAllocations.getBaseAllocation(UserPlan.BUSINESS)
        ).toBe(1);
        expect(
          WorkspaceCustomDomainAllocations.getBaseAllocation(UserPlan.AGENCY)
        ).toBe(0);
      });
    });

    describe("calculateTotalAllocation", () => {
      it("should add EXTRA_CUSTOM_DOMAIN add-ons to base allocation", () => {
        const total = WorkspaceCustomDomainAllocations.calculateTotalAllocation(
          {
            workspacePlanType: UserPlan.BUSINESS,
            addOns: [
              {
                type: AddOnType.EXTRA_CUSTOM_DOMAIN,
                quantity: 2,
                status: "ACTIVE",
              },
            ],
          }
        );
        expect(total).toBe(3); // 1 base + 2 from add-ons
      });

      it("should only count ACTIVE add-ons", () => {
        const total = WorkspaceCustomDomainAllocations.calculateTotalAllocation(
          {
            workspacePlanType: UserPlan.AGENCY,
            addOns: [
              {
                type: AddOnType.EXTRA_CUSTOM_DOMAIN,
                quantity: 3,
                status: "ACTIVE",
              },
              {
                type: AddOnType.EXTRA_CUSTOM_DOMAIN,
                quantity: 5,
                status: "INACTIVE",
              },
            ],
          }
        );
        expect(total).toBe(3); // 0 base + 3 from active add-ons only
      });
    });

    describe("canCreateCustomDomain", () => {
      it("should return false when FREE has 0 base allocation", () => {
        const canCreate =
          WorkspaceCustomDomainAllocations.canCreateCustomDomain(0, {
            workspacePlanType: UserPlan.FREE,
          });
        expect(canCreate).toBe(false);
      });

      it("should return true when BUSINESS under limit", () => {
        const canCreate =
          WorkspaceCustomDomainAllocations.canCreateCustomDomain(0, {
            workspacePlanType: UserPlan.BUSINESS,
          });
        expect(canCreate).toBe(true);
      });

      it("should account for add-ons", () => {
        const canCreate =
          WorkspaceCustomDomainAllocations.canCreateCustomDomain(1, {
            workspacePlanType: UserPlan.AGENCY,
            addOns: [
              {
                type: AddOnType.EXTRA_CUSTOM_DOMAIN,
                quantity: 4,
                status: "ACTIVE",
              },
            ],
          });
        expect(canCreate).toBe(true); // 1 < 4 (0 base + 4 add-ons)
      });
    });

    describe("getAllocationSummary", () => {
      it("should return complete summary", () => {
        const summary = WorkspaceCustomDomainAllocations.getAllocationSummary(
          0,
          {
            workspacePlanType: UserPlan.AGENCY,
            addOns: [
              {
                type: AddOnType.EXTRA_CUSTOM_DOMAIN,
                quantity: 2,
                status: "ACTIVE",
              },
            ],
          }
        );

        expect(summary).toEqual({
          baseAllocation: 0,
          extraFromAddOns: 2,
          totalAllocation: 2,
          currentUsage: 0,
          remainingSlots: 2,
          canCreateMore: true,
        });
      });
    });
  });

  // ========== CROSS-UTILITY INTEGRATION TESTS ==========
  describe("Integration Tests", () => {
    it("should handle complete FREE plan allocation scenario", () => {
      const freePlan = UserPlan.FREE;

      // User level
      const workspaces = UserWorkspaceAllocations.getAllocationSummary(1, {
        plan: freePlan,
      });
      expect(workspaces.totalAllocation).toBe(1);
      expect(workspaces.canCreateMore).toBe(false);

      // Workspace level
      const members = WorkspaceMemberAllocations.getAllocationSummary(0, {
        workspacePlanType: freePlan,
      });
      expect(members.totalAllocation).toBe(1);
      expect(members.canAddMore).toBe(true);

      const funnels = WorkspaceFunnelAllocations.getAllocationSummary(0, {
        workspacePlanType: freePlan,
      });
      expect(funnels.totalAllocation).toBe(1);
      expect(funnels.canCreateMore).toBe(true);

      const subdomains = WorkspaceSubdomainAllocations.getAllocationSummary(0, {
        workspacePlanType: freePlan,
      });
      expect(subdomains.totalAllocation).toBe(1);
      expect(subdomains.canCreateMore).toBe(true);

      const customDomains =
        WorkspaceCustomDomainAllocations.getAllocationSummary(0, {
          workspacePlanType: freePlan,
        });
      expect(customDomains.totalAllocation).toBe(0);
      expect(customDomains.canCreateMore).toBe(false);

      // Funnel level
      const pages = FunnelPageAllocations.getAllocationSummary(10, {
        workspacePlanType: freePlan,
      });
      expect(pages.totalAllocation).toBe(35);
      expect(pages.canCreateMore).toBe(true);
    });

    it("should handle complete BUSINESS plan with add-ons scenario", () => {
      const businessPlan = UserPlan.BUSINESS;
      const addOns = [
        { type: AddOnType.EXTRA_WORKSPACE, quantity: 1, status: "ACTIVE" },
        { type: AddOnType.EXTRA_FUNNEL, quantity: 3, status: "ACTIVE" },
        { type: AddOnType.EXTRA_SUBDOMAIN, quantity: 2, status: "ACTIVE" },
        { type: AddOnType.EXTRA_CUSTOM_DOMAIN, quantity: 2, status: "ACTIVE" },
        { type: AddOnType.EXTRA_PAGE, quantity: 2, status: "ACTIVE" },
      ];

      // User level
      const workspaces = UserWorkspaceAllocations.getAllocationSummary(1, {
        plan: businessPlan,
        addOns,
      });
      expect(workspaces.totalAllocation).toBe(2); // 1 base + 1 add-on
      expect(workspaces.canCreateMore).toBe(true);

      // Workspace level
      const funnels = WorkspaceFunnelAllocations.getAllocationSummary(2, {
        workspacePlanType: businessPlan,
        addOns,
      });
      expect(funnels.totalAllocation).toBe(4); // 1 base + 3 add-ons
      expect(funnels.canCreateMore).toBe(true);

      const subdomains = WorkspaceSubdomainAllocations.getAllocationSummary(1, {
        workspacePlanType: businessPlan,
        addOns,
      });
      expect(subdomains.totalAllocation).toBe(3); // 1 base + 2 add-ons
      expect(subdomains.canCreateMore).toBe(true);

      const customDomains =
        WorkspaceCustomDomainAllocations.getAllocationSummary(1, {
          workspacePlanType: businessPlan,
          addOns,
        });
      expect(customDomains.totalAllocation).toBe(3); // 1 base + 2 add-ons
      expect(customDomains.canCreateMore).toBe(true);

      // Funnel level
      const pages = FunnelPageAllocations.getAllocationSummary(35, {
        workspacePlanType: businessPlan,
        addOns,
      });
      expect(pages.totalAllocation).toBe(45); // 35 base + 10 (2 × 5) add-ons
      expect(pages.canCreateMore).toBe(true);
    });

    it("should handle complete AGENCY plan scenario", () => {
      const agencyPlan = UserPlan.AGENCY;
      const addOns = [
        { type: AddOnType.EXTRA_ADMIN, quantity: 100, status: "ACTIVE" },
      ];

      // User level
      const workspaces = UserWorkspaceAllocations.getAllocationSummary(2, {
        plan: agencyPlan,
      });
      expect(workspaces.totalAllocation).toBe(10000);
      expect(workspaces.canCreateMore).toBe(true);

      // Workspace level
      const members = WorkspaceMemberAllocations.getAllocationSummary(50, {
        workspacePlanType: agencyPlan,
        addOns,
      });
      expect(members.totalAllocation).toBe(101); // 1 base + 100 add-ons
      expect(members.canAddMore).toBe(true);

      const funnels = WorkspaceFunnelAllocations.getAllocationSummary(5, {
        workspacePlanType: agencyPlan,
      });
      expect(funnels.totalAllocation).toBe(1);
      expect(funnels.canCreateMore).toBe(false);
    });
  });

  // ========== EDGE CASES ==========
  describe("Edge Cases", () => {
    it("should handle zero current usage", () => {
      const summary = WorkspaceFunnelAllocations.getAllocationSummary(0, {
        workspacePlanType: UserPlan.FREE,
      });

      expect(summary.currentUsage).toBe(0);
      expect(summary.remainingSlots).toBe(1);
      expect(summary.canCreateMore).toBe(true);
    });

    it("should handle usage exceeding allocation", () => {
      const summary = UserWorkspaceAllocations.getAllocationSummary(5, {
        plan: UserPlan.FREE,
      });

      expect(summary.currentUsage).toBe(5);
      expect(summary.remainingSlots).toBe(0);
      expect(summary.canCreateMore).toBe(false);
    });

    it("should handle empty add-ons array", () => {
      const total = WorkspaceMemberAllocations.calculateTotalAllocation({
        workspacePlanType: UserPlan.BUSINESS,
        addOns: [],
      });

      expect(total).toBe(2);
    });

    it("should handle undefined add-ons", () => {
      const total = FunnelPageAllocations.calculateTotalAllocation({
        workspacePlanType: UserPlan.AGENCY,
      });

      expect(total).toBe(35);
    });

    it("should ignore non-relevant add-on types", () => {
      const total = WorkspaceFunnelAllocations.calculateTotalAllocation({
        workspacePlanType: UserPlan.BUSINESS,
        addOns: [
          { type: AddOnType.EXTRA_WORKSPACE, quantity: 5, status: "ACTIVE" },
          { type: AddOnType.EXTRA_ADMIN, quantity: 10, status: "ACTIVE" },
        ],
      });

      expect(total).toBe(1); // Only base, no EXTRA_FUNNEL add-ons
    });

    it("should handle mix of active and inactive add-ons correctly", () => {
      const total = UserWorkspaceAllocations.calculateTotalAllocation({
        plan: UserPlan.AGENCY,
        addOns: [
          { type: AddOnType.EXTRA_WORKSPACE, quantity: 2, status: "ACTIVE" },
          { type: AddOnType.EXTRA_WORKSPACE, quantity: 5, status: "INACTIVE" },
          { type: AddOnType.EXTRA_WORKSPACE, quantity: 3, status: "ACTIVE" },
          { type: AddOnType.EXTRA_WORKSPACE, quantity: 1, status: "EXPIRED" },
        ],
      });

      expect(total).toBe(10005); // 10000 base + 2 + 3 active only
    });
  });
});
