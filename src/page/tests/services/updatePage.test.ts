import { describe, it, expect, vi } from "vitest";
import { PageService } from "../../services";
import {
  mockPrisma,
  createMockFunnel,
  createMockPage,
  setupPageServiceTest,
} from "./test-setup";

describe("PageService.updatePage", () => {
  setupPageServiceTest();

  it("should update page successfully", async () => {
    const funnel = createMockFunnel({ id: 1 });
    const existingPage = createMockPage({
      id: 1,
      funnelId: 1,
      name: "Original Name",
      order: 1,
    });
    const updatedPageData = {
      ...existingPage,
      name: "Updated Name",
      seoTitle: "New SEO Title",
    };

    mockPrisma.page.findFirst = vi.fn().mockResolvedValue({
      ...existingPage,
      funnel,
    });
    mockPrisma.page.update = vi.fn().mockResolvedValue(updatedPageData);

    const result = await PageService.updatePage({ pageId: 1 }, 1, {
      name: "Updated Name",
      seoTitle: "New SEO Title",
    });

    expect(result.message).toContain("updated successfully");
    expect(mockPrisma.page.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: "Updated Name", seoTitle: "New SEO Title" },
    });
  });

  it("should return success message when no changes are made", async () => {
    const existingPage = createMockPage({
      id: 1,
      funnelId: 1,
      name: "Test Page",
    });

    mockPrisma.page.findFirst = vi.fn().mockResolvedValue(existingPage);

    const result = await PageService.updatePage({ pageId: 1 }, 1, {
      name: "Test Page",
    });

    expect(result.message).toBe("No changes detected");
    expect(mockPrisma.page.update).not.toHaveBeenCalled();
  });

  it("should handle multiple field updates", async () => {
    const existingPage = createMockPage({
      id: 1,
      funnelId: 1,
      name: "Original Name",
      order: 1,
      linkingId: "original-id",
    });
    const updatedPageData = {
      ...existingPage,
      name: "Updated Name",
      order: 2,
      linkingId: "updated-id",
      seoTitle: "New SEO Title",
    };

    mockPrisma.page.findFirst = vi.fn().mockResolvedValue(existingPage);
    mockPrisma.page.update = vi.fn().mockResolvedValue(updatedPageData);

    const result = await PageService.updatePage({ pageId: 1 }, 1, {
      name: "Updated Name",
      order: 2,
      linkingId: "updated-id",
      seoTitle: "New SEO Title",
    });

    expect(result.message).toContain("updated successfully");
    expect(mockPrisma.page.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        name: "Updated Name",
        order: 2,
        linkingId: "updated-id",
        seoTitle: "New SEO Title",
      },
    });
  });

  it("should throw error for non-existent page", async () => {
    mockPrisma.page.findFirst = vi.fn().mockResolvedValue(null);

    await expect(
      PageService.updatePage({ pageId: 999 }, 1, { name: "Updated Name" })
    ).rejects.toThrow("Page not found or you don't have access");
  });

  it("should validate input parameters with Zod", async () => {
    await expect(PageService.updatePage({ pageId: 0 }, 1, {})).rejects.toThrow(
      "Page ID must be positive"
    );

    await expect(PageService.updatePage({ pageId: 1 }, 0, {})).rejects.toThrow(
      "User ID is required"
    );
  });
});
