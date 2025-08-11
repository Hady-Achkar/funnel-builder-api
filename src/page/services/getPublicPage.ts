import { getPrisma } from "../../lib/prisma";
import { PublicPageData } from "../types";
import { cacheService } from "../../services/cache/cache.service";

export const getPublicPage = async (
  funnelId: number,
  linkingId: string
): Promise<PublicPageData> => {
  try {
    if (!funnelId || !linkingId)
      throw new Error("Please provide funnelId and linkingId.");

    const prisma = getPrisma();

    // Get page with funnel info
    const page = await prisma.page.findFirst({
      where: { funnelId, linkingId },
      omit: { visits: true },
      include: {
        funnel: {
          select: { id: true, name: true, status: true, userId: true }
        }
      }
    });

    if (!page) {
      throw new Error("Page not found");
    }

    if (!page.funnel || page.funnel.status !== "LIVE") {
      throw new Error("This page is not publicly accessible. The funnel must be live");
    }

    // Try cache first using the page ID
    const cacheKey = `user:${page.funnel.userId}:page:${page.id}:full`;
    const cachedPage = await cacheService.get(cacheKey);

    if (cachedPage) {
      // Return public format from cached data
      const cached = cachedPage as any;
      return {
        id: cached.id,
        name: cached.name,
        content: cached.content,
        linkingId: cached.linkingId,
        seoTitle: cached.seoTitle,
        seoDescription: cached.seoDescription,
        seoKeywords: cached.seoKeywords,
        funnelName: page.funnel.name,
        funnelId: page.funnel.id
      };
    }

    // Cache miss - prepare and cache full page data
    const fullPageData = {
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
      updatedAt: page.updatedAt
    };

    // Cache for next time
    try {
      await cacheService.set(cacheKey, fullPageData, { ttl: 0 });
    } catch (cacheError) {
      console.warn("Public page fetched but couldn't cache:", cacheError);
    }

    // Return public format
    return {
      id: page.id,
      name: page.name,
      content: page.content,
      linkingId: page.linkingId,
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
      seoKeywords: page.seoKeywords,
      funnelName: page.funnel.name,
      funnelId: page.funnel.id
    };

  } catch (e) {
    console.error("Failed to get public page:", e);
    if (e instanceof Error) throw new Error(e.message);
    throw new Error("Couldn't get the public page. Please try again.");
  }
};