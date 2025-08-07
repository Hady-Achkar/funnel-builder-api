import { $Enums } from "../../generated/prisma-client";
import {
  FunnelListQuery,
  FunnelListResponse,
  FunnelListItem,
} from "../../types/funnel.types";
import { cacheService } from "../cache/cache.service";
import { getPrisma } from "../../lib/prisma";
import { validateStatusQuery } from "./helpers";
import { getCachedFunnelsWithFallback } from "./cache-helpers";

export const getUserFunnels = async (
  userId: number,
  query?: FunnelListQuery
): Promise<FunnelListResponse> => {
  validateStatusQuery(query?.status);

  try {
    const page = Math.max(1, query?.page || 1);
    const limit = Math.min(100, Math.max(1, query?.limit || 10));
    const skip = (page - 1) * limit;
    const sortBy = query?.sortBy || "createdAt";
    const sortOrder = query?.sortOrder || "desc";

    const statusFilter = query?.status
      ? { status: query.status.toUpperCase() as $Enums.FunnelStatus }
      : {};

    const where = { userId, ...statusFilter };

    const funnelIds = await getPrisma().funnel.findMany({
      where,
      select: { id: true },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    const total = await getPrisma().funnel.count({ where });
    const totalPages = Math.ceil(total / limit);

    const cachedFunnels = await getCachedFunnelsWithFallback(
      userId,
      funnelIds.map((f) => f.id)
    );

    const funnels: FunnelListItem[] = cachedFunnels.map((funnel) => ({
      id: funnel.id,
      name: funnel.name,
      status: funnel.status,
      createdAt: funnel.createdAt,
      updatedAt: funnel.updatedAt,
    }));

    return {
      funnels,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error: any) {
    console.error("FunnelService.getUserFunnels error:", error);
    throw new Error("Failed to fetch funnels. Please try again later.");
  }
};

