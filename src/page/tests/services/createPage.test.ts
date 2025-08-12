import { describe, it, expect, vi } from "vitest";
import { PageService } from "../../services";
import {
  mockPrisma,
  createMockFunnel,
  createMockPage,
  setupPageServiceTest,
} from "./test-setup";

describe("PageService.createPage", () => {
  setupPageServiceTest();

  it("should create page successfully", async () => {
    const mockFunnel = createMockFunnel();
    const mockPage = createMockPage();

    mockPrisma.funnel.findFirst = vi.fn().mockResolvedValue(mockFunnel);
    mockPrisma.page.count = vi.fn().mockResolvedValue(0);
    mockPrisma.page.findFirst = vi.fn().mockResolvedValue(null);
    mockPrisma.page.create = vi.fn().mockResolvedValue(mockPage);

    const result = await PageService.createPage({ funnelId: 1 }, 1, {});

    expect(result.message).toContain("Test Page created successfully");
    expect(mockPrisma.page.create).toHaveBeenCalled();
  });

  it("should throw error for non-existent funnel", async () => {
    mockPrisma.funnel.findFirst = vi.fn().mockResolvedValue(null);

    await expect(
      PageService.createPage({ funnelId: 999 }, 1, {})
    ).rejects.toThrow("Funnel not found");
  });

  it("should generate unique page names when pages exist", async () => {
    const mockFunnel = createMockFunnel();
    const newPage = createMockPage({
      id: 2,
      name: "Page 2",
    });

    mockPrisma.funnel.findFirst = vi.fn().mockResolvedValue(mockFunnel);
    mockPrisma.page.count = vi.fn().mockResolvedValue(1); // 1 existing page
    mockPrisma.page.findFirst = vi
      .fn()
      .mockResolvedValueOnce({ name: "Page 2" }) // First check finds existing "Page 2"
      .mockResolvedValueOnce(null); // Second check for "Page 3" finds nothing
    mockPrisma.page.create = vi.fn().mockResolvedValue(newPage);

    const result = await PageService.createPage({ funnelId: 1 }, 1, {});

    expect(result.message).toContain("created successfully");
    expect(mockPrisma.page.create).toHaveBeenCalled();
  });

  it("should create page with custom name when provided", async () => {
    const mockFunnel = createMockFunnel();
    const customPage = createMockPage({
      name: "Custom Page",
    });

    mockPrisma.funnel.findFirst = vi.fn().mockResolvedValue(mockFunnel);
    mockPrisma.page.count = vi.fn().mockResolvedValue(0);
    mockPrisma.page.findFirst = vi.fn().mockResolvedValue(null);
    mockPrisma.page.create = vi.fn().mockResolvedValue(customPage);

    const result = await PageService.createPage({ funnelId: 1 }, 1, {
      name: "Custom Page",
    });

    expect(result.message).toContain("Custom Page created successfully");
  });

  it("should handle page creation when no existing pages", async () => {
    const mockFunnel = createMockFunnel();
    const firstPage = createMockPage({
      name: "Page 1",
      order: 1,
    });

    mockPrisma.funnel.findFirst = vi.fn().mockResolvedValue(mockFunnel);
    mockPrisma.page.count = vi.fn().mockResolvedValue(0); // No existing pages
    mockPrisma.page.findFirst = vi.fn().mockResolvedValue(null);
    mockPrisma.page.create = vi.fn().mockResolvedValue(firstPage);

    const result = await PageService.createPage({ funnelId: 1 }, 1, {});

    expect(result.message).toContain("Page 1 created successfully");
    expect(mockPrisma.page.create).toHaveBeenCalled();
  });

  it("should validate input parameters with Zod", async () => {
    await expect(
      PageService.createPage({ funnelId: 0 }, 1, {})
    ).rejects.toThrow("Funnel ID must be positive");

    await expect(
      PageService.createPage({ funnelId: 1 }, 0, {})
    ).rejects.toThrow("User ID is required");
  });

  it("should validate SEO fields", async () => {
    const mockFunnel = createMockFunnel();
    const mockPage = createMockPage({
      name: "SEO Page",
      seoTitle: "SEO Title",
      seoDescription: "SEO Description",
    });

    mockPrisma.funnel.findFirst = vi.fn().mockResolvedValue(mockFunnel);
    mockPrisma.page.count = vi.fn().mockResolvedValue(0);
    mockPrisma.page.findFirst = vi.fn().mockResolvedValue(null);
    mockPrisma.page.create = vi.fn().mockResolvedValue(mockPage);

    const result = await PageService.createPage({ funnelId: 1 }, 1, {
      name: "SEO Page",
      seoTitle: "SEO Title",
      seoDescription: "SEO Description",
      seoKeywords: "keyword1, keyword2",
    });

    expect(result.message).toContain("SEO Page created successfully");
    expect(mockPrisma.page.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        seoTitle: "SEO Title",
        seoDescription: "SEO Description",
        seoKeywords: "keyword1, keyword2",
      }),
    });
  });
});
