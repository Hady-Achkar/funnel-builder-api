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

  it("should throw error when pageId is missing", async () => {
    await expect(
      PageService.duplicatePage(null as any, 1)
    ).rejects.toThrow("Please provide pageId and userId.");
  });

  it("should throw error when userId is missing", async () => {
    await expect(
      PageService.duplicatePage(1, null as any)
    ).rejects.toThrow("Please provide pageId and userId.");
  });

  it("should duplicate page successfully within same funnel", async () => {
    const originalPage = createMockPage({ 
      funnelId: 1, 
      name: "Original Page",
      linkingId: "original-page",
      content: "<h1>Original Content</h1>"
    });
    const duplicatedPage = createMockPage({ 
      id: 2, 
      funnelId: 1, 
      name: "Original Page (Copy)", 
      linkingId: "original-page-copy",
      content: "<h1>Original Content</h1>",
      order: 2 
    });

    // Mock for finding the original page
    mockPrisma.page.findFirst = vi.fn()
      .mockResolvedValueOnce(originalPage) // Original page lookup
      .mockResolvedValueOnce(null) // Name check - no duplicate
      .mockResolvedValueOnce(null) // LinkingId check - no duplicate
      .mockResolvedValueOnce({ order: 1 }); // Last page for order calculation

    mockPrisma.page.create = vi.fn().mockResolvedValue(duplicatedPage);

    const result = await PageService.duplicatePage(1, 1);

    expect(result.id).toBe(2);
    expect(result.name).toBe("Original Page (Copy)");
    expect(result.funnelId).toBe(1);
    expect(result.order).toBe(2);
    expect(result.message).toContain("duplicated successfully");
  });

  it("should duplicate page to different funnel", async () => {
    const originalPage = createMockPage({ 
      funnelId: 1, 
      name: "Original Page",
      linkingId: "original-page"
    });
    const targetFunnel = createMockFunnel({ id: 2 });
    const duplicatedPage = createMockPage({ 
      id: 2, 
      funnelId: 2, 
      name: "Original Page",
      linkingId: "original-page", 
      order: 1 
    });

    mockPrisma.page.findFirst = vi.fn()
      .mockResolvedValueOnce(originalPage) // Original page lookup
      .mockResolvedValueOnce(null) // Name check - no duplicate
      .mockResolvedValueOnce(null) // LinkingId check - no duplicate
      .mockResolvedValueOnce(null); // Last page for order - none exists
    
    mockPrisma.funnel.findFirst = vi.fn().mockResolvedValue(targetFunnel);
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
    ).rejects.toThrow("Page not found or you don't have access.");
  });

  it("should throw error for non-existent target funnel", async () => {
    const originalPage = createMockPage({ funnelId: 1 });

    mockPrisma.page.findFirst = vi.fn().mockResolvedValue(originalPage);
    mockPrisma.funnel.findFirst = vi.fn().mockResolvedValue(null);

    await expect(
      PageService.duplicatePage(1, 1, { targetFunnelId: 999 })
    ).rejects.toThrow("Target funnel not found or you don't have access.");
  });

  it("should handle duplicate names appropriately", async () => {
    const originalPage = createMockPage({ 
      funnelId: 1, 
      name: "Test Page",
      linkingId: "test-page"
    });
    const duplicatedPage = createMockPage({ 
      id: 2, 
      funnelId: 1, 
      name: "Test Page (Copy)",
      linkingId: "test-page-copy"
    });

    mockPrisma.page.findFirst = vi.fn()
      .mockResolvedValueOnce(originalPage) // Original page lookup
      .mockResolvedValueOnce(null) // Name check - "Test Page (Copy)" is available
      .mockResolvedValueOnce(null) // LinkingId check
      .mockResolvedValueOnce({ order: 1 }); // Last page for order
    
    mockPrisma.page.create = vi.fn().mockResolvedValue(duplicatedPage);

    const result = await PageService.duplicatePage(1, 1);

    expect(result.name).toBe("Test Page (Copy)");
    expect(result.message).toContain("duplicated successfully");
  });

  it("should return all required fields on success", async () => {
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

    mockPrisma.page.findFirst = vi.fn()
      .mockResolvedValueOnce(originalPage) // Original page lookup
      .mockResolvedValueOnce(null) // Name check
      .mockResolvedValueOnce(null) // LinkingId check
      .mockResolvedValueOnce({ order: 1 }); // Last page for order
    
    mockPrisma.page.create = vi.fn().mockResolvedValue(duplicatedPage);

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