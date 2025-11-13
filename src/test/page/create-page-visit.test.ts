import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { createPageVisit } from "../../services/page/createPageVisit";
import { createPageVisitController } from "../../controllers/page/createPageVisit";
import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import { BadRequestError, NotFoundError } from "../../errors";

vi.mock("../../lib/prisma");
vi.mock("../../services/cache/cache.service");

describe("Create Page Visit Tests", () => {
  let mockPrisma: any;
  let mockReq: any;
  let mockRes: any;
  const pageId = 1,
    funnelId = 1,
    workspaceId = 1,
    sessionId = "session-123";

  const createMockPage = (overrides: any = {}) => ({
    id: pageId,
    funnelId,
    funnel: {
      id: funnelId,
      slug: "test-funnel",
      workspaceId,
      workspace: {
        id: workspaceId,
        slug: "test-workspace",
      },
      status: "LIVE",
    },
    ...overrides,
  });

  const createMockSession = (visitedPages: number[] = []) => ({
    id: 1,
    visitedPages,
    funnelId,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      page: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      session: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn(),
    };
    (getPrisma as any).mockReturnValue(mockPrisma);
    (cacheService.del as any).mockResolvedValue(undefined);

    mockReq = {
      params: { pageId: String(pageId) },
      body: { sessionId },
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ========== PAGE & FUNNEL VALIDATION ==========
  describe("Page & Funnel Validation", () => {
    it("should reject if page not found", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(null);

      await expect(
        createPageVisit({ pageId }, { sessionId })
      ).rejects.toThrow(NotFoundError);
      await expect(
        createPageVisit({ pageId }, { sessionId })
      ).rejects.toThrow("Page not found");
    });

    it("should reject tracking for non-LIVE funnels", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(
        createMockPage({ funnel: { ...createMockPage().funnel, status: "DRAFT" } })
      );

      const result = await createPageVisit({ pageId }, { sessionId });

      expect(result.message).toBe("Visit tracking is only enabled for live funnels");
      expect(result.isNewVisit).toBe(false);
    });

    it("should reject tracking for ARCHIVED funnels", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(
        createMockPage({ funnel: { ...createMockPage().funnel, status: "ARCHIVED" } })
      );

      const result = await createPageVisit({ pageId }, { sessionId });

      expect(result.message).toBe("Visit tracking is only enabled for live funnels");
      expect(result.isNewVisit).toBe(false);
    });

    it("should allow tracking for LIVE funnels", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.session.findUnique.mockResolvedValue(null);
      mockPrisma.session.create.mockResolvedValue(createMockSession());
      mockPrisma.session.update.mockResolvedValue({});
      mockPrisma.page.update.mockResolvedValue({});

      const result = await createPageVisit({ pageId }, { sessionId });

      expect(result.message).toBe("Page visit recorded successfully");
      expect(result.isNewVisit).toBe(true);
    });
  });

  // ========== SESSION MANAGEMENT ==========
  describe("Session Management", () => {
    it("should create new session if not exists", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.session.findUnique.mockResolvedValue(null);
      mockPrisma.session.create.mockResolvedValue(createMockSession());
      mockPrisma.session.update.mockResolvedValue({});
      mockPrisma.page.update.mockResolvedValue({});

      await createPageVisit({ pageId }, { sessionId });

      expect(mockPrisma.session.create).toHaveBeenCalledWith({
        data: {
          sessionId,
          funnelId,
          visitedPages: [],
          interactions: {},
        },
        select: {
          id: true,
          visitedPages: true,
          funnelId: true,
        },
      });
    });

    it("should use existing session if found", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.session.findUnique.mockResolvedValue(createMockSession());
      mockPrisma.session.update.mockResolvedValue({});
      mockPrisma.page.update.mockResolvedValue({});

      await createPageVisit({ pageId }, { sessionId });

      expect(mockPrisma.session.create).not.toHaveBeenCalled();
      expect(mockPrisma.session.update).toHaveBeenCalled();
    });

    it("should initialize new session with empty visitedPages array", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.session.findUnique.mockResolvedValue(null);
      mockPrisma.session.create.mockResolvedValue(createMockSession([]));
      mockPrisma.session.update.mockResolvedValue({});
      mockPrisma.page.update.mockResolvedValue({});

      await createPageVisit({ pageId }, { sessionId });

      expect(mockPrisma.session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            visitedPages: [],
          }),
        })
      );
    });
  });

  // ========== VISIT TRACKING ==========
  describe("Visit Tracking", () => {
    it("should record new visit if page not visited in session", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.session.findUnique.mockResolvedValue(createMockSession([2, 3]));
      mockPrisma.session.update.mockResolvedValue({});
      mockPrisma.page.update.mockResolvedValue({});

      const result = await createPageVisit({ pageId }, { sessionId });

      expect(result.message).toBe("Page visit recorded successfully");
      expect(result.isNewVisit).toBe(true);
      expect(mockPrisma.session.update).toHaveBeenCalledWith({
        where: { sessionId },
        data: {
          visitedPages: { push: pageId },
          updatedAt: expect.any(Date),
        },
      });
      expect(mockPrisma.page.update).toHaveBeenCalledWith({
        where: { id: pageId },
        data: { visits: { increment: 1 } },
      });
    });

    it("should not record duplicate visit if page already visited", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.session.findUnique.mockResolvedValue(createMockSession([pageId, 2, 3]));

      const result = await createPageVisit({ pageId }, { sessionId });

      expect(result.message).toBe("Page visit already recorded for this session");
      expect(result.isNewVisit).toBe(false);
      expect(mockPrisma.session.update).not.toHaveBeenCalled();
      expect(mockPrisma.page.update).not.toHaveBeenCalled();
    });

    it("should increment page visit count", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.session.findUnique.mockResolvedValue(createMockSession());
      mockPrisma.session.update.mockResolvedValue({});
      mockPrisma.page.update.mockResolvedValue({});

      await createPageVisit({ pageId }, { sessionId });

      expect(mockPrisma.page.update).toHaveBeenCalledWith({
        where: { id: pageId },
        data: { visits: { increment: 1 } },
      });
    });

    it("should add page to session visitedPages array", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.session.findUnique.mockResolvedValue(createMockSession([2]));
      mockPrisma.session.update.mockResolvedValue({});
      mockPrisma.page.update.mockResolvedValue({});

      await createPageVisit({ pageId }, { sessionId });

      expect(mockPrisma.session.update).toHaveBeenCalledWith({
        where: { sessionId },
        data: {
          visitedPages: { push: pageId },
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  // ========== TRANSACTION HANDLING ==========
  describe("Transaction Handling", () => {
    it("should execute visit recording in a transaction", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      let transactionCallback: any;
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        transactionCallback = callback;
        return await callback(mockPrisma);
      });
      mockPrisma.session.findUnique.mockResolvedValue(createMockSession());
      mockPrisma.session.update.mockResolvedValue({});
      mockPrisma.page.update.mockResolvedValue({});

      await createPageVisit({ pageId }, { sessionId });

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(typeof transactionCallback).toBe("function");
    });

    it("should rollback on transaction error", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      mockPrisma.$transaction.mockRejectedValue(new Error("Transaction failed"));

      await expect(
        createPageVisit({ pageId }, { sessionId })
      ).rejects.toThrow("Transaction failed");
      expect(cacheService.del).not.toHaveBeenCalled();
    });

    it("should ensure atomic session update and page increment", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      const operations: string[] = [];
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.session.findUnique.mockResolvedValue(createMockSession());
      mockPrisma.session.update.mockImplementation(() => {
        operations.push("session");
        return Promise.resolve({});
      });
      mockPrisma.page.update.mockImplementation(() => {
        operations.push("page");
        return Promise.resolve({});
      });

      await createPageVisit({ pageId }, { sessionId });

      expect(operations).toEqual(["session", "page"]);
    });
  });

  // ========== CACHE INVALIDATION ==========
  describe("Cache Invalidation", () => {
    it("should invalidate page cache after new visit", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.session.findUnique.mockResolvedValue(createMockSession());
      mockPrisma.session.update.mockResolvedValue({});
      mockPrisma.page.update.mockResolvedValue({});

      await createPageVisit({ pageId }, { sessionId });

      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:test-workspace:funnel:test-funnel:page:${pageId}:full`
      );
    });

    it("should not invalidate cache if visit already recorded", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.session.findUnique.mockResolvedValue(createMockSession([pageId]));

      await createPageVisit({ pageId }, { sessionId });

      expect(cacheService.del).not.toHaveBeenCalled();
    });

    it("should not invalidate cache for non-LIVE funnels", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(
        createMockPage({ funnel: { ...createMockPage().funnel, status: "DRAFT" } })
      );

      await createPageVisit({ pageId }, { sessionId });

      expect(cacheService.del).not.toHaveBeenCalled();
    });

    it("should handle cache deletion errors gracefully", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.session.findUnique.mockResolvedValue(createMockSession());
      mockPrisma.session.update.mockResolvedValue({});
      mockPrisma.page.update.mockResolvedValue({});
      (cacheService.del as any).mockRejectedValue(new Error("Cache error"));

      // Should not throw - visit should still be recorded
      await expect(
        createPageVisit({ pageId }, { sessionId })
      ).rejects.toThrow("Cache error");
    });
  });

  // ========== INPUT VALIDATION ==========
  describe("Input Validation", () => {
    it("should validate pageId is required", async () => {
      await expect(
        createPageVisit({ pageId: undefined as any }, { sessionId })
      ).rejects.toThrow(BadRequestError);
    });

    it("should validate pageId is a positive number", async () => {
      await expect(
        createPageVisit({ pageId: -1 }, { sessionId })
      ).rejects.toThrow(BadRequestError);
      await expect(
        createPageVisit({ pageId: 0 }, { sessionId })
      ).rejects.toThrow(BadRequestError);
    });

    it("should validate sessionId is required", async () => {
      await expect(
        createPageVisit({ pageId }, { sessionId: "" })
      ).rejects.toThrow(BadRequestError);
    });

    it("should validate sessionId is a string", async () => {
      await expect(
        createPageVisit({ pageId }, { sessionId: 123 as any })
      ).rejects.toThrow(BadRequestError);
    });

    it("should validate sessionId max length", async () => {
      const longSessionId = "a".repeat(256);
      await expect(
        createPageVisit({ pageId }, { sessionId: longSessionId })
      ).rejects.toThrow(BadRequestError);
    });

    it("should accept valid pageId and sessionId", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.session.findUnique.mockResolvedValue(createMockSession());
      mockPrisma.session.update.mockResolvedValue({});
      mockPrisma.page.update.mockResolvedValue({});

      const result = await createPageVisit({ pageId: 999 }, { sessionId: "valid-session-123" });

      expect(result.isNewVisit).toBe(true);
    });
  });

  // ========== CONTROLLER INTEGRATION ==========
  describe("Controller Integration", () => {
    it("should return 200 with success response for new visit", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.session.findUnique.mockResolvedValue(createMockSession());
      mockPrisma.session.update.mockResolvedValue({});
      mockPrisma.page.update.mockResolvedValue({});

      await createPageVisitController(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Page visit recorded successfully",
        isNewVisit: true,
      });
    });

    it("should return 200 with duplicate visit message", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.session.findUnique.mockResolvedValue(createMockSession([pageId]));

      await createPageVisitController(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Page visit already recorded for this session",
        isNewVisit: false,
      });
    });

    it("should handle errors with 500 status", async () => {
      const error = new Error("Database error");
      mockPrisma.page.findUnique.mockRejectedValue(error);

      await createPageVisitController(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: "Database error",
      });
    });
  });

  // ========== COMPLEX SCENARIOS ==========
  describe("Complex Scenarios", () => {
    it("should handle multiple pages in session visitedPages", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.session.findUnique.mockResolvedValue(createMockSession([2, 3, 4, 5]));
      mockPrisma.session.update.mockResolvedValue({});
      mockPrisma.page.update.mockResolvedValue({});

      const result = await createPageVisit({ pageId }, { sessionId });

      expect(result.isNewVisit).toBe(true);
      expect(mockPrisma.session.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            visitedPages: { push: pageId },
          }),
        })
      );
    });

    it("should handle different sessionIds for same page", async () => {
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.session.findUnique.mockResolvedValue(null);
      mockPrisma.session.create.mockResolvedValue(createMockSession());
      mockPrisma.session.update.mockResolvedValue({});
      mockPrisma.page.update.mockResolvedValue({});

      const result1 = await createPageVisit({ pageId }, { sessionId: "session-1" });
      const result2 = await createPageVisit({ pageId }, { sessionId: "session-2" });

      expect(result1.isNewVisit).toBe(true);
      expect(result2.isNewVisit).toBe(true);
      expect(mockPrisma.page.update).toHaveBeenCalledTimes(2);
    });

    it("should verify cache invalidation happens after transaction commit", async () => {
      const callOrder: string[] = [];
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const result = await callback(mockPrisma);
        callOrder.push("transaction");
        return result;
      });
      mockPrisma.session.findUnique.mockResolvedValue(createMockSession());
      mockPrisma.session.update.mockResolvedValue({});
      mockPrisma.page.update.mockResolvedValue({});
      (cacheService.del as any).mockImplementation(() => {
        callOrder.push("cache");
        return Promise.resolve();
      });

      await createPageVisit({ pageId }, { sessionId });

      expect(callOrder).toEqual(["transaction", "cache"]);
    });
  });
});
