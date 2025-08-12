import { describe, beforeEach, afterEach, vi } from "vitest";
import { PageService, setPrismaClient } from "../../services";
import { PrismaClient } from "../../../generated/prisma-client";

// Mock the CacheService
export const mockCacheService = {
  set: vi.fn().mockResolvedValue(undefined),
  get: vi.fn().mockResolvedValue(null),
  del: vi.fn().mockResolvedValue(undefined),
  exists: vi.fn().mockResolvedValue(false),
  invalidatePattern: vi.fn().mockResolvedValue(undefined),
  getUserFunnelCache: vi.fn().mockResolvedValue(null),
  setUserFunnelCache: vi.fn().mockResolvedValue(undefined),
};

vi.mock("../../../services/cache/cache.service", () => ({
  cacheService: mockCacheService,
}));

// Also mock the cache-helpers since they directly import cacheService
export const mockCacheHelpers = {
  cachePageData: vi.fn().mockResolvedValue(undefined),
  cachePageSummary: vi.fn().mockResolvedValue(undefined),
  cachePagesList: vi.fn().mockResolvedValue(undefined),
  getCachedPagesList: vi.fn().mockResolvedValue(null),
  getCachedPage: vi.fn().mockResolvedValue(null),
  getCachedPageSummary: vi.fn().mockResolvedValue(null),
  invalidatePage: vi.fn().mockResolvedValue(undefined),
  invalidatePagesList: vi.fn().mockResolvedValue(undefined),
  invalidateFunnelCache: vi.fn().mockResolvedValue(undefined),
  updateFunnelDataCacheWithNewPage: vi.fn().mockResolvedValue(undefined),
  updateFunnelCachesWithUpdatedPage: vi.fn().mockResolvedValue(undefined),
  invalidatePageCache: vi.fn().mockResolvedValue(undefined),
  updatePagesCacheAfterReorder: vi.fn().mockResolvedValue(undefined),
};

vi.mock("../../../services/page/cache-helpers", () => ({
  cachePageData: mockCacheHelpers.cachePageData,
  cachePageSummary: mockCacheHelpers.cachePageSummary,
  cachePagesList: mockCacheHelpers.cachePagesList,
  getCachedPagesList: mockCacheHelpers.getCachedPagesList,
  getCachedPage: mockCacheHelpers.getCachedPage,
  invalidatePageCache: mockCacheHelpers.invalidatePageCache,
  updatePagesCacheAfterReorder: mockCacheHelpers.updatePagesCacheAfterReorder,
  invalidateFunnelCache: mockCacheHelpers.invalidateFunnelCache,
  updateFunnelCachesWithUpdatedPage:
    mockCacheHelpers.updateFunnelCachesWithUpdatedPage,
  updateFunnelDataCacheWithNewPage:
    mockCacheHelpers.updateFunnelDataCacheWithNewPage,
}));

// Create mock Prisma client
export const mockPrisma = {
  page: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    createMany: vi.fn(),
    updateMany: vi.fn(),
  },
  funnel: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
  },
  $transaction: vi.fn(),
} as unknown as PrismaClient;

// Test data helpers
export const createMockPage = (overrides = {}) => ({
  id: 1,
  name: "Test Page",
  content: "Test content",
  order: 1,
  linkingId: "test-page",
  seoTitle: null,
  seoDescription: null,
  seoKeywords: null,
  funnelId: 1,
  visits: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockFunnel = (overrides = {}) => ({
  id: 1,
  name: "Test Funnel",
  status: "DRAFT",
  userId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const setupPageServiceTest = () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setPrismaClient(mockPrisma);
    // Reset cache service mocks to defaults
    mockCacheService.set.mockResolvedValue(undefined);
    mockCacheService.get.mockResolvedValue(null);
    mockCacheService.del.mockResolvedValue(undefined);
    mockCacheService.exists.mockResolvedValue(false);
    mockCacheService.invalidatePattern.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });
};
