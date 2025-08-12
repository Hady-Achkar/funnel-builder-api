import { cacheService } from "../../services/cache/cache.service";
import { PageSummary } from "../types";
import { CachedFunnelWithPages } from "../../funnel/types";

// Define PageData interface locally since it's used here
interface PageData {
  id: number;
  name: string;
  content: string | null;
  order: number;
  linkingId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  funnelId: number;
  createdAt: Date;
  updatedAt: Date;
}

export const cachePageData = async (
  userId: number,
  pageData: PageData
): Promise<void> => {
  await cacheService.set(`user:${userId}:page:${pageData.id}`, pageData, { ttl: 0 });
  
  if (pageData.linkingId && pageData.funnelId) {
    await cacheService.set(
      `user:${userId}:funnel:${pageData.funnelId}:page:${pageData.linkingId}`,
      pageData,
      { ttl: 0 }
    );
  }
};

export const cachePageSummary = async (
  userId: number,
  pageId: number,
  summary: PageSummary
): Promise<void> => {
  await cacheService.set(`user:${userId}:page:${pageId}:summary`, summary, { ttl: 0 });
};

export const cachePagesList = async (
  userId: number,
  funnelId: number,
  pages: PageSummary[]
): Promise<void> => {
  const cacheKey = `user:${userId}:funnel:${funnelId}:pages`;
  await cacheService.set(cacheKey, pages, { ttl: 0 });
};

export const getCachedPagesList = async (
  userId: number,
  funnelId: number
): Promise<PageSummary[] | null> => {
  const cacheKey = `user:${userId}:funnel:${funnelId}:pages`;
  return await cacheService.get<PageSummary[]>(cacheKey);
};

export const getCachedPage = async (
  userId: number,
  pageId: number
): Promise<PageData | null> => {
  const cacheKey = `user:${userId}:page:${pageId}`;
  return await cacheService.get<PageData>(cacheKey);
};

export const invalidatePageCache = async (
  userId: number,
  pageId: number,
  funnelId: number,
  linkingId?: string | null
): Promise<void> => {
  const cacheCleanup = [
    cacheService.del(`user:${userId}:page:${pageId}`),
    cacheService.del(`user:${userId}:page:${pageId}:summary`),
    cacheService.del(`public:page:${pageId}`),
  ];

  if (linkingId) {
    cacheCleanup.push(
      cacheService.del(`user:${userId}:funnel:${funnelId}:page:${linkingId}`)
    );
  }

  await Promise.all(cacheCleanup);
};

