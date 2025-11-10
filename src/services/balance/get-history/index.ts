import { getPrisma } from "../../../lib/prisma";
import {
  GetBalanceHistoryRequest,
  GetBalanceHistoryResponse,
  PayoutSummary,
} from "../../../types/balance/get-history";
import { buildPayoutFilters } from "./utils/build-filters";
import { buildPayoutSorting } from "./utils/build-sorting";
import { calculatePagination } from "../../../utils/pagination";
import { PayoutStatus } from "../../../generated/prisma-client";

export class GetBalanceHistoryService {
  static async getHistory(
    userId: number,
    request: GetBalanceHistoryRequest
  ): Promise<GetBalanceHistoryResponse> {
    try {
      const prisma = getPrisma();

      // Build filters and sorting
      const where = buildPayoutFilters({
        userId,
        status: request.status,
        method: request.method,
        startDate: request.startDate,
        endDate: request.endDate,
        search: request.search,
      });

      const orderBy = buildPayoutSorting(request.sortBy, request.sortOrder);

      // Calculate pagination offset
      const skip = (request.page - 1) * request.limit;

      // Fetch user and payouts in parallel
      const [user, payouts, totalPayouts, allPayoutsSum] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            balance: true,
            pendingBalance: true,
          },
        }),
        prisma.payout.findMany({
          where,
          orderBy,
          skip,
          take: request.limit,
          select: {
            id: true,
            amount: true,
            fees: true,
            netAmount: true,
            status: true,
            method: true,
            createdAt: true,
            processedAt: true,
            failureReason: true,
            accountHolderName: true,
            bankName: true,
            usdtWalletAddress: true,
          },
        }),
        prisma.payout.count({ where }),
        // Get sum of COMPLETED payouts only (actually withdrawn amount)
        prisma.payout.aggregate({
          where: {
            userId,
            status: PayoutStatus.COMPLETED,
          },
          _sum: { amount: true },
        }),
      ]);

      if (!user) {
        throw new Error("User not found");
      }

      // Balance calculations based on user fields
      const available = user.balance;
      const pending = user.pendingBalance;
      const totalWithdrawn = allPayoutsSum._sum.amount || 0;
      const total = available + pending + totalWithdrawn;

      // Calculate pagination metadata
      const pagination = calculatePagination(
        request.page,
        request.limit,
        totalPayouts
      );

      // Format payouts
      const formattedPayouts: PayoutSummary[] = payouts.map((payout) => ({
        id: payout.id,
        amount: payout.amount,
        fees: payout.fees,
        netAmount: payout.netAmount,
        status: payout.status,
        method: payout.method,
        createdAt: payout.createdAt,
        processedAt: payout.processedAt,
        failureReason: payout.failureReason,
        accountHolderName: payout.accountHolderName,
        bankName: payout.bankName,
        usdtWalletAddress: payout.usdtWalletAddress,
      }));

      // Format filters for response
      const filters = {
        status: request.status,
        method: request.method,
        startDate: request.startDate?.toISOString(),
        endDate: request.endDate?.toISOString(),
      };

      return {
        balance: {
          available,
          pending,
          total,
          totalWithdrawn,
        },
        payouts: formattedPayouts,
        pagination,
        filters,
      };
    } catch (error) {
      throw error;
    }
  }
}
