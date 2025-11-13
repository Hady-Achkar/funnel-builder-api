import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { getPage } from "../../services/page/get";
import { getPageController } from "../../controllers/page/get";
import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import { PermissionManager } from "../../utils/workspace-utils/workspace-permission-manager/permission-manager";
import { PageType } from "../../generated/prisma-client";
import { NextFunction } from "express";

vi.mock("../../lib/prisma");
vi.mock("../../services/cache/cache.service");
vi.mock(
  "../../utils/workspace-utils/workspace-permission-manager/permission-manager"
);

describe("Get Page Tests", () => {
  let mockPrisma: any;
  let mockReq: any;
  let mockRes: any;
  let mockNext: NextFunction;
  const userId = 1,
    workspaceId = 1,
    funnelId = 1,
    pageId = 1;

  const createMockPage = (overrides = {}) => ({
    id: pageId,
    name: "Test Page",
    content: "Test content",
    order: 1,
    type: PageType.PAGE,
    linkingId: "test-page",
    seoTitle: "Test SEO Title",
    seoDescription: "Test SEO Description",
    seoKeywords: "test, page, keywords",
    funnelId,
    visits: 0,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    funnel: {
      id: funnelId,
      slug: "test-funnel",
      workspaceId,
      workspace: {
        id: workspaceId,
        slug: "test-workspace",
      },
    },
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      page: {
        findUnique: vi.fn(),
      },
    };
    (getPrisma as any).mockReturnValue(mockPrisma);
    (cacheService.get as any).mockResolvedValue(null);
    (cacheService.set as any).mockResolvedValue(undefined);
    mockReq = { userId, body: { pageId } };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
  });

  afterEach(() => vi.restoreAllMocks());

  describe("Authentication & Authorization", () => {
    it("should require authentication", async () => {
      mockReq.userId = undefined;
      await getPageController(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Authentication required" })
      );
    });

    it("should reject if page not found", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(null);
      await expect(getPage(userId, { pageId })).rejects.toThrow(
        "Page not found"
      );
    });

    it("should allow workspace owner to view page", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

      const result = await getPage(userId, { pageId });

      expect(PermissionManager.requirePermission).toHaveBeenCalledWith({
        userId,
        workspaceId,
        action: "VIEW_PAGE",
      });
      expect(result).toMatchObject({
        id: pageId,
        name: "Test Page",
        content: "Test content",
      });
    });

    it("should allow member with VIEW_PAGE permission", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

      const result = await getPage(userId, { pageId });

      expect(result.id).toBe(pageId);
      expect(PermissionManager.requirePermission).toHaveBeenCalled();
    });

    it("should reject user without VIEW_PAGE permission", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      (PermissionManager.requirePermission as any).mockRejectedValue(
        new Error("You don't have permission to view this page")
      );

      await expect(getPage(userId, { pageId })).rejects.toThrow(
        "You don't have permission to view this page"
      );
    });
  });

  describe("Cache Behavior", () => {
    it("should return cached page when available", async () => {
      const cachedPage = {
        id: pageId,
        name: "Cached Page",
        content: "Cached content",
        order: 1,
        type: PageType.PAGE,
        linkingId: "cached-page",
        seoTitle: null,
        seoDescription: null,
        seoKeywords: null,
        funnelId,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);
      (cacheService.get as any).mockResolvedValue(cachedPage);

      const result = await getPage(userId, { pageId });

      expect(result.name).toBe("Cached Page");
      expect(result.content).toBe("Cached content");
      expect(cacheService.get).toHaveBeenCalledWith(
        `workspace:test-workspace:funnel:test-funnel:page:${pageId}:full`
      );
    });

    it("should cache page data on cache miss", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);
      (cacheService.get as any).mockResolvedValue(null);

      await getPage(userId, { pageId });

      expect(cacheService.set).toHaveBeenCalledWith(
        `workspace:test-workspace:funnel:test-funnel:page:${pageId}:full`,
        expect.objectContaining({
          id: pageId,
          name: "Test Page",
          content: "Test content",
        }),
        { ttl: 0 }
      );
    });

    it("should handle cache set errors gracefully", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);
      (cacheService.get as any).mockResolvedValue(null);
      (cacheService.set as any).mockRejectedValue(new Error("Cache error"));

      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const result = await getPage(userId, { pageId });

      expect(result.id).toBe(pageId);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Failed to cache page data:",
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe("Data Retrieval", () => {
    it("should return all page fields", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

      const result = await getPage(userId, { pageId });

      expect(result).toMatchObject({
        id: pageId,
        name: "Test Page",
        content: "Test content",
        order: 1,
        type: PageType.PAGE,
        linkingId: "test-page",
        seoTitle: "Test SEO Title",
        seoDescription: "Test SEO Description",
        seoKeywords: "test, page, keywords",
        funnelId,
      });
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should handle page with null SEO fields", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(
        createMockPage({
          seoTitle: null,
          seoDescription: null,
          seoKeywords: null,
        })
      );
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

      const result = await getPage(userId, { pageId });

      expect(result.seoTitle).toBeNull();
      expect(result.seoDescription).toBeNull();
      expect(result.seoKeywords).toBeNull();
    });

    it("should handle different page types", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(
        createMockPage({ type: PageType.RESULT })
      );
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

      const result = await getPage(userId, { pageId });

      expect(result.type).toBe(PageType.RESULT);
    });
  });

  describe("Controller Integration", () => {
    it("should return 200 with page data", async () => {
      mockReq.params = { id: pageId.toString() };
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

      await getPageController(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: pageId,
          name: "Test Page",
        })
      );
    });

    it("should handle errors through next middleware", async () => {
      mockReq.params = { id: pageId.toString() };
      mockPrisma.page.findUnique.mockResolvedValue(null);

      await getPageController(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("Input Validation", () => {
    it("should validate pageId is required", async () => {
      await expect(getPage(userId, {})).rejects.toThrow();
    });

    it("should validate pageId is a number", async () => {
      await expect(getPage(userId, { pageId: "invalid" })).rejects.toThrow();
    });

    it("should accept valid pageId", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

      const result = await getPage(userId, { pageId: 123 });

      expect(mockPrisma.page.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 123 },
        })
      );
    });
  });

  describe("Permission Check Flow", () => {
    it("should check permission after fetching page", async () => {
      const callOrder: string[] = [];

      mockPrisma.page.findUnique.mockImplementation(() => {
        callOrder.push("findUnique");
        return Promise.resolve(createMockPage());
      });

      (PermissionManager.requirePermission as any).mockImplementation(() => {
        callOrder.push("requirePermission");
        return Promise.resolve();
      });

      await getPage(userId, { pageId });

      expect(callOrder).toEqual(["findUnique", "requirePermission"]);
    });

    it("should not cache if permission check fails", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      (PermissionManager.requirePermission as any).mockRejectedValue(
        new Error("No permission")
      );

      await expect(getPage(userId, { pageId })).rejects.toThrow(
        "No permission"
      );

      expect(cacheService.set).not.toHaveBeenCalled();
    });
  });
});
