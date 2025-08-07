import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../cache/cache.service";
import { invalidatePageCache } from "./cache-helpers";

export const deletePage = async (pageId: number, userId: number): Promise<void> => {
  // Verify page belongs to user's funnel
  const existingPage = await getPrisma().page.findFirst({
    where: {
      id: pageId,
      funnel: {
        userId,
      },
    },
    include: {
      funnel: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!existingPage) {
    throw new Error("Page not found");
  }

  // Check how many pages are in this funnel
  const pageCount = await getPrisma().page.count({
    where: {
      funnelId: existingPage.funnelId,
    },
  });

  // Prevent deletion if this is the last page in the funnel
  if (pageCount <= 1) {
    throw new Error(
      "Cannot delete the last page in a funnel. Each funnel must have at least one page."
    );
  }

  const deletedPageOrder = existingPage.order;

  await getPrisma().page.delete({
    where: { id: pageId },
  });

  // Reorder remaining pages to maintain continuous sequence
  const remainingPages = await getPrisma().page.findMany({
    where: { 
      funnelId: existingPage.funnelId,
      order: { gt: deletedPageOrder }
    },
    orderBy: { order: 'asc' }
  });

  if (remainingPages.length > 0) {
    // Update database: decrement order for all pages with higher order
    await getPrisma().$transaction(
      remainingPages.map((page) =>
        getPrisma().page.update({
          where: { id: page.id },
          data: { order: page.order - 1 },
        })
      )
    );
  }

  // Clean up all cache entries for the deleted page
  const funnelId = existingPage.funnelId;
  await invalidatePageCache(userId, pageId, funnelId, existingPage.linkingId);

  // Update cache for reordered pages and funnel pages list
  const funnelPagesKey = `user:${userId}:funnel:${funnelId}:pages`;
  const cachedPagesList = await cacheService.get<any[]>(funnelPagesKey);
  
  if (cachedPagesList) {
    // Filter out deleted page and update orders for remaining pages
    const updatedPagesList = cachedPagesList
      .filter(p => p.id !== pageId)
      .map(page => ({
        ...page,
        order: page.order > deletedPageOrder ? page.order - 1 : page.order
      }))
      .sort((a, b) => a.order - b.order);

    await cacheService.set(funnelPagesKey, updatedPagesList, { ttl: 0 });
  }

  // Update individual page caches for reordered pages
  const cacheUpdates: Promise<void>[] = [];
  for (const page of remainingPages) {
    const newOrder = page.order - 1;
    
    // Update full page cache
    const fullPageCache = await cacheService.get<any>(`user:${userId}:page:${page.id}`);
    if (fullPageCache) {
      cacheUpdates.push(
        cacheService.set(`user:${userId}:page:${page.id}`, { ...fullPageCache, order: newOrder }, { ttl: 0 })
      );
    }

    // Update page summary cache
    const pageSummaryCache = await cacheService.get<any>(`user:${userId}:page:${page.id}:summary`);
    if (pageSummaryCache) {
      cacheUpdates.push(
        cacheService.set(`user:${userId}:page:${page.id}:summary`, { ...pageSummaryCache, order: newOrder }, { ttl: 0 })
      );
    }

    // Update linking ID cache if exists
    if (fullPageCache && fullPageCache.linkingId) {
      cacheUpdates.push(
        cacheService.set(`user:${userId}:funnel:${funnelId}:page:${fullPageCache.linkingId}`, 
          { ...fullPageCache, order: newOrder }, { ttl: 0 })
      );
    }
  }

  // Execute all cache cleanup and update operations
  await Promise.all(cacheUpdates);

  // Update funnel :full cache using copy -> delete -> manipulate -> save approach
  const cachedFullFunnel = await cacheService.getUserFunnelCache<any>(userId, funnelId, "full");
  
  if (cachedFullFunnel && cachedFullFunnel.pages && Array.isArray(cachedFullFunnel.pages)) {
    // Step 1: Copy the data to a new variable
    const fullFunnelDataCopy = JSON.parse(JSON.stringify(cachedFullFunnel));
    
    // Step 2: Delete the key from Redis
    await cacheService.del(`user:${userId}:funnel:${funnelId}:full`);
    
    // Step 3: Remove the deleted page and reorder remaining pages
    const updatedPages = fullFunnelDataCopy.pages
      .filter((page: any) => page.id !== pageId)
      .map((page: any) => ({
        ...page,
        order: page.order > deletedPageOrder ? page.order - 1 : page.order
      }))
      .sort((a: any, b: any) => a.order - b.order);
    
    // Update the funnel data with new pages and timestamp
    fullFunnelDataCopy.pages = updatedPages;
    fullFunnelDataCopy.updatedAt = new Date();
    
    // Step 4: Set the key back to Redis with the updated data
    await cacheService.setUserFunnelCache(userId, funnelId, "full", fullFunnelDataCopy, { ttl: 0 });
  }
};