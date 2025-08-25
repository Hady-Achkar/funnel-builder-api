import {
  GetPageRequest,
  GetPageResponse,
  getPageRequest,
  getPageResponse,
} from "../types";
import { getPrisma } from "../../../lib/prisma";
import { cacheService } from "../../../services/cache/cache.service";
import {
  BadRequestError,
  UnauthorizedError,
} from "../../../errors";
import { ZodError } from "zod";
import { checkFunnelViewPermissions } from "../helpers";

export const getPage = async (
  userId: number,
  requestBody: Record<string, unknown>
): Promise<GetPageResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    // Parse and validate request data
    const validatedRequest = getPageRequest.parse(requestBody);

    // Check permissions (funnel view access)
    const permissionCheck = await checkFunnelViewPermissions(
      userId,
      validatedRequest.pageId
    );

    const funnelId = permissionCheck.funnel.id;
    const pageId = validatedRequest.pageId;

    // Try to get page from cache first
    const pageCacheKey = `funnel:${funnelId}:page:${pageId}:full`;
    let cachedPage = await cacheService.get(pageCacheKey);

    if (cachedPage && typeof cachedPage === 'object') {
      // Return cached data
      return getPageResponse.parse(cachedPage);
    }

    // Cache miss - fetch from database
    const prisma = getPrisma();
    
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: {
        id: true,
        name: true,
        content: true,
        order: true,
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
      const pageData = {
        id: page.id,
        name: page.name,
        content: page.content,
        order: page.order,
        linkingId: page.linkingId,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        seoKeywords: page.seoKeywords,
        funnelId: page.funnelId,
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
      };

      await cacheService.set(pageCacheKey, pageData, { ttl: 0 });
    } catch (cacheError) {
      console.warn("Failed to cache page data:", cacheError);
    }

    return getPageResponse.parse(page);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};