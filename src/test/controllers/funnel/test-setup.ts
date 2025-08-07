import { describe, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import { setPrismaClient } from "../../../services/funnel";
import { setPrismaClient as setThemePrismaClient } from "../../../services/theme.service";
import { cacheService } from "../../../services/cache/cache.service";
import { TestHelpers, testPrisma } from "../../helpers";

// Mock services
vi.mock("../../../services/cache/cache.service");

export const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Mock auth middleware - extract user from header for testing
  app.use((req: any, res: any, next: any) => {
    const userHeader = req.get("x-user-id");
    if (userHeader) {
      req.userId = parseInt(userHeader);
    }
    next();
  });

  return app;
};

export const setupFunnelTest = () => {
  let user: any;
  let mockCache: any;

  beforeEach(async () => {
    // Set test Prisma client for funnel service
    setPrismaClient(testPrisma);
    setThemePrismaClient(testPrisma);

    // Clean up database
    await testPrisma.funnelDomain.deleteMany();
    await testPrisma.page.deleteMany();
    await testPrisma.funnel.deleteMany();
    await testPrisma.theme.deleteMany();
    await testPrisma.user.deleteMany();

    // Create test user
    user = await TestHelpers.createTestUser();

    // Setup mocks
    mockCache = vi.mocked(cacheService);
    mockCache.setUserFunnelCache = vi.fn().mockResolvedValue(undefined);
    vi.clearAllMocks();
  });

  return {
    getUser: () => user,
    getMockCache: () => mockCache,
  };
};