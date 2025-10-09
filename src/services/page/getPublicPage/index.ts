import {
  GetPublicPageResponse,
  getPublicPageRequest,
  getPublicPageResponse,
} from "../../../types/page/getPublicPage";
import { getPrisma } from "../../../lib/prisma";
import { cacheService } from "../../cache/cache.service";
import { BadRequestError } from "../../../errors";
import { ZodError } from "zod";

export const getPublicPage = async (
  requestBody: Record<string, unknown>
): Promise<GetPublicPageResponse> => {
  try {
    // Parse and validate request data
    const validatedRequest = getPublicPageRequest.parse(requestBody);

    const prisma = getPrisma();
    
    // First, find the funnel by slug and ensure it's LIVE
    const funnel = await prisma.funnel.findFirst({
      where: { 
        slug: validatedRequest.funnelSlug,
        status: 'LIVE'
      },
      select: {
        id: true,
        workspaceId: true,
        pages: {
          where: {
            linkingId: validatedRequest.linkingId,
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!funnel) {
      throw new BadRequestError("Page not found or not publicly accessible");
    }

    if (funnel.pages.length === 0) {
      throw new BadRequestError("Page not found or not publicly accessible");
    }

    const pageId = funnel.pages[0].id;
    const funnelId = funnel.id;
    const workspaceId = funnel.workspaceId;

    // Try to get page from cache first
    const pageCacheKey = `workspace:${workspaceId}:funnel:${funnelId}:page:${pageId}:full`;
    let cachedPage = await cacheService.get<any>(pageCacheKey);

    if (cachedPage && typeof cachedPage === 'object') {
      // Return cached data
      return getPublicPageResponse.parse(cachedPage);
    }

    // Cache miss - fetch from database
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: {
        id: true,
        name: true,
        content: true,
        order: true,
        type: true,
        linkingId: true,
        seoTitle: true,
        seoDescription: true,
        seoKeywords: true,
        funnelId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!page) {
      throw new BadRequestError("Page not found");
    }

    // Cache the page for future requests
    try {
      await cacheService.set(pageCacheKey, page, { ttl: 0 });
    } catch (cacheError) {
      console.warn("Failed to cache page data:", cacheError);
    }

    return getPublicPageResponse.parse(page);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};