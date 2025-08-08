import { getPrisma } from "../../lib/prisma";
import {
  DuplicatePageRequest,
  DuplicatePageResponse,
} from "../../types/page.types";
import { cacheService } from "../cache/cache.service";

export const duplicatePage = async (
  pageId: number,
  userId: number,
  data: DuplicatePageRequest = {}
): Promise<DuplicatePageResponse> => {
  try {
    if (!pageId || !userId)
      throw new Error("Please provide pageId and userId.");

    const prisma = getPrisma();

    const original = await prisma.page.findFirst({
      where: { id: pageId, funnel: { userId } },
    });
    if (!original) throw new Error("Page not found or you don't have access.");

    const targetFunnelId = data.targetFunnelId ?? original.funnelId;
    const sameFunnel = targetFunnelId === original.funnelId;

    if (!sameFunnel) {
      const target = await prisma.funnel.findFirst({
        where: { id: targetFunnelId, userId },
      });
      if (!target)
        throw new Error("Target funnel not found or you don't have access.");
    }

    const baseName = data.newName ?? original.name;
    let name = sameFunnel && !data.newName ? `${baseName} (Copy)` : baseName;
    for (
      let i = 1;
      await prisma.page.findFirst({
        where: { funnelId: targetFunnelId, name },
      });
      i++
    ) {
      name = `${baseName} (Copy ${i + (sameFunnel && !data.newName ? 0 : 0)})`;
    }

    let linkingId =
      data.newLinkingId ??
      (sameFunnel ? `${original.linkingId}-copy` : original.linkingId) ??
      `page-${Date.now()}`;
    for (
      let i = 1;
      await prisma.page.findFirst({
        where: { funnelId: targetFunnelId, linkingId },
      });
      i++
    ) {
      const base = original.linkingId || "page";
      linkingId = `${base}-copy${i}`;
    }

    const lastPage = await prisma.page.findFirst({
      where: { funnelId: targetFunnelId },
      orderBy: { order: "desc" },
    });
    const order = (lastPage?.order ?? 0) + 1;

    const duplicated = await prisma.page.create({
      data: {
        name,
        content: original.content,
        order,
        linkingId,
        funnelId: targetFunnelId,
      },
    });

    try {
      const pageKey = `user:${userId}:page:${duplicated.id}:full`;
      await cacheService.set(pageKey, duplicated, { ttl: 0 });

      const funnelKey = `user:${userId}:funnel:${targetFunnelId}:full`;
      const cached = (await cacheService.get(funnelKey)) as any;
      if (cached) {
        const pageLite = {
          id: duplicated.id,
          name: duplicated.name,
          order: duplicated.order,
          linkingId: duplicated.linkingId,
          seoTitle: duplicated.seoTitle,
          seoDescription: duplicated.seoDescription,
          seoKeywords: duplicated.seoKeywords,
          createdAt: duplicated.createdAt,
          updatedAt: duplicated.updatedAt,
        };
        await cacheService.set(
          funnelKey,
          { ...cached, pages: [...(cached.pages || []), pageLite] },
          { ttl: 0 }
        );
      }
    } catch (e) {
      console.warn("Page duplicated, but cache couldn't be updated:", e);
    }

    return {
      id: duplicated.id,
      name: duplicated.name,
      linkingId: duplicated.linkingId!,
      order: duplicated.order,
      funnelId: duplicated.funnelId,
      message: `Page "${duplicated.name}" duplicated successfully`,
    };
  } catch (e) {
    console.error("Failed to duplicate page:", e);
    if (e instanceof Error) throw new Error(e.message);
    throw new Error("Couldn't duplicate the page. Please try again.");
  }
};
