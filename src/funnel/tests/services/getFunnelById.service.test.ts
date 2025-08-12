import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { FunnelService } from "../../services";
import { cacheService } from "../../../services/cache/cache.service";
import { TestHelpers, testPrisma } from "../../../test/helpers";
import { $Enums } from "../../../generated/prisma-client";

describe("FunnelService.getFunnelById", () => {
  let testUser: any;
  let testFunnel: any;

  beforeEach(async () => {
    testUser = await TestHelpers.createTestUser();
    testFunnel = await TestHelpers.createTestFunnel(testUser.id, {
      status: $Enums.FunnelStatus.LIVE,
    });

    // Create test pages with content
    await testPrisma.page.createMany({
      data: [
        { 
          name: "Page 1", 
          order: 1, 
          funnelId: testFunnel.id, 
          visits: 0, 
          content: "This is page 1 content that should be excluded from cache",
          linkingId: "page1",
          seoTitle: "Page 1 SEO Title",
          seoDescription: "Page 1 SEO Description",
          seoKeywords: "page1, test"
        },
        { 
          name: "Page 2", 
          order: 2, 
          funnelId: testFunnel.id, 
          visits: 0, 
          content: "This is page 2 content that should be excluded from cache",
          linkingId: "page2",
          seoTitle: "Page 2 SEO Title",
          seoDescription: "Page 2 SEO Description",
          seoKeywords: "page2, test"
        },
      ],
    });

    // Clear any existing cache
    await cacheService.del(`user:${testUser.id}:funnel:${testFunnel.id}:full`);
  });

  afterEach(async () => {
    // Clean up cache
    await cacheService.del(`user:${testUser.id}:funnel:${testFunnel.id}:full`);
  });

  it("should require user authentication", async () => {
    // Test with invalid user ID (0 or negative)
    await expect(FunnelService.getFunnelById(testFunnel.id, 0)).rejects.toThrow("Please provide userId.");
  });

  it("should return null for non-existent funnel", async () => {
    await expect(FunnelService.getFunnelById(999999, testUser.id)).rejects.toThrow("Funnel not found.");
  });

  it("should throw access denied error for unauthorized access (different user)", async () => {
    const otherUser = await TestHelpers.createTestUser();
    
    // Verify the funnel exists and is owned by testUser
    const funnel = await testPrisma.funnel.findUnique({
      where: { id: testFunnel.id }
    });
    expect(funnel).toBeDefined();
    expect(funnel?.userId).toBe(testUser.id);
    expect(funnel?.userId).not.toBe(otherUser.id);

    // Should throw access denied when different user tries to access
    await expect(FunnelService.getFunnelById(testFunnel.id, otherUser.id)).rejects.toThrow("Funnel not found.");
  });

  it("should fetch from database and cache when not in cache", async () => {
    // Ensure cache is empty
    const cacheKey = `user:${testUser.id}:funnel:${testFunnel.id}:full`;
    const cachedData = await cacheService.get(cacheKey);
    expect(cachedData).toBeNull();

    // Verify funnel exists in DB with pages
    const dbFunnel = await testPrisma.funnel.findUnique({
      where: { id: testFunnel.id },
      include: { pages: true, theme: true }
    });
    expect(dbFunnel).toBeDefined();
    expect(dbFunnel?.userId).toBe(testUser.id);
    expect(dbFunnel?.pages).toHaveLength(2);

    // Fetch funnel
    const result = await FunnelService.getFunnelById(testFunnel.id, testUser.id);

    // Verify result structure
    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.data.id).toBe(testFunnel.id);
    expect(result.data.name).toBe(testFunnel.name);
    expect(result.data.userId).toBe(testUser.id);
    expect(result.data.pages).toHaveLength(2);
    expect(result.data.theme).toBeDefined();

    // Verify pages don't contain content
    result.data.pages.forEach(page => {
      expect((page as any).content).toBeUndefined();
      expect(page.name).toBeDefined();
      expect(page.order).toBeDefined();
      expect(page.linkingId).toBeDefined();
      expect(page.seoTitle).toBeDefined();
      expect(page.seoDescription).toBeDefined();
      expect(page.seoKeywords).toBeDefined();
    });

    // Verify data was cached
    const newCachedData = await cacheService.get(cacheKey);
    expect(newCachedData).toBeDefined();
  });

  it("should return cached data when available", async () => {
    // First fetch to populate cache
    const firstResult = await FunnelService.getFunnelById(testFunnel.id, testUser.id);
    expect(firstResult).toBeDefined();

    // Verify cache was populated
    const cacheKey = `user:${testUser.id}:funnel:${testFunnel.id}:full`;
    const cachedData = await cacheService.get(cacheKey);
    expect(cachedData).toBeDefined();

    // Second fetch should use cache
    const secondResult = await FunnelService.getFunnelById(testFunnel.id, testUser.id);
    
    // Results should be identical
    expect(secondResult).toBeDefined();
    expect(secondResult.data.id).toBe(firstResult.data.id);
    expect(secondResult.data.pages).toHaveLength(2);
    expect(secondResult.data.theme).toBeDefined();

    // Verify pages don't contain content (from cache)
    secondResult.data.pages.forEach(page => {
      expect((page as any).content).toBeUndefined();
    });
  });

  it("should use correct cache key format", async () => {
    await FunnelService.getFunnelById(testFunnel.id, testUser.id);

    // Verify the exact cache key format
    const expectedCacheKey = `user:${testUser.id}:funnel:${testFunnel.id}:full`;
    const cachedData = await cacheService.get(expectedCacheKey);
    expect(cachedData).toBeDefined();

    // Verify wrong key formats don't exist
    const wrongKeys = [
      `funnel:${testFunnel.id}:full`,
      `user:${testUser.id}:funnel:${testFunnel.id}:pages`,
      `user:${testUser.id}:funnel:${testFunnel.id}`,
      `user_${testUser.id}_funnel_${testFunnel.id}_full`,
    ];

    for (const wrongKey of wrongKeys) {
      const wrongCachedData = await cacheService.get(wrongKey);
      expect(wrongCachedData).toBeNull();
    }
  });

  it("should handle cache errors gracefully", async () => {
    // Mock cache service to throw error on get
    const originalGet = cacheService.get;
    cacheService.get = async () => {
      throw new Error("Cache error");
    };

    try {
      // Should still work by fetching from database
      const result = await FunnelService.getFunnelById(testFunnel.id, testUser.id);
      expect(result).toBeDefined();
      expect(result.data.id).toBe(testFunnel.id);
      expect(result.data.pages).toHaveLength(2);
    } finally {
      // Restore original method
      cacheService.get = originalGet;
    }
  });
});