export const updatePagesCacheAfterReorder = async (
  userId: number,
  funnelId: number,
  pageOrders: { id: number; order: number }[]
): Promise<void> => {
  const cacheUpdates: Promise<void>[] = [];
  const orderMap = new Map(pageOrders.map(p => [p.id, p.order]));

  // Update funnel pages list cache
  const funnelPagesKey = `user:${userId}:funnel:${funnelId}:pages`;
  const cachedPagesList = await cacheService.get<any[]>(funnelPagesKey);
  
  if (cachedPagesList) {
    const updatedPagesList = cachedPagesList.map(page => ({
      ...page,
      order: orderMap.get(page.id) || page.order
    }));
    
    updatedPagesList.sort((a, b) => a.order - b.order);
    
    cacheUpdates.push(
      cacheService.set(funnelPagesKey, updatedPagesList, { ttl: 0 })
    );
  }

  // Update funnel :full cache with new page orders using copy -> delete -> manipulate -> save approach
  const cachedFullFunnel = await cacheService.getUserFunnelCache<CachedFunnelWithPages>(userId, funnelId, "full");
  
  if (cachedFullFunnel && cachedFullFunnel.pages && Array.isArray(cachedFullFunnel.pages)) {
    // Step 1: Copy the data to a new variable
    const fullFunnelDataCopy = JSON.parse(JSON.stringify(cachedFullFunnel));
    
    // Step 2: Delete the key from Redis
    await cacheService.del(`user:${userId}:funnel:${funnelId}:full`);
    
    // Step 3: Manipulate the order as coming from the request body
    const updatedPages = fullFunnelDataCopy.pages.map((page: any) => {
      const newOrder = orderMap.get(page.id);
      if (newOrder !== undefined) {
        return { ...page, order: newOrder };
      }
      return page;
    });
    
    // Sort pages by new order
    updatedPages.sort((a: any, b: any) => a.order - b.order);
    
    // Update the funnel data with new pages and timestamp
    fullFunnelDataCopy.pages = updatedPages;
    fullFunnelDataCopy.updatedAt = new Date();
    
    // Step 4: Set the key back to Redis with the new order
    await cacheService.setUserFunnelCache(userId, funnelId, "full", fullFunnelDataCopy, { ttl: 0 });
  }

  // Update individual page caches
  for (const { id: pageId, order } of pageOrders) {
    const fullPageCache = await cacheService.get<any>(`user:${userId}:page:${pageId}`);
    if (fullPageCache) {
      cacheUpdates.push(
        cacheService.set(`user:${userId}:page:${pageId}`, { ...fullPageCache, order }, { ttl: 0 })
      );
    }

    const pageSummaryCache = await cacheService.get<any>(`user:${userId}:page:${pageId}:summary`);
    if (pageSummaryCache) {
      cacheUpdates.push(
        cacheService.set(`user:${userId}:page:${pageId}:summary`, { ...pageSummaryCache, order }, { ttl: 0 })
      );
    }

    if (fullPageCache && fullPageCache.linkingId) {
      cacheUpdates.push(
        cacheService.set(
          `user:${userId}:funnel:${funnelId}:page:${fullPageCache.linkingId}`,
          { ...fullPageCache, order },
          { ttl: 0 }
        )
      );
    }
  }

  await Promise.all(cacheUpdates);
};

export const invalidateFunnelCache = async (
  userId: number,
  funnelId: number
): Promise<void> => {
  // Invalidate all funnel cache keys
  await Promise.all([
    cacheService.del(`user:${userId}:funnel:${funnelId}:pages`),    // Page list only
    cacheService.del(`user:${userId}:funnel:${funnelId}:full`),     // Full funnel with pages+theme
  ]);
};

export const updateFunnelCachesWithUpdatedPage = async (
  userId: number,
  funnelId: number,
  updatedPage: {
    id: number;
    name: string;
    order: number;
    linkingId: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    seoKeywords: string | null;
    createdAt: Date;
    updatedAt: Date;
  }
): Promise<void> => {
  try {
    // Update :pages cache if it exists
    const pagesCacheKey = `user:${userId}:funnel:${funnelId}:pages`;
    const cachedPagesList = await cacheService.get<PageSummary[]>(pagesCacheKey);
    
    if (cachedPagesList && Array.isArray(cachedPagesList)) {
      const pageIndex = cachedPagesList.findIndex(p => p.id === updatedPage.id);
      if (pageIndex !== -1) {
        // Update the page in the pages cache
        cachedPagesList[pageIndex] = {
          id: updatedPage.id,
          name: updatedPage.name,
          order: updatedPage.order,
          linkingId: updatedPage.linkingId,
          seoTitle: updatedPage.seoTitle,
          seoDescription: updatedPage.seoDescription,
          seoKeywords: updatedPage.seoKeywords,
          createdAt: updatedPage.createdAt,
          updatedAt: updatedPage.updatedAt,
        };
        
        // Sort pages by order
        cachedPagesList.sort((a, b) => a.order - b.order);
        
        await cacheService.set(pagesCacheKey, cachedPagesList, { ttl: 0 });
        console.log(`Updated :pages cache with updated page for funnel ID: ${funnelId}`);
      }
    }

    // Update :full cache if it exists
    const cachedFullFunnel = await cacheService.getUserFunnelCache<CachedFunnelWithPages>(userId, funnelId, "full");
    
    if (cachedFullFunnel && cachedFullFunnel.pages && Array.isArray(cachedFullFunnel.pages)) {
      const pageIndex = cachedFullFunnel.pages.findIndex(p => p.id === updatedPage.id);
      if (pageIndex !== -1) {
        // Update the page in the full cache
        cachedFullFunnel.pages[pageIndex] = {
          id: updatedPage.id,
          name: updatedPage.name,
          order: updatedPage.order,
          linkingId: updatedPage.linkingId,
          seoTitle: updatedPage.seoTitle,
          seoDescription: updatedPage.seoDescription,
          seoKeywords: updatedPage.seoKeywords,
          createdAt: updatedPage.createdAt,
          updatedAt: updatedPage.updatedAt,
        };
        
        // Sort pages by order and update funnel's updatedAt
        cachedFullFunnel.pages.sort((a, b) => a.order - b.order);
        cachedFullFunnel.updatedAt = new Date();
        
        await cacheService.setUserFunnelCache(userId, funnelId, "full", cachedFullFunnel, { ttl: 0 });
        console.log(`Updated :full cache with updated page for funnel ID: ${funnelId}`);
      }
    }
    
  } catch (error) {
    console.warn(`Failed to update funnel caches with updated page for funnel ${funnelId}:`, error);
    // Fallback to invalidating all caches if update fails
    await invalidateFunnelCache(userId, funnelId);
  }
};

