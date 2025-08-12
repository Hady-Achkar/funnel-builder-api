import { describe, it, expect, vi } from "vitest";
import { PageService } from "../../services";
import { 
  mockPrisma, 
  setupPageServiceTest,
  mockCacheService
} from "./test-setup";

describe("PageService.getPublicPage", () => {
  setupPageServiceTest();

  it("should get public page successfully", async () => {
    const mockPage = {
      id: 1,
      name: "Test Page",
      content: "<h1>Test</h1>",
      order: 1,
      linkingId: "test-page",
      seoTitle: "Test Page",
      seoDescription: "A test page",
      seoKeywords: "test",
      funnelId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      funnel: {
        id: 1,
        name: "Test Funnel",
        status: "LIVE",
        userId: 1,
      },
    };

    mockCacheService.get.mockResolvedValue(null);
    mockPrisma.page.findFirst = vi.fn().mockResolvedValue(mockPage);
    mockCacheService.set.mockResolvedValue(undefined);

    const result = await PageService.getPublicPage({
      funnelId: 1,
      linkingId: "test-page",
    });

    expect(mockPrisma.page.findFirst).toHaveBeenCalledWith({
      where: {
        funnelId: 1,
        linkingId: "test-page",
      },
      include: {
        funnel: {
          select: { id: true, name: true, status: true, userId: true },
        },
      },
    });

    expect(result).toEqual({
      data: {
        id: 1,
        name: "Test Page",
        content: "<h1>Test</h1>",
        linkingId: "test-page",
        seoTitle: "Test Page",
        seoDescription: "A test page",
        seoKeywords: "test",
        funnelName: "Test Funnel",
        funnelId: 1,
      },
    });
  });

  it("should return cached page if available", async () => {
    const mockPage = {
      id: 1,
      name: "Test Page",
      content: "<h1>Test</h1>",
      order: 1,
      linkingId: "test-page",
      seoTitle: "Test Page",
      seoDescription: "A test page",
      seoKeywords: "test",
      funnelId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      funnel: {
        id: 1,
        name: "Test Funnel",
        status: "LIVE",
        userId: 1,
      },
    };

    const cachedData = {
      id: 1,
      name: "Test Page",
      content: "<h1>Test</h1>",
      linkingId: "test-page",
      seoTitle: "Test Page",
      seoDescription: "A test page",
      seoKeywords: "test",
    };

    mockCacheService.get.mockResolvedValue(cachedData);
    mockPrisma.page.findFirst = vi.fn().mockResolvedValue(mockPage);
    mockCacheService.set.mockResolvedValue(undefined);

    const result = await PageService.getPublicPage({
      funnelId: 1,
      linkingId: "test-page",
    });

    expect(result).toEqual({
      data: {
        id: 1,
        name: "Test Page",
        content: "<h1>Test</h1>",
        linkingId: "test-page",
        seoTitle: "Test Page",
        seoDescription: "A test page",
        seoKeywords: "test",
        funnelName: "Test Funnel",
        funnelId: 1,
      },
    });
  });

  it("should throw error if page not found", async () => {
    mockCacheService.get.mockResolvedValue(null);
    mockPrisma.page.findFirst = vi.fn().mockResolvedValue(null);

    await expect(
      PageService.getPublicPage({
        funnelId: 1,
        linkingId: "non-existent",
      })
    ).rejects.toThrow("Public page retrieval failed: Page not found");
  });

  it("should throw error if page is not publicly accessible", async () => {
    const mockPage = {
      id: 1,
      name: "Test Page",
      content: "<h1>Test</h1>",
      order: 1,
      linkingId: "test-page",
      seoTitle: "Test Page",
      seoDescription: "A test page",
      seoKeywords: "test",
      funnelId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      funnel: {
        id: 1,
        name: "Test Funnel",
        status: "DRAFT",
        userId: 1,
      },
    };

    mockCacheService.get.mockResolvedValue(null);
    mockPrisma.page.findFirst = vi.fn().mockResolvedValue(mockPage);

    await expect(
      PageService.getPublicPage({
        funnelId: 1,
        linkingId: "test-page",
      })
    ).rejects.toThrow("Public page retrieval failed: This page is not publicly accessible");
  });

  it("should handle invalid input", async () => {
    await expect(
      PageService.getPublicPage({
        funnelId: 0,
        linkingId: "",
      })
    ).rejects.toThrow("Invalid input");
  });
});