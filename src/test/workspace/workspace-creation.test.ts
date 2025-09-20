import { describe, it, expect, beforeEach, vi } from "vitest";
import { CreateWorkspaceService } from "../../services/workspace/create";
import { getPrisma } from "../../lib/prisma";
import { BadRequestError, InternalServerError } from "../../errors/http-errors";
import { UserPlan } from "../../generated/prisma-client";

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
    process.env.WORKSPACE_ZONE_ID = 'test-zone-id';
    process.env.WORKSPACE_DOMAIN = 'digitalsite.com';
    process.env.WORKSPACE_IP = '20.56.136.29';

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
      $transaction: vi.fn(),
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
  });

  describe("Plan-based workspace limits", () => {
    it("should allow FREE plan users to create only 1 workspace", async () => {
      const userId = 1;
      const workspaceData = {
        name: "My Workspace",
        slug: "my-workspace",
        description: "Test workspace",
      };

      // Mock user with FREE plan and no existing workspaces
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        plan: UserPlan.FREE,
        maximumWorkspaces: 1,
      });

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
            }),
          },
          workspaceMember: {
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

      // Mock user with FREE plan who already has 1 workspace
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        plan: UserPlan.FREE,
        maximumWorkspaces: 1,
      });

      mockPrisma.workspace.count.mockResolvedValue(1);

      await expect(
        CreateWorkspaceService.create(userId, workspaceData)
      ).rejects.toThrow(
        "You have reached your workspace limit of 1 workspace. Please upgrade your plan to create more workspaces."
      );
    });

    it("should allow BUSINESS plan users to create up to 3 workspaces", async () => {
      const userId = 2;
      const workspaceData = {
        name: "Business Workspace",
        slug: "business-workspace",
      };

      // Mock user with BUSINESS plan who has 2 workspaces
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        plan: UserPlan.BUSINESS,
        maximumWorkspaces: 3,
      });

      mockPrisma.workspace.count.mockResolvedValue(2);
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
            }),
          },
          workspaceMember: {
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

    it("should allow AGENCY plan users to create up to 10 workspaces", async () => {
      const userId = 3;
      const workspaceData = {
        name: "Agency Workspace",
        slug: "agency-workspace",
      };

      // Mock user with AGENCY plan who has 9 workspaces
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        plan: UserPlan.AGENCY,
        maximumWorkspaces: 10,
      });

      mockPrisma.workspace.count.mockResolvedValue(9);
      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.workspace.findFirst.mockResolvedValue(null);
      mockPrisma.domain.findUnique.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const txMock = {
          workspace: {
            create: vi.fn().mockResolvedValue({
              id: 10,
              name: workspaceData.name,
              slug: workspaceData.slug,
              ownerId: userId,
            }),
          },
          workspaceMember: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      const result = await CreateWorkspaceService.create(userId, workspaceData);

      expect(result.message).toBe("Workspace created successfully");
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
        maximumWorkspaces: 3,
      });

      mockPrisma.workspace.count.mockResolvedValue(0);

      await expect(
        CreateWorkspaceService.create(userId, workspaceData)
      ).rejects.toThrow(
        'The slug "admin" is reserved and cannot be used. Please choose a different slug.'
      );
    });

    it("should reject slugs that are already taken", async () => {
      const userId = 1;
      const workspaceData = {
        name: "My Workspace",
        slug: "existing-slug",
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        plan: UserPlan.BUSINESS,
        maximumWorkspaces: 3,
      });

      mockPrisma.workspace.count.mockResolvedValue(0);
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 999,
        slug: "existing-slug",
      });

      await expect(
        CreateWorkspaceService.create(userId, workspaceData)
      ).rejects.toThrow(
        "This workspace slug is already taken. Please choose another one."
      );
    });

    it("should reject workspace names that user already has", async () => {
      const userId = 1;
      const workspaceData = {
        name: "Duplicate Name",
        slug: "unique-slug",
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        plan: UserPlan.BUSINESS,
        maximumWorkspaces: 3,
      });

      mockPrisma.workspace.count.mockResolvedValue(0);
      mockPrisma.workspace.findUnique.mockResolvedValueOnce(null);
      mockPrisma.domain.findUnique.mockResolvedValue(null);
      mockPrisma.workspace.findFirst.mockResolvedValue({
        id: 999,
        name: "Duplicate Name",
      });

      await expect(
        CreateWorkspaceService.create(userId, workspaceData)
      ).rejects.toThrow(
        "You already have a workspace with this name. Please choose a different name."
      );
    });
  });

  describe("Workspace creation without allocations", () => {
    it("should create workspace without any allocation fields", async () => {
      const userId = 1;
      const workspaceData = {
        name: "Test Workspace",
        slug: "test-workspace",
        description: "A test workspace",
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        plan: UserPlan.BUSINESS,
        maximumWorkspaces: 3,
      });

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
        };
        return callback(txMock);
      });

      await CreateWorkspaceService.create(userId, workspaceData);

      // Verify that no allocation fields are present
      expect(createdWorkspaceData).not.toHaveProperty("allocatedFunnels");
      expect(createdWorkspaceData).not.toHaveProperty("allocatedCustomDomains");
      expect(createdWorkspaceData).not.toHaveProperty("allocatedSubdomains");

      // Verify correct fields are present
      expect(createdWorkspaceData).toMatchObject({
        name: workspaceData.name,
        slug: workspaceData.slug,
        description: workspaceData.description,
        ownerId: userId,
      });
    });
  });
});