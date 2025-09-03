import { cacheService } from "../../../services/cache/cache.service";

interface UpdateCacheOptions {
  pageId: number;
  funnelId: number;
  workspaceId: number;
}

export const updatePageVisitCaches = async ({
  pageId,
  funnelId,
  workspaceId,
}: UpdateCacheOptions): Promise<void> => {
  try {
    const pageCacheKey = `funnel:${funnelId}:page:${pageId}:full`;
    const funnelCacheKey = `workspace:${workspaceId}:funnel:${funnelId}:full`;

    const [cachedPage, cachedFunnel] = await Promise.all([
      cacheService.get<any>(pageCacheKey),
      cacheService.get<any>(funnelCacheKey),
    ]);

    const updatePromises: Promise<void>[] = [];

    if (cachedPage) {
      const updatedPage = {
        ...cachedPage,
        visits: (cachedPage.visits || 0) + 1,
        updatedAt: new Date().toISOString(),
      };
      updatePromises.push(
        cacheService.set(pageCacheKey, updatedPage, { ttl: 0 })
      );
    }

    if (cachedFunnel?.pages) {
      const pageIndex = cachedFunnel.pages.findIndex(
        (p: any) => p.id === pageId
      );
      
      if (pageIndex !== -1) {
        const updatedFunnel = { ...cachedFunnel };
        updatedFunnel.pages[pageIndex] = {
          ...updatedFunnel.pages[pageIndex],
          visits: (updatedFunnel.pages[pageIndex].visits || 0) + 1,
          updatedAt: new Date().toISOString(),
        };
        updatedFunnel.updatedAt = new Date().toISOString();
        
        updatePromises.push(
          cacheService.set(funnelCacheKey, updatedFunnel, { ttl: 0 })
        );
      }
    }

    await Promise.all(updatePromises);
  } catch (error) {
    console.warn("Cache update failed but visit was recorded:", error);
  }
};