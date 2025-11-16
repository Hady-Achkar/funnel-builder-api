import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { duplicatePage } from "../../services/page/duplicate";
import { duplicatePageController } from "../../controllers/page/duplicate";
import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import { PermissionManager } from "../../utils/workspace-utils/workspace-permission-manager/permission-manager";
import { UserPlan, AddOnType, PageType } from "../../generated/prisma-client";
import { NextFunction } from "express";

vi.mock("../../lib/prisma");
vi.mock("../../services/cache/cache.service");
vi.mock(
  "../../utils/workspace-utils/workspace-permission-manager/permission-manager"
);

describe("Duplicate Page Tests", () => {
  let mockPrisma: any;
  let mockReq: any;
  let mockRes: any;
  let mockNext: NextFunction;
  const userId = 1,
    workspaceId = 1,
    funnelId = 1,
    pageId = 1;

  const createPage = (overrides: any = {}) => ({
    id: pageId,
    name: "Test Page",
    content: "content",
    order: 1,
    type: PageType.PAGE,
    linkingId: "test-page",
    funnelId,
    funnel: {
      id: funnelId,
      workspaceId,
      workspace: {
        id: workspaceId,
        ownerId: userId,
        planType: UserPlan.FREE,
        addOns: [],
      },
    },
    ...overrides,
  });

  const mockSuccess = () => {
    mockPrisma.page.findUnique.mockResolvedValue(createPage());
    (PermissionManager.requirePermission as any).mockResolvedValue(undefined);
    mockPrisma.page.count.mockResolvedValue(1);
    mockPrisma.page.findMany.mockResolvedValue([]);
    mockPrisma.page.findFirst.mockResolvedValue(null);
    mockPrisma.$transaction.mockImplementation(async (cb: any) =>
      cb({
        page: {
          create: vi.fn().mockResolvedValue({
            id: 2,
            name: "Test Page (copy)",
            order: 2,
            linkingId: "test-page-copy",
            type: PageType.PAGE,
            funnelId,
            content: "content",
            seoTitle: null,
            seoDescription: null,
            seoKeywords: null,
            visits: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
          update: vi.fn(),
        },
      })
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      funnel: { findUnique: vi.fn() },
      workspace: { findUnique: vi.fn() },
      workspaceMember: { findUnique: vi.fn() },
      page: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn(),
    };
    (getPrisma as any).mockReturnValue(mockPrisma);
    (cacheService.del as any).mockResolvedValue(undefined);
    (cacheService.set as any).mockResolvedValue(undefined);
    (cacheService.get as any).mockResolvedValue(null);
    mockReq = { userId, body: {}, params: { pageId: pageId.toString() } };
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
      await duplicatePageController(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Authentication required" })
      );
    });

    it("should reject if page not found", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(null);
      await expect(duplicatePage(userId, { pageId })).rejects.toThrow(
        "Page not found"
      );
    });

    it("should allow workspace owner", async () => {
      mockSuccess();
      const result = await duplicatePage(userId, { pageId });
      expect(result.pageId).toBe(2);
      expect(result.message).toBe("Page duplicated successfully");
    });

    it("should allow member with permissions", async () => {
      mockSuccess();
      const result = await duplicatePage(userId, { pageId });
      expect(PermissionManager.requirePermission).toHaveBeenCalled();
      expect(result.pageId).toBe(2);
    });

    it("should reject without VIEW permission", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createPage());
      (PermissionManager.requirePermission as any).mockRejectedValueOnce(
        new Error("No permission")
      );
      await expect(duplicatePage(userId, { pageId })).rejects.toThrow(
        "No permission"
      );
    });
  });

  describe("Validation", () => {
    it("should reject if target funnel not found", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createPage());
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);
      mockPrisma.funnel.findUnique.mockResolvedValue(null);
      await expect(
        duplicatePage(userId, { pageId, targetFunnelId: 999 })
      ).rejects.toThrow("Target funnel not found");
    });
  });

  describe("Page Limits", () => {
    it("should enforce page limit", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createPage());
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);
      mockPrisma.page.count.mockResolvedValue(100);
      await expect(duplicatePage(userId, { pageId })).rejects.toThrow(
        /page limit/
      );
    });

    it("should allow under limit", async () => {
      mockSuccess();
      const result = await duplicatePage(userId, { pageId });
      expect(result.pageId).toBe(2);
    });

    it("should respect add-ons", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(
        createPage({
          funnel: {
            id: funnelId,
            workspaceId,
            workspace: {
              id: workspaceId,
              ownerId: userId,
              planType: UserPlan.FREE,
              addOns: [
                { type: AddOnType.EXTRA_PAGE, quantity: 2, status: "ACTIVE" },
              ],
            },
          },
        })
      );
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);
      mockPrisma.page.count.mockResolvedValue(299); // 100 base + 200 from add-ons = 300 total, currently at 299
      mockPrisma.page.findMany.mockResolvedValue([]);
      mockPrisma.page.findFirst.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (cb: any) =>
        cb({
          page: {
            create: vi.fn().mockResolvedValue({ id: 2 }),
            update: vi.fn(),
          },
        })
      );
      const result = await duplicatePage(userId, { pageId });
      expect(result.pageId).toBe(2);
    });
  });

  describe("Duplication Behavior", () => {
    it("should add (copy) suffix in same funnel", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(
        createPage({ name: "My Page" })
      );
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);
      mockPrisma.page.count.mockResolvedValue(5);
      mockPrisma.page.findMany.mockResolvedValue([]);
      mockPrisma.page.findFirst.mockResolvedValue(null);

      let createdName: string | null = null;
      mockPrisma.$transaction.mockImplementation(async (cb: any) =>
        cb({
          page: {
            create: vi.fn().mockImplementation((data: any) => {
              createdName = data.data.name;
              return Promise.resolve({ id: 2, name: data.data.name });
            }),
            update: vi.fn(),
          },
        })
      );

      await duplicatePage(userId, { pageId });
      expect(createdName).toBe("My Page (copy)");
    });

    it("should reorder pages after insertion", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createPage());
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);
      mockPrisma.page.count.mockResolvedValue(3);
      mockPrisma.page.findMany.mockResolvedValue([
        { id: 2, order: 2 },
        { id: 3, order: 3 },
      ]);
      mockPrisma.page.findFirst.mockResolvedValue(null);

      const updateSpy = vi.fn();
      mockPrisma.$transaction.mockImplementation(async (cb: any) =>
        cb({
          page: {
            create: vi.fn().mockResolvedValue({ id: 4 }),
            update: updateSpy,
          },
        })
      );

      await duplicatePage(userId, { pageId });
      expect(updateSpy).toHaveBeenCalledTimes(2);
    });
  });
});
