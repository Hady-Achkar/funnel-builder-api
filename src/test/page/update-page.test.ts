import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { updatePage } from "../../services/page/update";
import { updatePageController } from "../../controllers/page/update";
import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import { PermissionManager } from "../../utils/workspace-utils/workspace-permission-manager/permission-manager";
import { PageType } from "../../generated/prisma-client";
import { NextFunction } from "express";
import { generateUniqueLinkingId } from "../../utils/page-utils/linking-id";

vi.mock("../../lib/prisma");
vi.mock("../../services/cache/cache.service");
vi.mock(
  "../../utils/workspace-utils/workspace-permission-manager/permission-manager"
);
vi.mock("../../utils/page-utils/linking-id");

describe("Update Page Tests", () => {
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
    content: [{ type: "button", content: "Click me" }],
    order: 1,
    type: PageType.PAGE,
    linkingId: "test-page",
    seoTitle: "Test SEO",
    seoDescription: "Test Description",
    seoKeywords: "test,keywords",
    funnelId,
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
        findFirst: vi.fn(),
        update: vi.fn(),
      },
    };
    (getPrisma as any).mockReturnValue(mockPrisma);
    (cacheService.del as any).mockResolvedValue(undefined);
    (generateUniqueLinkingId as any).mockResolvedValue("unique-linking-id");
    mockReq = {
      userId,
      params: { id: String(pageId) },
      body: {},
    };
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

      await updatePageController(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "User ID is required",
      });
    });

    it("should reject if page not found", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(null);

      await expect(
        updatePage({ id: String(pageId) }, { name: "New Name" }, userId)
      ).rejects.toThrow("Page not found");
    });

    it("should allow workspace owner to update page", async () => {
      const mockPage = createMockPage();
      mockPrisma.page.findUnique.mockResolvedValue(mockPage);
      mockPrisma.page.update.mockResolvedValue({
        ...mockPage,
        name: "Updated Name",
      });
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

      const result = await updatePage(
        { id: String(pageId) },
        { name: "Updated Name" },
        userId
      );

      expect(result.message).toBe("Page updated successfully");
      expect(result.page.name).toBe("Updated Name");
      expect(PermissionManager.requirePermission).toHaveBeenCalledWith({
        userId,
        workspaceId,
        action: "EDIT_PAGE",
      });
    });

    it("should allow member with EDIT_PAGE permission", async () => {
      const mockPage = createMockPage();
      mockPrisma.page.findUnique.mockResolvedValue(mockPage);
      mockPrisma.page.update.mockResolvedValue(mockPage);
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

      await updatePage({ id: String(pageId) }, { name: "New Name" }, userId);

      expect(PermissionManager.requirePermission).toHaveBeenCalledWith({
        userId,
        workspaceId,
        action: "EDIT_PAGE",
      });
    });

    it("should reject user without EDIT_PAGE permission", async () => {
      const mockPage = createMockPage();
      mockPrisma.page.findUnique.mockResolvedValue(mockPage);
      (PermissionManager.requirePermission as any).mockRejectedValue(
        new Error("Permission denied")
      );

      await expect(
        updatePage({ id: String(pageId) }, { name: "New Name" }, userId)
      ).rejects.toThrow("Permission denied");
    });
  });

  describe("Field Updates", () => {
    it("should update page name", async () => {
      const mockPage = createMockPage();
      mockPrisma.page.findUnique.mockResolvedValue(mockPage);
      mockPrisma.page.update.mockResolvedValue({
        ...mockPage,
        name: "Updated Name",
      });
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

      const result = await updatePage(
        { id: String(pageId) },
        { name: "Updated Name" },
        userId
      );

      expect(result.page.name).toBe("Updated Name");
      expect(mockPrisma.page.update).toHaveBeenCalledWith({
        where: { id: pageId },
        data: expect.objectContaining({
          name: "Updated Name",
          linkingId: expect.any(String),
        }),
      });
    });

    it("should update page content", async () => {
      const mockPage = createMockPage();
      const newContent = [{ type: "text", content: "New content" }];
      mockPrisma.page.findUnique.mockResolvedValue(mockPage);
      mockPrisma.page.update.mockResolvedValue({
        ...mockPage,
        content: newContent,
      });
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

      const result = await updatePage(
        { id: String(pageId) },
        { content: newContent },
        userId
      );

      expect(result.page.content).toEqual(newContent);
    });

    it("should update SEO fields", async () => {
      const mockPage = createMockPage();
      mockPrisma.page.findUnique.mockResolvedValue(mockPage);
      mockPrisma.page.update.mockResolvedValue({
        ...mockPage,
        seoTitle: "New SEO Title",
        seoDescription: "New SEO Description",
        seoKeywords: "new,keywords",
      });
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

      const result = await updatePage(
        { id: String(pageId) },
        {
          seoTitle: "New SEO Title",
          seoDescription: "New SEO Description",
          seoKeywords: "new,keywords",
        },
        userId
      );

      expect(result.page.seoTitle).toBe("New SEO Title");
      expect(result.page.seoDescription).toBe("New SEO Description");
      expect(result.page.seoKeywords).toBe("new,keywords");
    });

    it("should update page type", async () => {
      const mockPage = createMockPage();
      mockPrisma.page.findUnique.mockResolvedValue(mockPage);
      mockPrisma.page.update.mockResolvedValue({
        ...mockPage,
        type: PageType.RESULT,
      });
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

      const result = await updatePage(
        { id: String(pageId) },
        { type: PageType.RESULT },
        userId
      );

      expect(result.page.type).toBe(PageType.RESULT);
    });

    it("should update multiple fields at once", async () => {
      const mockPage = createMockPage();
      const newContent = [{ type: "heading", content: "Title" }];
      mockPrisma.page.findUnique.mockResolvedValue(mockPage);
      mockPrisma.page.update.mockResolvedValue({
        ...mockPage,
        name: "Multi Update",
        content: newContent,
        type: PageType.RESULT,
        seoTitle: "Multi SEO",
      });
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

      const result = await updatePage(
        { id: String(pageId) },
        {
          name: "Multi Update",
          content: newContent,
          type: PageType.RESULT,
          seoTitle: "Multi SEO",
        },
        userId
      );

      expect(result.page.name).toBe("Multi Update");
      expect(result.page.content).toEqual(newContent);
      expect(result.page.type).toBe(PageType.RESULT);
      expect(result.page.seoTitle).toBe("Multi SEO");
    });

    it("should handle null SEO fields", async () => {
      const mockPage = createMockPage();
      mockPrisma.page.findUnique.mockResolvedValue(mockPage);
      mockPrisma.page.update.mockResolvedValue({
        ...mockPage,
        seoTitle: null,
        seoDescription: null,
        seoKeywords: null,
      });
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

      const result = await updatePage(
        { id: String(pageId) },
        {
          seoTitle: null,
          seoDescription: null,
          seoKeywords: null,
        },
        userId
      );

      expect(result.page.seoTitle).toBeNull();
      expect(result.page.seoDescription).toBeNull();
      expect(result.page.seoKeywords).toBeNull();
    });
  });

  describe("Linking ID Logic", () => {
    it("should generate new linkingId when name is updated", async () => {
      const mockPage = createMockPage();
      mockPrisma.page.findUnique.mockResolvedValue(mockPage);
      mockPrisma.page.update.mockResolvedValue(mockPage);
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

      await updatePage(
        { id: String(pageId) },
        { name: "New Page Name" },
        userId
      );

      expect(mockPrisma.page.update).toHaveBeenCalledWith({
        where: { id: pageId },
        data: expect.objectContaining({
          linkingId: "unique-linking-id",
        }),
      });
    });

    it("should use provided linkingId if explicitly provided", async () => {
      const mockPage = createMockPage();
      mockPrisma.page.findUnique.mockResolvedValue(mockPage);
      mockPrisma.page.findFirst.mockResolvedValue(null); // No conflict
      mockPrisma.page.update.mockResolvedValue({
        ...mockPage,
        linkingId: "custom-id",
      });
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

      const result = await updatePage(
        { id: String(pageId) },
        { linkingId: "custom-id" },
        userId
      );

      expect(result.page.linkingId).toBe("custom-id");
      expect(mockPrisma.page.findFirst).toHaveBeenCalledWith({
        where: {
          linkingId: "custom-id",
          funnelId,
          id: { not: pageId },
        },
      });
    });

    it("should reject duplicate linkingId in same funnel", async () => {
      const mockPage = createMockPage();
      mockPrisma.page.findUnique.mockResolvedValue(mockPage);
      mockPrisma.page.findFirst.mockResolvedValue({ id: 999 }); // Conflicting page
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

      await expect(
        updatePage(
          { id: String(pageId) },
          { linkingId: "duplicate-id" },
          userId
        )
      ).rejects.toThrow(
        'A page with the linking ID "duplicate-id" already exists in this funnel'
      );
    });

    it("should validate linkingId format", async () => {
      const mockPage = createMockPage();
      mockPrisma.page.findUnique.mockResolvedValue(mockPage);
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

      await expect(
        updatePage(
          { id: String(pageId) },
          { linkingId: "Invalid_ID!" }, // Invalid format
          userId
        )
      ).rejects.toThrow();
    });
  });

  describe("No Changes Handling", () => {
    it("should return existing page when no changes provided", async () => {
      const mockPage = createMockPage();
      mockPrisma.page.findUnique.mockResolvedValue(mockPage);
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

      const result = await updatePage({ id: String(pageId) }, {}, userId);

      expect(result.message).toBe("No changes provided");
      expect(result.page.id).toBe(pageId);
      expect(mockPrisma.page.update).not.toHaveBeenCalled();
    });
  });

  describe("Cache Invalidation", () => {
    it("should invalidate both funnel and page cache after update", async () => {
      const mockPage = createMockPage();
      mockPrisma.page.findUnique.mockResolvedValue(mockPage);
      mockPrisma.page.update.mockResolvedValue(mockPage);
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

      await updatePage({ id: String(pageId) }, { name: "New Name" }, userId);

      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:test-workspace:funnel:test-funnel:full`
      );
      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${workspaceId}:funnels:all`
      );
      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:test-workspace:funnel:test-funnel:page:${pageId}:full`
      );
    });

    it("should not invalidate cache when no changes made", async () => {
      const mockPage = createMockPage();
      mockPrisma.page.findUnique.mockResolvedValue(mockPage);
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

      await updatePage({ id: String(pageId) }, {}, userId);

      expect(cacheService.del).not.toHaveBeenCalled();
    });
  });

  describe("Input Validation", () => {
    it("should validate page ID is required", async () => {
      await expect(
        updatePage({ id: "" }, { name: "Test" }, userId)
      ).rejects.toThrow();
    });

    it("should validate page ID is a number", async () => {
      await expect(
        updatePage({ id: "abc" }, { name: "Test" }, userId)
      ).rejects.toThrow();
    });

    it("should validate name length", async () => {
      const mockPage = createMockPage();
      mockPrisma.page.findUnique.mockResolvedValue(mockPage);
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

      await expect(
        updatePage({ id: String(pageId) }, { name: "a".repeat(256) }, userId)
      ).rejects.toThrow();
    });

    it("should validate SEO title length", async () => {
      const mockPage = createMockPage();
      mockPrisma.page.findUnique.mockResolvedValue(mockPage);
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

      await expect(
        updatePage(
          { id: String(pageId) },
          { seoTitle: "a".repeat(61) },
          userId
        )
      ).rejects.toThrow();
    });

    it("should validate SEO description length", async () => {
      const mockPage = createMockPage();
      mockPrisma.page.findUnique.mockResolvedValue(mockPage);
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

      await expect(
        updatePage(
          { id: String(pageId) },
          { seoDescription: "a".repeat(161) },
          userId
        )
      ).rejects.toThrow();
    });
  });

  describe("Controller Integration", () => {
    it("should return 200 with updated page", async () => {
      const mockPage = createMockPage();
      mockPrisma.page.findUnique.mockResolvedValue(mockPage);
      mockPrisma.page.update.mockResolvedValue({
        ...mockPage,
        name: "Updated",
      });
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);
      mockReq.body = { name: "Updated" };

      await updatePageController(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Page updated successfully",
          page: expect.objectContaining({
            id: pageId,
            name: "Updated",
          }),
        })
      );
    });

    it("should handle errors through next middleware", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(null);

      await updatePageController(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
