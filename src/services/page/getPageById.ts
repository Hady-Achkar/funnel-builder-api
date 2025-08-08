import { getPrisma } from "../../lib/prisma";
import { PageData } from "../../types/page.types";
import { cacheService } from "../cache/cache.service";

export const getPageById = async (
  pageId: number,
  userId: number
): Promise<PageData | null> => {
  try {
    if (!pageId || !userId)
      throw new Error("Please provide pageId and userId.");

    // Try cache first
    const cacheKey = `user:${userId}:page:${pageId}:full`;
    const cachedPage = await cacheService.get(cacheKey);

    if (cachedPage) {
      return cachedPage as PageData;
    }

    // Cache miss - get from database
    const prisma = getPrisma();
    const page = await prisma.page.findFirst({
      where: {
        id: pageId,
        funnel: { userId }
      }
    });

    if (!page) return null;

    const pageData: PageData = {
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

    // Cache for next time
    try {
      await cacheService.set(cacheKey, pageData, { ttl: 0 });
    } catch (cacheError) {
      console.warn("Page fetched but couldn't cache:", cacheError);
    }

    return pageData;

  } catch (e) {
    console.error("Failed to get page by ID:", e);
    if (e instanceof Error) throw new Error(e.message);
    throw new Error("Couldn't get the page. Please try again.");
  }
};