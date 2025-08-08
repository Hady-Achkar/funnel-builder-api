import { cacheService } from "../cache/cache.service";
import { CachedFunnelData, CachedFunnelWithPages, UpdateFunnelData } from "../../types/funnel.types";
import { getPrisma } from "../../lib/prisma";

export const updateFunnelCache = async (
  userId: number,
  funnelId: number,
  updatedFunnel: any,
  changedData: UpdateFunnelData
): Promise<void> => {
  try {
    // Update summary cache (without pages)
    const summaryCached = await cacheService.getUserFunnelCache<CachedFunnelData>(
      userId,
      funnelId,
      "summary"
    );

    if (summaryCached) {
      // Update only changed fields in summary cache
      if (changedData.name !== undefined) {
        summaryCached.name = updatedFunnel.name;
      }
      if (changedData.status !== undefined) {
        summaryCached.status = updatedFunnel.status;
      }
      summaryCached.updatedAt = updatedFunnel.updatedAt;

      await cacheService.setUserFunnelCache(
        userId,
        funnelId,
        "summary",
        summaryCached,
        { ttl: 0 }
      );
      console.log(`Updated summary cache for funnel ID: ${funnelId}`);
    } else {
      // Create summary cache if it doesn't exist
      const summaryData: CachedFunnelData = {
        id: updatedFunnel.id,
        name: updatedFunnel.name,
        status: updatedFunnel.status,
        userId: updatedFunnel.userId,
        createdAt: updatedFunnel.createdAt,
        updatedAt: updatedFunnel.updatedAt,
        theme: updatedFunnel.theme,
      };

      await cacheService.setUserFunnelCache(
        userId,
        funnelId,
        "summary",
        summaryData,
        { ttl: 0 }
      );
      console.log(`Created summary cache for funnel ID: ${funnelId}`);
    }

    // Also update full cache if it exists (getFunnelById uses this)
    const fullCached = await cacheService.getUserFunnelCache<CachedFunnelWithPages>(
      userId,
      funnelId,
      "full"
    );

    if (fullCached) {
      // Update only changed fields in full cache
      if (changedData.name !== undefined) {
        fullCached.name = updatedFunnel.name;
      }
      if (changedData.status !== undefined) {
        fullCached.status = updatedFunnel.status;
      }
      fullCached.updatedAt = updatedFunnel.updatedAt;

      await cacheService.setUserFunnelCache(
        userId,
        funnelId,
        "full",
        fullCached,
        { ttl: 0 }
      );
      console.log(`Updated full cache for funnel ID: ${funnelId}`);
    }
  } catch (cacheError) {
    console.warn(`Failed to update cache for funnel ${funnelId}:`, cacheError);
  }
};

export const getCachedFunnelsWithFallback = async (
  userId: number,
  funnelIds: number[]
): Promise<CachedFunnelData[]> => {
  const cachedFunnels: CachedFunnelData[] = [];
  const missingFunnelIds: number[] = [];

  // Try to get each funnel from cache using :summary key (without pages)
  for (const funnelId of funnelIds) {
    try {
      const cachedFunnel = await cacheService.getUserFunnelCache<CachedFunnelData>(
        userId,
        funnelId,
        "summary"
      );

      if (cachedFunnel) {
        cachedFunnels.push(cachedFunnel);
      } else {
        missingFunnelIds.push(funnelId);
      }
    } catch (cacheError) {
      console.warn(`Cache miss for funnel ${funnelId}:`, cacheError);
      missingFunnelIds.push(funnelId);
    }
  }

  // Fetch missing funnels from database and cache them
  if (missingFunnelIds.length > 0) {
    const dbFunnels = await getPrisma().funnel.findMany({
      where: {
        id: { in: missingFunnelIds },
        userId,
      },
      include: {
        theme: true,
      },
    });

    // Cache each fetched funnel and add to results
    for (const dbFunnel of dbFunnels) {
      // Cache the summary data (without pages) using :summary key
      const summaryData: CachedFunnelData = {
        id: dbFunnel.id,
        name: dbFunnel.name,
        status: dbFunnel.status,
        userId: dbFunnel.userId,
        createdAt: dbFunnel.createdAt,
        updatedAt: dbFunnel.updatedAt,
        theme: dbFunnel.theme,
      };

      try {
        await cacheService.setUserFunnelCache(
          userId,
          dbFunnel.id,
          "summary",
          summaryData,
          { ttl: 0 }
        );
        console.log(`Cached summary data for funnel ID: ${dbFunnel.id}`);
      } catch (cacheError) {
        console.warn(`Failed to cache funnel ${dbFunnel.id}:`, cacheError);
      }

      cachedFunnels.push(summaryData);
    }
  }

  // Sort by the original order of funnelIds to maintain database sorting
  const sortedFunnels = funnelIds
    .map((id) => cachedFunnels.find((f) => f.id === id))
    .filter((f): f is CachedFunnelData => f !== undefined);

  return sortedFunnels;
};