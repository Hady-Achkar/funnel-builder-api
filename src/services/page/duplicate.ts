import { getPrisma } from "../../lib/prisma";
import { DuplicatePageRequest, DuplicatePageResponse, PageData } from "../../types/page.types";
import { generateLinkingId } from "./helpers";
import { cacheService } from "../cache/cache.service";
import { updateFunnelDataCacheWithNewPage } from "./cache-helpers";

export const duplicatePage = async (
  pageId: number,
  userId: number,
  data: DuplicatePageRequest = {}
): Promise<DuplicatePageResponse> => {
  // Get the original page
  const originalPage = await getPrisma().page.findFirst({
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

  if (!originalPage) {
    throw new Error("Page not found");
  }

  // Determine target funnel
  const targetFunnelId = data.targetFunnelId || originalPage.funnelId;
  const isTargetSameFunnel = targetFunnelId === originalPage.funnelId;

  // If targeting a different funnel, verify it belongs to the user
  if (!isTargetSameFunnel) {
    const targetFunnel = await getPrisma().funnel.findFirst({
      where: {
        id: targetFunnelId,
        userId,
      },
    });

    if (!targetFunnel) {
      throw new Error("Target funnel not found");
    }
  }

  // Get existing pages in target funnel to check for conflicts
  const existingPagesInTarget = await getPrisma().page.findMany({
    where: { funnelId: targetFunnelId },
    select: {
      name: true,
      linkingId: true,
      order: true,
    },
    orderBy: { order: "desc" },
  });

  const existingNames = existingPagesInTarget.map((page) => page.name);
  const existingLinkingIds = existingPagesInTarget.map((page) => page.linkingId);

  // Generate unique page name
  let duplicatedPageName = data.newName;
  if (!duplicatedPageName) {
    let baseName = originalPage.name;

    if (isTargetSameFunnel) {
      duplicatedPageName = `${baseName} (Copy)`;
      let copyNumber = 1;
      while (existingNames.includes(duplicatedPageName)) {
        copyNumber++;
        duplicatedPageName = `${baseName} (Copy ${copyNumber})`;
      }
    } else {
      if (existingNames.includes(baseName)) {
        duplicatedPageName = `${baseName} (Copy)`;
        let copyNumber = 1;
        while (existingNames.includes(duplicatedPageName)) {
          copyNumber++;
          duplicatedPageName = `${baseName} (Copy ${copyNumber})`;
        }
      } else {
        duplicatedPageName = baseName;
      }
    }
  } else {
    if (existingNames.includes(duplicatedPageName)) {
      throw new Error(`Page name "${duplicatedPageName}" already exists in target funnel`);
    }
  }

  // Generate unique linking ID
  let duplicatedLinkingId = data.newLinkingId;
  if (!duplicatedLinkingId) {
    if (isTargetSameFunnel || existingLinkingIds.includes(originalPage.linkingId)) {
      do {
        duplicatedLinkingId = generateLinkingId();
      } while (existingLinkingIds.includes(duplicatedLinkingId));
    } else {
      duplicatedLinkingId = originalPage.linkingId || generateLinkingId();
    }
  } else {
    if (existingLinkingIds.includes(duplicatedLinkingId)) {
      throw new Error(`Linking ID "${duplicatedLinkingId}" already exists in target funnel`);
    }
  }

  // Determine order for the new page
  let newOrder: number;
  if (isTargetSameFunnel) {
    newOrder = originalPage.order + 1;

    // Push all pages after the original page down by 1
    await getPrisma().$transaction([
      getPrisma().page.updateMany({
        where: {
          funnelId: targetFunnelId,
          order: {
            gte: newOrder,
          },
        },
        data: {
          order: {
            increment: 1,
          },
        },
      }),
    ]);
  } else {
    const lastPage = existingPagesInTarget[0];
    newOrder = lastPage ? lastPage.order + 1 : 1;
  }

  // Create the duplicated page
  const duplicatedPage = await getPrisma().page.create({
    data: {
      name: duplicatedPageName,
      content: originalPage.content,
      order: newOrder,
      linkingId: duplicatedLinkingId,
      funnelId: targetFunnelId,
      visits: 0,
      seoTitle: null,
      seoDescription: null,
      seoKeywords: null,
    },
    select: {
      id: true,
      name: true,
      content: true,
      order: true,
      linkingId: true,
      seoTitle: true,
      seoDescription: true,
      seoKeywords: true,
      visits: true,
      funnelId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Update cache for the new duplicated page
  const duplicatedPageData: PageData = {
    id: duplicatedPage.id,
    name: duplicatedPage.name,
    content: duplicatedPage.content,
    order: duplicatedPage.order,
    linkingId: duplicatedPage.linkingId,
    seoTitle: duplicatedPage.seoTitle,
    seoDescription: duplicatedPage.seoDescription,
    seoKeywords: duplicatedPage.seoKeywords,
    funnelId: duplicatedPage.funnelId,
    createdAt: duplicatedPage.createdAt,
    updatedAt: duplicatedPage.updatedAt,
  };

  // Cache the new duplicated page
  const cacheUpdates = [
    cacheService.set(`user:${userId}:page:${duplicatedPage.id}`, duplicatedPageData, { ttl: 0 }),
    cacheService.set(`user:${userId}:funnel:${targetFunnelId}:page:${duplicatedPage.linkingId}`, duplicatedPageData, { ttl: 0 }),
  ];

  // Update target funnel cache (:pages and :full) with the new duplicated page
  await updateFunnelDataCacheWithNewPage(userId, targetFunnelId, {
    id: duplicatedPage.id,
    name: duplicatedPage.name,
    order: duplicatedPage.order,
    linkingId: duplicatedPage.linkingId,
    seoTitle: duplicatedPage.seoTitle,
    seoDescription: duplicatedPage.seoDescription,
    seoKeywords: duplicatedPage.seoKeywords,
    createdAt: duplicatedPage.createdAt,
    updatedAt: duplicatedPage.updatedAt,
  });

  // If duplicating to the same funnel, update cache for pages that were pushed down
  if (isTargetSameFunnel) {
    const pushedPages = await getPrisma().page.findMany({
      where: {
        funnelId: targetFunnelId,
        order: { gt: newOrder },
      },
      select: {
        id: true,
        name: true,
        order: true,
        linkingId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    for (const page of pushedPages) {
      const fullPageCache = await cacheService.get<any>(`user:${userId}:page:${page.id}`);
      if (fullPageCache) {
        cacheUpdates.push(
          cacheService.set(`user:${userId}:page:${page.id}`, { ...fullPageCache, order: page.order }, { ttl: 0 })
        );
      }

      const pageSummaryCache = await cacheService.get<any>(`user:${userId}:page:${page.id}:summary`);
      if (pageSummaryCache) {
        cacheUpdates.push(
          cacheService.set(`user:${userId}:page:${page.id}:summary`, { ...pageSummaryCache, order: page.order }, { ttl: 0 })
        );
      }

      if (fullPageCache && fullPageCache.linkingId) {
        cacheUpdates.push(
          cacheService.set(`user:${userId}:funnel:${targetFunnelId}:page:${fullPageCache.linkingId}`, 
            { ...fullPageCache, order: page.order }, { ttl: 0 })
        );
      }
    }

    // Update the source funnel caches since page orders have changed
    // Invalidate both :pages and :full caches for the source funnel and let them refresh
    cacheUpdates.push(
      cacheService.del(`user:${userId}:funnel:${originalPage.funnelId}:pages`),
      cacheService.del(`user:${userId}:funnel:${originalPage.funnelId}:full`)
    );
  }

  // Execute all cache updates
  await Promise.all(cacheUpdates);

  let message: string;
  if (isTargetSameFunnel) {
    message = `Page "${duplicatedPageName}" has been duplicated successfully in the same funnel`;
  } else {
    message = `Page "${duplicatedPageName}" has been duplicated successfully to target funnel`;
  }

  return {
    id: duplicatedPage.id,
    name: duplicatedPage.name,
    linkingId: duplicatedPage.linkingId!,
    order: duplicatedPage.order,
    funnelId: duplicatedPage.funnelId,
    message,
  };
};