import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { getPublicPage } from "../../services/page/getPublicPage";
import { getPublicPageController } from "../../controllers/page/getPublicPage";
import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import { PageType } from "../../generated/prisma-client";
import { NextFunction } from "express";

vi.mock("../../lib/prisma");
vi.mock("../../services/cache/cache.service");

describe("Get Public Page Tests", () => {
  let mockPrisma: any;
  let mockReq: any;
  let mockRes: any;
  let mockNext: NextFunction;
  const workspaceId = 1,
    funnelId = 1,
    pageId = 1;
  const funnelSlug = "test-funnel";
  const linkingId = "test-page";

  const createMockFunnel = (overrides = {}) => ({
    id: funnelId,
    workspaceId,
    pages: [{ id: pageId }],
    ...overrides,
  });

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
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      funnel: {
        findFirst: vi.fn(),
      },
      page: {
        findUnique: vi.fn(),
      },
    };
    (getPrisma as any).mockReturnValue(mockPrisma);
    (cacheService.get as any).mockResolvedValue(null);
    (cacheService.set as any).mockResolvedValue(undefined);
    mockReq = {
      params: { funnelSlug, linkingId },
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
  });

  afterEach(() => vi.restoreAllMocks());

  describe("Input Validation", () => {
    it("should validate funnelSlug is required", async () => {
      await expect(getPublicPage({ linkingId })).rejects.toThrow();
    });

    it("should validate linkingId is required", async () => {
      await expect(getPublicPage({ funnelSlug })).rejects.toThrow();
    });

    it("should accept valid funnelSlug and linkingId", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel());
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());

      const result = await getPublicPage({ funnelSlug, linkingId });

      expect(result.id).toBe(pageId);
      expect(mockPrisma.funnel.findFirst).toHaveBeenCalledWith({
        where: {
          slug: funnelSlug,
          status: "LIVE",
        },
        select: expect.any(Object),
      });
    });
  });

  describe("Funnel & Page Discovery", () => {
    it("should reject if funnel not found", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      await expect(getPublicPage({ funnelSlug, linkingId })).rejects.toThrow(
        "Page not found or not publicly accessible"
      );
    });

    it("should reject if funnel is not LIVE", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      await expect(getPublicPage({ funnelSlug, linkingId })).rejects.toThrow(
        "Page not found or not publicly accessible"
      );

      expect(mockPrisma.funnel.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "LIVE",
          }),
        })
      );
    });

    it("should reject if page with linkingId not found in funnel", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(
        createMockFunnel({ pages: [] })
      );

      await expect(getPublicPage({ funnelSlug, linkingId })).rejects.toThrow(
        "Page not found or not publicly accessible"
      );
    });

    it("should successfully find page by funnelSlug + linkingId", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel());
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());

      const result = await getPublicPage({ funnelSlug, linkingId });

      expect(result.id).toBe(pageId);
      expect(result.name).toBe("Test Page");
      expect(mockPrisma.funnel.findFirst).toHaveBeenCalledWith({
        where: {
          slug: funnelSlug,
          status: "LIVE",
        },
        select: {
          id: true,
          workspaceId: true,
          pages: {
            where: {
              linkingId,
            },
            select: {
              id: true,
            },
          },
        },
      });
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

      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel());
      (cacheService.get as any).mockResolvedValue(cachedPage);

      const result = await getPublicPage({ funnelSlug, linkingId });

      expect(result.name).toBe("Cached Page");
      expect(result.content).toBe("Cached content");
      expect(cacheService.get).toHaveBeenCalledWith(
        `workspace:${workspaceId}:funnel:${funnelId}:page:${pageId}:full`
      );
      expect(mockPrisma.page.findUnique).not.toHaveBeenCalled();
    });

    it("should cache page data on cache miss", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel());
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      (cacheService.get as any).mockResolvedValue(null);

      await getPublicPage({ funnelSlug, linkingId });

      expect(cacheService.set).toHaveBeenCalledWith(
        `workspace:${workspaceId}:funnel:${funnelId}:page:${pageId}:full`,
        expect.objectContaining({
          id: pageId,
          name: "Test Page",
          content: "Test content",
        }),
        { ttl: 0 }
      );
    });

    it("should handle cache set errors gracefully", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel());
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());
      (cacheService.get as any).mockResolvedValue(null);
      (cacheService.set as any).mockRejectedValue(new Error("Cache error"));

      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const result = await getPublicPage({ funnelSlug, linkingId });

      expect(result.id).toBe(pageId);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Failed to cache page data:",
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe("Data Retrieval", () => {
    it("should return all page fields with correct types", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel());
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());

      const result = await getPublicPage({ funnelSlug, linkingId });

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

    it("should handle pages with null SEO fields", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel());
      mockPrisma.page.findUnique.mockResolvedValue(
        createMockPage({
          seoTitle: null,
          seoDescription: null,
          seoKeywords: null,
        })
      );

      const result = await getPublicPage({ funnelSlug, linkingId });

      expect(result.seoTitle).toBeNull();
      expect(result.seoDescription).toBeNull();
      expect(result.seoKeywords).toBeNull();
    });

    it("should handle different page types", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel());
      mockPrisma.page.findUnique.mockResolvedValue(
        createMockPage({ type: PageType.RESULT })
      );

      const result = await getPublicPage({ funnelSlug, linkingId });

      expect(result.type).toBe(PageType.RESULT);
    });
  });

  describe("Controller Integration", () => {
    it("should return 200 with page data", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel());
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());

      await getPublicPageController(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: pageId,
          name: "Test Page",
        })
      );
    });

    it("should handle errors through next middleware", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      await getPublicPageController(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should validate required params in controller", async () => {
      mockReq.params = {};

      await getPublicPageController(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Funnel slug and linking ID are required",
      });
    });
  });

  describe("Database Query Optimization", () => {
    it("should fetch funnel and page in two queries (not N+1)", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel());
      mockPrisma.page.findUnique.mockResolvedValue(createMockPage());

      await getPublicPage({ funnelSlug, linkingId });

      expect(mockPrisma.funnel.findFirst).toHaveBeenCalledTimes(1);
      expect(mockPrisma.page.findUnique).toHaveBeenCalledTimes(1);
    });

    it("should handle page not found after successful funnel lookup", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel());
      mockPrisma.page.findUnique.mockResolvedValue(null);

      await expect(getPublicPage({ funnelSlug, linkingId })).rejects.toThrow(
        "Page not found"
      );
    });
  });
});
