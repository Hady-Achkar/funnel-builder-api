import { describe, it, expect, vi } from "vitest";
import { PageService } from "../../services";
import { 
  mockPrisma, 
  createMockPage, 
  createMockFunnel,
  setupPageServiceTest,
  mockCacheService
} from "./test-setup";

describe("PageService.reorderPages", () => {
  setupPageServiceTest();

  it("should reorder pages successfully", async () => {
    const mockFunnel = createMockFunnel({
      id: 1,
      userId: 1,
    });

    const mockPages = [
      createMockPage({ id: 1, order: 1 }),
      createMockPage({ id: 2, order: 2 }),
    ];

    mockPrisma.funnel.findFirst = vi.fn().mockResolvedValue(mockFunnel);
    mockPrisma.page.findMany = vi.fn().mockResolvedValue(mockPages);
    mockPrisma.$transaction = vi.fn().mockResolvedValue([]);
    mockCacheService.get.mockResolvedValue(null);

    const result = await PageService.reorderPages(
      { funnelId: 1 },
      1,
      {
        pageOrders: [
          { id: 1, order: 2 },
          { id: 2, order: 1 },
        ],
      }
    );

    expect(mockPrisma.funnel.findFirst).toHaveBeenCalledWith({
      where: { id: 1, userId: 1 },
    });

    expect(mockPrisma.page.findMany).toHaveBeenCalledWith({
      where: { funnelId: 1 },
      select: { id: true, order: true },
    });

    expect(result).toEqual({
      message: "Successfully reordered funnel pages",
    });
  });

  it("should throw error if funnel not found", async () => {
    mockPrisma.funnel.findFirst = vi.fn().mockResolvedValue(null);

    await expect(
      PageService.reorderPages(
        { funnelId: 1 },
        1,
        {
          pageOrders: [
            { id: 1, order: 1 },
            { id: 2, order: 2 },
          ],
        }
      )
    ).rejects.toThrow("Page reordering failed: Funnel not found or you don't have access.");
  });

  it("should throw error if page not found in funnel", async () => {
    const mockFunnel = createMockFunnel({
      id: 1,
      userId: 1,
    });

    const mockPages = [
      createMockPage({ id: 1, order: 1 }),
      createMockPage({ id: 2, order: 2 }),
    ];

    mockPrisma.funnel.findFirst = vi.fn().mockResolvedValue(mockFunnel);
    mockPrisma.page.findMany = vi.fn().mockResolvedValue(mockPages);

    await expect(
      PageService.reorderPages(
        { funnelId: 1 },
        1,
        {
          pageOrders: [
            { id: 999, order: 1 },
            { id: 2, order: 2 },
          ],
        }
      )
    ).rejects.toThrow("Page reordering failed: Page with ID 999 not found in funnel.");
  });

  it("should handle invalid input", async () => {
    await expect(
      PageService.reorderPages(
        { funnelId: 0 },
        1,
        {
          pageOrders: [
            { id: 1, order: 1 },
            { id: 2, order: 2 },
          ],
        }
      )
    ).rejects.toThrow("Invalid input: Funnel ID must be positive");
  });

  it("should handle missing user ID", async () => {
    await expect(
      PageService.reorderPages(
        { funnelId: 1 },
        0,
        {
          pageOrders: [
            { id: 1, order: 1 },
            { id: 2, order: 2 },
          ],
        }
      )
    ).rejects.toThrow("User ID is required");
  });
});