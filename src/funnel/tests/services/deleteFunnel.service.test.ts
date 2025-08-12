import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { FunnelService } from "../../services";
import { cacheService } from "../../../services/cache/cache.service";
import { TestHelpers, testPrisma } from "../../../test/helpers";
import { $Enums } from "../../../generated/prisma-client";

describe("FunnelService.deleteFunnel", () => {
  let testUser: any;
  let testFunnel: any;
  let testTheme: any;

  beforeEach(async () => {
    testUser = await TestHelpers.createTestUser();

    // Create funnel with theme
    testTheme = await testPrisma.theme.create({
      data: {
        name: "Test Theme",
        backgroundColor: "#ffffff",
        textColor: "#000000",
        buttonColor: "#0066cc",
        buttonTextColor: "#ffffff",
        borderColor: "#dddddd",
        optionColor: "#f0f0f0",
        fontFamily: "Arial",
        borderRadius: $Enums.BorderRadius.SOFT,
      },
    });

    testFunnel = await TestHelpers.createTestFunnel(testUser.id, {
      name: "Test Funnel",
      status: $Enums.FunnelStatus.DRAFT,
      themeId: testTheme.id,
    });

    // Create test pages
    await testPrisma.page.createMany({
      data: [
        {
          name: "Page 1",
          order: 1,
          funnelId: testFunnel.id,
          visits: 0,
          content: "Content 1",
        },
        {
          name: "Page 2",
          order: 2,
          funnelId: testFunnel.id,
          visits: 0,
          content: "Content 2",
        },
      ],
    });

    // Clear any existing cache
    await cacheService.del(`user:${testUser.id}:funnel:${testFunnel.id}:full`);
    await cacheService.del(
      `user:${testUser.id}:funnel:${testFunnel.id}:summary`
    );
  });

  afterEach(async () => {
    // Clean up cache
    await cacheService.del(`user:${testUser.id}:funnel:${testFunnel.id}:full`);
    await cacheService.del(
      `user:${testUser.id}:funnel:${testFunnel.id}:summary`
    );
  });

  it("should require user authentication", async () => {
    await expect(FunnelService.deleteFunnel(testFunnel.id, 0)).rejects.toThrow(
      "Please provide userId."
    );
  });

  it("should validate funnelId", async () => {
    await expect(FunnelService.deleteFunnel(-1, testUser.id)).rejects.toThrow(
      "Invalid input"
    );
    await expect(FunnelService.deleteFunnel(0, testUser.id)).rejects.toThrow(
      "Invalid input"
    );
  });

  it("should throw error for non-existent funnel", async () => {
    await expect(
      FunnelService.deleteFunnel(999999, testUser.id)
    ).rejects.toThrow("Funnel not found.");
  });

  it("should throw access denied for unauthorized user", async () => {
    const otherUser = await TestHelpers.createTestUser();
    await expect(
      FunnelService.deleteFunnel(testFunnel.id, otherUser.id)
    ).rejects.toThrow("You can't delete this funnel.");
  });

  it("should prevent deletion of LIVE funnel", async () => {
    // Update funnel to LIVE status
    await testPrisma.funnel.update({
      where: { id: testFunnel.id },
      data: { status: $Enums.FunnelStatus.LIVE },
    });

    await expect(
      FunnelService.deleteFunnel(testFunnel.id, testUser.id)
    ).rejects.toThrow(
      "This funnel is live. Switch it to Draft or Archived first."
    );
  });

  it("should delete funnel successfully with DRAFT status", async () => {
    const result = await FunnelService.deleteFunnel(testFunnel.id, testUser.id);

    expect(result).toBeDefined();
    expect(result.name).toBe("Test Funnel");

    // Verify funnel is deleted from database
    const deletedFunnel = await testPrisma.funnel.findUnique({
      where: { id: testFunnel.id },
    });
    expect(deletedFunnel).toBeNull();

    // Verify pages are deleted
    const pages = await testPrisma.page.findMany({
      where: { funnelId: testFunnel.id },
    });
    expect(pages).toHaveLength(0);

    // Verify theme is deleted
    const theme = await testPrisma.theme.findUnique({
      where: { id: testTheme.id },
    });
    expect(theme).toBeNull();
  });

  it("should delete funnel successfully with ARCHIVED status", async () => {
    // Update funnel to ARCHIVED status
    await testPrisma.funnel.update({
      where: { id: testFunnel.id },
      data: { status: $Enums.FunnelStatus.ARCHIVED },
    });

    const result = await FunnelService.deleteFunnel(testFunnel.id, testUser.id);

    expect(result).toBeDefined();
    expect(result.name).toBe("Test Funnel");

    // Verify funnel is deleted
    const deletedFunnel = await testPrisma.funnel.findUnique({
      where: { id: testFunnel.id },
    });
    expect(deletedFunnel).toBeNull();
  });

  it("should handle funnel without theme", async () => {
    // Create funnel without theme
    const funnelNoTheme = await TestHelpers.createTestFunnel(testUser.id, {
      name: "No Theme Funnel",
      status: $Enums.FunnelStatus.DRAFT,
    });

    const result = await FunnelService.deleteFunnel(
      funnelNoTheme.id,
      testUser.id
    );

    expect(result).toBeDefined();
    expect(result.name).toBe("No Theme Funnel");

    // Verify funnel is deleted
    const deletedFunnel = await testPrisma.funnel.findUnique({
      where: { id: funnelNoTheme.id },
    });
    expect(deletedFunnel).toBeNull();
  });

  it("should delete all pages associated with funnel", async () => {
    // Verify pages exist before deletion
    const pagesBefore = await testPrisma.page.findMany({
      where: { funnelId: testFunnel.id },
    });
    expect(pagesBefore).toHaveLength(2);

    await FunnelService.deleteFunnel(testFunnel.id, testUser.id);

    // Verify all pages are deleted
    const pagesAfter = await testPrisma.page.findMany({
      where: { funnelId: testFunnel.id },
    });
    expect(pagesAfter).toHaveLength(0);
  });

  it("should invalidate cache after deletion", async () => {
    // Set some cache data
    await cacheService.set(
      `user:${testUser.id}:funnel:${testFunnel.id}:full`,
      { test: "data" },
      { ttl: 0 }
    );
    await cacheService.set(
      `user:${testUser.id}:funnel:${testFunnel.id}:summary`,
      { test: "summary" },
      { ttl: 0 }
    );

    // Verify cache exists
    const fullCacheBefore = await cacheService.get(
      `user:${testUser.id}:funnel:${testFunnel.id}:full`
    );
    const summaryCacheBefore = await cacheService.get(
      `user:${testUser.id}:funnel:${testFunnel.id}:summary`
    );
    expect(fullCacheBefore).toBeDefined();
    expect(summaryCacheBefore).toBeDefined();

    await FunnelService.deleteFunnel(testFunnel.id, testUser.id);

    // Verify cache is cleared
    const fullCacheAfter = await cacheService.get(
      `user:${testUser.id}:funnel:${testFunnel.id}:full`
    );
    const summaryCacheAfter = await cacheService.get(
      `user:${testUser.id}:funnel:${testFunnel.id}:summary`
    );
    expect(fullCacheAfter).toBeNull();
    expect(summaryCacheAfter).toBeNull();
  });

  it("should handle cache errors gracefully", async () => {
    // Mock cache service to throw error
    const originalInvalidate = cacheService.invalidateUserFunnelCache;
    cacheService.invalidateUserFunnelCache = async () => {
      throw new Error("Cache error");
    };

    try {
      // Should still delete successfully despite cache error
      const result = await FunnelService.deleteFunnel(
        testFunnel.id,
        testUser.id
      );
      expect(result).toBeDefined();
      expect(result.name).toBe("Test Funnel");

      // Verify funnel is still deleted from database
      const deletedFunnel = await testPrisma.funnel.findUnique({
        where: { id: testFunnel.id },
      });
      expect(deletedFunnel).toBeNull();
    } finally {
      // Restore original method
      cacheService.invalidateUserFunnelCache = originalInvalidate;
    }
  });
});
