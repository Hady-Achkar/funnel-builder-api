import { Prisma } from "../../../../generated/prisma-client";

export interface FilterParams {
  startDate?: Date;
  endDate?: Date;
  search?: string;
  userId: number;
}

/**
 * Builds Prisma where clause for affiliate link filtering
 * Pure function - no Prisma calls, no error throwing
 */
export function buildAffiliateLinkFilters(
  params: FilterParams
): Prisma.AffiliateLinkWhereInput {
  const where: Prisma.AffiliateLinkWhereInput = {
    userId: params.userId,
  };

  // Filter by date range (affiliate link createdAt)
  if (params.startDate || params.endDate) {
    where.createdAt = {};
    if (params.startDate) {
      where.createdAt.gte = params.startDate;
    }
    if (params.endDate) {
      where.createdAt.lte = params.endDate;
    }
  }

  // Search by affiliate link name
  if (params.search && params.search.trim() !== "") {
    where.name = {
      contains: params.search,
      mode: "insensitive" as Prisma.QueryMode,
    };
  }

  return where;
}
