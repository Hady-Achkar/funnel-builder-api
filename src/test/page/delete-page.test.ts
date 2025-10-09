import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { deletePage } from "../../services/page/delete";
import { deletePageController } from "../../controllers/page/delete";
import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import { PermissionManager } from "../../utils/workspace-utils/workspace-permission-manager/permission-manager";
import { PermissionAction } from "../../utils/workspace-utils/workspace-permission-manager/types";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../errors";
import { NextFunction } from "express";

vi.mock("../../lib/prisma");
vi.mock("../../services/cache/cache.service");
vi.mock(
  "../../utils/workspace-utils/workspace-permission-manager/permission-manager"
);

describe("Delete Page Tests", () => {
  let mockPrisma: any;
  let mockReq: any;
  let mockRes: any;
  let mockNext: NextFunction;
  const userId = 1,
    workspaceId = 1,
    funnelId = 1,
    pageId = 1;

  const createMockPage = (overrides: any = {}) => ({
    id: pageId,
    funnelId,
    order: 2,
    funnel: {
      id: funnelId,
      workspaceId,
    },
    ...overrides,
  });

  const createMockPages = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      order: i + 1,
    }));

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      page: {
        findFirst: vi.fn(),
        count: vi.fn(),
        delete: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn(),
    };
    (getPrisma as any).mockReturnValue(mockPrisma);
    (cacheService.del as any).mockResolvedValue(undefined);
    (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

    mockReq = {
      userId,
      params: { id: String(pageId) },
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ========== AUTHENTICATION & PERMISSIONS ==========
  describe("Authentication & Permissions", () => {
    it("should require authentication", async () => {
      await expect(deletePage(0, { pageId })).rejects.toThrow(
        UnauthorizedError
      );
      await expect(deletePage(0, { pageId })).rejects.toThrow(
        "User ID is required"
      );
    });

    it("should reject if page not found", async () => {
      mockPrisma.page.findFirst.mockResolvedValue(null);

      await expect(deletePage(userId, { pageId })).rejects.toThrow(
        NotFoundError
      );
      await expect(deletePage(userId, { pageId })).rejects.toThrow(
        "Page not found"
      );
    });

    it("should allow workspace owner to delete page", async () => {
      mockPrisma.page.findFirst.mockResolvedValue(createMockPage());
      mockPrisma.page.count.mockResolvedValue(3);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.page.delete.mockResolvedValue({});
      mockPrisma.page.findMany.mockResolvedValue([]);

      await deletePage(userId, { pageId });

      expect(PermissionManager.requirePermission).toHaveBeenCalledWith({
        userId,
        workspaceId,
        action: PermissionAction.DELETE_PAGE,
      });
    });

    it("should allow member with DELETE_PAGE permission", async () => {
      mockPrisma.page.findFirst.mockResolvedValue(createMockPage());
      mockPrisma.page.count.mockResolvedValue(2);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.page.delete.mockResolvedValue({});
      mockPrisma.page.findMany.mockResolvedValue([]);

      await deletePage(userId, { pageId });

      expect(PermissionManager.requirePermission).toHaveBeenCalledWith(
        expect.objectContaining({
          action: PermissionAction.DELETE_PAGE,
        })
      );
    });

    it("should reject user without DELETE_PAGE permission", async () => {
      mockPrisma.page.findFirst.mockResolvedValue(createMockPage());
      (PermissionManager.requirePermission as any).mockRejectedValue(
        new Error("Permission denied")
      );

      await expect(deletePage(userId, { pageId })).rejects.toThrow(
        "Permission denied"
      );
    });

    it("should reject non-member user", async () => {
      mockPrisma.page.findFirst.mockResolvedValue(createMockPage());
      (PermissionManager.requirePermission as any).mockRejectedValue(
        new Error("You are not a member of this workspace")
      );

      await expect(deletePage(userId, { pageId })).rejects.toThrow(
        "You are not a member of this workspace"
      );
    });
  });

  // ========== LAST PAGE PROTECTION ==========
  describe("Last Page Protection", () => {
    it("should not allow deleting the last page in a funnel", async () => {
      mockPrisma.page.findFirst.mockResolvedValue(createMockPage());
      mockPrisma.page.count.mockResolvedValue(1);

      await expect(deletePage(userId, { pageId })).rejects.toThrow(
        BadRequestError
      );
      await expect(deletePage(userId, { pageId })).rejects.toThrow(
        "Cannot delete the last page in a funnel"
      );
    });

    it("should include helpful context in last page error", async () => {
      mockPrisma.page.findFirst.mockResolvedValue(createMockPage());
      mockPrisma.page.count.mockResolvedValue(1);

      await expect(deletePage(userId, { pageId })).rejects.toThrow(
        "Every funnel must have at least one page"
      );
    });

    it("should allow deleting when 2+ pages exist", async () => {
      mockPrisma.page.findFirst.mockResolvedValue(createMockPage());
      mockPrisma.page.count.mockResolvedValue(2);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.page.delete.mockResolvedValue({});
      mockPrisma.page.findMany.mockResolvedValue([]);

      const result = await deletePage(userId, { pageId });

      expect(result.message).toBe("Page deleted successfully");
    });
  });

  // ========== DELETE & REORDER LOGIC ==========
  describe("Delete & Reorder Logic", () => {
    it("should delete page and reorder remaining pages", async () => {
      const page = createMockPage({ order: 2 });
      mockPrisma.page.findFirst.mockResolvedValue(page);
      mockPrisma.page.count.mockResolvedValue(4);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.page.delete.mockResolvedValue({});
      mockPrisma.page.findMany.mockResolvedValue([
        { id: 3, order: 3 },
        { id: 4, order: 4 },
      ]);
      mockPrisma.page.update.mockResolvedValue({});

      await deletePage(userId, { pageId });

      expect(mockPrisma.page.delete).toHaveBeenCalledWith({
        where: { id: pageId },
      });
      expect(mockPrisma.page.findMany).toHaveBeenCalledWith({
        where: {
          funnelId,
          order: { gt: 2 },
        },
        orderBy: { order: "asc" },
      });
    });

    it("should handle deleting first page (order 1)", async () => {
      const page = createMockPage({ order: 1 });
      mockPrisma.page.findFirst.mockResolvedValue(page);
      mockPrisma.page.count.mockResolvedValue(3);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.page.delete.mockResolvedValue({});
      mockPrisma.page.findMany.mockResolvedValue([
        { id: 2, order: 2 },
        { id: 3, order: 3 },
      ]);
      mockPrisma.page.update.mockResolvedValue({});

      await deletePage(userId, { pageId });

      expect(mockPrisma.page.findMany).toHaveBeenCalledWith({
        where: {
          funnelId,
          order: { gt: 1 },
        },
        orderBy: { order: "asc" },
      });
      expect(mockPrisma.page.update).toHaveBeenCalledTimes(2);
    });

    it("should handle deleting middle page", async () => {
      const page = createMockPage({ order: 3 });
      mockPrisma.page.findFirst.mockResolvedValue(page);
      mockPrisma.page.count.mockResolvedValue(5);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.page.delete.mockResolvedValue({});
      mockPrisma.page.findMany.mockResolvedValue([
        { id: 4, order: 4 },
        { id: 5, order: 5 },
      ]);
      mockPrisma.page.update.mockResolvedValue({});

      await deletePage(userId, { pageId });

      expect(mockPrisma.page.update).toHaveBeenCalledWith({
        where: { id: 4 },
        data: { order: 3 },
      });
      expect(mockPrisma.page.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { order: 4 },
      });
    });

    it("should handle deleting last page (highest order)", async () => {
      const page = createMockPage({ order: 5 });
      mockPrisma.page.findFirst.mockResolvedValue(page);
      mockPrisma.page.count.mockResolvedValue(5);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.page.delete.mockResolvedValue({});
      mockPrisma.page.findMany.mockResolvedValue([]);

      await deletePage(userId, { pageId });

      expect(mockPrisma.page.update).not.toHaveBeenCalled();
    });

    it("should ensure transaction atomicity", async () => {
      mockPrisma.page.findFirst.mockResolvedValue(createMockPage());
      mockPrisma.page.count.mockResolvedValue(3);
      let transactionCallback: any;
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        transactionCallback = callback;
        return await callback(mockPrisma);
      });
      mockPrisma.page.delete.mockResolvedValue({});
      mockPrisma.page.findMany.mockResolvedValue([{ id: 3, order: 3 }]);
      mockPrisma.page.update.mockResolvedValue({});

      await deletePage(userId, { pageId });

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(typeof transactionCallback).toBe("function");
    });

    it("should rollback on transaction error", async () => {
      mockPrisma.page.findFirst.mockResolvedValue(createMockPage());
      mockPrisma.page.count.mockResolvedValue(2);
      mockPrisma.$transaction.mockRejectedValue(new Error("DB error"));

      await expect(deletePage(userId, { pageId })).rejects.toThrow("DB error");
      expect(cacheService.del).not.toHaveBeenCalled();
    });
  });

  // ========== CACHE INVALIDATION ==========
  describe("Cache Invalidation", () => {
    it("should invalidate workspace funnel cache after delete", async () => {
      mockPrisma.page.findFirst.mockResolvedValue(createMockPage());
      mockPrisma.page.count.mockResolvedValue(2);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.page.delete.mockResolvedValue({});
      mockPrisma.page.findMany.mockResolvedValue([]);

      await deletePage(userId, { pageId });

      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${workspaceId}:funnel:${funnelId}:full`
      );
    });

    it("should handle cache errors gracefully", async () => {
      mockPrisma.page.findFirst.mockResolvedValue(createMockPage());
      mockPrisma.page.count.mockResolvedValue(2);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.page.delete.mockResolvedValue({});
      mockPrisma.page.findMany.mockResolvedValue([]);
      (cacheService.del as any).mockRejectedValue(new Error("Cache error"));

      await expect(deletePage(userId, { pageId })).rejects.toThrow(
        "Cache error"
      );
    });
  });

  // ========== INPUT VALIDATION ==========
  describe("Input Validation", () => {
    it("should validate pageId is required", async () => {
      await expect(deletePage(userId, {})).rejects.toThrow(BadRequestError);
    });

    it("should validate pageId is a positive number", async () => {
      await expect(deletePage(userId, { pageId: -1 })).rejects.toThrow(
        BadRequestError
      );
      await expect(deletePage(userId, { pageId: 0 })).rejects.toThrow(
        BadRequestError
      );
    });

    it("should accept valid pageId", async () => {
      mockPrisma.page.findFirst.mockResolvedValue(createMockPage());
      mockPrisma.page.count.mockResolvedValue(2);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.page.delete.mockResolvedValue({});
      mockPrisma.page.findMany.mockResolvedValue([]);

      await deletePage(userId, { pageId: 123 });

      expect(mockPrisma.page.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 123 },
        })
      );
    });
  });

  // ========== CONTROLLER INTEGRATION ==========
  describe("Controller Integration", () => {
    it("should return 200 with success message", async () => {
      mockPrisma.page.findFirst.mockResolvedValue(createMockPage());
      mockPrisma.page.count.mockResolvedValue(2);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.page.delete.mockResolvedValue({});
      mockPrisma.page.findMany.mockResolvedValue([]);

      await deletePageController(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Page deleted successfully",
      });
    });

    it("should handle errors through next middleware", async () => {
      const error = new Error("Test error");
      mockPrisma.page.findFirst.mockRejectedValue(error);

      await deletePageController(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should require authentication in controller", async () => {
      mockReq.userId = undefined;

      await deletePageController(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  // ========== COMPLEX SCENARIOS ==========
  describe("Complex Delete Scenarios", () => {
    it("should correctly reorder when deleting page with multiple pages after it", async () => {
      const page = createMockPage({ order: 2 });
      mockPrisma.page.findFirst.mockResolvedValue(page);
      mockPrisma.page.count.mockResolvedValue(6);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.page.delete.mockResolvedValue({});
      mockPrisma.page.findMany.mockResolvedValue([
        { id: 3, order: 3 },
        { id: 4, order: 4 },
        { id: 5, order: 5 },
        { id: 6, order: 6 },
      ]);
      mockPrisma.page.update.mockResolvedValue({});

      await deletePage(userId, { pageId });

      expect(mockPrisma.page.update).toHaveBeenCalledTimes(4);
      expect(mockPrisma.page.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { order: 2 },
      });
      expect(mockPrisma.page.update).toHaveBeenCalledWith({
        where: { id: 6 },
        data: { order: 5 },
      });
    });

    it("should handle two-page funnel correctly", async () => {
      const page = createMockPage({ order: 1 });
      mockPrisma.page.findFirst.mockResolvedValue(page);
      mockPrisma.page.count.mockResolvedValue(2);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.page.delete.mockResolvedValue({});
      mockPrisma.page.findMany.mockResolvedValue([{ id: 2, order: 2 }]);
      mockPrisma.page.update.mockResolvedValue({});

      await deletePage(userId, { pageId });

      expect(mockPrisma.page.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { order: 1 },
      });
    });

    it("should verify permission check happens before deletion", async () => {
      const callOrder: string[] = [];
      mockPrisma.page.findFirst.mockResolvedValue(createMockPage());
      mockPrisma.page.count.mockResolvedValue(2);
      (PermissionManager.requirePermission as any).mockImplementation(() => {
        callOrder.push("permission");
        return Promise.resolve();
      });
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        callOrder.push("transaction");
        return await callback(mockPrisma);
      });
      mockPrisma.page.delete.mockResolvedValue({});
      mockPrisma.page.findMany.mockResolvedValue([]);

      await deletePage(userId, { pageId });

      expect(callOrder).toEqual(["permission", "transaction"]);
    });
  });
});
