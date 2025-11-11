import { describe, it, expect, beforeEach, vi } from "vitest";
import { Request, Response, NextFunction } from "express";
import { GetAllAffiliateLinksController } from "../../controllers/affiliate/get-all-affiliate-links";
import { getPrisma } from "../../lib/prisma";
import { UserPlan } from "../../generated/prisma-client";

// Mock Prisma
vi.mock("../../lib/prisma");

interface AuthRequest extends Request {
  userId?: number;
}

describe("GetAllAffiliateLinksController", () => {
  let mockPrisma: any;
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Create mock Prisma client
    mockPrisma = {
      affiliateLink: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
    };

    vi.mocked(getPrisma).mockReturnValue(mockPrisma as any);

    // Create mock request
    mockReq = {
      userId: 1,
      query: {},
    };

    // Create mock response
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    // Create mock next function
    mockNext = vi.fn();
  });

  describe("Authentication", () => {
    it("should return 401 if user is not authenticated", async () => {
      delete mockReq.userId;

      await GetAllAffiliateLinksController.getAllAffiliateLinks(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Please sign in to view your affiliate links",
      });
    });
  });

  describe("Validation", () => {
    it("should handle invalid page number", async () => {
      mockReq.query = { page: "0" };

      await GetAllAffiliateLinksController.getAllAffiliateLinks(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Invalid request parameters",
        })
      );
    });

    it("should handle negative limit", async () => {
      mockReq.query = { limit: "-5" };

      await GetAllAffiliateLinksController.getAllAffiliateLinks(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should handle limit exceeding maximum", async () => {
      mockReq.query = { limit: "101" };

      await GetAllAffiliateLinksController.getAllAffiliateLinks(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should handle invalid sort field", async () => {
      mockReq.query = { sortBy: "invalidField" };

      await GetAllAffiliateLinksController.getAllAffiliateLinks(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Success Cases - Basic Retrieval", () => {
    beforeEach(() => {
      // Setup default successful responses
      mockPrisma.affiliateLink.findMany.mockResolvedValue([
        {
          id: 1,
          name: "My Affiliate Link",
          token: "test-token-123",
          clickCount: 150,
          totalAmount: 500,
          createdAt: new Date("2025-01-15T10:00:00.000Z"),
          workspace: {
            name: "Test Workspace",
          },
          subscribedUsers: [
            {
              email: "user1@example.com",
              firstName: "John",
              lastName: "Doe",
              plan: UserPlan.BUSINESS,
              avatar: "https://example.com/avatar1.jpg",
              createdAt: new Date("2025-01-20T15:30:00.000Z"),
            },
            {
              email: "user2@example.com",
              firstName: "Jane",
              lastName: "Smith",
              plan: UserPlan.FREE,
              avatar: null,
              createdAt: new Date("2025-01-22T10:00:00.000Z"),
            },
          ],
        },
      ]);

      mockPrisma.affiliateLink.count.mockResolvedValue(1);
    });

    it("should retrieve affiliate links with default pagination", async () => {
      await GetAllAffiliateLinksController.getAllAffiliateLinks(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          affiliateLinks: expect.arrayContaining([
            expect.objectContaining({
              name: "My Affiliate Link",
              workspaceName: "Test Workspace",
              clickCount: 150,
              totalEarnings: 500,
              cvr: expect.any(Number), // CVR should be calculated
              url: expect.stringContaining("/register?affiliate=test-token-123"),
              createdAt: expect.any(Date),
              subscribedUsers: expect.arrayContaining([
                expect.objectContaining({
                  email: "user1@example.com",
                  firstName: "John",
                  lastName: "Doe",
                  plan: UserPlan.BUSINESS,
                }),
              ]),
            }),
          ]),
          pagination: expect.objectContaining({
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          }),
          filters: expect.any(Object),
        })
      );
    });

    it("should retrieve affiliate links with custom pagination", async () => {
      mockReq.query = { page: "2", limit: "5" };
      mockPrisma.affiliateLink.count.mockResolvedValue(15);

      await GetAllAffiliateLinksController.getAllAffiliateLinks(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockPrisma.affiliateLink.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page 2 - 1) * limit 5
          take: 5,
        })
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            page: 2,
            limit: 5,
            total: 15,
            totalPages: 3,
            hasNext: true,
            hasPrev: true,
          }),
        })
      );
    });

    it("should include all subscribed users without pagination", async () => {
      await GetAllAffiliateLinksController.getAllAffiliateLinks(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      const response = (mockRes.json as any).mock.calls[0][0];
      expect(response.affiliateLinks[0].subscribedUsers).toHaveLength(2);
      expect(response.affiliateLinks[0].subscribedUsers[0]).toEqual({
        email: "user1@example.com",
        firstName: "John",
        lastName: "Doe",
        plan: UserPlan.BUSINESS,
        avatar: "https://example.com/avatar1.jpg",
        createdAt: expect.any(Date),
      });
    });
  });

  describe("Success Cases - Filtering", () => {
    beforeEach(() => {
      mockPrisma.affiliateLink.findMany.mockResolvedValue([]);
      mockPrisma.affiliateLink.count.mockResolvedValue(0);
    });

    it("should filter by date range", async () => {
      mockReq.query = {
        startDate: "2025-01-01",
        endDate: "2025-01-31",
      };

      await GetAllAffiliateLinksController.getAllAffiliateLinks(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockPrisma.affiliateLink.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });

    it("should filter by startDate only", async () => {
      mockReq.query = { startDate: "2025-01-01" };

      await GetAllAffiliateLinksController.getAllAffiliateLinks(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockPrisma.affiliateLink.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        })
      );
    });

    it("should filter by endDate only", async () => {
      mockReq.query = { endDate: "2025-01-31" };

      await GetAllAffiliateLinksController.getAllAffiliateLinks(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockPrisma.affiliateLink.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });

    it("should search by link name", async () => {
      mockReq.query = { search: "promo" };

      await GetAllAffiliateLinksController.getAllAffiliateLinks(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockPrisma.affiliateLink.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.objectContaining({
              contains: "promo",
              mode: "insensitive",
            }),
          }),
        })
      );
    });

    it("should combine multiple filters", async () => {
      mockReq.query = {
        startDate: "2025-01-01",
        endDate: "2025-01-31",
        search: "holiday",
      };

      await GetAllAffiliateLinksController.getAllAffiliateLinks(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockPrisma.affiliateLink.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 1,
            name: expect.objectContaining({
              contains: "holiday",
            }),
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });
  });

  describe("Success Cases - Sorting", () => {
    beforeEach(() => {
      mockPrisma.affiliateLink.findMany.mockResolvedValue([]);
      mockPrisma.affiliateLink.count.mockResolvedValue(0);
    });

    it("should sort by createdAt desc (default)", async () => {
      await GetAllAffiliateLinksController.getAllAffiliateLinks(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockPrisma.affiliateLink.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        })
      );
    });

    it("should sort by clickCount asc", async () => {
      mockReq.query = { sortBy: "clickCount", sortOrder: "asc" };

      await GetAllAffiliateLinksController.getAllAffiliateLinks(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockPrisma.affiliateLink.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { clickCount: "asc" },
        })
      );
    });

    it("should sort by totalEarnings desc", async () => {
      mockReq.query = { sortBy: "totalEarnings", sortOrder: "desc" };

      await GetAllAffiliateLinksController.getAllAffiliateLinks(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockPrisma.affiliateLink.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { totalAmount: "desc" }, // Maps to totalAmount in DB
        })
      );
    });

    it("should sort by name asc", async () => {
      mockReq.query = { sortBy: "name", sortOrder: "asc" };

      await GetAllAffiliateLinksController.getAllAffiliateLinks(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockPrisma.affiliateLink.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: "asc" },
        })
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty results", async () => {
      mockPrisma.affiliateLink.findMany.mockResolvedValue([]);
      mockPrisma.affiliateLink.count.mockResolvedValue(0);

      await GetAllAffiliateLinksController.getAllAffiliateLinks(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          affiliateLinks: [],
          pagination: expect.objectContaining({
            total: 0,
            totalPages: 0,
          }),
        })
      );
    });

    it("should handle affiliate link with no subscribed users", async () => {
      mockPrisma.affiliateLink.findMany.mockResolvedValue([
        {
          id: 1,
          name: "Empty Link",
          token: "empty-token",
          clickCount: 0,
          totalAmount: 0,
          createdAt: new Date("2025-01-15T10:00:00.000Z"),
          workspace: {
            name: "Test Workspace",
          },
          subscribedUsers: [],
        },
      ]);
      mockPrisma.affiliateLink.count.mockResolvedValue(1);

      await GetAllAffiliateLinksController.getAllAffiliateLinks(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      const response = (mockRes.json as any).mock.calls[0][0];
      expect(response.affiliateLinks[0].subscribedUsers).toEqual([]);
    });

    it("should handle affiliate link with null avatar users", async () => {
      mockPrisma.affiliateLink.findMany.mockResolvedValue([
        {
          id: 1,
          name: "Test Link",
          token: "test-token",
          clickCount: 5,
          totalAmount: 100,
          createdAt: new Date("2025-01-15T10:00:00.000Z"),
          workspace: {
            name: "Test Workspace",
          },
          subscribedUsers: [
            {
              email: "user@example.com",
              firstName: "John",
              lastName: "Doe",
              plan: UserPlan.FREE,
              avatar: null,
              createdAt: new Date("2025-01-20T15:30:00.000Z"),
            },
          ],
        },
      ]);
      mockPrisma.affiliateLink.count.mockResolvedValue(1);

      await GetAllAffiliateLinksController.getAllAffiliateLinks(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      const response = (mockRes.json as any).mock.calls[0][0];
      expect(response.affiliateLinks[0].subscribedUsers[0].avatar).toBeNull();
    });

    it("should construct correct URL format", async () => {
      process.env.FRONTEND_URL = "https://test.com";
      mockPrisma.affiliateLink.findMany.mockResolvedValue([
        {
          id: 1,
          name: "Test Link",
          token: "abc123xyz",
          clickCount: 0,
          totalAmount: 0,
          createdAt: new Date(),
          workspace: { name: "Test Workspace" },
          subscribedUsers: [],
        },
      ]);
      mockPrisma.affiliateLink.count.mockResolvedValue(1);

      await GetAllAffiliateLinksController.getAllAffiliateLinks(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      const response = (mockRes.json as any).mock.calls[0][0];
      expect(response.affiliateLinks[0].url).toBe(
        "https://test.com/register?affiliate=abc123xyz"
      );
    });
  });

  describe("Response Structure", () => {
    it("should not include success or message fields", async () => {
      mockPrisma.affiliateLink.findMany.mockResolvedValue([]);
      mockPrisma.affiliateLink.count.mockResolvedValue(0);

      await GetAllAffiliateLinksController.getAllAffiliateLinks(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      const response = (mockRes.json as any).mock.calls[0][0];
      expect(response).not.toHaveProperty("success");
      expect(response).not.toHaveProperty("message");
    });

    it("should include filters in response", async () => {
      mockReq.query = {
        startDate: "2025-01-01",
        endDate: "2025-01-31",
        search: "test",
      };
      mockPrisma.affiliateLink.findMany.mockResolvedValue([]);
      mockPrisma.affiliateLink.count.mockResolvedValue(0);

      await GetAllAffiliateLinksController.getAllAffiliateLinks(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      const response = (mockRes.json as any).mock.calls[0][0];
      expect(response.filters).toEqual({
        startDate: expect.any(String),
        endDate: expect.any(String),
        search: "test",
      });
    });
  });

  describe("CVR Calculation", () => {
    it("should calculate CVR correctly with clicks and conversions", async () => {
      mockPrisma.affiliateLink.findMany.mockResolvedValue([
        {
          id: 1,
          name: "Test Link",
          token: "test-token",
          clickCount: 100,
          totalAmount: 200,
          createdAt: new Date("2025-01-15T10:00:00.000Z"),
          workspace: {
            name: "Test Workspace",
          },
          subscribedUsers: [
            {
              email: "user1@example.com",
              firstName: "John",
              lastName: "Doe",
              plan: UserPlan.BUSINESS,
              avatar: null,
              createdAt: new Date("2025-01-20T15:30:00.000Z"),
            },
            {
              email: "user2@example.com",
              firstName: "Jane",
              lastName: "Smith",
              plan: UserPlan.BUSINESS,
              avatar: null,
              createdAt: new Date("2025-01-22T10:00:00.000Z"),
            },
          ],
        },
      ]);
      mockPrisma.affiliateLink.count.mockResolvedValue(1);

      await GetAllAffiliateLinksController.getAllAffiliateLinks(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      const response = (mockRes.json as any).mock.calls[0][0];
      // CVR = (2 subscribers / 100 clicks) * 100 = 2.00%
      expect(response.affiliateLinks[0].cvr).toBe(2.00);
    });

    it("should return 0 CVR when there are no clicks", async () => {
      mockPrisma.affiliateLink.findMany.mockResolvedValue([
        {
          id: 1,
          name: "No Clicks Link",
          token: "test-token",
          clickCount: 0,
          totalAmount: 0,
          createdAt: new Date("2025-01-15T10:00:00.000Z"),
          workspace: {
            name: "Test Workspace",
          },
          subscribedUsers: [],
        },
      ]);
      mockPrisma.affiliateLink.count.mockResolvedValue(1);

      await GetAllAffiliateLinksController.getAllAffiliateLinks(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      const response = (mockRes.json as any).mock.calls[0][0];
      expect(response.affiliateLinks[0].cvr).toBe(0);
    });

    it("should round CVR to 2 decimal places", async () => {
      mockPrisma.affiliateLink.findMany.mockResolvedValue([
        {
          id: 1,
          name: "Test Link",
          token: "test-token",
          clickCount: 300,
          totalAmount: 150,
          createdAt: new Date("2025-01-15T10:00:00.000Z"),
          workspace: {
            name: "Test Workspace",
          },
          subscribedUsers: [
            {
              email: "user1@example.com",
              firstName: "John",
              lastName: "Doe",
              plan: UserPlan.BUSINESS,
              avatar: null,
              createdAt: new Date("2025-01-20T15:30:00.000Z"),
            },
          ],
        },
      ]);
      mockPrisma.affiliateLink.count.mockResolvedValue(1);

      await GetAllAffiliateLinksController.getAllAffiliateLinks(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      const response = (mockRes.json as any).mock.calls[0][0];
      // CVR = (1 subscriber / 300 clicks) * 100 = 0.333...% -> rounded to 0.33%
      expect(response.affiliateLinks[0].cvr).toBe(0.33);
    });
  });

  describe("NO_PLAN User Filtering", () => {
    it("should verify query excludes NO_PLAN users", async () => {
      mockPrisma.affiliateLink.findMany.mockResolvedValue([]);
      mockPrisma.affiliateLink.count.mockResolvedValue(0);

      await GetAllAffiliateLinksController.getAllAffiliateLinks(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      // Verify the Prisma query includes the filter for NO_PLAN
      expect(mockPrisma.affiliateLink.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            subscribedUsers: expect.objectContaining({
              where: expect.objectContaining({
                plan: {
                  not: "NO_PLAN",
                },
              }),
            }),
          }),
        })
      );
    });

    it("should not include NO_PLAN users in subscribed users list", async () => {
      // Note: In real implementation, NO_PLAN users are filtered at DB level
      // This test verifies the expected behavior
      mockPrisma.affiliateLink.findMany.mockResolvedValue([
        {
          id: 1,
          name: "Test Link",
          token: "test-token",
          clickCount: 50,
          totalAmount: 100,
          createdAt: new Date("2025-01-15T10:00:00.000Z"),
          workspace: {
            name: "Test Workspace",
          },
          subscribedUsers: [
            // Only users with paid plans (NO_PLAN filtered out by Prisma)
            {
              email: "paid-user@example.com",
              firstName: "Paid",
              lastName: "User",
              plan: UserPlan.BUSINESS,
              avatar: null,
              createdAt: new Date("2025-01-20T15:30:00.000Z"),
            },
          ],
        },
      ]);
      mockPrisma.affiliateLink.count.mockResolvedValue(1);

      await GetAllAffiliateLinksController.getAllAffiliateLinks(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      const response = (mockRes.json as any).mock.calls[0][0];
      const users = response.affiliateLinks[0].subscribedUsers;

      // Should only have 1 user (NO_PLAN user filtered out)
      expect(users).toHaveLength(1);
      expect(users[0].plan).toBe(UserPlan.BUSINESS);
      expect(users[0].plan).not.toBe(UserPlan.NO_PLAN);

      // CVR should be calculated based on paid users only
      // (1 paid user / 50 clicks) * 100 = 2%
      expect(response.affiliateLinks[0].cvr).toBe(2.00);
    });
  });
});
