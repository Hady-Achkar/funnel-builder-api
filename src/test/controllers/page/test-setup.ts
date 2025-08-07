import { describe, beforeEach, vi } from "vitest";
import { Request, Response } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { setPrismaClient } from "../../../services/page";
import { cacheService } from "../../../services/cache/cache.service";
import { TestHelpers, testPrisma } from "../../helpers";

// Mock services
vi.mock("../../../services/cache/cache.service");

export const setupPageControllerTest = () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let user: any;
  let funnel: any;
  let mockCache: any;

  beforeEach(async () => {
    // Set test Prisma client for page service
    setPrismaClient(testPrisma);

    // Create test user and funnel
    user = await TestHelpers.createTestUser();
    funnel = await TestHelpers.createTestFunnel(user.id, {
      name: "Test Funnel"
    });

    // Setup mocks
    mockCache = vi.mocked(cacheService);
    mockCache.setUserFunnelCache = vi.fn().mockResolvedValue(undefined);
    mockCache.setPageCache = vi.fn().mockResolvedValue(undefined);
    vi.clearAllMocks();

    mockReq = {
      userId: user.id,
      body: { funnelId: funnel.id },
      params: { funnelId: funnel.id.toString() },
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  return {
    getMockReq: () => mockReq as AuthRequest,
    getMockRes: () => mockRes as Response,
    setMockReq: (req: Partial<AuthRequest>) => { mockReq = { ...mockReq, ...req }; },
    getUser: () => user,
    getFunnel: () => funnel,
    getMockCache: () => mockCache,
  };
};