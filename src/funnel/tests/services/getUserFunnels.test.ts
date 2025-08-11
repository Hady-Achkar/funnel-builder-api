import { describe, it, expect, vi } from "vitest";
import { FunnelService } from "../../services";
import { mockPrisma, setupFunnelServiceTest, mockCacheService } from "./test-setup";

describe("FunnelService.getUserFunnels", () => {
  setupFunnelServiceTest();

  it("should get user funnels with pagination", async () => {
    const mockFunnels = [
      { id: 1, name: "Funnel 1", status: "LIVE" as const, userId: 1, createdAt: new Date(), updatedAt: new Date(), theme: null },
      { id: 2, name: "Funnel 2", status: "DRAFT" as const, userId: 1, createdAt: new Date(), updatedAt: new Date(), theme: null }
    ];

    // Mock the ID query
    mockPrisma.funnel.findMany = vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]);
    
    // Mock cache service to return cached data
    mockCacheService.getUserFunnelCache = vi.fn()
      .mockResolvedValueOnce(mockFunnels[0]) // First funnel cached
      .mockResolvedValueOnce(mockFunnels[1]); // Second funnel cached

    const result = await FunnelService.getUserFunnels(1);

    expect(result.data).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(10);
  });

  it("should handle pagination parameters", async () => {
    mockPrisma.funnel.findMany = vi.fn().mockResolvedValue([]);
    mockCacheService.getUserFunnelCache = vi.fn().mockResolvedValue(null);

    const result = await FunnelService.getUserFunnels(1, { page: 2, limit: 5 } as any);

    expect(result.pagination.page).toBe(2);
    expect(result.pagination.limit).toBe(5);
    expect(result.data).toHaveLength(0);
  });

  it("should validate status filter", async () => {
    await expect(
      FunnelService.getUserFunnels(1, { status: "INVALID" } as any)
    ).rejects.toThrow("Invalid input");
  });
});