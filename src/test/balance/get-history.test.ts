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
      payout: {
        findMany: vi.fn(),
        count: vi.fn(),
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
      mockPrisma.payout.findMany.mockResolvedValue([]);
      mockPrisma.payout.count.mockResolvedValue(0);
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
        startDate: "2025-01-01",
        endDate: "2025-01-31",
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

    it("should filter by startDate only", async () => {
      mockReq.query = { startDate: "2025-01-01" };

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

    it("should filter by endDate only", async () => {
      mockReq.query = { endDate: "2025-01-31" };

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
        startDate: "2025-01-01",
        endDate: "2025-01-31",
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
      mockPrisma.payout.findMany.mockResolvedValue([]);
      mockPrisma.payout.count.mockResolvedValue(0);
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

  describe("Pagination Metadata", () => {
    beforeEach(() => {
      mockPrisma.payout.findMany.mockResolvedValue([]);
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
    it("should handle database errors", async () => {
      mockPrisma.payout.findMany.mockRejectedValue(
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

      mockPrisma.payout.findMany.mockResolvedValue([mockPayout]);
      mockPrisma.payout.count.mockResolvedValue(1);

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

      mockPrisma.payout.findMany.mockResolvedValue([mockPayout]);
      mockPrisma.payout.count.mockResolvedValue(1);

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
