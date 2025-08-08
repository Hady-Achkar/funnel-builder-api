import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../cache/cache.service";
import { CachedFunnelWithPages } from "../../types/funnel.types";

export const deletePage = async (
  pageId: number,
  userId: number
): Promise<{ success: boolean; message: string }> => {
  try {
    if (!pageId || !userId)
      throw new Error("Please provide pageId and userId.");

    const prisma = getPrisma();

    const existingPage = await prisma.page.findFirst({
      where: { id: pageId, funnel: { userId } },
      include: { funnel: { select: { id: true, name: true } } },
    });

    if (!existingPage) throw new Error("Page not found or you don't have access.");

    const pageCount = await prisma.page.count({
      where: { funnelId: existingPage.funnelId },
    });

    if (pageCount <= 1) {
      throw new Error("Cannot delete the last page in a funnel. Each funnel must have at least one page.");
    }

    const deletedPageOrder = existingPage.order;
    const funnelId = existingPage.funnelId;
    const pageName = existingPage.name;

    await prisma.page.delete({
      where: { id: pageId },
    });

    const remainingPages = await prisma.page.findMany({
      where: { 
        funnelId,
        order: { gt: deletedPageOrder }
      },
      orderBy: { order: 'asc' }
    });

    if (remainingPages.length > 0) {
      await prisma.$transaction(
        remainingPages.map(page =>
          prisma.page.update({
            where: { id: page.id },
            data: { order: page.order - 1 },
          })
        )
      );
    }

    try {
      // Clear the deleted page's cache
      await cacheService.del(`user:${userId}:page:${pageId}:full`);

      // Update cache for remaining pages that were reordered
      for (const page of remainingPages) {
        const newOrder = page.order - 1;
        const pageFullKey = `user:${userId}:page:${page.id}:full`;
        const cachedPage = await cacheService.get<any>(pageFullKey);
        
        if (cachedPage) {
          const pageDataCopy = { ...cachedPage };
          await cacheService.del(pageFullKey);
          pageDataCopy.order = newOrder;
          pageDataCopy.updatedAt = new Date();
          await cacheService.set(pageFullKey, pageDataCopy, { ttl: 0 });
        }
      }

      // Update funnel:full cache using copy->delete->update->save pattern
      const funnelFullKey = `user:${userId}:funnel:${funnelId}:full`;
      const cachedFunnel = await cacheService.get<CachedFunnelWithPages>(funnelFullKey);
      
      if (cachedFunnel?.pages) {
        const funnelDataCopy = { ...cachedFunnel };
        await cacheService.del(funnelFullKey);
        
        funnelDataCopy.pages = funnelDataCopy.pages
          .filter(page => page.id !== pageId)
          .map(page => ({
            ...page,
            order: page.order > deletedPageOrder ? page.order - 1 : page.order,
            updatedAt: new Date()
          }))
          .sort((a, b) => a.order - b.order);
        
        funnelDataCopy.updatedAt = new Date();
        
        await cacheService.set(funnelFullKey, funnelDataCopy, { ttl: 0 });
      }
    } catch (cacheError) {
      console.warn("Page deleted, but cache couldn't be updated:", cacheError);
    }

    return {
      success: true,
      message: `Page "${pageName}" deleted successfully`,
    };
  } catch (e) {
    console.error("Failed to delete page:", e);
    if (e instanceof Error) throw new Error(e.message);
    throw new Error("Couldn't delete the page. Please try again.");
  }
};