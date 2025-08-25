import { cacheService } from "../../../services/cache/cache.service";

interface PageCacheData {
  id: number;
  name: string;
  content: string;
  order: number;
  linkingId: string;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  funnelId: number;
  visits: number;
  createdAt: Date;
  updatedAt: Date;
}

interface UpdateCacheAfterDuplicateParams {
  workspaceId: number;
  funnelId: number;
  newPage: PageCacheData;
  reorderedPages?: Array<{ id: number; order: number }>;
}

export const updateCacheAfterDuplicate = async ({
  workspaceId,
  funnelId,
  newPage,
  reorderedPages = [],
}: UpdateCacheAfterDuplicateParams): Promise<void> => {
  try {
    // 1. Cache the new page under funnel:funnelId:page:pageId:full
    const pageFullKey = `funnel:${funnelId}:page:${newPage.id}:full`;
    await cacheService.set(pageFullKey, newPage, { ttl: 0 });

    // 2. Update workspace:workspaceId:funnel:funnelId:full to include the new page
    const funnelFullKey = `workspace:${workspaceId}:funnel:${funnelId}:full`;
    const cachedFunnel = (await cacheService.get(funnelFullKey)) as any;

    if (cachedFunnel?.pages) {
      // Create page summary without content for funnel cache
      const pageSummary = {
        id: newPage.id,
        name: newPage.name,
        order: newPage.order,
        linkingId: newPage.linkingId,
        seoTitle: newPage.seoTitle,
        seoDescription: newPage.seoDescription,
        seoKeywords: newPage.seoKeywords,
        visits: newPage.visits,
        funnelId: newPage.funnelId,
        createdAt: newPage.createdAt,
        updatedAt: newPage.updatedAt,
      };

      // Update orders for any reordered pages
      let updatedPages = cachedFunnel.pages.map((page: any) => {
        const reorderedPage = reorderedPages.find((p) => p.id === page.id);
        if (reorderedPage) {
          return { ...page, order: reorderedPage.order, updatedAt: new Date() };
        }
        return page;
      });

      // Add the new page
      updatedPages.push(pageSummary);

      // Sort by order
      updatedPages.sort((a: any, b: any) => a.order - b.order);

      // Update the funnel cache
      await cacheService.set(
        funnelFullKey,
        {
          ...cachedFunnel,
          pages: updatedPages,
          updatedAt: new Date(),
        },
        { ttl: 0 }
      );
    }

    // 3. Update individual page caches for reordered pages
    for (const reorderedPage of reorderedPages) {
      const reorderedPageKey = `funnel:${funnelId}:page:${reorderedPage.id}:full`;
      const cachedPage = (await cacheService.get(reorderedPageKey)) as any;
      
      if (cachedPage) {
        await cacheService.set(
          reorderedPageKey,
          {
            ...cachedPage,
            order: reorderedPage.order,
            updatedAt: new Date(),
          },
          { ttl: 0 }
        );
      }
    }
  } catch (error) {
    console.warn("Failed to update cache after page duplication:", error);
    // Don't throw - cache update failure shouldn't break the duplication
  }
};