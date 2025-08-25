import { cacheService } from "../../../services/cache/cache.service";

export const updateThemeInCache = async (
  workspaceId: number,
  funnelId: number,
  updatedTheme: any
): Promise<void> => {
  try {
    // Update workspace:workspaceId:funnel:funnelId:full cache
    const fullCacheKey = `workspace:${workspaceId}:funnel:${funnelId}:full`;
    const cachedFull = await cacheService.get<any>(fullCacheKey);

    if (cachedFull) {
      const updatedFullData = {
        ...cachedFull,
        theme: updatedTheme,
        updatedAt: new Date(),
      };
      await cacheService.set(fullCacheKey, updatedFullData, { ttl: 0 });
      console.log(`Updated theme in cache key: ${fullCacheKey}`);
    }

    // Update workspace:workspaceId:funnels:all cache
    const allFunnelsCacheKey = `workspace:${workspaceId}:funnels:all`;
    const cachedFunnels = await cacheService.get<any[]>(allFunnelsCacheKey);

    if (cachedFunnels && Array.isArray(cachedFunnels)) {
      const updatedFunnels = cachedFunnels.map((funnel: any) => {
        if (funnel.id === funnelId) {
          return {
            ...funnel,
            theme: updatedTheme,
            updatedAt: new Date(),
          };
        }
        return funnel;
      });

      await cacheService.set(allFunnelsCacheKey, updatedFunnels, { ttl: 0 });
      console.log(`Updated theme in cache key: ${allFunnelsCacheKey}`);
    }
  } catch (cacheError) {
    console.warn("Failed to update theme in cache:", cacheError);
    // Don't throw - cache update failure shouldn't break the theme update
  }
};