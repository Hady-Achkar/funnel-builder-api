import { getPrisma } from "../../lib/prisma";
import { CreatePageRequest, CreatePageResponse } from "../../types/page.types";
import { cacheService } from "../cache/cache.service";

export const createPage = async (
  funnelId: number,
  userId: number,
  data: CreatePageRequest = {}
): Promise<CreatePageResponse> => {
  try {
    if (!funnelId || !userId)
      throw new Error("Please provide funnelId and userId.");

    const prisma = getPrisma();

    const funnel = await prisma.funnel.findFirst({
      where: { id: funnelId, userId },
    });
    if (!funnel) throw new Error("Funnel not found or you don't have access.");

    const order = (await prisma.page.count({ where: { funnelId } })) + 1;

    let name = data.name;
    if (!name) {
      let counter = order;
      let testName = `Page ${counter}`;

      while (
        await prisma.page.findFirst({
          where: { funnelId, name: testName },
        })
      ) {
        counter++;
        testName = `Page ${counter}`;
      }
      name = testName;
    }

    let linkingId = data.linkingId;
    if (!linkingId) {
      let counter = order;
      let testId = `page${counter}`;

      while (
        await prisma.page.findFirst({
          where: { funnelId, linkingId: testId },
        })
      ) {
        counter++;
        testId = `page${counter}`;
      }
      linkingId = testId;
    }

    const page = await prisma.page.create({
      data: {
        name,
        content: data.content || "",
        order,
        linkingId,
        funnelId,
      },
    });

    try {
      const pageKey = `user:${userId}:page:${page.id}:full`;
      await cacheService.set(pageKey, page, { ttl: 0 });

      const funnelKey = `user:${userId}:funnel:${funnelId}:full`;
      const cachedFunnel = (await cacheService.get(funnelKey)) as any;

      if (cachedFunnel) {
        const pageWithoutContent = {
          id: page.id,
          name: page.name,
          order: page.order,
          linkingId: page.linkingId,
          seoTitle: page.seoTitle,
          seoDescription: page.seoDescription,
          seoKeywords: page.seoKeywords,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt,
        };

        await cacheService.set(
          funnelKey,
          {
            ...cachedFunnel,
            pages: [...(cachedFunnel.pages || []), pageWithoutContent],
          },
          { ttl: 0 }
        );
      }
    } catch (cacheError) {
      console.warn("Page created, but cache couldn't be updated:", cacheError);
    }

    return {
      id: page.id,
      name: page.name,
      linkingId: page.linkingId!,
      order: page.order,
      message: `Page "${page.name}" created successfully`,
    };
  } catch (e) {
    console.error("Failed to create page:", e);
    if (e instanceof Error) throw new Error(e.message);
    throw new Error("Couldn't create the page. Please try again.");
  }
};
