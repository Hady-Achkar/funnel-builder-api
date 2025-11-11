import { Prisma } from "../../../../generated/prisma-client";

/**
 * Builds Prisma orderBy clause for affiliate link sorting
 * Pure function - no Prisma calls, no error throwing
 */
export function buildAffiliateLinkSorting(
  sortBy: "createdAt" | "clickCount" | "totalEarnings" | "name",
  sortOrder: "asc" | "desc"
): Prisma.AffiliateLinkOrderByWithRelationInput {
  // Map totalEarnings to the actual database field totalAmount
  const field = sortBy === "totalEarnings" ? "totalAmount" : sortBy;

  return {
    [field]: sortOrder,
  };
}
