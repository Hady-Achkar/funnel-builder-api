import { z } from "zod";
import {
  CachedFunnelWithPages,
  GetFunnelByIdParamsSchema,
  GetFunnelByIdResponse,
  GetFunnelByIdResponseSchema,
  PageData,
} from "../types";
import { cacheService } from "../../services/cache/cache.service";
import { getPrisma } from "../../lib/prisma";

export const getFunnelById = async (
  funnelId: number,
  userId: number
): Promise<GetFunnelByIdResponse> => {
  try {
    if (!userId) throw new Error("Please provide userId.");

    const validatedParams = GetFunnelByIdParamsSchema.parse({ funnelId });
    const validFunnelId = validatedParams.funnelId;

    const cacheKey = `user:${userId}:funnel:${validFunnelId}:full`;

    let cached: CachedFunnelWithPages | null = null;
    try {
      cached = await cacheService.get<CachedFunnelWithPages>(cacheKey);
    } catch (e) {
      console.warn("Cache error, continuing to database:", e);
      cached = null;
    }

    if (cached) {
      if (cached.userId !== userId) {
        throw new Error("You don't have access to this funnel.");
      }

      const response = {
        data: {
          id: cached.id,
          name: cached.name,
          status: cached.status,
          userId: cached.userId,
          createdAt: cached.createdAt,
          updatedAt: cached.updatedAt,
          pages: cached.pages.map((p: PageData) => ({
            ...p,
            seoTitle: p.seoTitle,
            seoDescription: p.seoDescription,
            seoKeywords: p.seoKeywords,
          })),
          theme: cached.theme,
        },
      };

      GetFunnelByIdResponseSchema.parse(response);
      return response as GetFunnelByIdResponse;
    }

    const prisma = getPrisma();

    const funnel = await prisma.funnel.findFirst({
      where: { id: validFunnelId, userId },
      omit: { templateId: true, themeId: true },
      include: {
        theme: true,
        pages: {
          omit: { content: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!funnel) throw new Error("Funnel not found.");

    try {
      const toCache: CachedFunnelWithPages = {
        id: funnel.id,
        name: funnel.name,
        status: funnel.status,
        userId: funnel.userId,
        createdAt: funnel.createdAt,
        updatedAt: funnel.updatedAt,
        pages: funnel.pages,
        theme: funnel.theme,
      };
      await cacheService.set(cacheKey, toCache, { ttl: 0 });
    } catch (e) {
      console.warn("Couldn't cache funnel:", e);
    }

    const response = {
      data: funnel,
    };

    GetFunnelByIdResponseSchema.parse(response);
    return response as GetFunnelByIdResponse;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`Invalid input: ${firstError.message}`);
    }
    if (error instanceof Error) {
      throw new Error(`Failed to get funnel by ID: ${error.message}`);
    }
    throw new Error("Couldn't load the funnel. Please try again.");
  }
};
