import { cacheService } from "../../../services/cache/cache.service";

interface UpdateCacheAfterDeleteParams {
  workspaceId: number;
  funnelId: number;
  pageId: number;
  deletedPageOrder: number;
}

export const updateCacheAfterDelete = async ({
  workspaceId,
  funnelId,
  pageId,
  deletedPageOrder,
}: UpdateCacheAfterDeleteParams): Promise<void> => {
  try {
    // Delete the funnel:page:full cache completely
    const pageFullKey = `funnel:${funnelId}:page:${pageId}:full`;
    await cacheService.del(pageFullKey);

    // Update workspace:funnel:full cache - remove the deleted page from pages array
    const funnelFullKey = `workspace:${workspaceId}:funnel:${funnelId}:full`;
    const cachedFunnel = (await cacheService.get(funnelFullKey)) as any;

    if (cachedFunnel?.pages) {
      // Filter out the deleted page and update orders for remaining pages
      const updatedPages = cachedFunnel.pages
        .filter((page: any) => page.id !== pageId)
        .map((page: any) => ({
          ...page,
          order: page.order > deletedPageOrder ? page.order - 1 : page.order,
          updatedAt: new Date(),
        }))
        .sort((a: any, b: any) => a.order - b.order);

      // Update the funnel cache with the new pages array
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

    // Note: Individual page caches will be invalidated when pages are reordered in the service
    // This avoids the need to iterate through all page caches here
  } catch (error) {
    console.warn("Failed to update cache after page deletion:", error);
    // Don't throw - cache update failure shouldn't break the deletion
  }
};