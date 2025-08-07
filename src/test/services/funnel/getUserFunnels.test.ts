import { describe, it, expect, vi } from "vitest";
import { FunnelService } from "../../../services/funnel";
import { mockPrisma, createMockFunnel, setupFunnelServiceTest, mockCacheService } from "./test-setup";

describe("FunnelService.getUserFunnels", () => {
  setupFunnelServiceTest();

  it("should get user funnels with pagination", async () => {
    const mockFunnels = [
      { id: 1, name: "Funnel 1", status: "LIVE", userId: 1, createdAt: new Date(), updatedAt: new Date(), theme: null },
      { id: 2, name: "Funnel 2", status: "DRAFT", userId: 1, createdAt: new Date(), updatedAt: new Date(), theme: null }
    ];

    mockPrisma.funnel.findMany = vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]);
    mockPrisma.funnel.count = vi.fn().mockResolvedValue(2);
    mockCacheService.getUserFunnelCache = vi.fn().mockResolvedValue(null);
    mockPrisma.funnel.findMany = vi.fn()
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }]) // for IDs
      .mockResolvedValueOnce(mockFunnels); // for actual data

    const result = await FunnelService.getUserFunnels(1);

    expect(result.funnels).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
  });

  it("should handle pagination parameters", async () => {
    mockPrisma.funnel.findMany = vi.fn().mockResolvedValue([]);
    mockPrisma.funnel.count = vi.fn().mockResolvedValue(0);

    const result = await FunnelService.getUserFunnels(1, { page: 2, limit: 5 });

    expect(result.pagination.page).toBe(2);
    expect(result.pagination.limit).toBe(5);
  });

  it("should validate status filter", async () => {
    await expect(
      FunnelService.getUserFunnels(1, { status: "INVALID" })
    ).rejects.toThrow("Invalid status");
  });
});