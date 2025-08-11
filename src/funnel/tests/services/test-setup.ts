import { describe, beforeEach, afterEach, vi } from "vitest";
import { FunnelService, setPrismaClient } from "../../services";
import { PrismaClient, $Enums } from "../../../generated/prisma-client";

// Mock the CacheService
export const mockCacheService = {
  setUserFunnelCache: vi.fn(),
  getUserFunnelCache: vi.fn(),
  getFunnelCache: vi.fn(),
  invalidateFunnelCache: vi.fn(),
  invalidateUserFunnelCache: vi.fn(),
};

vi.mock("../../../services/cache/cache.service", () => ({
  cacheService: mockCacheService
}));

// Create mock Prisma client
export const mockPrisma = {
  user: { findUnique: vi.fn() },
  funnel: { 
    create: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), 
    findMany: vi.fn(), count: vi.fn(), update: vi.fn(), delete: vi.fn() 
  },
  page: { create: vi.fn(), deleteMany: vi.fn() },
  theme: { create: vi.fn() },
  domain: { findFirst: vi.fn() },
  funnelDomain: { deleteMany: vi.fn(), updateMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  $transaction: vi.fn(),
} as unknown as PrismaClient;

// Test data helpers
export const createMockUser = (id = 1, maximumFunnels: number | null = null) => ({ id, maximumFunnels });

export const createMockTheme = (id = 1) => ({
  id, name: "Default Theme", backgroundColor: "#ffffff", textColor: "#000000", 
  buttonColor: "#007bff", buttonTextColor: "#ffffff", borderColor: "#dee2e6", 
  optionColor: "#f8f9fa", fontFamily: "Arial, sans-serif", borderRadius: $Enums.BorderRadius.SOFT,
  createdAt: new Date(), updatedAt: new Date()
});

export const createMockFunnel = (id = 1, name = "Test Funnel", userId = 1) => ({
  id, name, status: "DRAFT", userId, createdAt: new Date(), updatedAt: new Date()
});

export const createMockPage = (id = 1, name = "Home", funnelId = 1) => ({
  id, name, content: "", order: 1, linkingId: null, funnelId, 
  createdAt: new Date(), updatedAt: new Date()
});

export const setupFunnelServiceTest = () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setPrismaClient(mockPrisma);
    // Reset cache service mock
    mockCacheService.setUserFunnelCache.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });
};