export const updateFunnelDataCacheWithNewPage = async (
  userId: number,
  funnelId: number,
  newPage: {
    id: number;
    name: string;
    order: number;
    linkingId: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    seoKeywords: string | null;
    createdAt: Date;
    updatedAt: Date;
  }
): Promise<void> => {
  try {
    
    // Get existing pages list cache
    const pagesListCacheKey = `user:${userId}:funnel:${funnelId}:pages`;
    const cachedPagesList = await cacheService.get<PageSummary[]>(pagesListCacheKey);
    
    if (cachedPagesList && Array.isArray(cachedPagesList)) {
      // Add new page to existing pages list
      const newPageSummary = {
        id: newPage.id,
        name: newPage.name,
        order: newPage.order,
        linkingId: newPage.linkingId,
        createdAt: newPage.createdAt,
        updatedAt: newPage.updatedAt,
      };
      
      // Add new page and sort by order
      const updatedPagesList = [...cachedPagesList, newPageSummary].sort((a, b) => a.order - b.order);
      
      await cacheService.set(pagesListCacheKey, updatedPagesList, { ttl: 0 });
      console.log(`Updated pages list cache with new page for funnel ID: ${funnelId}`);
    }
    
    // Update the :full cache if it exists (includes theme data)
    const cachedFullFunnel = await cacheService.getUserFunnelCache<CachedFunnelWithPages>(userId, funnelId, "full");
    
    if (cachedFullFunnel && cachedFullFunnel.pages && Array.isArray(cachedFullFunnel.pages)) {
      // Add new page to existing full funnel cache
      const newPageSummaryForFull = {
        id: newPage.id,
        name: newPage.name,
        order: newPage.order,
        linkingId: newPage.linkingId,
        seoTitle: newPage.seoTitle,
        seoDescription: newPage.seoDescription,
        seoKeywords: newPage.seoKeywords,
        createdAt: newPage.createdAt,
        updatedAt: newPage.updatedAt,
      };
      
      // Add new page and sort by order
      const updatedFullPages = [...cachedFullFunnel.pages, newPageSummaryForFull].sort((a, b) => a.order - b.order);
      
      // Update the cached full funnel data
      const updatedFullFunnelData = {
        ...cachedFullFunnel,
        pages: updatedFullPages,
        updatedAt: new Date(),
      };
      
      await cacheService.setUserFunnelCache(userId, funnelId, "full", updatedFullFunnelData, { ttl: 0 });
      console.log(`Updated full cache with new page for funnel ID: ${funnelId}`);
    }
    
  } catch (error) {
    console.warn(`Failed to update funnel cache with new page for funnel ${funnelId}:`, error);
    // Fallback to invalidating all caches if update fails
    await invalidateFunnelCache(userId, funnelId);
  }
};