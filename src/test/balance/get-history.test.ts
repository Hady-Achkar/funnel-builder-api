import { describe, it, expect, beforeEach, vi } from "vitest";
import { Request, Response, NextFunction } from "express";
import { GetBalanceHistoryController } from "../../controllers/balance/get-history";
import { getPrisma } from "../../lib/prisma";
import { PayoutStatus, PayoutMethod } from "../../generated/prisma-client";

// Mock Prisma
vi.mock("../../lib/prisma");

interface AuthRequest extends Request {
  userId?: number;
}

describe("GetBalanceHistoryController", () => {
  let mockPrisma: any;
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Create mock Prisma client
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      payout: {
        findMany: vi.fn(),
        count: vi.fn(),
        aggregate: vi.fn(),
      },
    };

    // Make getPrisma() return our mock
    (getPrisma as any).mockReturnValue(mockPrisma);

    // Setup mock request, response, and next
    mockReq = {
      userId: 1,
      query: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  describe("Authentication", () => {
    it("should return 401 if user is not authenticated", async () => {
      mockReq.userId = undefined;

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Please sign in to view your balance",
      });
    });
  });

  describe("Validation", () => {
    it("should handle invalid page number", async () => {
      mockReq.query = { page: "0" };

      await GetBalanceHistoryController.getHistory(
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

    it("should handle negative page number", async () => {
      mockReq.query = { page: "-1" };

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should handle invalid limit (0)", async () => {
      mockReq.query = { limit: "0" };

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should handle invalid limit (> 100)", async () => {
      mockReq.query = { limit: "101" };

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should handle invalid status filter", async () => {
      mockReq.query = { status: "INVALID_STATUS" };

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should handle invalid method filter", async () => {
      mockReq.query = { method: "INVALID_METHOD" };

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should handle invalid sortBy field", async () => {
      mockReq.query = { sortBy: "invalidField" };

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should handle invalid sortOrder", async () => {
      mockReq.query = { sortOrder: "invalid" };

      await GetBalanceHistoryController.getHistory(
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
      mockPrisma.user.findUnique.mockResolvedValue({
        balance: 1000, // Available
        pendingBalance: 50, // Pending
      });

      mockPrisma.payout.findMany.mockResolvedValue([
        {
          id: 1,
          amount: 100,
          fees: 5,
          netAmount: 95,
          status: PayoutStatus.COMPLETED,
          method: PayoutMethod.UAE_BANK,
          createdAt: new Date("2025-01-01"),
          processedAt: new Date("2025-01-02"),
          failureReason: null,
          accountHolderName: "John Doe",
          bankName: "ABC Bank",
          usdtWalletAddress: null,
        },
      ]);

      mockPrisma.payout.count.mockResolvedValue(1);

      // COMPLETED payouts aggregate (for totalWithdrawn)
      mockPrisma.payout.aggregate.mockResolvedValue({
        _sum: { amount: 200 }, // Only COMPLETED payouts
      });
    });

    it("should retrieve balance history with default pagination", async () => {
      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          balance: expect.objectContaining({
            available: 1000, // user.balance
            pending: 50, // user.pendingBalance
            total: 1250, // 1000 + 50 + 200
            totalWithdrawn: 200, // Only COMPLETED payouts
          }),
          payouts: expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              amount: 100,
              fees: 5,
              netAmount: 95,
            }),
          ]),
          pagination: expect.objectContaining({
            page: 1,
            limit: 10,
            total: 1,
          }),
        })
      );
    });

    it("should handle custom page and limit", async () => {
      mockReq.query = { page: "2", limit: "5" };

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockPrisma.payout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page 2 - 1) * limit 5
          take: 5,
        })
      );
    });

    it("should handle empty payout history", async () => {
      mockPrisma.payout.findMany.mockResolvedValue([]);
      mockPrisma.payout.count.mockResolvedValue(0);

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          payouts: [],
          pagination: expect.objectContaining({
            total: 0,
            totalPages: 0,
          }),
        })
      );
    });
  });

  describe("Success Cases - Filtering", () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue({
        balance: 1000,
        pendingBalance: 0,
      });
      mockPrisma.payout.findMany.mockResolvedValue([]);
      mockPrisma.payout.count.mockResolvedValue(0);
      mockPrisma.payout.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
    });

    it("should filter by status", async () => {
      mockReq.query = { status: PayoutStatus.PENDING };

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockPrisma.payout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: PayoutStatus.PENDING,
          }),
        })
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            status: PayoutStatus.PENDING,
          }),
        })
      );
    });

    it("should filter by payment method", async () => {
      mockReq.query = { method: PayoutMethod.USDT };

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockPrisma.payout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            method: PayoutMethod.USDT,
          }),
        })
      );
    });

    it("should filter by date range", async () => {
      mockReq.query = {
        dateFrom: "2025-01-01",
        dateTo: "2025-01-31",
      };

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockPrisma.payout.findMany).toHaveBeenCalledWith(
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

    it("should filter by dateFrom only", async () => {
      mockReq.query = { dateFrom: "2025-01-01" };

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockPrisma.payout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        })
      );
    });

    it("should filter by dateTo only", async () => {
      mockReq.query = { dateTo: "2025-01-31" };

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockPrisma.payout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });

    it("should combine multiple filters", async () => {
      mockReq.query = {
        status: PayoutStatus.COMPLETED,
        method: PayoutMethod.UAE_BANK,
        dateFrom: "2025-01-01",
        dateTo: "2025-01-31",
      };

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockPrisma.payout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 1,
            status: PayoutStatus.COMPLETED,
            method: PayoutMethod.UAE_BANK,
            createdAt: expect.any(Object),
          }),
        })
      );
    });

    it("should handle search parameter", async () => {
      mockReq.query = { search: "John" };

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockPrisma.payout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                accountHolderName: expect.any(Object),
              }),
            ]),
          }),
        })
      );
    });
  });

  describe("Success Cases - Sorting", () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue({
        balance: 1000,
        pendingBalance: 0,
      });
      mockPrisma.payout.findMany.mockResolvedValue([]);
      mockPrisma.payout.count.mockResolvedValue(0);
      mockPrisma.payout.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
    });

    it("should sort by createdAt desc (default)", async () => {
      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockPrisma.payout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        })
      );
    });

    it("should sort by createdAt asc", async () => {
      mockReq.query = { sortBy: "createdAt", sortOrder: "asc" };

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockPrisma.payout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "asc" },
        })
      );
    });

    it("should sort by amount desc", async () => {
      mockReq.query = { sortBy: "amount", sortOrder: "desc" };

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockPrisma.payout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { amount: "desc" },
        })
      );
    });

    it("should sort by status asc", async () => {
      mockReq.query = { sortBy: "status", sortOrder: "asc" };

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockPrisma.payout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { status: "asc" },
        })
      );
    });

    it("should sort by method desc", async () => {
      mockReq.query = { sortBy: "method", sortOrder: "desc" };

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockPrisma.payout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { method: "desc" },
        })
      );
    });
  });

  describe("Balance Calculations", () => {
    it("should calculate correct total from user fields and payouts", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        balance: 1000, // Available
        pendingBalance: 150, // Pending
      });
      mockPrisma.payout.findMany.mockResolvedValue([]);
      mockPrisma.payout.count.mockResolvedValue(0);
      mockPrisma.payout.aggregate.mockResolvedValue({
        _sum: { amount: 500 }, // Only COMPLETED payouts
      });

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          balance: {
            available: 1000, // user.balance
            pending: 150, // user.pendingBalance
            total: 1650, // 1000 + 150 + 500
            totalWithdrawn: 500, // Only COMPLETED payouts
          },
        })
      );
    });

    it("should handle zero pending balance", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        balance: 1000,
        pendingBalance: 0,
      });
      mockPrisma.payout.findMany.mockResolvedValue([]);
      mockPrisma.payout.count.mockResolvedValue(0);
      mockPrisma.payout.aggregate.mockResolvedValue({
        _sum: { amount: 500 },
      });

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          balance: {
            available: 1000,
            pending: 0,
            total: 1500, // 1000 + 0 + 500
            totalWithdrawn: 500,
          },
        })
      );
    });

    it("should handle zero withdrawn amount", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        balance: 500,
        pendingBalance: 100,
      });
      mockPrisma.payout.findMany.mockResolvedValue([]);
      mockPrisma.payout.count.mockResolvedValue(0);
      mockPrisma.payout.aggregate.mockResolvedValue({
        _sum: { amount: null }, // No payouts
      });

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          balance: {
            available: 500,
            pending: 100,
            total: 600, // 500 + 100 + 0
            totalWithdrawn: 0,
          },
        })
      );
    });
  });

  describe("Pagination Metadata", () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue({
        balance: 1000,
        pendingBalance: 0,
      });
      mockPrisma.payout.findMany.mockResolvedValue([]);
      mockPrisma.payout.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
    });

    it("should calculate correct pagination for first page", async () => {
      mockPrisma.payout.count.mockResolvedValue(25);
      mockReq.query = { page: "1", limit: "10" };

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: {
            page: 1,
            limit: 10,
            total: 25,
            totalPages: 3,
            hasNext: true,
            hasPrev: false,
          },
        })
      );
    });

    it("should calculate correct pagination for middle page", async () => {
      mockPrisma.payout.count.mockResolvedValue(25);
      mockReq.query = { page: "2", limit: "10" };

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: {
            page: 2,
            limit: 10,
            total: 25,
            totalPages: 3,
            hasNext: true,
            hasPrev: true,
          },
        })
      );
    });

    it("should calculate correct pagination for last page", async () => {
      mockPrisma.payout.count.mockResolvedValue(25);
      mockReq.query = { page: "3", limit: "10" };

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: {
            page: 3,
            limit: 10,
            total: 25,
            totalPages: 3,
            hasNext: false,
            hasPrev: true,
          },
        })
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle user not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should handle database errors", async () => {
      mockPrisma.user.findUnique.mockRejectedValue(
        new Error("Database error")
      );

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("Payout Data Completeness", () => {
    it("should include all payout fields in response", async () => {
      const mockPayout = {
        id: 123,
        amount: 500,
        fees: 38,
        netAmount: 462,
        status: PayoutStatus.PROCESSING,
        method: PayoutMethod.INTERNATIONAL_BANK,
        createdAt: new Date("2025-01-15"),
        processedAt: null,
        failureReason: null,
        accountHolderName: "Jane Smith",
        bankName: "XYZ International",
        usdtWalletAddress: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        balance: 1000,
        pendingBalance: 0,
      });
      mockPrisma.payout.findMany.mockResolvedValue([mockPayout]);
      mockPrisma.payout.count.mockResolvedValue(1);
      mockPrisma.payout.aggregate.mockResolvedValue({ _sum: { amount: 0 } });

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          payouts: [
            {
              id: 123,
              amount: 500,
              fees: 38,
              netAmount: 462,
              status: PayoutStatus.PROCESSING,
              method: PayoutMethod.INTERNATIONAL_BANK,
              createdAt: expect.any(Date),
              processedAt: null,
              failureReason: null,
              accountHolderName: "Jane Smith",
              bankName: "XYZ International",
              usdtWalletAddress: null,
            },
          ],
        })
      );
    });

    it("should include USDT wallet address for crypto payouts", async () => {
      const mockPayout = {
        id: 456,
        amount: 300,
        fees: 12,
        netAmount: 288,
        status: PayoutStatus.COMPLETED,
        method: PayoutMethod.USDT,
        createdAt: new Date("2025-01-10"),
        processedAt: new Date("2025-01-11"),
        failureReason: null,
        accountHolderName: null,
        bankName: null,
        usdtWalletAddress: "0x1234567890abcdef",
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        balance: 1000,
        pendingBalance: 0,
      });
      mockPrisma.payout.findMany.mockResolvedValue([mockPayout]);
      mockPrisma.payout.count.mockResolvedValue(1);
      mockPrisma.payout.aggregate.mockResolvedValue({ _sum: { amount: 0 } });

      await GetBalanceHistoryController.getHistory(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          payouts: [
            expect.objectContaining({
              usdtWalletAddress: "0x1234567890abcdef",
              method: PayoutMethod.USDT,
            }),
          ],
        })
      );
    });
  });
});
