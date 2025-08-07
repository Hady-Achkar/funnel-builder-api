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
    // Handle full cache (consolidated cache for all funnel data)
    const fullCachedFunnel = await cacheService.getUserFunnelCache<CachedFunnelWithPages>(
      userId,
      funnelId,
      "full"
    );

    if (fullCachedFunnel) {
      // Update only changed fields in full cache
      if (changedData.name !== undefined) {
        fullCachedFunnel.name = updatedFunnel.name;
      }
      if (changedData.status !== undefined) {
        fullCachedFunnel.status = updatedFunnel.status;
      }
      fullCachedFunnel.updatedAt = updatedFunnel.updatedAt;

      await cacheService.setUserFunnelCache(
        userId,
        funnelId,
        "full",
        fullCachedFunnel,
        { ttl: 0 }
      );
      console.log(`Updated full cache for funnel ID: ${funnelId}`);
    } else {
      // Cache doesn't exist, create it from updated funnel data with pages
      const fullFunnelData: CachedFunnelWithPages = {
        id: updatedFunnel.id,
        name: updatedFunnel.name,
        status: updatedFunnel.status,
        userId: updatedFunnel.userId,
        themeId: updatedFunnel.themeId,
        createdAt: updatedFunnel.createdAt,
        updatedAt: updatedFunnel.updatedAt,
        pages: updatedFunnel.pages,
        theme: updatedFunnel.theme,
      };

      await cacheService.setUserFunnelCache(
        userId,
        funnelId,
        "full",
        fullFunnelData,
        { ttl: 0 }
      );
      console.log(`Cached full funnel data for funnel ID: ${funnelId}`);
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

  // Try to get each funnel from cache using :full key
  for (const funnelId of funnelIds) {
    try {
      const cachedFunnel = await cacheService.getUserFunnelCache<CachedFunnelWithPages>(
        userId,
        funnelId,
        "full"
      );

      if (cachedFunnel) {
        // Extract basic funnel data from full cache
        const basicFunnelData: CachedFunnelData = {
          id: cachedFunnel.id,
          name: cachedFunnel.name,
          status: cachedFunnel.status,
          userId: cachedFunnel.userId,
          createdAt: cachedFunnel.createdAt,
          updatedAt: cachedFunnel.updatedAt,
          theme: cachedFunnel.theme,
        };
        cachedFunnels.push(basicFunnelData);
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
        theme: {
          select: {
            id: true,
            name: true,
            backgroundColor: true,
            textColor: true,
            buttonColor: true,
            buttonTextColor: true,
            borderColor: true,
            optionColor: true,
            fontFamily: true,
            borderRadius: true,
          },
        },
        pages: {
          select: {
            id: true,
            name: true,
            order: true,
            linkingId: true,
            seoTitle: true,
            seoDescription: true,
            seoKeywords: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { order: "asc" },
        },
      },
    });

    // Cache each fetched funnel and add to results
    for (const dbFunnel of dbFunnels) {
      // Cache the full funnel data using :full key
      const fullCachedData: CachedFunnelWithPages = {
        id: dbFunnel.id,
        name: dbFunnel.name,
        status: dbFunnel.status,
        userId: dbFunnel.userId,
        themeId: dbFunnel.themeId,
        createdAt: dbFunnel.createdAt,
        updatedAt: dbFunnel.updatedAt,
        theme: dbFunnel.theme,
        pages: dbFunnel.pages,
      };

      try {
        await cacheService.setUserFunnelCache(
          userId,
          dbFunnel.id,
          "full",
          fullCachedData,
          { ttl: 0 }
        );
        console.log(`Cached full funnel data for funnel ID: ${dbFunnel.id}`);
      } catch (cacheError) {
        console.warn(`Failed to cache funnel ${dbFunnel.id}:`, cacheError);
      }

      // Add basic data to results
      const basicFunnelData: CachedFunnelData = {
        id: dbFunnel.id,
        name: dbFunnel.name,
        status: dbFunnel.status,
        userId: dbFunnel.userId,
        createdAt: dbFunnel.createdAt,
        updatedAt: dbFunnel.updatedAt,
        theme: dbFunnel.theme,
      };
      cachedFunnels.push(basicFunnelData);
    }
  }

  // Sort by the original order of funnelIds to maintain database sorting
  const sortedFunnels = funnelIds
    .map((id) => cachedFunnels.find((f) => f.id === id))
    .filter((f): f is CachedFunnelData => f !== undefined);

  return sortedFunnels;
};