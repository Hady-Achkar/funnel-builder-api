import { Prisma } from "../../../../generated/prisma-client";

export type SortField = "createdAt" | "amount" | "status" | "method";
export type SortOrder = "asc" | "desc";

/**
 * Builds Prisma orderBy clause for payout sorting
 * Pure function - no Prisma calls, no error throwing
 */
export function buildPayoutSorting(
  sortBy: SortField = "createdAt",
  sortOrder: SortOrder = "desc"
): Prisma.PayoutOrderByWithRelationInput {
  return {
    [sortBy]: sortOrder,
  };
}
