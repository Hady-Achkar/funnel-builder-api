import { describe, it, expect, vi } from "vitest";
import { FunnelService } from "../../../services/funnel";
import { 
  mockPrisma, 
  createMockUser, 
  createMockTheme, 
  createMockFunnel, 
  createMockPage,
  setupFunnelServiceTest 
} from "./test-setup";

describe("FunnelService.createFunnel", () => {
  setupFunnelServiceTest();

  it("should create funnel successfully with valid data", async () => {
    const mockUser = createMockUser();
    const mockTheme = createMockTheme();
    const mockFunnel = createMockFunnel();
    const mockPage = createMockPage();

    mockPrisma.user.findUnique = vi.fn().mockResolvedValue(mockUser);
    mockPrisma.funnel.count = vi.fn().mockResolvedValue(0);
    mockPrisma.$transaction = vi.fn().mockImplementation(async (callback) => {
      const transactionalPrisma = {
        funnel: { 
          create: vi.fn().mockResolvedValue(mockFunnel),
          update: vi.fn().mockResolvedValue({ ...mockFunnel, themeId: mockTheme.id, theme: mockTheme })
        },
        theme: { create: vi.fn().mockResolvedValue(mockTheme) },
        page: { create: vi.fn().mockResolvedValue(mockPage) },
      };
      return await callback(transactionalPrisma);
    });

    const result = await FunnelService.createFunnel(1, { name: "Test Funnel" });

    expect(result.id).toBe(1);
    expect(result.name).toBe("Test Funnel");
    expect(result.message).toContain("created successfully");
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it("should throw error for invalid userId", async () => {
    const userId = 0;
    const funnelData = { name: "Test Funnel" };

    await expect(
      FunnelService.createFunnel(userId, funnelData)
    ).rejects.toThrow("Invalid user ID provided");
  });

  it("should throw error when name is missing", async () => {
    const userId = 1;
    const funnelData = { name: " " }; // Space will be trimmed to empty

    await expect(
      FunnelService.createFunnel(userId, funnelData)
    ).rejects.toThrow("Funnel name cannot be empty");
  });

  it("should throw error when user is not found", async () => {
    mockPrisma.user.findUnique = vi.fn().mockResolvedValue(null);

    await expect(
      FunnelService.createFunnel(1, { name: "Test Funnel" })
    ).rejects.toThrow("User not found");
  });

  it("should throw error when maximum funnel limit is reached", async () => {
    const mockUser = createMockUser(1, 2);
    mockPrisma.user.findUnique = vi.fn().mockResolvedValue(mockUser);
    mockPrisma.funnel.count = vi.fn().mockResolvedValue(2);

    await expect(
      FunnelService.createFunnel(1, { name: "Test Funnel" })
    ).rejects.toThrow("Maximum funnel limit reached");
  });

  it("should create funnel when under maximum limit", async () => {
    const mockUser = createMockUser(1, 3);
    const mockTheme = createMockTheme();
    const mockFunnel = createMockFunnel();
    const mockPage = createMockPage();

    mockPrisma.user.findUnique = vi.fn().mockResolvedValue(mockUser);
    mockPrisma.funnel.count = vi.fn().mockResolvedValue(1);
    mockPrisma.$transaction = vi.fn().mockImplementation(async (callback) => {
      const transactionalPrisma = {
        funnel: { 
          create: vi.fn().mockResolvedValue(mockFunnel),
          update: vi.fn().mockResolvedValue({ ...mockFunnel, themeId: mockTheme.id, theme: mockTheme })
        },
        theme: { create: vi.fn().mockResolvedValue(mockTheme) },
        page: { create: vi.fn().mockResolvedValue(mockPage) },
      };
      return await callback(transactionalPrisma);
    });

    const result = await FunnelService.createFunnel(1, { name: "Test Funnel" });

    expect(result.id).toBe(1);
    expect(result.name).toBe("Test Funnel");
  });

  it("should create funnel when no maximum limit is set", async () => {
    const mockUser = createMockUser(1, null);
    const mockTheme = createMockTheme();
    const mockFunnel = createMockFunnel();
    const mockPage = createMockPage();

    mockPrisma.user.findUnique = vi.fn().mockResolvedValue(mockUser);
    mockPrisma.funnel.count = vi.fn().mockResolvedValue(10); // High count should not matter
    mockPrisma.$transaction = vi.fn().mockImplementation(async (callback) => {
      const transactionalPrisma = {
        funnel: { 
          create: vi.fn().mockResolvedValue(mockFunnel),
          update: vi.fn().mockResolvedValue({ ...mockFunnel, themeId: mockTheme.id, theme: mockTheme })
        },
        theme: { create: vi.fn().mockResolvedValue(mockTheme) },
        page: { create: vi.fn().mockResolvedValue(mockPage) },
      };
      return await callback(transactionalPrisma);
    });

    const result = await FunnelService.createFunnel(1, { name: "Test Funnel" });

    expect(result.id).toBe(1);
    expect(result.name).toBe("Test Funnel");
  });

  it("should throw error for invalid status", async () => {
    await expect(
      FunnelService.createFunnel(1, { name: "Test Funnel", status: "INVALID" as any })
    ).rejects.toThrow("Status must be one of");
  });
});