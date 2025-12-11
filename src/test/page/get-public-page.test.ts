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
  const hostname = "example.com";

  const createMockFunnel = (overrides = {}) => ({
    id: funnelId,
    slug: funnelSlug,
    workspaceId,
    workspace: {
      id: workspaceId,
      slug: "test-workspace",
    },
    pages: [{
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
    }],
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
      query: { hostname },
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
      await expect(getPublicPage({ linkingId, hostname })).rejects.toThrow();
    });

    it("should validate linkingId is required", async () => {
      await expect(getPublicPage({ funnelSlug, hostname })).rejects.toThrow();
    });

    it("should validate hostname is required", async () => {
      await expect(getPublicPage({ funnelSlug, linkingId })).rejects.toThrow("Hostname must be a string");
    });

    it("should accept valid funnelSlug, linkingId, and hostname", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel());

      const result = await getPublicPage({ funnelSlug, linkingId, hostname });

      expect(result.id).toBe(pageId);
      expect(mockPrisma.funnel.findFirst).toHaveBeenCalledWith({
        where: {
          slug: funnelSlug,
          status: "LIVE",
          OR: expect.any(Array),
        },
        include: expect.any(Object),
      });
    });
  });

  describe("Funnel & Page Discovery", () => {
    it("should reject if funnel not found", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      await expect(getPublicPage({ funnelSlug, linkingId, hostname })).rejects.toThrow(
        "Page not found or not publicly accessible"
      );
    });

    it("should reject if funnel is not LIVE", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      await expect(getPublicPage({ funnelSlug, linkingId, hostname })).rejects.toThrow(
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

      await expect(getPublicPage({ funnelSlug, linkingId, hostname })).rejects.toThrow(
        "Page not found or not publicly accessible"
      );
    });

    it("should successfully find page by funnelSlug + linkingId + hostname", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel());

      const result = await getPublicPage({ funnelSlug, linkingId, hostname });

      expect(result.id).toBe(pageId);
      expect(result.name).toBe("Test Page");
      expect(mockPrisma.funnel.findFirst).toHaveBeenCalled();
    });
  });

  describe("Domain Verification", () => {
    it("should verify domain association via workspace domains", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel());

      const result = await getPublicPage({ funnelSlug, linkingId, hostname });

      expect(result.id).toBe(pageId);
      expect(mockPrisma.funnel.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                workspace: expect.objectContaining({
                  domains: expect.objectContaining({
                    some: expect.objectContaining({ hostname })
                  })
                })
              })
            ])
          })
        })
      );
    });

    it("should verify domain association via funnel connections", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel());

      const result = await getPublicPage({ funnelSlug, linkingId, hostname });

      expect(result.id).toBe(pageId);
      expect(mockPrisma.funnel.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                domainConnections: expect.objectContaining({
                  some: expect.objectContaining({
                    domain: expect.objectContaining({ hostname }),
                    isActive: true
                  })
                })
              })
            ])
          })
        })
      );
    });
  });

  describe("Data Retrieval", () => {
    it("should return all page fields with correct types", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel());

      const result = await getPublicPage({ funnelSlug, linkingId, hostname });

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
      const mockFunnelWithNullSeo = createMockFunnel({
        pages: [{
          id: pageId,
          name: "Test Page",
          content: "Test content",
          order: 1,
          type: PageType.PAGE,
          linkingId: "test-page",
          seoTitle: null,
          seoDescription: null,
          seoKeywords: null,
          funnelId,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        }]
      });
      mockPrisma.funnel.findFirst.mockResolvedValue(mockFunnelWithNullSeo);

      const result = await getPublicPage({ funnelSlug, linkingId, hostname });

      expect(result.seoTitle).toBeNull();
      expect(result.seoDescription).toBeNull();
      expect(result.seoKeywords).toBeNull();
    });

    it("should handle different page types", async () => {
      const mockFunnelWithResult = createMockFunnel({
        pages: [{
          id: pageId,
          name: "Test Page",
          content: "Test content",
          order: 1,
          type: PageType.RESULT,
          linkingId: "test-page",
          seoTitle: "Test SEO Title",
          seoDescription: "Test SEO Description",
          seoKeywords: "test, page, keywords",
          funnelId,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        }]
      });
      mockPrisma.funnel.findFirst.mockResolvedValue(mockFunnelWithResult);

      const result = await getPublicPage({ funnelSlug, linkingId, hostname });

      expect(result.type).toBe(PageType.RESULT);
    });
  });

  describe("Controller Integration", () => {
    it("should return 200 with page data", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel());

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
      mockReq.query = {};

      await getPublicPageController(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Funnel slug, linking ID, and hostname are required",
      });
    });
  });

  describe("Database Query Optimization", () => {
    it("should fetch funnel and page in single query with include", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel());

      await getPublicPage({ funnelSlug, linkingId, hostname });

      expect(mockPrisma.funnel.findFirst).toHaveBeenCalledTimes(1);
      expect(mockPrisma.funnel.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            pages: expect.any(Object)
          })
        })
      );
    });

    it("should handle page not found in funnel pages array", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(createMockFunnel({ pages: [] }));

      await expect(getPublicPage({ funnelSlug, linkingId, hostname })).rejects.toThrow(
        "Page not found or not publicly accessible"
      );
    });
  });
});
