import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { createPage } from "../../services/page/create";
import { createPageController } from "../../controllers/page/create";
import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import { PermissionManager } from "../../utils/workspace-utils/workspace-permission-manager/permission-manager";
import {
  UserPlan,
  AddOnType,
  PageType,
  WorkspaceRole,
  WorkspacePermission,
} from "../../generated/prisma-client";
import { NextFunction } from "express";

vi.mock("../../lib/prisma");
vi.mock("../../services/cache/cache.service");
vi.mock(
  "../../utils/workspace-utils/workspace-permission-manager/permission-manager"
);

describe("Create Page Tests", () => {
  let mockPrisma: any;
  let mockReq: any;
  let mockRes: any;
  let mockNext: NextFunction;
  const userId = 1;
  const workspaceId = 1;
  const funnelId = 1;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Prisma client
    mockPrisma = {
      funnel: {
        findUnique: vi.fn(),
      },
      workspace: {
        findUnique: vi.fn(),
      },
      workspaceMember: {
        findUnique: vi.fn(),
      },
      page: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
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
      params: { funnelId: funnelId.toString() },
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
      mockReq.userId = undefined;

      await createPageController(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Authentication required",
        })
      );
    });

    it("should verify funnel exists", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(null);

      await createPageController(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Funnel not found",
        })
      );
    });

    it("should allow workspace owner to create page", async () => {
      const funnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
          planType: UserPlan.FREE,
          addOns: [],
        },
      };

      // Mock funnel lookup in controller
      mockPrisma.funnel.findUnique.mockResolvedValue({ workspaceId });

      // Mock permission check to pass
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

      // Mock service call
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.page.count.mockResolvedValue(0);
      mockPrisma.page.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback({
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Page",
              order: 1,
              linkingId: "test-page",
              type: PageType.PAGE,
              funnelId,
              content: "",
              seoTitle: null,
              seoDescription: null,
              seoKeywords: null,
              visits: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
          },
        });
      });

      mockReq.body = { name: "Test Page" };

      await createPageController(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Page created successfully",
          pageId: 1,
        })
      );
    });

    it("should allow member with EDIT_PAGES permission", async () => {
      // Mock funnel lookup in controller
      mockPrisma.funnel.findUnique.mockResolvedValue({ workspaceId });

      // Mock permission check to pass
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

      const funnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: 999,
          planType: UserPlan.FREE,
          addOns: [],
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.page.count.mockResolvedValue(0);
      mockPrisma.page.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback({
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Page",
              order: 1,
              linkingId: "test-page",
              type: PageType.PAGE,
              funnelId,
              content: "",
              seoTitle: null,
              seoDescription: null,
              seoKeywords: null,
              visits: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
          },
        });
      });

      mockReq.body = { name: "Test Page" };

      await createPageController(mockReq, mockRes, mockNext);

      expect(PermissionManager.requirePermission).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should reject user without EDIT_PAGES permission", async () => {
      // Mock funnel lookup in controller
      mockPrisma.funnel.findUnique.mockResolvedValue({ workspaceId });

      // Mock permission check to fail
      (PermissionManager.requirePermission as any).mockRejectedValue(
        new Error("You don't have permission to create pages")
      );

      mockReq.body = { name: "Test Page" };

      await createPageController(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/don't have permission/),
        })
      );
    });

    it("should reject user who is not a workspace member", async () => {
      // Mock funnel lookup in controller
      mockPrisma.funnel.findUnique.mockResolvedValue({ workspaceId });

      // Mock permission check to fail
      (PermissionManager.requirePermission as any).mockRejectedValue(
        new Error("You don't have access to this workspace")
      );

      mockReq.body = { name: "Test Page" };

      await createPageController(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/don't have access/),
        })
      );
    });
  });

  describe("Page Allocation Limits", () => {
    it("should enforce page limit for FREE plan (35 pages)", async () => {
      const funnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
        workspace: {
          id: workspaceId,
          ownerId: userId,
          planType: UserPlan.FREE,
          addOns: [],
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.page.count.mockResolvedValue(35); // At limit

      await expect(
        createPage(userId, {
          name: "Test Page",
          funnelId,
        })
      ).rejects.toThrow(/reached its page limit \(35 pages\)/);
    });

    it("should allow page creation when under limit", async () => {
      const funnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
        workspace: {
          id: workspaceId,
          ownerId: userId,
          planType: UserPlan.FREE,
          addOns: [],
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.page.count.mockResolvedValue(34); // Under limit
      mockPrisma.page.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback({
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Page",
              order: 1,
              linkingId: "test-page",
              type: PageType.PAGE,
              funnelId,
              content: "",
              seoTitle: null,
              seoDescription: null,
              seoKeywords: null,
              visits: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
          },
        });
      });

      const result = await createPage(userId, {
        name: "Test Page",
        funnelId,
      });

      expect(result.pageId).toBe(1);
    });

    it("should respect EXTRA_PAGE add-ons for increased limits", async () => {
      const funnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
        workspace: {
          id: workspaceId,
          ownerId: userId,
          planType: UserPlan.FREE,
          addOns: [
            {
              type: AddOnType.EXTRA_PAGE,
              quantity: 2, // 2 units = 10 extra pages (2*5)
              status: "ACTIVE",
            },
          ],
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.page.count.mockResolvedValue(44); // 35 + 10 = 45 total, currently at 44
      mockPrisma.page.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback({
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Page",
              order: 45,
              linkingId: "test-page",
              type: PageType.PAGE,
              funnelId,
              content: "",
              seoTitle: null,
              seoDescription: null,
              seoKeywords: null,
              visits: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
          },
        });
      });

      const result = await createPage(userId, {
        name: "Test Page",
        funnelId,
      });

      expect(result.pageId).toBe(1);
    });

    it("should show user-friendly error message with limit details", async () => {
      const funnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
        workspace: {
          id: workspaceId,
          ownerId: userId,
          planType: UserPlan.FREE,
          addOns: [
            {
              type: AddOnType.EXTRA_PAGE,
              quantity: 1,
              status: "ACTIVE",
            },
          ],
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.page.count.mockResolvedValue(40); // At limit (35 + 5)

      await expect(
        createPage(userId, {
          name: "Test Page",
          funnelId,
        })
      ).rejects.toThrow(
        /Your funnel has reached its page limit \(40 pages\)\. You have 35 base pages \+ 5 from add-ons\./
      );
    });

    it("should not count inactive add-ons towards limit", async () => {
      const funnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
        workspace: {
          id: workspaceId,
          ownerId: userId,
          planType: UserPlan.FREE,
          addOns: [
            {
              type: AddOnType.EXTRA_PAGE,
              quantity: 2,
              status: "INACTIVE", // Not active
            },
          ],
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.page.count.mockResolvedValue(35); // At base limit

      await expect(
        createPage(userId, {
          name: "Test Page",
          funnelId,
        })
      ).rejects.toThrow(/page limit \(35 pages\)/);
    });
  });

  describe("Linking ID Generation", () => {
    it("should generate linking ID from page name", async () => {
      const funnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
        workspace: {
          id: workspaceId,
          ownerId: userId,
          planType: UserPlan.FREE,
          addOns: [],
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.page.count.mockResolvedValue(0);
      mockPrisma.page.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null); // Linking ID available

      let createdLinkingId: string | null = null;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback({
          page: {
            create: vi.fn().mockImplementation((data: any) => {
              createdLinkingId = data.data.linkingId;
              return Promise.resolve({
                id: 1,
                name: "My Awesome Page",
                order: 1,
                linkingId: data.data.linkingId,
                type: PageType.PAGE,
                funnelId,
                content: "",
                seoTitle: null,
                seoDescription: null,
                seoKeywords: null,
                visits: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }),
          },
        });
      });

      await createPage(userId, {
        name: "My Awesome Page",
        funnelId,
      });

      expect(createdLinkingId).toBe("my-awesome-page");
    });

    it("should handle duplicate linking IDs with counter", async () => {
      const funnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
        workspace: {
          id: workspaceId,
          ownerId: userId,
          planType: UserPlan.FREE,
          addOns: [],
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.page.count.mockResolvedValue(0);
      mockPrisma.page.findFirst
        .mockResolvedValueOnce(null) // Last page query
        .mockResolvedValueOnce({ id: 1, linkingId: "test-page" }) // test-page exists
        .mockResolvedValueOnce(null); // test-page-2 available

      let createdLinkingId: string | null = null;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback({
          page: {
            create: vi.fn().mockImplementation((data: any) => {
              createdLinkingId = data.data.linkingId;
              return Promise.resolve({
                id: 2,
                name: "Test Page",
                order: 2,
                linkingId: data.data.linkingId,
                type: PageType.PAGE,
                funnelId,
                content: "",
                seoTitle: null,
                seoDescription: null,
                seoKeywords: null,
                visits: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }),
          },
        });
      });

      await createPage(userId, {
        name: "Test Page",
        funnelId,
      });

      expect(createdLinkingId).toBe("test-page-2");
    });

    it('should use default name "Page N" when name not provided', async () => {
      const funnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
        workspace: {
          id: workspaceId,
          ownerId: userId,
          planType: UserPlan.FREE,
          addOns: [],
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.page.count.mockResolvedValue(0);
      mockPrisma.page.findFirst
        .mockResolvedValueOnce({ order: 2 }) // Last page has order 2
        .mockResolvedValueOnce(null); // Linking ID available

      let createdName: string | null = null;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback({
          page: {
            create: vi.fn().mockImplementation((data: any) => {
              createdName = data.data.name;
              return Promise.resolve({
                id: 1,
                name: data.data.name,
                order: 3,
                linkingId: "page-3",
                type: PageType.PAGE,
                funnelId,
                content: "",
                seoTitle: null,
                seoDescription: null,
                seoKeywords: null,
                visits: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }),
          },
        });
      });

      await createPage(userId, {
        funnelId,
      });

      expect(createdName).toBe("Page 3");
    });
  });

  describe("Cache Invalidation", () => {
    it("should invalidate funnel cache after page creation", async () => {
      const funnel = {
        id: funnelId,
        slug: "test-funnel",
        name: "Test Funnel",
        workspaceId,
        workspace: {
          id: workspaceId,
          slug: "test-workspace",
          ownerId: userId,
          planType: UserPlan.FREE,
          addOns: [],
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.page.count.mockResolvedValue(0);
      mockPrisma.page.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback({
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Page",
              order: 1,
              linkingId: "test-page",
              type: PageType.PAGE,
              funnelId,
              content: "",
              seoTitle: null,
              seoDescription: null,
              seoKeywords: null,
              visits: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
          },
        });
      });

      await createPage(userId, {
        name: "Test Page",
        funnelId,
      });

      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:test-workspace:funnel:test-funnel:full`
      );
      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${workspaceId}:funnels:all`
      );
    });

    it("should handle cache invalidation errors gracefully", async () => {
      const funnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
        workspace: {
          id: workspaceId,
          ownerId: userId,
          planType: UserPlan.FREE,
          addOns: [],
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.page.count.mockResolvedValue(0);
      mockPrisma.page.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback({
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Page",
              order: 1,
              linkingId: "test-page",
              type: PageType.PAGE,
              funnelId,
              content: "",
              seoTitle: null,
              seoDescription: null,
              seoKeywords: null,
              visits: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
          },
        });
      });

      (cacheService.del as any).mockRejectedValue(new Error("Cache error"));
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const result = await createPage(userId, {
        name: "Test Page",
        funnelId,
      });

      expect(result.pageId).toBe(1); // Page still created
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("Validation", () => {
    it("should reject invalid page type", async () => {
      await expect(
        createPage(userId, {
          name: "Test Page",
          funnelId,
          type: "INVALID_TYPE" as any,
        })
      ).rejects.toThrow();
    });

    it("should reject page name longer than 255 characters", async () => {
      const longName = "a".repeat(256);

      await expect(
        createPage(userId, {
          name: longName,
          funnelId,
        })
      ).rejects.toThrow();
    });

    it("should accept valid page types (PAGE, RESULT)", async () => {
      const funnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
        workspace: {
          id: workspaceId,
          ownerId: userId,
          planType: UserPlan.FREE,
          addOns: [],
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.page.count.mockResolvedValue(0);
      mockPrisma.page.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback({
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Popup",
              order: 1,
              linkingId: "test-popup",
              type: PageType.PAGE,
              funnelId,
              content: "",
              seoTitle: null,
              seoDescription: null,
              seoKeywords: null,
              visits: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
          },
        });
      });

      const result = await createPage(userId, {
        name: "Test Popup",
        funnelId,
        type: PageType.PAGE,
      });

      expect(result.pageId).toBe(1);
    });
  });

  describe("Integration Tests", () => {
    it("should create page with correct order sequence", async () => {
      const funnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
        workspace: {
          id: workspaceId,
          ownerId: userId,
          planType: UserPlan.FREE,
          addOns: [],
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.page.count.mockResolvedValue(3); // 3 existing pages
      mockPrisma.page.findFirst
        .mockResolvedValueOnce({ order: 3 }) // Last page has order 3
        .mockResolvedValueOnce(null); // Linking ID available

      let createdOrder: number | null = null;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback({
          page: {
            create: vi.fn().mockImplementation((data: any) => {
              createdOrder = data.data.order;
              return Promise.resolve({
                id: 4,
                name: "Page 4",
                order: data.data.order,
                linkingId: "page-4",
                type: PageType.PAGE,
                funnelId,
                content: "",
                seoTitle: null,
                seoDescription: null,
                seoKeywords: null,
                visits: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }),
          },
        });
      });

      await createPage(userId, {
        funnelId,
      });

      expect(createdOrder).toBe(4);
    });

    it("should return correct response structure", async () => {
      const funnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
        workspace: {
          id: workspaceId,
          ownerId: userId,
          planType: UserPlan.FREE,
          addOns: [],
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.page.count.mockResolvedValue(0);
      mockPrisma.page.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback({
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Page",
              order: 1,
              linkingId: "test-page",
              type: PageType.PAGE,
              funnelId,
              content: "",
              seoTitle: null,
              seoDescription: null,
              seoKeywords: null,
              visits: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
          },
        });
      });

      const result = await createPage(userId, {
        name: "Test Page",
        funnelId,
      });

      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("pageId");
      expect(typeof result.message).toBe("string");
      expect(typeof result.pageId).toBe("number");
      expect(result.message).toBe("Page created successfully");
    });

    it("should handle custom content when provided", async () => {
      const funnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
        workspace: {
          id: workspaceId,
          ownerId: userId,
          planType: UserPlan.FREE,
          addOns: [],
        },
      };

      const customContent = JSON.stringify({
        blocks: [{ type: "heading", content: "Hello" }],
      });

      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.page.count.mockResolvedValue(0);
      mockPrisma.page.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      let savedContent: string | null = null;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback({
          page: {
            create: vi.fn().mockImplementation((data: any) => {
              savedContent = data.data.content;
              return Promise.resolve({
                id: 1,
                name: "Test Page",
                order: 1,
                linkingId: "test-page",
                type: PageType.PAGE,
                funnelId,
                content: data.data.content,
                seoTitle: null,
                seoDescription: null,
                seoKeywords: null,
                visits: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }),
          },
        });
      });

      await createPage(userId, {
        name: "Test Page",
        funnelId,
        content: customContent,
      });

      expect(savedContent).toBe(customContent);
    });
  });
});
