import { getPrisma } from "../../lib/prisma";
import { PageSummary } from "../../types/page.types";
import { cacheService } from "../cache/cache.service";

export const getFunnelPages = async (
  funnelId: number,
  userId: number
): Promise<PageSummary[]> => {
  try {
    if (!funnelId || !userId)
      throw new Error("Please provide funnelId and userId.");

    const prisma = getPrisma();

    const funnel = await prisma.funnel.findFirst({
      where: { id: funnelId, userId },
    });
    if (!funnel) throw new Error("Funnel not found or you don't have access.");

    const cacheKey = `user:${userId}:funnel:${funnelId}:full`;
    const cached = (await cacheService.get(cacheKey)) as any;
    if (cached?.pages) return cached.pages as PageSummary[];

    const pages = await prisma.page.findMany({
      where: { funnelId },
      omit: { content: true },
      orderBy: { order: "asc" },
    });

    try {
      const fullFunnel = await prisma.funnel.findUnique({
        where: { id: funnelId },
        include: {
          theme: true,
          pages: { omit: { content: true }, orderBy: { order: "asc" } },
        },
      });
      if (fullFunnel) await cacheService.set(cacheKey, fullFunnel, { ttl: 0 });
    } catch (e) {
      console.warn("Pages fetched, but caching the funnel failed:", e);
    }

    return pages;
  } catch (e) {
    console.error("Failed to get funnel pages:", e);
    if (e instanceof Error) throw new Error(e.message);
    throw new Error("Couldn't get funnel pages. Please try again.");
  }
};
