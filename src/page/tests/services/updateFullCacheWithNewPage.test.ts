import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { updateFunnelDataCacheWithNewPage } from "../../services/cache-helpers";
import { cacheService } from "../../../services/cache/cache.service";
import { CachedFunnelWithPages } from "../../../funnel/types";
import { $Enums } from "../../../generated/prisma-client";

describe("updateFunnelDataCacheWithNewPage - :full cache updates", () => {
  const userId = 1;
  const funnelId = 1;

  beforeEach(async () => {
    // Clean up test caches before each test
    try {
      await cacheService.del(`user:${userId}:funnel:${funnelId}:pages`);
      await cacheService.del(`user:${userId}:funnel:${funnelId}:full`);
    } catch (error) {
      // Ignore cache errors in test setup
    }
  });

  afterEach(async () => {
    // Clean up test caches after each test
    try {
      await cacheService.del(`user:${userId}:funnel:${funnelId}:pages`);
      await cacheService.del(`user:${userId}:funnel:${funnelId}:full`);
    } catch (error) {
      // Ignore cache errors in test cleanup
    }
  });

  it("should update :full cache with new page when cache exists", async () => {
    // Setup initial :full cache with theme and existing pages
    const existingPage = {
      id: 1,
      name: "Page 1",
      order: 1,
      linkingId: "page-1",
      seoTitle: null,
      seoDescription: null,
      seoKeywords: null,
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-01"),
    };

    const initialFullCache: CachedFunnelWithPages = {
      id: funnelId,
      name: "Test Funnel",
      status: $Enums.FunnelStatus.DRAFT,
      userId,
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-01"),
      theme: {
        id: 1,
        name: "Default Theme",
        backgroundColor: "#ffffff",
        textColor: "#000000",
        buttonColor: "#007bff",
        buttonTextColor: "#ffffff",
        borderColor: "#dee2e6",
        optionColor: "#f8f9fa",
        fontFamily: "Arial, sans-serif",
        borderRadius: "4px",
      },
      pages: [existingPage],
    };

    await cacheService.set(
      `user:${userId}:funnel:${funnelId}:full`,
      initialFullCache,
      { ttl: 0 }
    );

    // Add new page with order 2
    const newPage = {
      id: 2,
      name: "Page 2",
      order: 2,
      linkingId: "page-2",
      seoTitle: "SEO Title",
      seoDescription: "SEO Description",
      seoKeywords: "keyword1, keyword2",
      createdAt: new Date("2023-01-02"),
      updatedAt: new Date("2023-01-02"),
    };

    await updateFunnelDataCacheWithNewPage(userId, funnelId, newPage);

    // Verify :full cache was updated with new page and theme preserved
    const updatedFullCache = await cacheService.get<CachedFunnelWithPages>(
      `user:${userId}:funnel:${funnelId}:full`
    );

    expect(updatedFullCache).toBeDefined();
    expect(updatedFullCache!.pages).toHaveLength(2);
    expect(updatedFullCache!.pages[0].id).toBe(1);
    expect(updatedFullCache!.pages[0].order).toBe(1);
    expect(updatedFullCache!.pages[1].id).toBe(2);
    expect(updatedFullCache!.pages[1].order).toBe(2);
    expect(updatedFullCache!.pages[1].seoTitle).toBe("SEO Title");

    // Verify theme data is preserved
    expect(updatedFullCache!.theme).toBeDefined();
    expect(updatedFullCache!.theme!.name).toBe("Default Theme");
    expect(updatedFullCache!.theme!.backgroundColor).toBe("#ffffff");

    // Verify updatedAt was updated (may be serialized as string from Redis)
    expect(updatedFullCache!.updatedAt).toBeDefined();
    const updatedAtTime = new Date(updatedFullCache!.updatedAt).getTime();
    expect(updatedAtTime).toBeGreaterThan(initialFullCache.updatedAt.getTime());
  });

  it("should handle :full cache with correct page ordering", async () => {
    // Setup cache with pages order 2, 3
    const initialPages = [
      {
        id: 2,
        name: "Page 2",
        order: 2,
        linkingId: "page-2",
        seoTitle: null,
        seoDescription: null,
        seoKeywords: null,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
      },
      {
        id: 3,
        name: "Page 3",
        order: 3,
        linkingId: "page-3",
        seoTitle: null,
        seoDescription: null,
        seoKeywords: null,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
      },
    ];

    const initialFullCache: CachedFunnelWithPages = {
      id: funnelId,
      name: "Test Funnel",
      status: $Enums.FunnelStatus.DRAFT,
      userId,
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-01"),
      theme: null,
      pages: initialPages,
    };

    await cacheService.set(
      `user:${userId}:funnel:${funnelId}:full`,
      initialFullCache,
      { ttl: 0 }
    );

    // Insert page with order 1 (should become first)
    const newPage = {
      id: 1,
      name: "Page 1",
      order: 1,
      linkingId: "page-1",
      seoTitle: null,
      seoDescription: null,
      seoKeywords: null,
      createdAt: new Date("2023-01-02"),
      updatedAt: new Date("2023-01-02"),
    };

    await updateFunnelDataCacheWithNewPage(userId, funnelId, newPage);

    // Verify pages are correctly sorted in :full cache
    const updatedFullCache = await cacheService.get<CachedFunnelWithPages>(
      `user:${userId}:funnel:${funnelId}:full`
    );

    expect(updatedFullCache!.pages).toHaveLength(3);
    expect(updatedFullCache!.pages[0].id).toBe(1);
    expect(updatedFullCache!.pages[0].order).toBe(1);
    expect(updatedFullCache!.pages[1].id).toBe(2);
    expect(updatedFullCache!.pages[1].order).toBe(2);
    expect(updatedFullCache!.pages[2].id).toBe(3);
    expect(updatedFullCache!.pages[2].order).toBe(3);
  });

  it("should skip :full cache update when cache doesn't exist", async () => {
    // Don't setup :full cache - should handle gracefully

    const newPage = {
      id: 1,
      name: "Page 1",
      order: 1,
      linkingId: "page-1",
      seoTitle: null,
      seoDescription: null,
      seoKeywords: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Should not throw error even when :full cache doesn't exist
    await expect(
      updateFunnelDataCacheWithNewPage(userId, funnelId, newPage)
    ).resolves.toBeUndefined();

    // Verify :full cache is still null (wasn't created)
    const fullCacheAfter = await cacheService.get(
      `user:${userId}:funnel:${funnelId}:full`
    );
    expect(fullCacheAfter).toBeNull();
  });

  it("should update both caches (:pages, :full) consistently", async () => {
    // Setup both caches (consolidated approach)
    const existingPage = {
      id: 1,
      name: "Page 1",
      order: 1,
      linkingId: "page-1",
      seoTitle: null,
      seoDescription: null,
      seoKeywords: null,
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-01"),
    };

    // :pages cache (pages only)
    const initialPagesCache = [existingPage];

    // :full cache (funnel + pages + theme)
    const initialFullCache: CachedFunnelWithPages = {
      id: funnelId,
      name: "Test Funnel",
      status: $Enums.FunnelStatus.DRAFT,
      userId,
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-01"),
      theme: {
        id: 1,
        name: "Test Theme",
        backgroundColor: "#ffffff",
        textColor: "#000000",
        buttonColor: "#007bff",
        buttonTextColor: "#ffffff",
        borderColor: "#dee2e6",
        optionColor: "#f8f9fa",
        fontFamily: "Arial, sans-serif",
        borderRadius: "4px",
      },
      pages: [existingPage],
    };

    await Promise.all([
      cacheService.set(
        `user:${userId}:funnel:${funnelId}:pages`,
        initialPagesCache,
        { ttl: 0 }
      ),
      cacheService.set(
        `user:${userId}:funnel:${funnelId}:full`,
        initialFullCache,
        { ttl: 0 }
      ),
    ]);

    // Add new page
    const newPage = {
      id: 2,
      name: "Page 2",
      order: 2,
      linkingId: "page-2",
      seoTitle: null,
      seoDescription: null,
      seoKeywords: null,
      createdAt: new Date("2023-01-02"),
      updatedAt: new Date("2023-01-02"),
    };

    await updateFunnelDataCacheWithNewPage(userId, funnelId, newPage);

    // Verify both caches were updated consistently
    const [updatedPagesCache, updatedFullCache] = await Promise.all([
      cacheService.get(`user:${userId}:funnel:${funnelId}:pages`),
      cacheService.get<CachedFunnelWithPages>(
        `user:${userId}:funnel:${funnelId}:full`
      ),
    ]);

    // Both caches should have 2 pages
    expect((updatedPagesCache as any[]).length).toBe(2);
    expect(updatedFullCache!.pages).toHaveLength(2);

    // Both caches should have the new page
    expect((updatedPagesCache as any[])[1].id).toBe(2);
    expect(updatedFullCache!.pages[1].id).toBe(2);

    // :full cache should have theme data
    expect(updatedFullCache!.theme).toBeDefined();
    expect(updatedFullCache!.theme!.name).toBe("Test Theme");
  });
});
