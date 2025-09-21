import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { duplicateFunnel } from "../../services/funnel/duplicate";
import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import { $Enums } from "../../generated/prisma-client";

vi.mock("../../lib/prisma");
vi.mock("../../services/cache/cache.service");

describe.skip("Funnel Duplicate Tests", () => {
  let mockPrisma: any;
  const userId = 1;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      funnel: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        count: vi.fn(),
      },
      workspace: {
        findUnique: vi.fn(),
      },
      workspaceMember: {
        findUnique: vi.fn(),
      },
      page: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      theme: {
        create: vi.fn(),
      },
      funnelSettings: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
    (cacheService.set as any).mockResolvedValue(undefined);
    (cacheService.get as any).mockResolvedValue(null);
    (cacheService.del as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Basic Duplication", () => {
    it("should duplicate a funnel within the same workspace", async () => {
      const originalFunnelId = 1;
      const workspaceId = 1;

      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        slug: "original-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        createdBy: userId,
        themeId: 1,
        theme: {
          id: 1,
          primaryColor: "#000000",
          secondaryColor: "#ffffff",
        },
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
        settings: {
          id: 1,
          defaultSeoTitle: "Original SEO Title",
          defaultSeoDescription: "Original SEO Description",
        },
      };

      const originalPages = [
        {
          id: 1,
          name: "Home",
          content: "<h1>Home Page</h1>",
          order: 1,
          linkingId: "home",
          type: $Enums.PageType.PAGE,
        },
        {
          id: 2,
          name: "About",
          content: "<h1>About Page</h1>",
          order: 2,
          linkingId: "about",
          type: $Enums.PageType.PAGE,
        },
      ];

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.funnel.count.mockResolvedValue(1); // Current count
      mockPrisma.funnel.findMany.mockResolvedValue([]); // No duplicate names
      mockPrisma.page.findMany.mockResolvedValue(originalPages);
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(originalFunnel.settings);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          theme: {
            create: vi.fn().mockResolvedValue({ id: 2 }),
          },
          funnel: {
            create: vi.fn().mockResolvedValue({
              id: 2,
              name: "Copy of Original Funnel",
              slug: "copy-of-original-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
              themeId: 2,
            }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({
              id: 2,
              funnelId: 2,
            }),
          },
          page: {
            create: vi.fn().mockResolvedValue({}),
          },
        };

        const result = await callback(tx);

        // Simulate the transaction result
        return {
          funnel: {
            id: 2,
            name: "Copy of Original Funnel",
            slug: "copy-of-original-funnel",
            status: $Enums.FunnelStatus.DRAFT,
            workspaceId,
            createdBy: userId,
            themeId: 2,
            theme: { id: 2 },
            pages: [
              { ...originalPages[0], id: 3, funnelId: 2 },
              { ...originalPages[1], id: 4, funnelId: 2 },
            ],
          },
        };
      });

      const result = await duplicateFunnel(originalFunnelId, userId, {});

      expect(result.message).toBe("Funnel duplicated successfully");
      expect(result.funnelId).toBe(2);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should generate unique name when duplicating with default name", async () => {
      const originalFunnelId = 1;
      const workspaceId = 1;

      const originalFunnel = {
        id: originalFunnelId,
        name: "Test Funnel",
        slug: "test-funnel",
        status: $Enums.FunnelStatus.LIVE,
        workspaceId,
        createdBy: userId,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.funnel.findMany.mockResolvedValue([]);
      mockPrisma.page.findMany.mockResolvedValue([]);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          theme: {
            create: vi.fn().mockResolvedValue({ id: 2 }),
          },
          funnel: {
            create: vi.fn().mockResolvedValue({
              id: 2,
              name: "Copy of Test Funnel",
              slug: "copy-of-test-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
              themeId: 2,
            }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({
              id: 2,
              funnelId: 2,
            }),
          },
        };

        return {
          funnel: {
            id: 2,
            name: "Copy of Test Funnel",
            slug: "copy-of-test-funnel",
            status: $Enums.FunnelStatus.DRAFT,
            workspaceId,
            createdBy: userId,
            themeId: 2,
            theme: { id: 2 },
            pages: [],
          },
        };
      });

      const result = await duplicateFunnel(originalFunnelId, userId, {});

      expect(result.funnelId).toBe(2);
    });

    it("should use custom name when provided", async () => {
      const originalFunnelId = 1;
      const workspaceId = 1;
      const customName = "My Custom Duplicate";

      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        slug: "original-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        createdBy: userId,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.funnel.findMany.mockResolvedValue([]);
      mockPrisma.page.findMany.mockResolvedValue([]);

      let createdFunnelName: string | null = null;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          theme: {
            create: vi.fn().mockResolvedValue({ id: 2 }),
          },
          funnel: {
            create: vi.fn().mockImplementation((data: any) => {
              createdFunnelName = data.data.name;
              return Promise.resolve({
                id: 2,
                name: data.data.name,
                slug: "my-custom-duplicate",
                status: $Enums.FunnelStatus.DRAFT,
                workspaceId,
                createdBy: userId,
                themeId: 2,
              });
            }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({
              id: 2,
              funnelId: 2,
            }),
          },
        };

        await callback(tx);

        return {
          funnel: {
            id: 2,
            name: customName,
            slug: "my-custom-duplicate",
            status: $Enums.FunnelStatus.DRAFT,
            workspaceId,
            createdBy: userId,
            themeId: 2,
            theme: { id: 2 },
            pages: [],
          },
        };
      });

      const result = await duplicateFunnel(originalFunnelId, userId, {
        name: customName
      });

      expect(createdFunnelName).toBe(customName);
      expect(result.funnelId).toBe(2);
    });
  });

  describe("Cross-Workspace Duplication", () => {
    it("should duplicate funnel to different workspace when user has permission", async () => {
      const originalFunnelId = 1;
      const sourceWorkspaceId = 1;
      const targetWorkspaceId = 2;
      const targetWorkspaceSlug = "target-workspace";

      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        slug: "original-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId: sourceWorkspaceId,
        createdBy: 999, // Different creator
        workspace: {
          id: sourceWorkspaceId,
          name: "Source Workspace",
          ownerId: 999,
        },
      };

      const targetWorkspace = {
        id: targetWorkspaceId,
        name: "Target Workspace",
        slug: targetWorkspaceSlug,
        ownerId: userId, // User owns target workspace
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.workspace.findUnique.mockResolvedValue(targetWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        role: $Enums.WorkspaceRole.VIEWER,
        permissions: [$Enums.WorkspacePermission.VIEW_FUNNEL],
      });
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.funnel.findMany.mockResolvedValue([]);
      mockPrisma.page.findMany.mockResolvedValue([]);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          theme: {
            create: vi.fn().mockResolvedValue({ id: 2 }),
          },
          funnel: {
            create: vi.fn().mockResolvedValue({
              id: 2,
              name: "Copy of Original Funnel",
              slug: "copy-of-original-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId: targetWorkspaceId,
              createdBy: userId,
              themeId: 2,
            }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({
              id: 2,
              funnelId: 2,
            }),
          },
        };

        return {
          funnel: {
            id: 2,
            name: "Copy of Original Funnel",
            slug: "copy-of-original-funnel",
            status: $Enums.FunnelStatus.DRAFT,
            workspaceId: targetWorkspaceId,
            createdBy: userId,
            themeId: 2,
            theme: { id: 2 },
            pages: [],
          },
        };
      });

      const result = await duplicateFunnel(originalFunnelId, userId, {
        targetWorkspaceSlug
      });

      expect(result.funnelId).toBe(2);
    });

    it("should throw error when duplicating to workspace without permission", async () => {
      const originalFunnelId = 1;
      const sourceWorkspaceId = 1;
      const targetWorkspaceId = 2;
      const targetWorkspaceSlug = "target-workspace";

      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        slug: "original-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId: sourceWorkspaceId,
        createdBy: userId,
        workspace: {
          id: sourceWorkspaceId,
          name: "Source Workspace",
          ownerId: userId,
        },
      };

      const targetWorkspace = {
        id: targetWorkspaceId,
        name: "Target Workspace",
        slug: targetWorkspaceSlug,
        ownerId: 999, // Different owner
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.workspace.findUnique.mockResolvedValue(targetWorkspace);
      mockPrisma.workspaceMember.findUnique
        .mockResolvedValueOnce(null) // Not a member of target workspace
        .mockResolvedValueOnce({
          role: $Enums.WorkspaceRole.VIEWER,
          permissions: [],
        });

      await expect(
        duplicateFunnel(originalFunnelId, userId, { targetWorkspaceSlug })
      ).rejects.toThrow("You don't have permission to create funnels in the target workspace");
    });
  });

  describe("Workspace Limits", () => {
    it("should throw error when workspace funnel limit is reached", async () => {
      const originalFunnelId = 1;
      const workspaceId = 1;

      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        slug: "original-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        createdBy: userId,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.funnel.count.mockResolvedValue(3); // Already at limit

      await expect(
        duplicateFunnel(originalFunnelId, userId, {})
      ).rejects.toThrow("Target workspace has reached its maximum limit of 3 funnels");
    });

    it("should allow duplication when under workspace limit", async () => {
      const originalFunnelId = 1;
      const workspaceId = 1;

      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        slug: "original-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        createdBy: userId,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.funnel.count.mockResolvedValue(2); // Under limit
      mockPrisma.funnel.findMany.mockResolvedValue([]);
      mockPrisma.page.findMany.mockResolvedValue([]);

      mockPrisma.$transaction.mockImplementation(async () => {
        return {
          funnel: {
            id: 2,
            name: "Copy of Original Funnel",
            slug: "copy-of-original-funnel",
            status: $Enums.FunnelStatus.DRAFT,
            workspaceId,
            createdBy: userId,
            themeId: 2,
            theme: { id: 2 },
            pages: [],
          },
        };
      });

      const result = await duplicateFunnel(originalFunnelId, userId, {});

      expect(result.funnelId).toBe(2);
    });
  });

  describe("Permissions", () => {
    it("should allow owner to duplicate any funnel in workspace", async () => {
      const originalFunnelId = 1;
      const workspaceId = 1;

      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        slug: "original-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        createdBy: 999, // Different creator
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId, // User is owner
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.funnel.findMany.mockResolvedValue([]);
      mockPrisma.page.findMany.mockResolvedValue([]);

      mockPrisma.$transaction.mockImplementation(async () => {
        return {
          funnel: {
            id: 2,
            name: "Copy of Original Funnel",
            slug: "copy-of-original-funnel",
            status: $Enums.FunnelStatus.DRAFT,
            workspaceId,
            createdBy: userId,
            themeId: 2,
            theme: { id: 2 },
            pages: [],
          },
        };
      });

      const result = await duplicateFunnel(originalFunnelId, userId, {});

      expect(result.funnelId).toBe(2);
    });

    it("should throw error when user lacks permission to view original funnel", async () => {
      const originalFunnelId = 1;
      const workspaceId = 1;

      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        slug: "original-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        createdBy: 999,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: 999,
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        duplicateFunnel(originalFunnelId, userId, {})
      ).rejects.toThrow("You don't have access to this funnel");
    });

    it("should allow member with VIEW_FUNNEL permission to duplicate own funnels", async () => {
      const originalFunnelId = 1;
      const workspaceId = 1;

      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        slug: "original-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        createdBy: userId, // User created this funnel
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: 999,
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        role: $Enums.WorkspaceRole.MEMBER,
        permissions: [$Enums.WorkspacePermission.VIEW_FUNNEL, $Enums.WorkspacePermission.CREATE_FUNNEL],
      });
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.funnel.findMany.mockResolvedValue([]);
      mockPrisma.page.findMany.mockResolvedValue([]);

      mockPrisma.$transaction.mockImplementation(async () => {
        return {
          funnel: {
            id: 2,
            name: "Copy of Original Funnel",
            slug: "copy-of-original-funnel",
            status: $Enums.FunnelStatus.DRAFT,
            workspaceId,
            createdBy: userId,
            themeId: 2,
            theme: { id: 2 },
            pages: [],
          },
        };
      });

      const result = await duplicateFunnel(originalFunnelId, userId, {});

      expect(result.funnelId).toBe(2);
    });
  });

  describe("Cache Management", () => {
    it("should update cache after successful duplication", async () => {
      const originalFunnelId = 1;
      const workspaceId = 1;

      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        slug: "original-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        createdBy: userId,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.funnel.findMany.mockResolvedValue([]);
      mockPrisma.page.findMany.mockResolvedValue([]);

      const newFunnel = {
        id: 2,
        name: "Copy of Original Funnel",
        slug: "copy-of-original-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        createdBy: userId,
        themeId: 2,
        theme: { id: 2 },
        pages: [],
      };

      mockPrisma.$transaction.mockImplementation(async () => {
        return { funnel: newFunnel };
      });

      await duplicateFunnel(originalFunnelId, userId, {});

      // Verify cache operations
      expect(cacheService.set).toHaveBeenCalledWith(
        `workspace:${workspaceId}:funnel:${newFunnel.id}:full`,
        expect.objectContaining({
          id: newFunnel.id,
          name: newFunnel.name,
        }),
        { ttl: 0 }
      );

      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${workspaceId}:funnels:list`
      );
    });
  });
});