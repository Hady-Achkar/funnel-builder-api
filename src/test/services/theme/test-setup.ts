import { vi } from "vitest";
import { PrismaClient } from "../../../generated/prisma-client";
import { BorderRadius } from "../../../types/theme.types";
import { setPrismaClient } from "../../../services/theme";

// Mock CacheService before anything else
const mockCacheService = {
  getUserFunnelCache: vi.fn(),
  setUserFunnelCache: vi.fn(),
};

vi.mock("../../../services/cache/cache.service", () => ({
  CacheService: {
    getInstance: vi.fn().mockReturnValue(mockCacheService)
  }
}));

// Create mock Prisma client
export const mockPrisma = {
  theme: {
    create: vi.fn() as any,
    findMany: vi.fn() as any,
    findFirst: vi.fn() as any,
    update: vi.fn() as any,
    delete: vi.fn() as any,
  },
  funnel: {
    findFirst: vi.fn() as any,
    update: vi.fn() as any,
  },
  $transaction: vi.fn() as any,
} as unknown as PrismaClient;

// Helper function to create complete theme data
export const createThemeData = (overrides: any = {}) => ({
  name: "Test Theme",
  funnelId: 1,
  backgroundColor: "#ffffff",
  textColor: "#000000",
  buttonColor: "#007bff",
  buttonTextColor: "#ffffff",
  borderColor: "#dee2e6",
  optionColor: "#f8f9fa",
  fontFamily: "Arial, sans-serif",
  borderRadius: BorderRadius.SOFT,
  ...overrides,
});

// Export the mock cache service (defined above)
export { mockCacheService };

// Setup function to initialize mocks
export const setupMocks = () => {
  vi.clearAllMocks();
  setPrismaClient(mockPrisma);
  
  // Reset cache service mocks
  mockCacheService.getUserFunnelCache.mockReset();
  mockCacheService.setUserFunnelCache.mockReset();
};

// Reset function to clean up after tests
export const resetMocks = () => {
  vi.resetAllMocks();
};