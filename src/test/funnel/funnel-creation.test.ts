import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { createFunnel } from "../../services/funnel/create";
import { createFunnelController } from "../../controllers/funnel/create";
import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import { $Enums } from "../../generated/prisma-client";
import { NextFunction } from "express";

vi.mock("../../lib/prisma");
vi.mock("../../services/cache/cache.service");

describe("Funnel Creation Tests", () => {
  let mockPrisma: any;
  let mockReq: any;
  let mockRes: any;
  let mockNext: NextFunction;
  const userId = 1;
  const workspaceId = 1;
  const workspaceSlug = "test-workspace";

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Prisma client
    mockPrisma = {
      workspace: {
        findUnique: vi.fn(),
      },
      workspaceMember: {
        findUnique: vi.fn(),
      },
      funnel: {
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findFirst: vi.fn().mockResolvedValue(null),
      },
      theme: {
        create: vi.fn(),
      },
      funnelSettings: {
        create: vi.fn(),
      },
      page: {
        create: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    (getPrisma as any).mockReturnValue(mockPrisma);

    // Mock cache service
    (cacheService.del as any).mockResolvedValue(undefined);
    (cacheService.set as any).mockResolvedValue(undefined);
    (cacheService.get as any).mockResolvedValue(null);

    // Mock Express request and response
    mockReq = {
      userId,
      body: {},
      params: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Authentication & Authorization", () => {
    it("should require user to be logged in", async () => {
      await expect(
        createFunnel(null as any, {
          name: "Test Funnel",
          workspaceSlug,
          status: $Enums.FunnelStatus.DRAFT,
        })
      ).rejects.toThrow("Please log in to continue");
    });

    it("should verify workspace exists", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await expect(
        createFunnel(userId, {
          name: "Test Funnel",
          workspaceSlug: "non-existent-workspace",
          status: $Enums.FunnelStatus.DRAFT,
        })
      ).rejects.toThrow("We couldn't find that workspace");
    });

    it("should allow workspace owner to create funnel", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        slug: workspaceSlug,
        ownerId: userId, // User is owner
        owner: {
          plan: $Enums.UserPlan.BUSINESS,
          addOns: [],
        },
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(0);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Funnel",
              slug: "test-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
            }),
            update: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Funnel",
              slug: "test-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
              themeId: 1,
              theme: { id: 1, type: $Enums.ThemeType.CUSTOM },
              pages: [],
            }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1, type: $Enums.ThemeType.CUSTOM }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 1, funnelId: 1 }),
          },
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Home",
              order: 1,
              linkingId: "home",
              type: $Enums.PageType.PAGE,
            }),
          },
        };

        return await callback(tx);
      });

      const result = await createFunnel(userId, {
        name: "Test Funnel",
        workspaceSlug,
        status: $Enums.FunnelStatus.DRAFT,
      });

      expect(result.response.message).toBe("Funnel created successfully!");
      expect(result.workspaceId).toBe(workspaceId);
    });

    it("should allow member with CREATE_FUNNELS permission to create funnel", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        slug: workspaceSlug,
        ownerId: 999, // Different owner
        owner: {
          plan: $Enums.UserPlan.BUSINESS,
          addOns: [],
        },
      };

      const member = {
        role: $Enums.WorkspaceRole.EDITOR,
        permissions: [$Enums.WorkspacePermission.CREATE_FUNNELS],
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.funnel.count.mockResolvedValue(0);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Funnel",
              slug: "test-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
            }),
            update: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Funnel",
              slug: "test-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
              themeId: 1,
              theme: { id: 1, type: $Enums.ThemeType.CUSTOM },
              pages: [],
            }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1, type: $Enums.ThemeType.CUSTOM }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 1, funnelId: 1 }),
          },
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Home",
              order: 1,
              linkingId: "home",
              type: $Enums.PageType.PAGE,
            }),
          },
        };

        return await callback(tx);
      });

      const result = await createFunnel(userId, {
        name: "Test Funnel",
        workspaceSlug,
        status: $Enums.FunnelStatus.DRAFT,
      });

      expect(result.response.message).toBe("Funnel created successfully!");
      expect(mockPrisma.workspaceMember.findUnique).toHaveBeenCalledWith({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId,
          },
        },
        select: {
          role: true,
          permissions: true,
        },
      });
    });

    it("should reject user without permission to create funnel", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        slug: workspaceSlug,
        ownerId: 999, // Different owner
        owner: {
          plan: $Enums.UserPlan.BUSINESS,
          addOns: [],
        },
      };

      const member = {
        role: $Enums.WorkspaceRole.VIEWER,
        permissions: [], // No CREATE_FUNNELS permission
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);

      await expect(
        createFunnel(userId, {
          name: "Test Funnel",
          workspaceSlug,
          status: $Enums.FunnelStatus.DRAFT,
        })
      ).rejects.toThrow(
        "You don't have permission to create funnel"
      );
    });

    it("should reject user who is not a workspace member", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        slug: workspaceSlug,
        ownerId: 999, // Different owner
        owner: {
          plan: $Enums.UserPlan.BUSINESS,
          addOns: [],
        },
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        createFunnel(userId, {
          name: "Test Funnel",
          workspaceSlug,
          status: $Enums.FunnelStatus.DRAFT,
        })
      ).rejects.toThrow("You don't have access to this workspace");
    });
  });

  describe("Workspace Limits", () => {
    it("should check workspace has free space for new funnel", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        slug: workspaceSlug,
        ownerId: userId,
        owner: {
          plan: $Enums.UserPlan.BUSINESS,
          addOns: [],
        },
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(0); // 0 out of 1 funnel (BUSINESS plan)

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Funnel",
              slug: "test-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
            }),
            update: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Funnel",
              slug: "test-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
              themeId: 1,
              theme: { id: 1, type: $Enums.ThemeType.CUSTOM },
              pages: [],
            }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1, type: $Enums.ThemeType.CUSTOM }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 1, funnelId: 1 }),
          },
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Home",
              order: 1,
              linkingId: "home",
              type: $Enums.PageType.PAGE,
            }),
          },
        };

        return await callback(tx);
      });

      const result = await createFunnel(userId, {
        name: "Test Funnel",
        workspaceSlug,
        status: $Enums.FunnelStatus.DRAFT,
      });

      expect(result.response.message).toBe("Funnel created successfully!");
      expect(mockPrisma.funnel.count).toHaveBeenCalledWith({
        where: { workspaceId },
      });
    });

    it("should reject when workspace limit reached (BUSINESS plan: 2 funnels)", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        slug: workspaceSlug,
        ownerId: userId,
        owner: {
          plan: $Enums.UserPlan.BUSINESS,
          addOns: [],
        },
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(2); // At limit (BUSINESS = 2 funnels)

      await expect(
        createFunnel(userId, {
          name: "Test Funnel",
          workspaceSlug,
          status: $Enums.FunnelStatus.DRAFT,
        })
      ).rejects.toThrow("You've reached the maximum of 2 funnels for this workspace");
    });
  });

  describe("Funnel Status", () => {
    it("should create funnel as DRAFT status by default", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        slug: workspaceSlug,
        ownerId: userId,
        owner: {
          plan: $Enums.UserPlan.BUSINESS,
          addOns: [],
        },
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(0);

      let createdFunnelStatus: any = null;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockImplementation((data: any) => {
              createdFunnelStatus = data.data.status;
              return Promise.resolve({
                id: 1,
                name: "Test Funnel",
                slug: "test-funnel",
                status: data.data.status || $Enums.FunnelStatus.DRAFT,
                workspaceId,
                createdBy: userId,
              });
            }),
            update: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Funnel",
              slug: "test-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
              themeId: 1,
              theme: { id: 1, type: $Enums.ThemeType.CUSTOM },
              pages: [],
            }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1, type: $Enums.ThemeType.CUSTOM }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 1, funnelId: 1 }),
          },
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Home",
              order: 1,
              linkingId: "home",
              type: $Enums.PageType.PAGE,
            }),
          },
        };

        return await callback(tx);
      });

      await createFunnel(userId, {
        name: "Test Funnel",
        workspaceSlug,
        status: $Enums.FunnelStatus.DRAFT,
      });

      expect(createdFunnelStatus).toBe($Enums.FunnelStatus.DRAFT);
    });

    it("should create funnel with custom status if provided", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        slug: workspaceSlug,
        ownerId: userId,
        owner: {
          plan: $Enums.UserPlan.BUSINESS,
          addOns: [],
        },
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(0);

      let createdFunnelStatus: any = null;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockImplementation((data: any) => {
              createdFunnelStatus = data.data.status;
              return Promise.resolve({
                id: 1,
                name: "Test Funnel",
                slug: "test-funnel",
                status: data.data.status,
                workspaceId,
                createdBy: userId,
              });
            }),
            update: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Funnel",
              slug: "test-funnel",
              status: $Enums.FunnelStatus.LIVE,
              workspaceId,
              createdBy: userId,
              themeId: 1,
              theme: { id: 1, type: $Enums.ThemeType.CUSTOM },
              pages: [],
            }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1, type: $Enums.ThemeType.CUSTOM }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 1, funnelId: 1 }),
          },
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Home",
              order: 1,
              linkingId: "home",
              type: $Enums.PageType.PAGE,
            }),
          },
        };

        return await callback(tx);
      });

      await createFunnel(userId, {
        name: "Test Funnel",
        workspaceSlug,
        status: $Enums.FunnelStatus.LIVE,
      });

      expect(createdFunnelStatus).toBe($Enums.FunnelStatus.LIVE);
    });
  });

  describe("Transaction Tests - Create Related Data", () => {
    it("should create default theme with funnelId and type: CUSTOM in transaction", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        slug: workspaceSlug,
        ownerId: userId,
        owner: {
          plan: $Enums.UserPlan.BUSINESS,
          addOns: [],
        },
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(0);

      let themeCreateCalled = false;
      let themeData: any = null;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Funnel",
              slug: "test-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
            }),
            update: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Funnel",
              slug: "test-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
              themeId: 1,
              theme: { id: 1, type: $Enums.ThemeType.CUSTOM },
              pages: [],
            }),
          },
          theme: {
            create: vi.fn().mockImplementation((data: any) => {
              themeCreateCalled = true;
              themeData = data.data;
              return Promise.resolve({ id: 1, ...data.data });
            }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 1, funnelId: 1 }),
          },
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Home",
              order: 1,
              linkingId: "home",
              type: $Enums.PageType.PAGE,
            }),
          },
        };

        return await callback(tx);
      });

      await createFunnel(userId, {
        name: "Test Funnel",
        workspaceSlug,
        status: $Enums.FunnelStatus.DRAFT,
      });

      expect(themeCreateCalled).toBe(true);
      // Verify theme is created with correct funnelId and type: CUSTOM
      expect(themeData).toBeDefined();
    });

    it("should create default home page of type PAGE in transaction", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        slug: workspaceSlug,
        ownerId: userId,
        owner: {
          plan: $Enums.UserPlan.BUSINESS,
          addOns: [],
        },
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(0);

      let pageData: any = null;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Funnel",
              slug: "test-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
            }),
            update: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Funnel",
              slug: "test-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
              themeId: 1,
              theme: { id: 1, type: $Enums.ThemeType.CUSTOM },
              pages: [],
            }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1, type: $Enums.ThemeType.CUSTOM }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 1, funnelId: 1 }),
          },
          page: {
            create: vi.fn().mockImplementation((data: any) => {
              pageData = data.data;
              return Promise.resolve({
                id: 1,
                ...data.data,
              });
            }),
          },
        };

        return await callback(tx);
      });

      await createFunnel(userId, {
        name: "Test Funnel",
        workspaceSlug,
        status: $Enums.FunnelStatus.DRAFT,
      });

      expect(pageData).toBeDefined();
      expect(pageData.name).toBe("Home");
      expect(pageData.type).toBe($Enums.PageType.PAGE);
      expect(pageData.linkingId).toBe("home");
      expect(pageData.order).toBe(1);
    });

    it("should create funnel settings in transaction", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        slug: workspaceSlug,
        ownerId: userId,
        owner: {
          plan: $Enums.UserPlan.BUSINESS,
          addOns: [],
        },
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(0);

      let settingsCreateCalled = false;
      let settingsData: any = null;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Funnel",
              slug: "test-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
            }),
            update: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Funnel",
              slug: "test-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
              themeId: 1,
              theme: { id: 1, type: $Enums.ThemeType.CUSTOM },
              pages: [],
            }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1, type: $Enums.ThemeType.CUSTOM }),
          },
          funnelSettings: {
            create: vi.fn().mockImplementation((data: any) => {
              settingsCreateCalled = true;
              settingsData = data.data;
              return Promise.resolve({ id: 1, ...data.data });
            }),
          },
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Home",
              order: 1,
              linkingId: "home",
              type: $Enums.PageType.PAGE,
            }),
          },
        };

        return await callback(tx);
      });

      await createFunnel(userId, {
        name: "Test Funnel",
        workspaceSlug,
        status: $Enums.FunnelStatus.DRAFT,
      });

      expect(settingsCreateCalled).toBe(true);
      expect(settingsData.funnelId).toBe(1);
    });

    it("should create funnel with all related data in one transaction", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        slug: workspaceSlug,
        ownerId: userId,
        owner: {
          plan: $Enums.UserPlan.BUSINESS,
          addOns: [],
        },
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(0);

      const operationOrder: string[] = [];

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockImplementation((data: any) => {
              operationOrder.push("funnel.create");
              return Promise.resolve({
                id: 1,
                name: data.data.name,
                slug: data.data.slug,
                status: data.data.status,
                workspaceId: data.data.workspaceId,
                createdBy: data.data.createdBy,
              });
            }),
            update: vi.fn().mockImplementation((data: any) => {
              operationOrder.push("funnel.update");
              return Promise.resolve({
                id: 1,
                name: "Test Funnel",
                slug: "test-funnel",
                status: $Enums.FunnelStatus.DRAFT,
                workspaceId,
                createdBy: userId,
                themeId: 1,
                theme: { id: 1, type: $Enums.ThemeType.CUSTOM },
                pages: [],
              });
            }),
          },
          theme: {
            create: vi.fn().mockImplementation((data: any) => {
              operationOrder.push("theme.create");
              return Promise.resolve({ id: 1, type: $Enums.ThemeType.CUSTOM });
            }),
          },
          funnelSettings: {
            create: vi.fn().mockImplementation((data: any) => {
              operationOrder.push("funnelSettings.create");
              return Promise.resolve({ id: 1, funnelId: 1 });
            }),
          },
          page: {
            create: vi.fn().mockImplementation((data: any) => {
              operationOrder.push("page.create");
              return Promise.resolve({
                id: 1,
                name: "Home",
                order: 1,
                linkingId: "home",
                type: $Enums.PageType.PAGE,
              });
            }),
          },
        };

        return await callback(tx);
      });

      const result = await createFunnel(userId, {
        name: "Test Funnel",
        workspaceSlug,
        status: $Enums.FunnelStatus.DRAFT,
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(operationOrder).toContain("funnel.create");
      expect(operationOrder).toContain("theme.create");
      expect(operationOrder).toContain("funnelSettings.create");
      expect(operationOrder).toContain("page.create");
      expect(result.response.funnelId).toBe(1);
    });

    it("should rollback everything if transaction fails", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        slug: workspaceSlug,
        ownerId: userId,
        owner: {
          plan: $Enums.UserPlan.BUSINESS,
          addOns: [],
        },
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(0);

      mockPrisma.$transaction.mockRejectedValue(
        new Error("Database transaction failed")
      );

      await expect(
        createFunnel(userId, {
          name: "Test Funnel",
          workspaceSlug,
        status: $Enums.FunnelStatus.DRAFT,
        })
      ).rejects.toThrow("Database transaction failed");
    });
  });

  describe("Cache Invalidation", () => {
    it("should invalidate workspace funnels cache after creation", async () => {
      mockReq.body = {
        name: "Test Funnel",
        workspaceSlug,
      };

      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        slug: workspaceSlug,
        ownerId: userId,
        owner: {
          plan: $Enums.UserPlan.BUSINESS,
          addOns: [],
        },
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(0);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Funnel",
              slug: "test-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
            }),
            update: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Funnel",
              slug: "test-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
              themeId: 1,
              theme: { id: 1, type: $Enums.ThemeType.CUSTOM },
              pages: [],
            }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1, type: $Enums.ThemeType.CUSTOM }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 1, funnelId: 1 }),
          },
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Home",
              order: 1,
              linkingId: "home",
              type: $Enums.PageType.PAGE,
            }),
          },
        };

        return await callback(tx);
      });

      await createFunnelController(mockReq, mockRes, mockNext);

      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${workspaceId}:funnels:all`
      );
      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${workspaceSlug}:user:${userId}`
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should handle cache invalidation errors gracefully", async () => {
      mockReq.body = {
        name: "Test Funnel",
        workspaceSlug,
      };

      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        slug: workspaceSlug,
        ownerId: userId,
        owner: {
          plan: $Enums.UserPlan.BUSINESS,
          addOns: [],
        },
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(0);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Funnel",
              slug: "test-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
            }),
            update: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Funnel",
              slug: "test-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
              themeId: 1,
              theme: { id: 1, type: $Enums.ThemeType.CUSTOM },
              pages: [],
            }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1, type: $Enums.ThemeType.CUSTOM }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 1, funnelId: 1 }),
          },
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Home",
              order: 1,
              linkingId: "home",
              type: $Enums.PageType.PAGE,
            }),
          },
        };

        return await callback(tx);
      });

      (cacheService.del as any).mockRejectedValue(new Error("Cache error"));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await createFunnelController(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("Slug Validation and Uniqueness", () => {
    it("should validate slug uniqueness within workspace", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        slug: workspaceSlug,
        ownerId: userId,
        owner: {
          plan: $Enums.UserPlan.BUSINESS,
          addOns: [],
        },
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Funnel",
              slug: "test-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
            }),
            update: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Funnel",
              slug: "test-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
              themeId: 1,
              theme: { id: 1, type: $Enums.ThemeType.CUSTOM },
              pages: [],
            }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1, type: $Enums.ThemeType.CUSTOM }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 1, funnelId: 1 }),
          },
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Home",
              order: 1,
              linkingId: "home",
              type: $Enums.PageType.PAGE,
            }),
          },
        };

        return await callback(tx);
      });

      await createFunnel(userId, {
        name: "Test Funnel",
        workspaceSlug,
        status: $Enums.FunnelStatus.DRAFT,
      });

      expect(mockPrisma.funnel.findFirst).toHaveBeenCalledWith({
        where: {
          workspaceId,
          slug: "test-funnel",
        },
        select: { id: true },
      });
    });

    it("should generate unique slug when slug already exists in workspace", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        slug: workspaceSlug,
        ownerId: userId,
        owner: {
          plan: $Enums.UserPlan.BUSINESS,
          addOns: [],
        },
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.funnel.findFirst
        .mockResolvedValueOnce(null) // First call: check for duplicate name
        .mockResolvedValueOnce({ id: 1 }) // Second call: slug exists
        .mockResolvedValueOnce(null); // Third call: slug-1 is available

      let createdSlug: string | null = null;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockImplementation((data: any) => {
              createdSlug = data.data.slug;
              return Promise.resolve({
                id: 2,
                name: "Test Funnel",
                slug: data.data.slug,
                status: $Enums.FunnelStatus.DRAFT,
                workspaceId,
                createdBy: userId,
              });
            }),
            update: vi.fn().mockResolvedValue({
              id: 2,
              name: "Test Funnel",
              slug: "test-funnel-1",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
              themeId: 1,
              theme: { id: 1, type: $Enums.ThemeType.CUSTOM },
              pages: [],
            }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1, type: $Enums.ThemeType.CUSTOM }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 1, funnelId: 2 }),
          },
          page: {
            create: vi.fn().mockResolvedValue({
              id: 2,
              name: "Home",
              order: 1,
              linkingId: "home",
              type: $Enums.PageType.PAGE,
            }),
          },
        };

        return await callback(tx);
      });

      await createFunnel(userId, {
        name: "Test Funnel",
        workspaceSlug,
        status: $Enums.FunnelStatus.DRAFT,
      });

      expect(createdSlug).toBe("test-funnel-1");
      expect(mockPrisma.funnel.findFirst).toHaveBeenCalledTimes(3); // 1 for name check, 2 for slug checks
    });

    it("should generate slug from funnel name", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        slug: workspaceSlug,
        ownerId: userId,
        owner: {
          plan: $Enums.UserPlan.BUSINESS,
          addOns: [],
        },
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      let generatedSlug: string | null = null;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockImplementation((data: any) => {
              generatedSlug = data.data.slug;
              return Promise.resolve({
                id: 1,
                name: data.data.name,
                slug: data.data.slug,
                status: $Enums.FunnelStatus.DRAFT,
                workspaceId,
                createdBy: userId,
              });
            }),
            update: vi.fn().mockResolvedValue({
              id: 1,
              name: "My Awesome Funnel",
              slug: "my-awesome-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
              themeId: 1,
              theme: { id: 1, type: $Enums.ThemeType.CUSTOM },
              pages: [],
            }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1, type: $Enums.ThemeType.CUSTOM }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 1, funnelId: 1 }),
          },
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Home",
              order: 1,
              linkingId: "home",
              type: $Enums.PageType.PAGE,
            }),
          },
        };

        return await callback(tx);
      });

      await createFunnel(userId, {
        name: "My Awesome Funnel",
        workspaceSlug,
        status: $Enums.FunnelStatus.DRAFT,
      });

      expect(generatedSlug).toBe("my-awesome-funnel");
    });
  });

  describe("Integration Tests", () => {
    it("should create complete funnel with theme, page, and settings", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        slug: workspaceSlug,
        ownerId: userId,
        owner: {
          plan: $Enums.UserPlan.BUSINESS,
          addOns: [],
        },
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(0); // 0 existing funnels (BUSINESS allows 1)

      const createdFunnel = {
        id: 2,
        name: "Complete Funnel",
        slug: "complete-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        createdBy: userId,
        themeId: 2,
        theme: {
          id: 2,
          name: "Default Theme",
          backgroundColor: "#0e1e12",
          textColor: "#d4ecd0",
          buttonColor: "#387e3d",
          type: $Enums.ThemeType.CUSTOM,
        },
        pages: [
          {
            id: 2,
            name: "Home",
            order: 1,
            linkingId: "home",
            type: $Enums.PageType.PAGE,
            seoTitle: null,
            seoDescription: null,
            seoKeywords: null,
          },
        ],
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({
              id: 2,
              name: "Complete Funnel",
              slug: "complete-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
            }),
            update: vi.fn().mockResolvedValue(createdFunnel),
          },
          theme: {
            create: vi.fn().mockResolvedValue({
              id: 2,
              type: $Enums.ThemeType.CUSTOM,
            }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 2, funnelId: 2 }),
          },
          page: {
            create: vi.fn().mockResolvedValue({
              id: 2,
              name: "Home",
              order: 1,
              linkingId: "home",
              type: $Enums.PageType.PAGE,
              seoTitle: null,
              seoDescription: null,
              seoKeywords: null,
            }),
          },
        };

        return await callback(tx);
      });

      const result = await createFunnel(userId, {
        name: "Complete Funnel",
        workspaceSlug,
        status: $Enums.FunnelStatus.DRAFT,
      });

      expect(result.response.message).toBe("Funnel created successfully!");
      expect(result.response.funnelId).toBe(2);
      expect(result.workspaceId).toBe(workspaceId);
    });

    it("should return correct response structure", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        slug: workspaceSlug,
        ownerId: userId,
        owner: {
          plan: $Enums.UserPlan.BUSINESS,
          addOns: [],
        },
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(0);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Funnel",
              slug: "test-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
            }),
            update: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Funnel",
              slug: "test-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
              themeId: 1,
              theme: { id: 1, type: $Enums.ThemeType.CUSTOM },
              pages: [],
            }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1, type: $Enums.ThemeType.CUSTOM }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 1, funnelId: 1 }),
          },
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Home",
              order: 1,
              linkingId: "home",
              type: $Enums.PageType.PAGE,
            }),
          },
        };

        return await callback(tx);
      });

      const result = await createFunnel(userId, {
        name: "Test Funnel",
        workspaceSlug,
        status: $Enums.FunnelStatus.DRAFT,
      });

      expect(result).toHaveProperty("response");
      expect(result).toHaveProperty("workspaceId");
      expect(result.response).toHaveProperty("message");
      expect(result.response).toHaveProperty("funnelId");
      expect(typeof result.response.message).toBe("string");
      expect(typeof result.response.funnelId).toBe("number");
      expect(typeof result.workspaceId).toBe("number");
    });
  });

  describe("Password Protection for DRAFT Workspaces", () => {
    it("should create funnel WITHOUT password protection in ACTIVE workspace", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        slug: workspaceSlug,
        ownerId: userId,
        status: $Enums.WorkspaceStatus.ACTIVE, // ACTIVE workspace
        owner: {
          plan: $Enums.UserPlan.BUSINESS,
          addOns: [],
        },
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(0);

      let funnelSettingsData: any = null;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Funnel",
              slug: "test-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
            }),
            update: vi.fn().mockResolvedValue({
              id: 1,
              activeThemeId: 1,
            }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1, type: $Enums.ThemeType.CUSTOM }),
          },
          funnelSettings: {
            create: vi.fn().mockImplementation((data: any) => {
              funnelSettingsData = data.data;
              return Promise.resolve({ id: 1, funnelId: 1 });
            }),
          },
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Home",
              order: 1,
              linkingId: "home",
              type: $Enums.PageType.PAGE,
              seoTitle: null,
              seoDescription: null,
              seoKeywords: null,
            }),
          },
        };

        return await callback(tx);
      });

      await createFunnel(userId, {
        name: "Test Funnel",
        workspaceSlug,
        status: $Enums.FunnelStatus.DRAFT,
      });

      expect(funnelSettingsData).not.toBeNull();
      expect(funnelSettingsData.isPasswordProtected).toBe(false);
      expect(funnelSettingsData.passwordHash).toBeNull();
    });

    it("should create funnel WITH password protection in DRAFT workspace", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        slug: workspaceSlug,
        ownerId: userId,
        status: $Enums.WorkspaceStatus.DRAFT, // DRAFT workspace
        owner: {
          plan: $Enums.UserPlan.AGENCY,
          addOns: [],
        },
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(0);

      let funnelSettingsData: any = null;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Funnel",
              slug: "test-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
            }),
            update: vi.fn().mockResolvedValue({
              id: 1,
              activeThemeId: 1,
            }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1, type: $Enums.ThemeType.CUSTOM }),
          },
          funnelSettings: {
            create: vi.fn().mockImplementation((data: any) => {
              funnelSettingsData = data.data;
              return Promise.resolve({ id: 1, funnelId: 1 });
            }),
          },
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Home",
              order: 1,
              linkingId: "home",
              type: $Enums.PageType.PAGE,
              seoTitle: null,
              seoDescription: null,
              seoKeywords: null,
            }),
          },
        };

        return await callback(tx);
      });

      await createFunnel(userId, {
        name: "Test Funnel",
        workspaceSlug,
        status: $Enums.FunnelStatus.DRAFT,
      });

      expect(funnelSettingsData).not.toBeNull();
      expect(funnelSettingsData.isPasswordProtected).toBe(true);
      expect(funnelSettingsData.passwordHash).not.toBeNull();
      expect(typeof funnelSettingsData.passwordHash).toBe("string");
    });

    it("should hash the default password when workspace is DRAFT", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        slug: workspaceSlug,
        ownerId: userId,
        status: $Enums.WorkspaceStatus.DRAFT,
        owner: {
          plan: $Enums.UserPlan.AGENCY,
          addOns: [],
        },
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(0);

      let funnelSettingsData: any = null;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Funnel",
              slug: "test-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
            }),
            update: vi.fn().mockResolvedValue({
              id: 1,
              activeThemeId: 1,
            }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1, type: $Enums.ThemeType.CUSTOM }),
          },
          funnelSettings: {
            create: vi.fn().mockImplementation((data: any) => {
              funnelSettingsData = data.data;
              return Promise.resolve({ id: 1, funnelId: 1 });
            }),
          },
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Home",
              order: 1,
              linkingId: "home",
              type: $Enums.PageType.PAGE,
              seoTitle: null,
              seoDescription: null,
              seoKeywords: null,
            }),
          },
        };

        return await callback(tx);
      });

      await createFunnel(userId, {
        name: "Test Funnel",
        workspaceSlug,
        status: $Enums.FunnelStatus.DRAFT,
      });

      // Verify password is encrypted (not plain text)
      expect(funnelSettingsData.passwordHash).not.toBeNull();
      expect(funnelSettingsData.passwordHash).not.toBe("FunnelDefault123!");
      // Verify it's an encrypted string (should be a non-empty string)
      expect(typeof funnelSettingsData.passwordHash).toBe("string");
      expect(funnelSettingsData.passwordHash.length).toBeGreaterThan(0);
    });

    it("should verify password hash format is correct for DRAFT workspace", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        slug: workspaceSlug,
        ownerId: userId,
        status: $Enums.WorkspaceStatus.DRAFT,
        owner: {
          plan: $Enums.UserPlan.AGENCY,
          addOns: [],
        },
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(0);

      let funnelSettingsData: any = null;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Funnel",
              slug: "test-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
            }),
            update: vi.fn().mockResolvedValue({
              id: 1,
              activeThemeId: 1,
            }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1, type: $Enums.ThemeType.CUSTOM }),
          },
          funnelSettings: {
            create: vi.fn().mockImplementation((data: any) => {
              funnelSettingsData = data.data;
              return Promise.resolve({ id: 1, funnelId: 1 });
            }),
          },
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Home",
              order: 1,
              linkingId: "home",
              type: $Enums.PageType.PAGE,
              seoTitle: null,
              seoDescription: null,
              seoKeywords: null,
            }),
          },
        };

        return await callback(tx);
      });

      await createFunnel(userId, {
        name: "Test Funnel",
        workspaceSlug,
        status: $Enums.FunnelStatus.DRAFT,
      });

      // Verify password is encrypted (AES-256-GCM produces variable length encrypted strings)
      expect(funnelSettingsData.passwordHash).toBeTruthy();
      expect(typeof funnelSettingsData.passwordHash).toBe("string");
      expect(funnelSettingsData.passwordHash.length).toBeGreaterThan(0);
    });
  });
});
