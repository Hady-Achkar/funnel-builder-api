import { getPrisma } from "../../../lib/prisma";
import {
  GetBalanceHistoryRequest,
  GetBalanceHistoryResponse,
  PayoutSummary,
} from "../../../types/balance/get-history";
import { buildPayoutFilters } from "./utils/build-filters";
import { buildPayoutSorting } from "./utils/build-sorting";
import { calculatePagination } from "../../../utils/pagination";

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

      // Calculate pagination offset (skip if all=true)
      const skip = request.all ? undefined : (request.page - 1) * request.limit;
      const take = request.all ? undefined : request.limit;

      // Fetch payouts and total count in parallel
      const [payouts, totalPayouts] = await Promise.all([
        prisma.payout.findMany({
          where,
          orderBy,
          skip,
          take,
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
      ]);

      // Calculate pagination metadata
      const pagination = request.all
        ? {
            page: 1,
            limit: totalPayouts,
            total: totalPayouts,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          }
        : calculatePagination(request.page, request.limit, totalPayouts);

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
        payouts: formattedPayouts,
        pagination,
        filters,
      };
    } catch (error) {
      throw error;
    }
  }
}
