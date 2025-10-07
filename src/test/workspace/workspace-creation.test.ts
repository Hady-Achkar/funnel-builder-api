import { describe, it, expect, beforeEach, vi } from "vitest";
import { CreateWorkspaceService } from "../../services/workspace/create";
import { getPrisma } from "../../lib/prisma";
import { BadRequestError } from "../../errors/http-errors";
import { UserPlan, AddOnStatus } from "../../generated/prisma-client";

// Mock the prisma client
vi.mock("../../lib/prisma");

// Mock the domain creation helper
vi.mock("../../helpers/domain/create-subdomain", () => ({
  createARecord: vi.fn().mockResolvedValue(undefined),
}));

describe("Workspace Creation Tests", () => {
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Set required environment variables for testing
    process.env.WORKSPACE_ZONE_ID = "test-zone-id";
    process.env.WORKSPACE_DOMAIN = "digitalsite.com";
    process.env.WORKSPACE_IP = "20.56.136.29";

    mockPrisma = {
      workspace: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        count: vi.fn(),
      },
      domain: {
        findUnique: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      workspaceMember: {
        create: vi.fn(),
      },
      workspaceRolePermTemplate: {
        create: vi.fn(),
        findMany: vi.fn(),
        deleteMany: vi.fn(),
      },
      addOn: {
        findMany: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
  });

  describe("Plan-based workspace limits (NEW ARCHITECTURE)", () => {
    it("should allow FREE plan users to create 1 workspace", async () => {
      const userId = 1;
      const workspaceData = {
        name: "My Free Workspace",
        slug: "my-free-workspace",
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        plan: UserPlan.FREE,
      });

      mockPrisma.addOn.findMany.mockResolvedValue([]); // No add-ons
      mockPrisma.workspace.count.mockResolvedValue(0); // No existing workspaces
      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.workspace.findFirst.mockResolvedValue(null);
      mockPrisma.domain.findUnique.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const txMock = {
          workspace: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: workspaceData.name,
              slug: workspaceData.slug,
              ownerId: userId,
              planType: UserPlan.FREE,
            }),
          },
          workspaceMember: {
            create: vi.fn().mockResolvedValue({}),
          },
          workspaceRolePermTemplate: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      const result = await CreateWorkspaceService.create(userId, workspaceData);

      expect(result.message).toBe("Workspace created successfully");
      expect(mockPrisma.workspace.count).toHaveBeenCalledWith({
        where: { ownerId: userId },
      });
    });

    it("should prevent FREE plan users from creating more than 1 workspace", async () => {
      const userId = 1;
      const workspaceData = {
        name: "Second Workspace",
        slug: "second-workspace",
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        plan: UserPlan.FREE,
      });

      mockPrisma.addOn.findMany.mockResolvedValue([]); // No add-ons
      mockPrisma.workspace.count.mockResolvedValue(1); // Already has 1 workspace

      await expect(
        CreateWorkspaceService.create(userId, workspaceData)
      ).rejects.toThrow(
        "You've reached your workspace limit. Upgrade your plan to create more workspaces."
      );
    });

    it("should allow BUSINESS plan users to create 1 workspace", async () => {
      const userId = 2;
      const workspaceData = {
        name: "Business Workspace",
        slug: "business-workspace",
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        plan: UserPlan.BUSINESS,
      });

      mockPrisma.addOn.findMany.mockResolvedValue([]);
      mockPrisma.workspace.count.mockResolvedValue(0);
      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.workspace.findFirst.mockResolvedValue(null);
      mockPrisma.domain.findUnique.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const txMock = {
          workspace: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: workspaceData.name,
              slug: workspaceData.slug,
              ownerId: userId,
              planType: UserPlan.BUSINESS,
            }),
          },
          workspaceMember: {
            create: vi.fn().mockResolvedValue({}),
          },
          workspaceRolePermTemplate: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      const result = await CreateWorkspaceService.create(userId, workspaceData);

      expect(result.message).toBe("Workspace created successfully");
    });

    it("should allow AGENCY plan users to create 3 workspaces", async () => {
      const userId = 3;
      const workspaceData = {
        name: "Agency Workspace 3",
        slug: "agency-workspace-3",
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        plan: UserPlan.AGENCY,
      });

      mockPrisma.addOn.findMany.mockResolvedValue([]);
      mockPrisma.workspace.count.mockResolvedValue(2); // Has 2, can create 3rd
      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.workspace.findFirst.mockResolvedValue(null);
      mockPrisma.domain.findUnique.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const txMock = {
          workspace: {
            create: vi.fn().mockResolvedValue({
              id: 3,
              name: workspaceData.name,
              slug: workspaceData.slug,
              ownerId: userId,
              planType: UserPlan.AGENCY,
            }),
          },
          workspaceMember: {
            create: vi.fn().mockResolvedValue({}),
          },
          workspaceRolePermTemplate: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      const result = await CreateWorkspaceService.create(userId, workspaceData);

      expect(result.message).toBe("Workspace created successfully");
    });
  });

  describe("EXTRA_WORKSPACE add-on support", () => {
    it("should allow FREE user to create 2nd workspace with EXTRA_WORKSPACE add-on", async () => {
      const userId = 1;
      const workspaceData = {
        name: "Extra Workspace",
        slug: "extra-workspace",
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        plan: UserPlan.FREE,
      });

      // User has 1 EXTRA_WORKSPACE add-on
      mockPrisma.addOn.findMany.mockResolvedValue([
        {
          id: 1,
          userId: userId,
          type: "EXTRA_WORKSPACE",
          quantity: 1,
          status: AddOnStatus.ACTIVE,
        },
      ]);

      mockPrisma.workspace.count.mockResolvedValue(1); // Has 1, can create 2nd
      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.workspace.findFirst.mockResolvedValue(null);
      mockPrisma.domain.findUnique.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const txMock = {
          workspace: {
            create: vi.fn().mockResolvedValue({
              id: 2,
              name: workspaceData.name,
              slug: workspaceData.slug,
              ownerId: userId,
              planType: UserPlan.FREE,
            }),
          },
          workspaceMember: {
            create: vi.fn().mockResolvedValue({}),
          },
          workspaceRolePermTemplate: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      const result = await CreateWorkspaceService.create(userId, workspaceData);

      expect(result.message).toBe("Workspace created successfully");
    });

    it("should allow AGENCY user to create 5 workspaces with 2 EXTRA_WORKSPACE add-ons", async () => {
      const userId = 3;
      const workspaceData = {
        name: "Fifth Agency Workspace",
        slug: "fifth-agency-workspace",
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        plan: UserPlan.AGENCY,
      });

      // User has 2 EXTRA_WORKSPACE add-ons (3 base + 2 extra = 5 total)
      mockPrisma.addOn.findMany.mockResolvedValue([
        {
          id: 1,
          userId: userId,
          type: "EXTRA_WORKSPACE",
          quantity: 2,
          status: AddOnStatus.ACTIVE,
        },
      ]);

      mockPrisma.workspace.count.mockResolvedValue(4); // Has 4, can create 5th
      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.workspace.findFirst.mockResolvedValue(null);
      mockPrisma.domain.findUnique.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const txMock = {
          workspace: {
            create: vi.fn().mockResolvedValue({
              id: 5,
              name: workspaceData.name,
              slug: workspaceData.slug,
              ownerId: userId,
              planType: UserPlan.AGENCY,
            }),
          },
          workspaceMember: {
            create: vi.fn().mockResolvedValue({}),
          },
          workspaceRolePermTemplate: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      const result = await CreateWorkspaceService.create(userId, workspaceData);

      expect(result.message).toBe("Workspace created successfully");
    });

    it("should ignore CANCELLED/EXPIRED add-ons when calculating workspace limit", async () => {
      const userId = 1;
      const workspaceData = {
        name: "Should Fail Workspace",
        slug: "should-fail-workspace",
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        plan: UserPlan.FREE,
      });

      // User has CANCELLED add-on (should not count)
      mockPrisma.addOn.findMany.mockResolvedValue([
        {
          id: 1,
          userId: userId,
          type: "EXTRA_WORKSPACE",
          quantity: 1,
          status: AddOnStatus.CANCELLED,
        },
      ]);

      mockPrisma.workspace.count.mockResolvedValue(1); // Already has 1 workspace

      await expect(
        CreateWorkspaceService.create(userId, workspaceData)
      ).rejects.toThrow(
        "You've reached your workspace limit. Upgrade your plan to create more workspaces."
      );
    });
  });

  describe("Workspace planType inheritance and override", () => {
    it("should inherit user's plan as workspace planType by default", async () => {
      const userId = 1;
      const workspaceData = {
        name: "Auto Plan Workspace",
        slug: "auto-plan-workspace",
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        plan: UserPlan.BUSINESS,
      });

      mockPrisma.addOn.findMany.mockResolvedValue([]);
      mockPrisma.workspace.count.mockResolvedValue(0);
      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.workspace.findFirst.mockResolvedValue(null);
      mockPrisma.domain.findUnique.mockResolvedValue(null);

      let createdWorkspaceData: any = null;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const txMock = {
          workspace: {
            create: vi.fn().mockImplementation(({ data }: any) => {
              createdWorkspaceData = data;
              return Promise.resolve({
                id: 1,
                ...data,
              });
            }),
          },
          workspaceMember: {
            create: vi.fn().mockResolvedValue({}),
          },
          workspaceRolePermTemplate: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      await CreateWorkspaceService.create(userId, workspaceData);

      expect(createdWorkspaceData.planType).toBe(UserPlan.BUSINESS);
    });

    it("should allow explicit planType override in request body", async () => {
      const userId = 1;
      const workspaceData = {
        name: "Custom Plan Workspace",
        slug: "custom-plan-workspace",
        planType: UserPlan.FREE, // Explicitly set to FREE
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        plan: UserPlan.BUSINESS, // User has BUSINESS plan
      });

      mockPrisma.addOn.findMany.mockResolvedValue([]);
      mockPrisma.workspace.count.mockResolvedValue(0);
      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.workspace.findFirst.mockResolvedValue(null);
      mockPrisma.domain.findUnique.mockResolvedValue(null);

      let createdWorkspaceData: any = null;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const txMock = {
          workspace: {
            create: vi.fn().mockImplementation(({ data }: any) => {
              createdWorkspaceData = data;
              return Promise.resolve({
                id: 1,
                ...data,
              });
            }),
          },
          workspaceMember: {
            create: vi.fn().mockResolvedValue({}),
          },
          workspaceRolePermTemplate: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      await CreateWorkspaceService.create(userId, workspaceData);

      expect(createdWorkspaceData.planType).toBe(UserPlan.FREE);
    });

    it("should set workspace planType correctly when specified", async () => {
      const userId = 1;
      const workspaceData = {
        name: "Agency Type Workspace",
        slug: "agency-type-workspace",
        planType: UserPlan.AGENCY,
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        plan: UserPlan.AGENCY,
      });

      mockPrisma.addOn.findMany.mockResolvedValue([]);
      mockPrisma.workspace.count.mockResolvedValue(0);
      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.workspace.findFirst.mockResolvedValue(null);
      mockPrisma.domain.findUnique.mockResolvedValue(null);

      let createdWorkspaceData: any = null;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const txMock = {
          workspace: {
            create: vi.fn().mockImplementation(({ data }: any) => {
              createdWorkspaceData = data;
              return Promise.resolve({
                id: 1,
                ...data,
              });
            }),
          },
          workspaceMember: {
            create: vi.fn().mockResolvedValue({}),
          },
          workspaceRolePermTemplate: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      await CreateWorkspaceService.create(userId, workspaceData);

      expect(createdWorkspaceData.planType).toBe(UserPlan.AGENCY);
    });
  });

  describe("User-friendly error messages", () => {
    it("should show friendly message when workspace limit reached", async () => {
      const userId = 1;
      const workspaceData = {
        name: "Too Many Workspaces",
        slug: "too-many-workspaces",
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        plan: UserPlan.FREE,
      });

      mockPrisma.addOn.findMany.mockResolvedValue([]);
      mockPrisma.workspace.count.mockResolvedValue(1);

      await expect(
        CreateWorkspaceService.create(userId, workspaceData)
      ).rejects.toThrow(
        "You've reached your workspace limit. Upgrade your plan to create more workspaces."
      );
    });

    it("should show friendly message for duplicate workspace name", async () => {
      const userId = 1;
      const workspaceData = {
        name: "My Workspace",
        slug: "my-workspace-2",
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        plan: UserPlan.BUSINESS,
      });

      mockPrisma.addOn.findMany.mockResolvedValue([]);
      mockPrisma.workspace.count.mockResolvedValue(0);
      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.workspace.findFirst.mockResolvedValue({
        id: 999,
        name: "My Workspace",
      });

      await expect(
        CreateWorkspaceService.create(userId, workspaceData)
      ).rejects.toThrow(
        "You already have a workspace with this name. Please choose a different name."
      );
    });

    it("should show friendly message for taken slug", async () => {
      const userId = 1;
      const workspaceData = {
        name: "New Workspace",
        slug: "existing-slug",
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        plan: UserPlan.BUSINESS,
      });

      mockPrisma.addOn.findMany.mockResolvedValue([]);
      mockPrisma.workspace.count.mockResolvedValue(0);
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 999,
        slug: "existing-slug",
      });

      await expect(
        CreateWorkspaceService.create(userId, workspaceData)
      ).rejects.toThrow(
        "This workspace name is already taken. Please choose another one."
      );
    });
  });

  describe("Workspace slug validation", () => {
    it("should reject reserved slugs", async () => {
      const userId = 1;
      const workspaceData = {
        name: "Admin Workspace",
        slug: "admin",
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        plan: UserPlan.BUSINESS,
      });

      mockPrisma.addOn.findMany.mockResolvedValue([]);
      mockPrisma.workspace.count.mockResolvedValue(0);

      await expect(
        CreateWorkspaceService.create(userId, workspaceData)
      ).rejects.toThrow(
        'The name "admin" is reserved and cannot be used. Please choose a different name.'
      );
    });
  });

  describe("Workspace Status - DRAFT vs ACTIVE", () => {
    it("should create workspace with DRAFT status for FREE plan users", async () => {
      const userId = 1;
      const workspaceData = {
        name: "Free Workspace",
        slug: "free-workspace",
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        plan: UserPlan.FREE,
      });

      mockPrisma.addOn.findMany.mockResolvedValue([]);
      mockPrisma.workspace.count.mockResolvedValue(0);
      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.workspace.findFirst.mockResolvedValue(null);
      mockPrisma.domain.findUnique.mockResolvedValue(null);

      let createdWorkspaceStatus: string | undefined;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const txMock = {
          workspace: {
            create: vi.fn().mockImplementation((data: any) => {
              createdWorkspaceStatus = data.data.status;
              return Promise.resolve({
                id: 1,
                name: workspaceData.name,
                slug: workspaceData.slug,
                ownerId: userId,
                planType: UserPlan.FREE,
                status: data.data.status,
              });
            }),
          },
          workspaceMember: {
            create: vi.fn().mockResolvedValue({}),
          },
          workspaceRolePermTemplate: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      await CreateWorkspaceService.create(userId, workspaceData);

      expect(createdWorkspaceStatus).toBe("DRAFT");
    });

    it("should create workspace with ACTIVE status for BUSINESS plan users", async () => {
      const userId = 1;
      const workspaceData = {
        name: "Business Workspace",
        slug: "business-workspace",
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        plan: UserPlan.BUSINESS,
      });

      mockPrisma.addOn.findMany.mockResolvedValue([]);
      mockPrisma.workspace.count.mockResolvedValue(0);
      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.workspace.findFirst.mockResolvedValue(null);
      mockPrisma.domain.findUnique.mockResolvedValue(null);

      let createdWorkspaceStatus: string | undefined;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const txMock = {
          workspace: {
            create: vi.fn().mockImplementation((data: any) => {
              createdWorkspaceStatus = data.data.status;
              return Promise.resolve({
                id: 1,
                name: workspaceData.name,
                slug: workspaceData.slug,
                ownerId: userId,
                planType: UserPlan.BUSINESS,
                status: data.data.status,
              });
            }),
          },
          workspaceMember: {
            create: vi.fn().mockResolvedValue({}),
          },
          workspaceRolePermTemplate: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      await CreateWorkspaceService.create(userId, workspaceData);

      expect(createdWorkspaceStatus).toBe("ACTIVE");
    });

    it("should create workspace with DRAFT status for AGENCY plan users", async () => {
      const userId = 1;
      const workspaceData = {
        name: "Agency Workspace",
        slug: "agency-workspace",
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        plan: UserPlan.AGENCY,
      });

      mockPrisma.addOn.findMany.mockResolvedValue([]);
      mockPrisma.workspace.count.mockResolvedValue(0);
      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.workspace.findFirst.mockResolvedValue(null);
      mockPrisma.domain.findUnique.mockResolvedValue(null);

      let createdWorkspaceStatus: string | undefined;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const txMock = {
          workspace: {
            create: vi.fn().mockImplementation((data: any) => {
              createdWorkspaceStatus = data.data.status;
              return Promise.resolve({
                id: 1,
                name: workspaceData.name,
                slug: workspaceData.slug,
                ownerId: userId,
                planType: UserPlan.AGENCY,
                status: data.data.status,
              });
            }),
          },
          workspaceMember: {
            create: vi.fn().mockResolvedValue({}),
          },
          workspaceRolePermTemplate: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      await CreateWorkspaceService.create(userId, workspaceData);

      expect(createdWorkspaceStatus).toBe("DRAFT");
    });
  });
});
