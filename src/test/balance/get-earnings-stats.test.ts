import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { GetEarningsStatsService } from "../../services/balance/get-earnings-stats";
import { GetEarningsStatsController } from "../../controllers/balance/get-earnings-stats";
import { getPrisma } from "../../lib/prisma";
import { PayoutStatus, UserPlan } from "../../generated/prisma-client";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";

vi.mock("../../lib/prisma");

describe("Get Earnings Stats Tests", () => {
  let mockPrisma: any;
  const userId = 1;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        count: vi.fn(),
      },
      affiliateLink: {
        findMany: vi.fn(),
      },
      payout: {
        aggregate: vi.fn(),
        findMany: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GetEarningsStatsService", () => {
    describe("Balance Calculations", () => {
      it("should calculate balance correctly with all values present", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
          balance: 100,
          pendingBalance: 50,
        });
        mockPrisma.affiliateLink.findMany.mockResolvedValue([]);
        mockPrisma.payout.findMany.mockResolvedValue([]);
        mockPrisma.payout.aggregate.mockResolvedValue({
          _sum: { amount: 200 },
        });
        mockPrisma.payout.findMany.mockResolvedValue([]);
        mockPrisma.user.count.mockResolvedValue(0);

        const result = await GetEarningsStatsService.getEarningsStats(userId);

        expect(result.balance).toEqual({
          available: 100,
          pending: 50,
          total: 350, // 100 + 50 + 200
          totalWithdrawn: 200,
        });
      });

      it("should handle null balance values", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
          balance: null,
          pendingBalance: null,
        });
        mockPrisma.affiliateLink.findMany.mockResolvedValue([]);
        mockPrisma.payout.findMany.mockResolvedValue([]);
        mockPrisma.payout.aggregate.mockResolvedValue({
          _sum: { amount: null },
        });
        mockPrisma.payout.findMany.mockResolvedValue([]);
        mockPrisma.user.count.mockResolvedValue(0);

        const result = await GetEarningsStatsService.getEarningsStats(userId);

        expect(result.balance).toEqual({
          available: 0,
          pending: 0,
          total: 0,
          totalWithdrawn: 0,
        });
      });

      it("should only count COMPLETED payouts in totalWithdrawn", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
          balance: 50,
          pendingBalance: 25,
        });
        mockPrisma.affiliateLink.findMany.mockResolvedValue([]);
        mockPrisma.payout.findMany.mockResolvedValue([]);
        mockPrisma.payout.aggregate.mockResolvedValue({
          _sum: { amount: 300 },
        });
        mockPrisma.payout.findMany.mockResolvedValue([]);
        mockPrisma.user.count.mockResolvedValue(0);

        await GetEarningsStatsService.getEarningsStats(userId);

        expect(mockPrisma.payout.aggregate).toHaveBeenCalledWith({
          where: {
            userId,
            status: PayoutStatus.COMPLETED,
          },
          _sum: {
            amount: true,
          },
        });
      });

      it("should subtract PENDING payout amounts from available balance", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
          balance: 100,
          pendingBalance: 50,
        });
        mockPrisma.affiliateLink.findMany.mockResolvedValue([]);
        mockPrisma.payout.findMany.mockResolvedValue([]);
        mockPrisma.payout.aggregate.mockResolvedValue({
          _sum: { amount: 200 },
        });
        mockPrisma.payout.findMany.mockResolvedValue([
          { amount: 30, status: PayoutStatus.PENDING },
        ]);
        mockPrisma.user.count.mockResolvedValue(0);

        const result = await GetEarningsStatsService.getEarningsStats(userId);

        expect(result.balance).toEqual({
          available: 70, // 100 - 30 (pending payout)
          pending: 50,
          total: 320, // 70 + 50 + 200
          totalWithdrawn: 200,
        });
      });

      it("should subtract PROCESSING payout amounts from available balance", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
          balance: 100,
          pendingBalance: 25,
        });
        mockPrisma.affiliateLink.findMany.mockResolvedValue([]);
        mockPrisma.payout.findMany.mockResolvedValue([]);
        mockPrisma.payout.aggregate.mockResolvedValue({
          _sum: { amount: 0 },
        });
        mockPrisma.payout.findMany.mockResolvedValue([
          { amount: 40, status: PayoutStatus.PROCESSING },
        ]);
        mockPrisma.user.count.mockResolvedValue(0);

        const result = await GetEarningsStatsService.getEarningsStats(userId);

        expect(result.balance).toEqual({
          available: 60, // 100 - 40 (processing payout)
          pending: 25,
          total: 85, // 60 + 25 + 0
          totalWithdrawn: 0,
        });
      });

      it("should subtract ON_HOLD payout amounts from available balance", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
          balance: 150,
          pendingBalance: 0,
        });
        mockPrisma.affiliateLink.findMany.mockResolvedValue([]);
        mockPrisma.payout.findMany.mockResolvedValue([]);
        mockPrisma.payout.aggregate.mockResolvedValue({
          _sum: { amount: 100 },
        });
        mockPrisma.payout.findMany.mockResolvedValue([
          { amount: 25, status: PayoutStatus.ON_HOLD },
        ]);
        mockPrisma.user.count.mockResolvedValue(0);

        const result = await GetEarningsStatsService.getEarningsStats(userId);

        expect(result.balance).toEqual({
          available: 125, // 150 - 25 (on hold payout)
          pending: 0,
          total: 225, // 125 + 0 + 100
          totalWithdrawn: 100,
        });
      });

      it("should subtract multiple pending payouts from available balance", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
          balance: 200,
          pendingBalance: 50,
        });
        mockPrisma.affiliateLink.findMany.mockResolvedValue([]);
        mockPrisma.payout.findMany.mockResolvedValue([]);
        mockPrisma.payout.aggregate.mockResolvedValue({
          _sum: { amount: 300 },
        });
        mockPrisma.payout.findMany.mockResolvedValue([
          { amount: 30, status: PayoutStatus.PENDING },
          { amount: 20, status: PayoutStatus.PROCESSING },
          { amount: 10, status: PayoutStatus.ON_HOLD },
        ]);
        mockPrisma.user.count.mockResolvedValue(0);

        const result = await GetEarningsStatsService.getEarningsStats(userId);

        expect(result.balance).toEqual({
          available: 140, // 200 - (30 + 20 + 10) = 140
          pending: 50,
          total: 490, // 140 + 50 + 300
          totalWithdrawn: 300,
        });
      });

      it("should NOT subtract COMPLETED, FAILED, or CANCELLED payouts from available balance", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
          balance: 100,
          pendingBalance: 0,
        });
        mockPrisma.affiliateLink.findMany.mockResolvedValue([]);
        mockPrisma.payout.findMany.mockResolvedValue([]);
        mockPrisma.payout.aggregate.mockResolvedValue({
          _sum: { amount: 50 },
        });
        // These payouts should NOT be fetched since they're not pending
        mockPrisma.payout.findMany.mockResolvedValue([]);
        mockPrisma.user.count.mockResolvedValue(0);

        const result = await GetEarningsStatsService.getEarningsStats(userId);

        expect(result.balance).toEqual({
          available: 100, // No deduction for COMPLETED/FAILED/CANCELLED
          pending: 0,
          total: 150, // 100 + 0 + 50
          totalWithdrawn: 50,
        });
      });

      it("should fetch only PENDING, PROCESSING, and ON_HOLD payouts", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
          balance: 100,
          pendingBalance: 0,
        });
        mockPrisma.affiliateLink.findMany.mockResolvedValue([]);
        mockPrisma.payout.findMany.mockResolvedValue([]);
        mockPrisma.payout.aggregate.mockResolvedValue({
          _sum: { amount: 0 },
        });
        mockPrisma.payout.findMany.mockResolvedValue([]);
        mockPrisma.user.count.mockResolvedValue(0);

        await GetEarningsStatsService.getEarningsStats(userId);

        expect(mockPrisma.payout.findMany).toHaveBeenCalledWith({
          where: {
            userId,
            status: {
              in: [
                PayoutStatus.PENDING,
                PayoutStatus.PROCESSING,
                PayoutStatus.ON_HOLD,
              ],
            },
          },
          select: {
            amount: true,
            status: true,
          },
        });
      });
    });

    describe("Affiliate Statistics", () => {
      it("should return zeros when user has no affiliate links", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
          balance: 50,
          pendingBalance: 0,
        });
        mockPrisma.affiliateLink.findMany.mockResolvedValue([]);
        mockPrisma.payout.findMany.mockResolvedValue([]);
        mockPrisma.payout.aggregate.mockResolvedValue({
          _sum: { amount: 0 },
        });
        mockPrisma.user.count.mockResolvedValue(0);

        const result = await GetEarningsStatsService.getEarningsStats(userId);

        expect(result.affiliateStats).toEqual({
          totalSubscribers: 0,
          totalClicks: 0,
          totalCVR: 0,
        });
      });

      it("should calculate total clicks across all affiliate links", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
          balance: 50,
          pendingBalance: 0,
        });
        mockPrisma.affiliateLink.findMany.mockResolvedValue([
          { id: 1, clickCount: 100 },
          { id: 2, clickCount: 200 },
          { id: 3, clickCount: 150 },
        ]);
        mockPrisma.payout.findMany.mockResolvedValue([]);
        mockPrisma.payout.aggregate.mockResolvedValue({
          _sum: { amount: 0 },
        });
        mockPrisma.user.count.mockResolvedValue(0);

        const result = await GetEarningsStatsService.getEarningsStats(userId);

        expect(result.affiliateStats.totalClicks).toBe(450); // 100 + 200 + 150
      });

      it("should count subscribers who used referral links with paid plans", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
          balance: 50,
          pendingBalance: 0,
        });
        mockPrisma.affiliateLink.findMany.mockResolvedValue([
          { id: 1, clickCount: 100 },
          { id: 2, clickCount: 200 },
        ]);
        mockPrisma.payout.findMany.mockResolvedValue([]);
        mockPrisma.payout.aggregate.mockResolvedValue({
          _sum: { amount: 0 },
        });
        mockPrisma.user.count.mockResolvedValue(15);

        const result = await GetEarningsStatsService.getEarningsStats(userId);

        expect(mockPrisma.user.count).toHaveBeenCalledWith({
          where: {
            referralLinkUsedId: {
              in: [1, 2],
            },
            plan: {
              not: "NO_PLAN",
            },
          },
        });
        expect(result.affiliateStats.totalSubscribers).toBe(15);
      });

      it("should calculate CVR correctly", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
          balance: 50,
          pendingBalance: 0,
        });
        mockPrisma.affiliateLink.findMany.mockResolvedValue([
          { id: 1, clickCount: 500 },
        ]);
        mockPrisma.payout.findMany.mockResolvedValue([]);
        mockPrisma.payout.aggregate.mockResolvedValue({
          _sum: { amount: 0 },
        });
        mockPrisma.user.count.mockResolvedValue(10);

        const result = await GetEarningsStatsService.getEarningsStats(userId);

        // CVR = (10 / 500) * 100 = 2.00%
        expect(result.affiliateStats.totalCVR).toBe(2.0);
      });

      it("should return 0 CVR when there are no clicks", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
          balance: 50,
          pendingBalance: 0,
        });
        mockPrisma.affiliateLink.findMany.mockResolvedValue([
          { id: 1, clickCount: 0 },
        ]);
        mockPrisma.payout.findMany.mockResolvedValue([]);
        mockPrisma.payout.aggregate.mockResolvedValue({
          _sum: { amount: 0 },
        });
        mockPrisma.user.count.mockResolvedValue(5);

        const result = await GetEarningsStatsService.getEarningsStats(userId);

        expect(result.affiliateStats.totalCVR).toBe(0);
      });

      it("should round CVR to 2 decimal places", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
          balance: 50,
          pendingBalance: 0,
        });
        mockPrisma.affiliateLink.findMany.mockResolvedValue([
          { id: 1, clickCount: 300 },
        ]);
        mockPrisma.payout.findMany.mockResolvedValue([]);
        mockPrisma.payout.aggregate.mockResolvedValue({
          _sum: { amount: 0 },
        });
        mockPrisma.user.count.mockResolvedValue(1);

        const result = await GetEarningsStatsService.getEarningsStats(userId);

        // CVR = (1 / 300) * 100 = 0.333...% -> rounded to 0.33%
        expect(result.affiliateStats.totalCVR).toBe(0.33);
      });

      it("should handle multiple affiliate links with subscribers", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
          balance: 100,
          pendingBalance: 50,
        });
        mockPrisma.affiliateLink.findMany.mockResolvedValue([
          { id: 1, clickCount: 1000 },
          { id: 2, clickCount: 500 },
          { id: 3, clickCount: 250 },
        ]);
        mockPrisma.payout.findMany.mockResolvedValue([]);
        mockPrisma.payout.aggregate.mockResolvedValue({
          _sum: { amount: 500 },
        });
        mockPrisma.user.count.mockResolvedValue(35);

        const result = await GetEarningsStatsService.getEarningsStats(userId);

        expect(result.balance).toEqual({
          available: 100,
          pending: 50,
          total: 650,
          totalWithdrawn: 500,
        });
        expect(result.affiliateStats).toEqual({
          totalSubscribers: 35,
          totalClicks: 1750, // 1000 + 500 + 250
          totalCVR: 2.0, // (35 / 1750) * 100 = 2.00%
        });
      });
    });

    describe("Error Handling", () => {
      it("should throw error when user is not found", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.affiliateLink.findMany.mockResolvedValue([]);
        mockPrisma.payout.findMany.mockResolvedValue([]);
        mockPrisma.payout.aggregate.mockResolvedValue({
          _sum: { amount: 0 },
        });

        await expect(
          GetEarningsStatsService.getEarningsStats(userId)
        ).rejects.toThrow("User not found");
      });

      it("should propagate database errors", async () => {
        const dbError = new Error("Database connection error");
        mockPrisma.user.findUnique.mockRejectedValue(dbError);

        await expect(
          GetEarningsStatsService.getEarningsStats(userId)
        ).rejects.toThrow("Database connection error");
      });
    });
  });

  describe("GetEarningsStatsController", () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockRequest = {
        userId,
      };
      mockResponse = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      mockNext = vi.fn();
    });

    it("should return 200 with earnings stats on success", async () => {
      const statsData = {
        balance: {
          available: 100,
          pending: 50,
          total: 150,
          totalWithdrawn: 0,
        },
        affiliateStats: {
          totalSubscribers: 10,
          totalClicks: 500,
          totalCVR: 2.0,
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        balance: 100,
        pendingBalance: 50,
      });
      mockPrisma.affiliateLink.findMany.mockResolvedValue([
        { id: 1, clickCount: 500 },
      ]);
      mockPrisma.payout.findMany.mockResolvedValue([]);
        mockPrisma.payout.aggregate.mockResolvedValue({
        _sum: { amount: 0 },
      });
      mockPrisma.user.count.mockResolvedValue(10);

      await GetEarningsStatsController.getEarningsStats(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(statsData);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 when userId is missing", async () => {
      mockRequest.userId = undefined;

      await GetEarningsStatsController.getEarningsStats(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Please log in to view earnings stats",
        })
      );
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it("should call next with error when service throws", async () => {
      const error = new Error("Database error");
      mockPrisma.user.findUnique.mockRejectedValue(error);

      await GetEarningsStatsController.getEarningsStats(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });
});
