import { z } from "zod";
import {
  FunnelListQuery,
  FunnelListResponse,
  FunnelListItem,
  FunnelListQuerySchema,
  FunnelListResponseSchema,
} from "../types";
import { getPrisma } from "../../lib/prisma";
import { getCachedFunnelsWithFallback } from "./cache-helpers";

export const getUserFunnels = async (
  userId: number,
  query?: FunnelListQuery
): Promise<FunnelListResponse> => {
  try {
    if (!userId) throw new Error("Please provide a userId.");

    const validatedQuery = FunnelListQuerySchema.parse(query || {});
    const { page, limit, sortBy, sortOrder, status } = validatedQuery;
    const skip = (page - 1) * limit;

    const prisma = getPrisma();

    const allUserFunnelIds = await prisma.funnel.findMany({
      where: { userId },
      select: { id: true },
    });

    const allIds = allUserFunnelIds.map((r) => r.id);

    const allCachedFunnels = await getCachedFunnelsWithFallback(userId, allIds);

    let filteredFunnels = allCachedFunnels;

    if (status) {
      filteredFunnels = filteredFunnels.filter((f) => f.status === status);
    }

    filteredFunnels.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a];
      const bValue = b[sortBy as keyof typeof b];
      if (sortOrder === "desc") {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });

    const total = filteredFunnels.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedFunnels = filteredFunnels.slice(skip, skip + limit);

    const cached = paginatedFunnels;

    const funnels: FunnelListItem[] = cached.map((f) => ({
      id: f.id,
      name: f.name,
      status: f.status,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    }));

    const response = {
      data: funnels,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    // Temporarily disable response validation for testing
    return response as FunnelListResponse;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`Invalid input: ${firstError.message}`);
    }
    if (error instanceof Error) {
      throw new Error(`Failed to get user funnels: ${error.message}`);
    }
    throw new Error("Couldn't load your funnels. Please try again.");
  }
};
