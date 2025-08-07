import {
  FunnelWithPagesAndTheme,
  CachedFunnelWithPages,
} from "../../types/funnel.types";
import { cacheService } from "../cache/cache.service";
import { getPrisma } from "../../lib/prisma";
import { verifyFunnelAccess } from "./helpers";

export const getFunnelById = async (
  funnelId: number,
  userId: number
): Promise<FunnelWithPagesAndTheme | null> => {
  // Validate user ID
  if (!userId || userId <= 0) return null;

  try {
    const funnelExists = await verifyFunnelAccess(funnelId, userId);
    if (!funnelExists) return null;
  } catch (error: any) {
    // Re-throw access denied errors for proper handling in controller
    if (error.message === "Access denied") {
      throw error;
    }
    return null;
  }

  try {
    // Try to get cached funnel with pages using the correct cache key format
    const cacheKey = `user:${userId}:funnel:${funnelId}:full`;
    let cachedFunnel: CachedFunnelWithPages | null = null;
    
    try {
      cachedFunnel = await cacheService.get<CachedFunnelWithPages>(cacheKey);
    } catch (cacheError) {
      console.warn(`Cache get error for ${cacheKey}:`, cacheError);
      // Continue without cache on cache errors
    }

    if (cachedFunnel) {
      // Convert cached data to expected format
      return {
        id: cachedFunnel.id,
        name: cachedFunnel.name,
        status: cachedFunnel.status as string,
        userId: cachedFunnel.userId,
        themeId: cachedFunnel.themeId,
        createdAt: cachedFunnel.createdAt,
        updatedAt: cachedFunnel.updatedAt,
        pages: cachedFunnel.pages,
        theme: cachedFunnel.theme,
      };
    }

    // Cache miss - fetch from database
    const funnel = await getPrisma().funnel.findFirst({
      where: { id: funnelId, userId },
      include: {
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
            // Explicitly exclude content
          },
          orderBy: { order: "asc" },
        },
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
      },
    });

    if (!funnel) return null;

    // Cache the funnel with pages (without content)
    const cachedData: CachedFunnelWithPages = {
      id: funnel.id,
      name: funnel.name,
      status: funnel.status,
      userId: funnel.userId,
      themeId: funnel.themeId,
      createdAt: funnel.createdAt,
      updatedAt: funnel.updatedAt,
      pages: funnel.pages,
      theme: funnel.theme,
    };

    try {
      await cacheService.set(cacheKey, cachedData, { ttl: 0 });
      console.log(`Cached funnel with pages for funnel ID: ${funnelId}`);
    } catch (cacheError) {
      console.warn(`Failed to cache funnel with pages ${funnelId}:`, cacheError);
    }

    return funnel;
  } catch (error: any) {
    console.error("FunnelService.getFunnelById error:", error);
    throw new Error("Failed to fetch funnel. Please try again later.");
  }
};