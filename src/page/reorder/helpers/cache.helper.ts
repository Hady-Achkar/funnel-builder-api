import { cacheService } from "../../../services/cache/cache.service";
import { PageOrderItem } from "../types";

interface UpdateCacheAfterReorderParams {
  workspaceId: number;
  funnelId: number;
  pageOrders: PageOrderItem[];
}

export const updateCacheAfterReorder = async ({
  workspaceId,
  funnelId,
  pageOrders,
}: UpdateCacheAfterReorderParams): Promise<void> => {
  try {
    // 1. Update each individual page cache: funnel:funnelId:page:pageId:full
    for (const { id: pageId, order } of pageOrders) {
      const pageFullKey = `funnel:${funnelId}:page:${pageId}:full`;
      const cachedPage = (await cacheService.get(pageFullKey)) as any;

      if (cachedPage) {
        await cacheService.set(
          pageFullKey,
          {
            ...cachedPage,
            order: order,
            updatedAt: new Date(),
          },
          { ttl: 0 }
        );
      }
    }

    // 2. Update workspace funnel cache: workspace:workspaceId:funnel:funnelId:full
    const funnelFullKey = `workspace:${workspaceId}:funnel:${funnelId}:full`;
    const cachedFunnel = (await cacheService.get(funnelFullKey)) as any;

    if (cachedFunnel?.pages) {
      // Create a map for O(1) lookup of new orders
      const orderMap = new Map(pageOrders.map((p) => [p.id, p.order]));

      // Update the pages array with new orders
      const updatedPages = cachedFunnel.pages.map((page: any) => {
        const newOrder = orderMap.get(page.id);
        return newOrder !== undefined
          ? { ...page, order: newOrder, updatedAt: new Date() }
          : page;
      });

      // Sort pages by their new order
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
  } catch (error) {
    console.warn("Failed to update cache after page reordering:", error);
    // Don't throw - cache update failure shouldn't break the reordering
  }
};