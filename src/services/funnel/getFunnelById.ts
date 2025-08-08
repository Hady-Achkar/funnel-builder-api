import {
  FunnelWithPagesAndTheme,
  CachedFunnelWithPages,
} from "../../types/funnel.types";
import { cacheService } from "../cache/cache.service";
import { getPrisma } from "../../lib/prisma";

export const getFunnelById = async (
  funnelId: number,
  userId: number
): Promise<FunnelWithPagesAndTheme | null> => {
  try {
    if (!funnelId || !userId)
      throw new Error("Please provide funnelId and userId.");

    const prisma = getPrisma();

    const exists = await prisma.funnel.findUnique({
      where: { id: funnelId },
      select: { id: true, userId: true },
    });

    if (!exists) throw new Error("Funnel not found.");
    if (exists.userId !== userId)
      throw new Error("You don't have access to this funnel.");

    const cacheKey = `user:${userId}:funnel:${funnelId}:full`;

    let cached: CachedFunnelWithPages | null = null;
    try {
      cached = await cacheService.get<CachedFunnelWithPages>(cacheKey);
    } catch (e) {
      console.warn("Cache error, continuing to database:", e);
      cached = null;
    }
    
    if (cached) {
      return {
        id: cached.id,
        name: cached.name,
        status: cached.status as string,
        userId: cached.userId,
        themeId: cached.themeId,
        createdAt: cached.createdAt,
        updatedAt: cached.updatedAt,
        pages: cached.pages.map((p: any) => ({
          ...p,
          seoTitle: p.seoTitle ?? null,
          seoDescription: p.seoDescription ?? null,
          seoKeywords: p.seoKeywords ?? null,
        })),
        theme: cached.theme,
      };
    }

    const funnel = await prisma.funnel.findFirst({
      where: { id: funnelId, userId },
      include: {
        theme: true,
        pages: {
          omit: { content: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!funnel) return null;

    try {
      const toCache: CachedFunnelWithPages = {
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
      await cacheService.set(cacheKey, toCache, { ttl: 0 });
    } catch (e) {
      console.warn("Couldn't cache funnel:", e);
    }

    return funnel;
  } catch (e) {
    console.error("Failed to get funnel by ID:", e);
    if (e instanceof Error) throw new Error(e.message);
    throw new Error("Couldn't load the funnel. Please try again.");
  }
};
