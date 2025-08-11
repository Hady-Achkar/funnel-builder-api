import { getPrisma } from "../../lib/prisma";
import { UpdatePageData, UpdatePageResponse } from "../types";
import { cacheService } from "../../services/cache/cache.service";
import { CachedFunnelWithPages } from "../../funnel/types";

export const updatePage = async (
  pageId: number,
  userId: number,
  data: UpdatePageData
): Promise<UpdatePageResponse> => {
  try {
    if (!pageId || !userId)
      throw new Error("Please provide pageId and userId.");

    const prisma = getPrisma();

    const existing = await prisma.page.findFirst({
      where: { id: pageId, funnel: { userId } },
    });

    if (!existing) throw new Error("Page not found or you don't have access.");

    const updates: UpdatePageData = {};
    const changed: string[] = [];

    if (data.name !== undefined && data.name !== existing.name) {
      updates.name = data.name;
      changed.push(`name "${data.name}"`);
    }
    if (data.content !== undefined && data.content !== existing.content) {
      updates.content = data.content;
      changed.push("content");
    }
    if (data.order !== undefined && data.order !== existing.order) {
      updates.order = data.order;
      changed.push(`order ${data.order}`);
    }
    if (data.linkingId !== undefined && data.linkingId !== existing.linkingId) {
      updates.linkingId = data.linkingId;
      changed.push(`linking ID "${data.linkingId}"`);
    }
    if (data.seoTitle !== undefined && data.seoTitle !== existing.seoTitle) {
      updates.seoTitle = data.seoTitle;
      changed.push("SEO title");
    }
    if (
      data.seoDescription !== undefined &&
      data.seoDescription !== existing.seoDescription
    ) {
      updates.seoDescription = data.seoDescription;
      changed.push("SEO description");
    }
    if (
      data.seoKeywords !== undefined &&
      data.seoKeywords !== existing.seoKeywords
    ) {
      updates.seoKeywords = data.seoKeywords;
      changed.push("SEO keywords");
    }

    if (changed.length === 0) {
      return {
        success: true,
        data: existing,
        message: "No changes detected. Page is already up to date.",
      };
    }

    const updated = await prisma.page.update({
      where: { id: pageId },
      data: updates,
    });

    const funnelId = existing.funnelId;

    try {
      await cacheService.set(`user:${userId}:page:${pageId}:full`, updated, { ttl: 0 });

      const funnelFullKey = `user:${userId}:funnel:${funnelId}:full`;
      const cachedFunnel = await cacheService.get<CachedFunnelWithPages>(funnelFullKey);
      
      if (cachedFunnel?.pages) {
        const funnelDataCopy = { ...cachedFunnel };
        await cacheService.del(funnelFullKey);
        
        const pageIndex = funnelDataCopy.pages.findIndex(p => p.id === updated.id);
        if (pageIndex !== -1) {
          funnelDataCopy.pages[pageIndex] = {
            id: updated.id, name: updated.name, order: updated.order,
            linkingId: updated.linkingId, seoTitle: updated.seoTitle,
            seoDescription: updated.seoDescription, seoKeywords: updated.seoKeywords,
            createdAt: updated.createdAt, updatedAt: updated.updatedAt,
          };
          funnelDataCopy.pages.sort((a, b) => a.order - b.order);
          funnelDataCopy.updatedAt = new Date();
        }
        
        await cacheService.set(funnelFullKey, funnelDataCopy, { ttl: 0 });
      }
    } catch (cacheError) {
      console.warn("Page updated, but cache couldn't be updated:", cacheError);
    }

    let message: string;
    if (changed.length === 1) {
      message = `Page ${changed[0]} updated successfully`;
    } else if (changed.length === 2) {
      message = `Page ${changed.join(" and ")} updated successfully`;
    } else {
      const last = changed.pop();
      message = `Page ${changed.join(
        ", "
      )}, and ${last} updated successfully`;
    }

    return {
      success: true,
      data: updated,
      message,
    };
  } catch (e) {
    console.error("Failed to update page:", e);
    if (e instanceof Error) throw new Error(e.message);
    throw new Error("Couldn't update the page. Please try again.");
  }
};
