import { z } from "zod";
import { getPrisma } from "../../lib/prisma";
import {
  DeletePageParams,
  DeletePageResponse,
  DeletePageParamsSchema,
  DeletePageResponseSchema,
} from "../types";
import { cacheService } from "../../services/cache/cache.service";

export const deletePage = async (
  params: DeletePageParams,
  userId: number
): Promise<DeletePageResponse> => {
  try {
    if (!userId) throw new Error("User ID is required");

    const validatedParams = DeletePageParamsSchema.parse(params);

    const prisma = getPrisma();

    const existingPage = await prisma.page.findFirst({
      where: { id: validatedParams.pageId, funnel: { userId } },
    });

    if (!existingPage)
      throw new Error("Page not found or you don't have access");

    const pageCount = await prisma.page.count({
      where: { funnelId: existingPage.funnelId },
    });

    if (pageCount <= 1) {
      throw new Error("You must have at least one page in the funnel");
    }

    const deletedPageOrder = existingPage.order;
    const funnelId = existingPage.funnelId;
    const pageName = existingPage.name;

    await prisma.page.delete({
      where: { id: validatedParams.pageId },
    });

    const remainingPages = await prisma.page.findMany({
      where: {
        funnelId,
        order: { gt: deletedPageOrder },
      },
      orderBy: { order: "asc" },
    });

    if (remainingPages.length > 0) {
      await prisma.$transaction(
        remainingPages.map((page) =>
          prisma.page.update({
            where: { id: page.id },
            data: { order: page.order - 1 },
          })
        )
      );
    }

    try {
      await cacheService.del(
        `user:${userId}:page:${validatedParams.pageId}:full`
      );

      for (const page of remainingPages) {
        const pageKey = `user:${userId}:page:${page.id}:full`;
        const cachedPage = (await cacheService.get(pageKey)) as any;

        if (cachedPage) {
          await cacheService.set(
            pageKey,
            { ...cachedPage, order: page.order - 1, updatedAt: new Date() },
            { ttl: 0 }
          );
        }
      }

      const funnelKey = `user:${userId}:funnel:${funnelId}:full`;
      const cachedFunnel = (await cacheService.get(funnelKey)) as any;

      if (cachedFunnel?.pages) {
        const updatedPages = cachedFunnel.pages
          .filter((page: any) => page.id !== validatedParams.pageId)
          .map((page: any) => ({
            ...page,
            order: page.order > deletedPageOrder ? page.order - 1 : page.order,
            updatedAt: new Date(),
          }))
          .sort((a: any, b: any) => a.order - b.order);

        await cacheService.set(
          funnelKey,
          { ...cachedFunnel, pages: updatedPages, updatedAt: new Date() },
          { ttl: 0 }
        );
      }
    } catch (cacheError) {
      console.warn("Page deleted, but cache couldn't be updated:", cacheError);
    }

    const response = {
      message: `Page ${pageName} deleted successfully`,
    };

    DeletePageResponseSchema.parse(response);
    return response;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`Invalid input: ${firstError.message}`);
    }
    if (error instanceof Error) {
      throw new Error(`Page deletion failed: ${error.message}`);
    }
    throw new Error("Couldn't delete the page. Please try again");
  }
};
