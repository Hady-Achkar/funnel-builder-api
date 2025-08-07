import { describe, it, expect, vi } from "vitest";
import { PageService } from "../../../services/page";
import { 
  mockPrisma, 
  createMockFunnel, 
  createMockPage, 
  setupPageServiceTest
} from "./test-setup";

describe("PageService.createPage", () => {
  setupPageServiceTest();

  it("should create page successfully", async () => {
    const mockFunnel = createMockFunnel();
    const mockPage = createMockPage();

    mockPrisma.funnel.findFirst = vi.fn().mockResolvedValue(mockFunnel);
    mockPrisma.page.findMany = vi.fn().mockResolvedValue([]);
    mockPrisma.page.findFirst = vi.fn().mockResolvedValue(null);
    mockPrisma.page.create = vi.fn().mockResolvedValue(mockPage);

    const result = await PageService.createPage(1, 1);

    expect(result.id).toBe(1);
    expect(result.name).toBe("Test Page");
    expect(result.message).toContain("created successfully");
    expect(mockPrisma.page.create).toHaveBeenCalled();
  });

  it("should throw error for non-existent funnel", async () => {
    mockPrisma.funnel.findFirst = vi.fn().mockResolvedValue(null);

    await expect(
      PageService.createPage(999, 1)
    ).rejects.toThrow("Funnel not found");
  });

  it("should generate unique page names when pages exist", async () => {
    const mockFunnel = createMockFunnel();
    const existingPage = createMockPage({ name: "Page 1" });
    const newPage = createMockPage({ 
      id: 2, 
      name: "Page 2" 
    });

    mockPrisma.funnel.findFirst = vi.fn().mockResolvedValue(mockFunnel);
    mockPrisma.page.findMany = vi.fn().mockResolvedValue([existingPage]);
    mockPrisma.page.findFirst = vi.fn().mockResolvedValue(null);
    mockPrisma.page.create = vi.fn().mockResolvedValue(newPage);

    const result = await PageService.createPage(1, 1);

    expect(result.name).toBe("Page 2");
    expect(mockPrisma.page.create).toHaveBeenCalled();
  });

  it("should create page with custom name when provided", async () => {
    const mockFunnel = createMockFunnel();
    const customPage = createMockPage({
      name: "Custom Page"
    });

    mockPrisma.funnel.findFirst = vi.fn().mockResolvedValue(mockFunnel);
    mockPrisma.page.findMany = vi.fn().mockResolvedValue([]);
    mockPrisma.page.findFirst = vi.fn().mockResolvedValue(null);
    mockPrisma.page.create = vi.fn().mockResolvedValue(customPage);

    const createData = {
      name: "Custom Page"
    };

    const result = await PageService.createPage(1, 1, createData);

    expect(result.name).toBe("Custom Page");
    expect(result.message).toContain("created successfully");
  });

  it("should handle page creation when no existing pages", async () => {
    const mockFunnel = createMockFunnel();
    const firstPage = createMockPage({ 
      name: "Page 1",
      order: 1
    });

    mockPrisma.funnel.findFirst = vi.fn().mockResolvedValue(mockFunnel);
    mockPrisma.page.findMany = vi.fn().mockResolvedValue([]); // No existing pages
    mockPrisma.page.findFirst = vi.fn().mockResolvedValue(null);
    mockPrisma.page.create = vi.fn().mockResolvedValue(firstPage);

    const result = await PageService.createPage(1, 1);

    expect(result.name).toBe("Page 1");
    expect(result.order).toBe(1);
    expect(mockPrisma.page.create).toHaveBeenCalled();
  });

  it("should return page data on successful creation", async () => {
    const mockFunnel = createMockFunnel();
    const mockPage = createMockPage({
      id: 5,
      name: "New Page",
      order: 2,
      linkingId: "new-page-id"
    });

    mockPrisma.funnel.findFirst = vi.fn().mockResolvedValue(mockFunnel);
    mockPrisma.page.findMany = vi.fn().mockResolvedValue([]);
    mockPrisma.page.findFirst = vi.fn().mockResolvedValue(null);
    mockPrisma.page.create = vi.fn().mockResolvedValue(mockPage);

    const result = await PageService.createPage(1, 1);

    expect(result).toMatchObject({
      id: 5,
      name: "New Page",
      order: 2,
      linkingId: "new-page-id",
      message: expect.stringContaining("created successfully")
    });
  });
});