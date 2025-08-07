import { describe, it, expect, vi } from "vitest";
import { PageService } from "../../../services/page";
import { $Enums } from "../../../generated/prisma-client";
import { 
  mockPrisma, 
  createMockFunnel, 
  createMockPage, 
  setupPageServiceTest
} from "./test-setup";

describe("PageService.updatePage", () => {
  setupPageServiceTest();

  it("should update page successfully", async () => {
    const funnel = createMockFunnel({ id: 1 });
    const existingPage = createMockPage({ 
      id: 1, 
      funnelId: 1, 
      name: "Original Name",
      order: 1 
    });
    const updatedPageData = {
      ...existingPage,
      name: "Updated Name",
      seoTitle: "New SEO Title"
    };

    mockPrisma.page.findFirst = vi.fn().mockResolvedValue({ 
      ...existingPage, 
      funnel 
    });
    mockPrisma.page.update = vi.fn().mockResolvedValue(updatedPageData);
    mockPrisma.funnel.findUnique = vi.fn().mockResolvedValue({ 
      ...funnel, 
      status: $Enums.FunnelStatus.DRAFT 
    });

    const updateData = { 
      name: "Updated Name", 
      seoTitle: "New SEO Title" 
    };

    const result = await PageService.updatePage(1, 1, updateData);

    expect(result.success).toBe(true);
    expect(result.data.name).toBe("Updated Name");
    expect(result.data.seoTitle).toBe("New SEO Title");
    expect(result.message).toContain("updated successfully");
  });

  it("should return success message when no changes are made", async () => {
    const funnel = createMockFunnel({ id: 1 });
    const existingPage = createMockPage({ 
      id: 1, 
      funnelId: 1, 
      name: "Test Page" 
    });

    mockPrisma.page.findFirst = vi.fn().mockResolvedValue({ 
      ...existingPage, 
      funnel 
    });

    const updateData = { name: "Test Page" }; // Same name - no changes

    const result = await PageService.updatePage(1, 1, updateData);

    expect(result.success).toBe(true);
    expect(result.message).toBe("No changes were made to the page");
    expect(mockPrisma.page.update).not.toHaveBeenCalled();
  });

  it("should handle multiple field updates", async () => {
    const funnel = createMockFunnel({ id: 1 });
    const existingPage = createMockPage({ 
      id: 1, 
      funnelId: 1, 
      name: "Original Name",
      order: 1,
      linkingId: "original-id"
    });
    const updatedPageData = {
      ...existingPage,
      name: "Updated Name",
      order: 2,
      linkingId: "updated-id",
      seoTitle: "New SEO Title"
    };

    mockPrisma.page.findFirst = vi.fn().mockResolvedValue({ 
      ...existingPage, 
      funnel 
    });
    mockPrisma.page.update = vi.fn().mockResolvedValue(updatedPageData);
    mockPrisma.funnel.findUnique = vi.fn().mockResolvedValue({ 
      ...funnel, 
      status: $Enums.FunnelStatus.DRAFT 
    });

    const updateData = { 
      name: "Updated Name",
      order: 2,
      linkingId: "updated-id",
      seoTitle: "New SEO Title"
    };

    const result = await PageService.updatePage(1, 1, updateData);

    expect(result.success).toBe(true);
    expect(result.data.name).toBe("Updated Name");
    expect(result.data.order).toBe(2);
    expect(result.data.linkingId).toBe("updated-id");
    expect(result.data.seoTitle).toBe("New SEO Title");
    expect(result.message).toContain("were updated successfully");
  });

  it("should throw error for non-existent page", async () => {
    mockPrisma.page.findFirst = vi.fn().mockResolvedValue(null);

    const updateData = { name: "Updated Name" };

    await expect(
      PageService.updatePage(999, 1, updateData)
    ).rejects.toThrow("Page not found");
  });
});