import {
  FunnelListQuery,
  FunnelListResponse,
  FunnelListItem,
} from "../../types/funnel.types";
import { getPrisma } from "../../lib/prisma";
import { getCachedFunnelsWithFallback } from "./cache-helpers";

export const getUserFunnels = async (
  userId: number,
  query?: FunnelListQuery
): Promise<FunnelListResponse> => {
  try {
    if (!userId) throw new Error("Please provide a userId.");

    const page = Math.max(1, query?.page ?? 1);
    const limit = Math.min(100, Math.max(1, query?.limit ?? 10));
    const skip = (page - 1) * limit;
    const sortBy = query?.sortBy ?? "createdAt";
    const sortOrder = query?.sortOrder ?? "desc";

    const status = query?.status?.toUpperCase();
    const validStatuses = ["DRAFT", "LIVE", "ARCHIVED", "SHARED"];
    if (status && !validStatuses.includes(status)) {
      throw new Error("Invalid status. Use DRAFT, LIVE, ARCHIVED, or SHARED.");
    }

    const filter: Record<string, any> = { userId };
    if (status) filter.status = status;

    const prisma = getPrisma();

    const idRows = await prisma.funnel.findMany({
      where: filter,
      select: { id: true },
      orderBy: { [sortBy]: sortOrder } as any,
      skip,
      take: limit,
    });

    const total = await prisma.funnel.count({ where: filter });
    const totalPages = Math.ceil(total / limit);

    const ids = idRows.map((r) => r.id);
    const cached = await getCachedFunnelsWithFallback(userId, ids);

    const funnels: FunnelListItem[] = cached.map((f) => ({
      id: f.id,
      name: f.name,
      status: f.status,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
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
  } catch (e) {
    console.error("Failed to get user funnels:", e);
    if (e instanceof Error) throw new Error(e.message);
    throw new Error("Couldn't load your funnels. Please try again.");
  }
};
