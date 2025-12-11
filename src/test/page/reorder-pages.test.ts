import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { reorderPages } from "../../services/page/reorder";
import { reorderPagesController } from "../../controllers/page/reorder";
import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import { PermissionManager } from "../../utils/workspace-utils/workspace-permission-manager/permission-manager";
import { NextFunction } from "express";

vi.mock("../../lib/prisma");
vi.mock("../../services/cache/cache.service");
vi.mock(
  "../../utils/workspace-utils/workspace-permission-manager/permission-manager"
);

describe("Reorder Pages Tests", () => {
  let mockPrisma: any;
  let mockReq: any;
  let mockRes: any;
  let mockNext: NextFunction;
  const userId = 1,
    workspaceId = 1,
    funnelId = 1;

  const createMockFunnel = (pages: Array<{ id: number; order: number}> = []) => ({
    id: funnelId,
    slug: "test-funnel",
    workspaceId,
    workspace: {
      id: workspaceId,
      slug: "test-workspace",
    },
    pages,
  });

  const createDefaultPages = () => [
    { id: 1, order: 1 },
    { id: 2, order: 2 },
    { id: 3, order: 3 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      funnel: {
        findFirst: vi.fn(),
      },
      page: {
        update: vi.fn(),
      },
      $transaction: vi.fn(),
    };
    (getPrisma as any).mockReturnValue(mockPrisma);
    (cacheService.del as any).mockResolvedValue(undefined);
    (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

    mockReq = {
      userId,
      params: { funnelId: String(funnelId) },
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
      await expect(reorderPages(0, {})).rejects.toThrow(
        "User ID is required"
      );
    });

    it("should reject if funnel not found", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      await expect(
        reorderPages(userId, {
          funnelId,
          pageOrders: [{ id: 1, order: 1 }],
        })
      ).rejects.toThrow("Funnel not found");
    });

    it("should reject if no pages found in funnel", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel([]));

      await expect(
        reorderPages(userId, {
          funnelId,
          pageOrders: [{ id: 1, order: 1 }],
        })
      ).rejects.toThrow("No pages found in this funnel");
    });

    it("should allow workspace owner to reorder pages", async () => {
      const pages = createDefaultPages();
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel(pages));
      mockPrisma.$transaction.mockResolvedValue([]);

      await reorderPages(userId, {
        funnelId,
        pageOrders: [
          { id: 3, order: 1 },
          { id: 1, order: 2 },
          { id: 2, order: 3 },
        ],
      });

      expect(PermissionManager.requirePermission).toHaveBeenCalledWith({
        userId,
        workspaceId,
        action: "REORDER_PAGE",
      });
    });

    it("should allow member with REORDER_PAGE permission", async () => {
      const pages = createDefaultPages();
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel(pages));
      mockPrisma.$transaction.mockResolvedValue([]);
      (PermissionManager.requirePermission as any).mockResolvedValue(undefined);

      await reorderPages(userId, {
        funnelId,
        pageOrders: [
          { id: 1, order: 1 },
          { id: 2, order: 2 },
          { id: 3, order: 3 },
        ],
      });

      expect(PermissionManager.requirePermission).toHaveBeenCalledWith({
        userId,
        workspaceId,
        action: "REORDER_PAGE",
      });
    });

    it("should reject user without REORDER_PAGE permission", async () => {
      const pages = createDefaultPages();
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel(pages));
      (PermissionManager.requirePermission as any).mockRejectedValue(
        new Error("Permission denied")
      );

      await expect(
        reorderPages(userId, {
          funnelId,
          pageOrders: [
            { id: 1, order: 1 },
            { id: 2, order: 2 },
            { id: 3, order: 3 },
          ],
        })
      ).rejects.toThrow("Permission denied");
    });
  });

  describe("Validation", () => {
    it("should reject if page ID not found in funnel", async () => {
      const pages = createDefaultPages();
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel(pages));

      await expect(
        reorderPages(userId, {
          funnelId,
          pageOrders: [
            { id: 1, order: 1 },
            { id: 2, order: 2 },
            { id: 999, order: 3 }, // Non-existent page
          ],
        })
      ).rejects.toThrow("Page with ID 999 not found in this funnel");
    });

    it("should reject if not all pages are included", async () => {
      const pages = createDefaultPages();
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel(pages));

      await expect(
        reorderPages(userId, {
          funnelId,
          pageOrders: [
            { id: 1, order: 1 },
            { id: 2, order: 2 },
            // Missing page 3
          ],
        })
      ).rejects.toThrow("Must provide new order for all pages in the funnel");
    });

    it("should reject duplicate order values", async () => {
      const pages = createDefaultPages();
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel(pages));

      await expect(
        reorderPages(userId, {
          funnelId,
          pageOrders: [
            { id: 1, order: 1 },
            { id: 2, order: 1 }, // Duplicate order
            { id: 3, order: 3 },
          ],
        })
      ).rejects.toThrow("Duplicate order values are not allowed");
    });

    it("should reject non-sequential order values", async () => {
      const pages = createDefaultPages();
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel(pages));

      await expect(
        reorderPages(userId, {
          funnelId,
          pageOrders: [
            { id: 1, order: 1 },
            { id: 2, order: 2 },
            { id: 3, order: 5 }, // Skip to 5 instead of 3
          ],
        })
      ).rejects.toThrow("Order values must be sequential starting from 1");
    });

    it("should reject orders not starting from 1", async () => {
      const pages = createDefaultPages();
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel(pages));

      // Use 2,3,4 instead of 0,1,2 to avoid Zod positive number validation
      await expect(
        reorderPages(userId, {
          funnelId,
          pageOrders: [
            { id: 1, order: 2 }, // Starts at 2 instead of 1
            { id: 2, order: 3 },
            { id: 3, order: 4 },
          ],
        })
      ).rejects.toThrow("Order values must be sequential starting from 1");
    });

    it("should accept valid reorder request", async () => {
      const pages = createDefaultPages();
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel(pages));
      mockPrisma.$transaction.mockResolvedValue([]);

      const result = await reorderPages(userId, {
        funnelId,
        pageOrders: [
          { id: 3, order: 1 },
          { id: 1, order: 2 },
          { id: 2, order: 3 },
        ],
      });

      expect(result.message).toBe("Pages reordered successfully");
    });
  });

  describe("Database Transaction", () => {
    it("should update all page orders in a transaction", async () => {
      const pages = createDefaultPages();
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel(pages));
      mockPrisma.page.update.mockResolvedValue({});
      mockPrisma.$transaction.mockResolvedValue([{}, {}, {}]);

      await reorderPages(userId, {
        funnelId,
        pageOrders: [
          { id: 3, order: 1 },
          { id: 1, order: 2 },
          { id: 2, order: 3 },
        ],
      });

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      const transactionArg = mockPrisma.$transaction.mock.calls[0][0];
      expect(transactionArg).toHaveLength(3);
    });

    it("should call page.update for each page", async () => {
      const pages = createDefaultPages();
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel(pages));

      // Mock the transaction to execute the updates
      mockPrisma.$transaction.mockImplementation((updates: any[]) => {
        return Promise.all(updates);
      });

      await reorderPages(userId, {
        funnelId,
        pageOrders: [
          { id: 3, order: 1 },
          { id: 1, order: 2 },
          { id: 2, order: 3 },
        ],
      });

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      const transactionCalls = mockPrisma.$transaction.mock.calls[0][0];
      expect(transactionCalls).toHaveLength(3);
    });
  });

  describe("Cache Invalidation", () => {
    it("should invalidate workspace funnel cache after reorder", async () => {
      const pages = createDefaultPages();
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel(pages));
      mockPrisma.$transaction.mockResolvedValue([]);

      await reorderPages(userId, {
        funnelId,
        pageOrders: [
          { id: 1, order: 1 },
          { id: 2, order: 2 },
          { id: 3, order: 3 },
        ],
      });

      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:test-workspace:funnel:test-funnel:full`
      );
      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${workspaceId}:funnels:all`
      );
    });
  });

  describe("Input Validation", () => {
    it("should validate funnelId is required", async () => {
      await expect(
        reorderPages(userId, {
          pageOrders: [{ id: 1, order: 1 }],
        })
      ).rejects.toThrow();
    });

    it("should validate funnelId is a positive number", async () => {
      await expect(
        reorderPages(userId, {
          funnelId: -1,
          pageOrders: [{ id: 1, order: 1 }],
        })
      ).rejects.toThrow();
    });

    it("should validate pageOrders array is required", async () => {
      await expect(
        reorderPages(userId, {
          funnelId,
        })
      ).rejects.toThrow();
    });

    it("should validate pageOrders array is not empty", async () => {
      await expect(
        reorderPages(userId, {
          funnelId,
          pageOrders: [],
        })
      ).rejects.toThrow();
    });

    it("should validate each page order has id and order", async () => {
      await expect(
        reorderPages(userId, {
          funnelId,
          pageOrders: [{ id: 1 }], // Missing order
        })
      ).rejects.toThrow();
    });

    it("should validate page ID is a positive number", async () => {
      await expect(
        reorderPages(userId, {
          funnelId,
          pageOrders: [{ id: -1, order: 1 }],
        })
      ).rejects.toThrow();
    });

    it("should validate order is a positive number", async () => {
      await expect(
        reorderPages(userId, {
          funnelId,
          pageOrders: [{ id: 1, order: -1 }],
        })
      ).rejects.toThrow();
    });
  });

  describe("Controller Integration", () => {
    it("should return 200 with success message", async () => {
      const pages = createDefaultPages();
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel(pages));
      mockPrisma.$transaction.mockResolvedValue([]);
      mockReq.body = {
        pageOrders: [
          { id: 1, order: 1 },
          { id: 2, order: 2 },
          { id: 3, order: 3 },
        ],
      };

      await reorderPagesController(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Pages reordered successfully",
      });
    });

    it("should handle errors through next middleware", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(null);
      mockReq.body = {
        pageOrders: [{ id: 1, order: 1 }],
      };

      await reorderPagesController(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should require authentication in controller", async () => {
      mockReq.userId = undefined;

      await reorderPagesController(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("Complex Reordering Scenarios", () => {
    it("should handle reverse order", async () => {
      const pages = createDefaultPages();
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel(pages));
      mockPrisma.$transaction.mockResolvedValue([]);

      const result = await reorderPages(userId, {
        funnelId,
        pageOrders: [
          { id: 3, order: 1 },
          { id: 2, order: 2 },
          { id: 1, order: 3 },
        ],
      });

      expect(result.message).toBe("Pages reordered successfully");
    });

    it("should handle partial reordering (swap middle elements)", async () => {
      const pages = [
        { id: 1, order: 1 },
        { id: 2, order: 2 },
        { id: 3, order: 3 },
        { id: 4, order: 4 },
        { id: 5, order: 5 },
      ];
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel(pages));
      mockPrisma.$transaction.mockResolvedValue([]);

      const result = await reorderPages(userId, {
        funnelId,
        pageOrders: [
          { id: 1, order: 1 },
          { id: 3, order: 2 }, // Swap
          { id: 2, order: 3 }, // Swap
          { id: 4, order: 4 },
          { id: 5, order: 5 },
        ],
      });

      expect(result.message).toBe("Pages reordered successfully");
    });

    it("should handle single page funnel", async () => {
      const pages = [{ id: 1, order: 1 }];
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel(pages));
      mockPrisma.$transaction.mockResolvedValue([]);

      const result = await reorderPages(userId, {
        funnelId,
        pageOrders: [{ id: 1, order: 1 }],
      });

      expect(result.message).toBe("Pages reordered successfully");
    });
  });
});
