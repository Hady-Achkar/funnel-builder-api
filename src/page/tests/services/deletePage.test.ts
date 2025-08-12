import { describe, it, expect, vi } from "vitest";
import { PageService } from "../../services";
import { 
  mockPrisma, 
  createMockPage, 
  setupPageServiceTest
} from "./test-setup";

describe("PageService.deletePage", () => {
  setupPageServiceTest();

  it("should validate input parameters with Zod", async () => {
    await expect(
      PageService.deletePage({ pageId: 0 }, 1)
    ).rejects.toThrow("Invalid input: Page ID must be positive");

    await expect(
      PageService.deletePage({ pageId: 1 }, 0)
    ).rejects.toThrow("User ID is required");
  });

  it("should delete page successfully", async () => {
    const existingPage = createMockPage({ 
      id: 1, 
      funnelId: 1, 
      name: "Test Page",
      order: 1
    });

    mockPrisma.page.findFirst = vi.fn().mockResolvedValue(existingPage);
    mockPrisma.page.count = vi.fn().mockResolvedValue(2); // More than 1 page exists
    mockPrisma.page.delete = vi.fn().mockResolvedValue(existingPage);
    mockPrisma.page.findMany = vi.fn().mockResolvedValue([]);
    mockPrisma.$transaction = vi.fn().mockResolvedValue([]);

    const result = await PageService.deletePage({ pageId: 1 }, 1);

    expect(result.message).toContain("deleted successfully");
    expect(mockPrisma.page.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("should throw error for non-existent page", async () => {
    mockPrisma.page.findFirst = vi.fn().mockResolvedValue(null);

    await expect(
      PageService.deletePage({ pageId: 999 }, 1)
    ).rejects.toThrow("Page deletion failed: Page not found or you don't have access");
  });

  it("should prevent deleting the last page in funnel", async () => {
    const existingPage = createMockPage({ 
      id: 1, 
      funnelId: 1, 
      name: "Last Page"
    });

    mockPrisma.page.findFirst = vi.fn().mockResolvedValue(existingPage);
    mockPrisma.page.count = vi.fn().mockResolvedValue(1); // Only 1 page exists

    await expect(
      PageService.deletePage({ pageId: 1 }, 1)
    ).rejects.toThrow("Page deletion failed: You must have at least one page in the funnel");
  });

  it("should reorder remaining pages after deletion", async () => {
    const existingPage = createMockPage({ 
      id: 1, 
      funnelId: 1, 
      name: "Middle Page",
      order: 2
    });
    const remainingPages = [
      createMockPage({ id: 2, order: 3 }),
      createMockPage({ id: 3, order: 4 })
    ];

    mockPrisma.page.findFirst = vi.fn().mockResolvedValue(existingPage);
    mockPrisma.page.count = vi.fn().mockResolvedValue(3);
    mockPrisma.page.delete = vi.fn().mockResolvedValue(existingPage);
    mockPrisma.page.findMany = vi.fn().mockResolvedValue(remainingPages);
    mockPrisma.$transaction = vi.fn().mockResolvedValue([]);

    const result = await PageService.deletePage({ pageId: 1 }, 1);

    expect(result.message).toContain("deleted successfully");
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });
});