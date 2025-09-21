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

  describe("Multiple workspace creation", () => {
    it("should allow users to create multiple workspaces within their plan limits", async () => {
      const userId = 1;

      // Mock user with BUSINESS plan (3 workspace limit)
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        plan: UserPlan.BUSINESS,
        maximumWorkspaces: 3,
      });

      // First workspace
      const firstWorkspace = {
        name: "First Workspace",
        slug: "first-workspace",
      };

      mockPrisma.workspace.count.mockResolvedValueOnce(0);
      mockPrisma.workspace.findUnique.mockResolvedValueOnce(null);
      mockPrisma.workspace.findFirst.mockResolvedValueOnce(null);
      mockPrisma.domain.findUnique.mockResolvedValueOnce(null);

      mockPrisma.$transaction.mockImplementationOnce(async (callback: any) => {
        const txMock = {
          workspace: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: firstWorkspace.name,
              slug: firstWorkspace.slug,
              ownerId: userId,
            }),
          },
          workspaceMember: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      const result1 = await CreateWorkspaceService.create(userId, firstWorkspace);
      expect(result1.message).toBe("Workspace created successfully");

      // Second workspace
      const secondWorkspace = {
        name: "Second Workspace",
        slug: "second-workspace",
      };

      mockPrisma.workspace.count.mockResolvedValueOnce(1);
      mockPrisma.workspace.findUnique.mockResolvedValueOnce(null);
      mockPrisma.workspace.findFirst.mockResolvedValueOnce(null);
      mockPrisma.domain.findUnique.mockResolvedValueOnce(null);

      mockPrisma.$transaction.mockImplementationOnce(async (callback: any) => {
        const txMock = {
          workspace: {
            create: vi.fn().mockResolvedValue({
              id: 2,
              name: secondWorkspace.name,
              slug: secondWorkspace.slug,
              ownerId: userId,
            }),
          },
          workspaceMember: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      const result2 = await CreateWorkspaceService.create(userId, secondWorkspace);
      expect(result2.message).toBe("Workspace created successfully");

      // Third workspace (still within limit)
      const thirdWorkspace = {
        name: "Third Workspace",
        slug: "third-workspace",
      };

      mockPrisma.workspace.count.mockResolvedValueOnce(2);
      mockPrisma.workspace.findUnique.mockResolvedValueOnce(null);
      mockPrisma.workspace.findFirst.mockResolvedValueOnce(null);
      mockPrisma.domain.findUnique.mockResolvedValueOnce(null);

      mockPrisma.$transaction.mockImplementationOnce(async (callback: any) => {
        const txMock = {
          workspace: {
            create: vi.fn().mockResolvedValue({
              id: 3,
              name: thirdWorkspace.name,
              slug: thirdWorkspace.slug,
              ownerId: userId,
            }),
          },
          workspaceMember: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      const result3 = await CreateWorkspaceService.create(userId, thirdWorkspace);
      expect(result3.message).toBe("Workspace created successfully");

      // Fourth workspace (should fail - exceeds limit)
      const fourthWorkspace = {
        name: "Fourth Workspace",
        slug: "fourth-workspace",
      };

      mockPrisma.workspace.count.mockResolvedValueOnce(3);

      await expect(
        CreateWorkspaceService.create(userId, fourthWorkspace)
      ).rejects.toThrow(
        "You have reached your workspace limit of 3 workspaces. Please upgrade your plan to create more workspaces."
      );
    });

    it("should only count workspaces owned by the user, not member workspaces", async () => {
      const userId = 1;

      // Mock user with FREE plan (1 workspace limit)
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        plan: UserPlan.FREE,
        maximumWorkspaces: 1,
      });

      // User owns 0 workspaces (but is a member of others)
      mockPrisma.workspace.count.mockResolvedValue(0);

      const workspaceData = {
        name: "My Own Workspace",
        slug: "my-own-workspace",
      };

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

    it("should handle workspace creation after deletion", async () => {
      const userId = 1;

      // Mock user with FREE plan
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        plan: UserPlan.FREE,
        maximumWorkspaces: 1,
      });

      // Scenario: User had 1 workspace, deleted it, now creating a new one
      mockPrisma.workspace.count.mockResolvedValue(0); // No workspaces after deletion

      const workspaceData = {
        name: "New After Deletion",
        slug: "new-after-deletion",
      };

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
      expect(result.workspaceId).toBe(5);
    });

    it("should correctly create owner as workspace member with all permissions", async () => {
      const userId = 1;
      const workspaceData = {
        name: "Test Permissions",
        slug: "test-permissions",
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

      let memberCreateData: any = null;

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
            create: vi.fn().mockImplementation(({ data }: any) => {
              memberCreateData = data;
              return Promise.resolve({});
            }),
          },
        };
        return callback(txMock);
      });

      await CreateWorkspaceService.create(userId, workspaceData);

      // Verify member was created with correct role and permissions
      expect(memberCreateData).toMatchObject({
        userId: userId,
        workspaceId: 1,
        role: "OWNER",
        permissions: expect.arrayContaining([
          "MANAGE_WORKSPACE",
          "MANAGE_MEMBERS",
          "CREATE_FUNNELS",
          "EDIT_FUNNELS",
          "EDIT_PAGES",
          "DELETE_FUNNELS",
          "VIEW_ANALYTICS",
          "MANAGE_DOMAINS",
          "CREATE_DOMAINS",
          "DELETE_DOMAINS",
          "CONNECT_DOMAINS",
        ]),
      });
    });

    it("should handle consecutive workspace creation by same user", async () => {
      const userId = 1;

      // Mock user with BUSINESS plan
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        plan: UserPlan.BUSINESS,
        maximumWorkspaces: 3,
      });

      // Create first workspace
      mockPrisma.workspace.count.mockResolvedValueOnce(0);
      mockPrisma.workspace.findUnique.mockResolvedValueOnce(null);
      mockPrisma.workspace.findFirst.mockResolvedValueOnce(null);
      mockPrisma.domain.findUnique.mockResolvedValueOnce(null);

      mockPrisma.$transaction.mockImplementationOnce(async (callback: any) => {
        const txMock = {
          workspace: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "First WS",
              slug: "first-ws",
              ownerId: userId,
            }),
          },
          workspaceMember: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
        };
        return callback(txMock);
      });

      const result1 = await CreateWorkspaceService.create(userId, {
        name: "First WS",
        slug: "first-ws",
      });
      expect(result1.message).toBe("Workspace created successfully");

      // Immediately create second workspace
      mockPrisma.workspace.count.mockResolvedValueOnce(1);
      mockPrisma.workspace.findUnique.mockResolvedValueOnce(null);
      mockPrisma.workspace.findFirst.mockResolvedValueOnce(null);
      mockPrisma.domain.findUnique.mockResolvedValueOnce(null);

      mockPrisma.$transaction.mockImplementationOnce(async (callback: any) => {
        const txMock = {
          workspace: {
            create: vi.fn().mockResolvedValue({
              id: 2,
              name: "Second WS",
              slug: "second-ws",
              ownerId: userId,
            }),
          },
          workspaceMember: {
            create: vi.fn().mockResolvedValue({ id: 2 }),
          },
        };
        return callback(txMock);
      });

      const result2 = await CreateWorkspaceService.create(userId, {
        name: "Second WS",
        slug: "second-ws",
      });
      expect(result2.message).toBe("Workspace created successfully");
      expect(result2.workspaceId).toBe(2);
    });
  });
});