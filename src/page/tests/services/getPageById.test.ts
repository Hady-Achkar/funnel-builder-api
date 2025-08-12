import { describe, it, expect, vi } from "vitest";
import { PageService } from "../../services";
import {
  mockPrisma,
  createMockPage,
  setupPageServiceTest,
  mockCacheService,
} from "./test-setup";

describe("PageService.getPageById", () => {
  setupPageServiceTest();

  it("should validate input parameters with Zod", async () => {
    await expect(PageService.getPageById({ pageId: 0 }, 1)).rejects.toThrow(
      "Page ID must be positive"
    );

    await expect(PageService.getPageById({ pageId: 1 }, 0)).rejects.toThrow(
      "User ID is required"
    );
  });

  it("should fetch page from database successfully", async () => {
    const dbPage = createMockPage({ id: 1, name: "DB Page" });

    mockCacheService.get.mockResolvedValue(null);
    mockPrisma.page.findFirst = vi.fn().mockResolvedValue(dbPage);
    mockCacheService.set.mockResolvedValue(undefined);

    const result = await PageService.getPageById({ pageId: 1 }, 1);

    expect(result.data.name).toBe("DB Page");
    expect(result.message).toBe("Page retrieved successfully");
    expect(mockPrisma.page.findFirst).toHaveBeenCalledWith({
      where: { id: 1, funnel: { userId: 1 } },
    });
  });

  it("should throw error for non-existent page", async () => {
    mockCacheService.get.mockResolvedValue(null);
    mockPrisma.page.findFirst = vi.fn().mockResolvedValue(null);

    await expect(PageService.getPageById({ pageId: 999 }, 1)).rejects.toThrow(
      "Page not found or you don't have access"
    );
  });
});
