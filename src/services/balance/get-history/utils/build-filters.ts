import { PayoutStatus, PayoutMethod, Prisma } from "../../../../generated/prisma-client";

export interface FilterParams {
  status?: PayoutStatus;
  method?: PayoutMethod;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  userId: number;
}

/**
 * Builds Prisma where clause for payout filtering
 * Pure function - no Prisma calls, no error throwing
 */
export function buildPayoutFilters(
  params: FilterParams
): Prisma.PayoutWhereInput {
  const where: Prisma.PayoutWhereInput = {
    userId: params.userId,
  };

  // Filter by status
  if (params.status) {
    where.status = params.status;
  }

  // Filter by payment method
  if (params.method) {
    where.method = params.method;
  }

  // Filter by date range
  if (params.dateFrom || params.dateTo) {
    where.createdAt = {};
    if (params.dateFrom) {
      where.createdAt.gte = params.dateFrom;
    }
    if (params.dateTo) {
      where.createdAt.lte = params.dateTo;
    }
  }

  // Search by account details
  if (params.search && params.search.trim() !== "") {
    where.OR = [
      {
        accountHolderName: {
          contains: params.search,
          mode: "insensitive" as Prisma.QueryMode,
        },
      },
      {
        bankName: {
          contains: params.search,
          mode: "insensitive" as Prisma.QueryMode,
        },
      },
      {
        usdtWalletAddress: {
          contains: params.search,
          mode: "insensitive" as Prisma.QueryMode,
        },
      },
    ];
  }

  return where;
}
