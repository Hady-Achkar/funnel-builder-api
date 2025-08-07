import { describe, it, expect, vi } from "vitest";
import { PageService } from "../../../services/page";
import { 
  mockPrisma, 
  createMockFunnel, 
  createMockPage, 
  setupPageServiceTest
} from "./test-setup";

describe("PageService.duplicatePage", () => {
  setupPageServiceTest();

  it("should duplicate page successfully within same funnel", async () => {
    const funnel = createMockFunnel({ id: 1 });
    const originalPage = createMockPage({ 
      funnelId: 1, 
      name: "Original Page",
      content: "<h1>Original Content</h1>"
    });
    const duplicatedPage = createMockPage({ 
      id: 2, 
      funnelId: 1, 
      name: "Original Page (Copy)", 
      content: "<h1>Original Content</h1>",
      order: 2 
    });

    mockPrisma.page.findFirst = vi.fn().mockResolvedValue({ 
      ...originalPage, 
      funnel 
    });
    mockPrisma.page.findMany = vi.fn()
      .mockResolvedValueOnce([{ name: "Original Page", linkingId: "original", order: 1 }]) // existing pages check
      .mockResolvedValueOnce([]); // pushed pages query
    mockPrisma.page.create = vi.fn().mockResolvedValue(duplicatedPage);
    mockPrisma.$transaction = vi.fn().mockImplementation(async (callback) => {
      if (Array.isArray(callback)) {
        return Promise.all(callback.map(() => Promise.resolve()));
      }
      return callback;
    });

    const result = await PageService.duplicatePage(1, 1);

    expect(result.id).toBe(2);
    expect(result.name).toBe("Original Page (Copy)");
    expect(result.funnelId).toBe(1);
    expect(result.order).toBe(2);
    expect(result.message).toContain("duplicated successfully");
  });

  it("should duplicate page to different funnel", async () => {
    const sourceFunnel = createMockFunnel({ id: 1 });
    const targetFunnel = createMockFunnel({ id: 2 });
    const originalPage = createMockPage({ funnelId: 1, name: "Original Page" });
    const duplicatedPage = createMockPage({ 
      id: 2, 
      funnelId: 2, 
      name: "Original Page", 
      order: 1 
    });

    mockPrisma.page.findFirst = vi.fn()
      .mockResolvedValueOnce({ ...originalPage, funnel: sourceFunnel })
      .mockResolvedValueOnce(null); // For order calculation
    mockPrisma.funnel.findFirst = vi.fn().mockResolvedValue(targetFunnel);
    mockPrisma.page.findMany = vi.fn().mockResolvedValue([]);
    mockPrisma.page.create = vi.fn().mockResolvedValue(duplicatedPage);

    const result = await PageService.duplicatePage(1, 1, { targetFunnelId: 2 });

    expect(result.id).toBe(2);
    expect(result.funnelId).toBe(2);
    expect(result.name).toBe("Original Page");
    expect(result.message).toContain("duplicated successfully");
  });

  it("should throw error for non-existent page", async () => {
    mockPrisma.page.findFirst = vi.fn().mockResolvedValue(null);

    await expect(
      PageService.duplicatePage(999, 1)
    ).rejects.toThrow("Page not found");
  });

  it("should throw error for non-existent target funnel", async () => {
    const originalPage = createMockPage({ funnelId: 1 });
    const funnel = createMockFunnel({ id: 1 });

    mockPrisma.page.findFirst = vi.fn().mockResolvedValue({ 
      ...originalPage, 
      funnel 
    });
    mockPrisma.funnel.findFirst = vi.fn().mockResolvedValue(null);

    await expect(
      PageService.duplicatePage(1, 1, { targetFunnelId: 999 })
    ).rejects.toThrow("Target funnel not found");
  });

  it("should handle duplicate names appropriately", async () => {
    const funnel = createMockFunnel({ id: 1 });
    const originalPage = createMockPage({ 
      funnelId: 1, 
      name: "Test Page"
    });
    const duplicatedPage = createMockPage({ 
      id: 2, 
      funnelId: 1, 
      name: "Test Page (Copy)" 
    });

    mockPrisma.page.findFirst = vi.fn().mockResolvedValue({ 
      ...originalPage, 
      funnel 
    });
    mockPrisma.page.findMany = vi.fn()
      .mockResolvedValueOnce([{ name: "Test Page", linkingId: "test", order: 1 }])
      .mockResolvedValueOnce([]);
    mockPrisma.page.create = vi.fn().mockResolvedValue(duplicatedPage);
    mockPrisma.$transaction = vi.fn().mockImplementation(async (callback) => {
      if (Array.isArray(callback)) {
        return Promise.all(callback.map(() => Promise.resolve()));
      }
      return callback;
    });

    const result = await PageService.duplicatePage(1, 1);

    expect(result.name).toBe("Test Page (Copy)");
    expect(result.message).toContain("duplicated successfully");
  });

  it("should return all required fields on success", async () => {
    const funnel = createMockFunnel({ id: 1 });
    const originalPage = createMockPage({ 
      funnelId: 1,
      name: "Rich Page",
      linkingId: "rich-page"
    });
    const duplicatedPage = createMockPage({ 
      id: 2,
      funnelId: 1,
      name: "Rich Page (Copy)",
      linkingId: "rich-page-copy",
      order: 2
    });

    mockPrisma.page.findFirst = vi.fn().mockResolvedValue({ 
      ...originalPage, 
      funnel 
    });
    mockPrisma.page.findMany = vi.fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    mockPrisma.page.create = vi.fn().mockResolvedValue(duplicatedPage);
    mockPrisma.$transaction = vi.fn().mockImplementation(async (callback) => {
      if (Array.isArray(callback)) {
        return Promise.all(callback.map(() => Promise.resolve()));
      }
      return callback;
    });

    const result = await PageService.duplicatePage(1, 1);

    expect(result).toMatchObject({
      id: 2,
      name: "Rich Page (Copy)",
      linkingId: "rich-page-copy",
      order: 2,
      funnelId: 1,
      message: expect.stringContaining("duplicated successfully")
    });
  });
});