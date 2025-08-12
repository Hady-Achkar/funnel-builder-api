import { describe, it, expect, vi } from "vitest";
import { PageService } from "../../services";
import {
  mockPrisma,
  createMockFunnel,
  createMockPage,
  setupPageServiceTest,
} from "./test-setup";

describe("PageService.duplicatePage", () => {
  setupPageServiceTest();

  it("should validate input parameters with Zod", async () => {
    await expect(
      PageService.duplicatePage({ pageId: 0 }, 1, {})
    ).rejects.toThrow("Page ID must be positive");

    await expect(
      PageService.duplicatePage({ pageId: 1 }, 0, {})
    ).rejects.toThrow("User ID is required");
  });

  it("should duplicate page successfully within same funnel", async () => {
    const originalPage = createMockPage({
      funnelId: 1,
      name: "Original Page",
      linkingId: "original-page",
      content: "<h1>Original Content</h1>",
    });
    const duplicatedPage = createMockPage({
      id: 2,
      funnelId: 1,
      name: "Original Page (Copy)",
      linkingId: "original-page-copy",
      content: "<h1>Original Content</h1>",
      order: 2,
    });

    mockPrisma.page.findFirst = vi
      .fn()
      .mockResolvedValueOnce(originalPage) // Original page lookup
      .mockResolvedValueOnce(null) // Name check - no duplicate
      .mockResolvedValueOnce(null); // LinkingId check - no duplicate

    mockPrisma.page.count = vi.fn().mockResolvedValue(1);
    mockPrisma.page.create = vi.fn().mockResolvedValue(duplicatedPage);

    const result = await PageService.duplicatePage({ pageId: 1 }, 1, {});

    expect(result.message).toContain("duplicated successfully");
    expect(mockPrisma.page.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: expect.stringContaining("Copy"),
        content: "<h1>Original Content</h1>",
        funnelId: 1,
        order: 2,
      }),
    });
  });

  it("should duplicate page to different funnel", async () => {
    const originalPage = createMockPage({
      funnelId: 1,
      name: "Original Page",
      linkingId: "original-page",
    });
    const targetFunnel = createMockFunnel({ id: 2 });
    const duplicatedPage = createMockPage({
      id: 2,
      funnelId: 2,
      name: "Original Page",
      linkingId: "original-page",
      order: 1,
    });

    mockPrisma.page.findFirst = vi
      .fn()
      .mockResolvedValueOnce(originalPage) // Original page lookup
      .mockResolvedValueOnce(null) // Name check - no duplicate
      .mockResolvedValueOnce(null); // LinkingId check - no duplicate

    mockPrisma.funnel.findFirst = vi.fn().mockResolvedValue(targetFunnel);
    mockPrisma.page.count = vi.fn().mockResolvedValue(0);
    mockPrisma.page.create = vi.fn().mockResolvedValue(duplicatedPage);

    const result = await PageService.duplicatePage({ pageId: 1 }, 1, {
      targetFunnelId: 2,
    });

    expect(result.message).toContain("duplicated successfully");
    expect(mockPrisma.page.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        funnelId: 2,
        order: 1,
      }),
    });
  });

  it("should throw error for non-existent page", async () => {
    mockPrisma.page.findFirst = vi.fn().mockResolvedValue(null);

    await expect(
      PageService.duplicatePage({ pageId: 999 }, 1, {})
    ).rejects.toThrow("Page not found or you don't have access");
  });

  it("should throw error for non-existent target funnel", async () => {
    const originalPage = createMockPage({ funnelId: 1 });

    mockPrisma.page.findFirst = vi.fn().mockResolvedValue(originalPage);
    mockPrisma.funnel.findFirst = vi.fn().mockResolvedValue(null);

    await expect(
      PageService.duplicatePage({ pageId: 1 }, 1, { targetFunnelId: 999 })
    ).rejects.toThrow("Target funnel not found or you don't have access");
  });

  it("should handle duplicate names appropriately", async () => {
    const originalPage = createMockPage({
      funnelId: 1,
      name: "Test Page",
      linkingId: "test-page",
    });
    const duplicatedPage = createMockPage({
      id: 2,
      funnelId: 1,
      name: "Test Page (Copy)",
      linkingId: "test-page-copy",
    });

    mockPrisma.page.findFirst = vi
      .fn()
      .mockResolvedValueOnce(originalPage) // Original page lookup
      .mockResolvedValueOnce(null) // Name check - "Test Page (Copy)" is available
      .mockResolvedValueOnce(null); // LinkingId check

    mockPrisma.page.count = vi.fn().mockResolvedValue(1);
    mockPrisma.page.create = vi.fn().mockResolvedValue(duplicatedPage);

    const result = await PageService.duplicatePage({ pageId: 1 }, 1, {});

    expect(result.message).toContain("duplicated successfully");
  });
});
