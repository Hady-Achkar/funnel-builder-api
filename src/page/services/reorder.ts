import { z } from "zod";
import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import { CachedFunnelWithPages } from "../../funnel/types";
import {
  ReorderPagesBody,
  ReorderPagesResponse,
  ReorderPagesParamsSchema,
  ReorderPagesBodySchema,
  ReorderPagesResponseSchema,
  ReorderPagesParams,
} from "../types";

export const reorderPages = async (
  params: ReorderPagesParams,
  userId: number,
  body: ReorderPagesBody
): Promise<ReorderPagesResponse> => {
  try {
    if (!userId) throw new Error("User ID is required");

    const validatedParams = ReorderPagesParamsSchema.parse(params);
    const validatedBody = ReorderPagesBodySchema.parse(body);

    const { pageOrders } = validatedBody;
    const { funnelId } = validatedParams;

    const prisma = getPrisma();

    const funnel = await prisma.funnel.findFirst({
      where: { id: funnelId, userId },
    });

    if (!funnel) throw new Error("Funnel not found or you don't have access.");

    const existingPages = await prisma.page.findMany({
      where: { funnelId },
      select: { id: true, order: true },
    });

    if (existingPages.length === 0) {
      throw new Error("No pages found in funnel.");
    }

    const existingPageIds = new Set(existingPages.map((page) => page.id));
    const providedPageIds = new Set(pageOrders.map((p) => p.id));

    for (const pageOrder of pageOrders) {
      if (!existingPageIds.has(pageOrder.id)) {
        throw new Error(`Page with ID ${pageOrder.id} not found in funnel.`);
      }

      if (typeof pageOrder.order !== "number" || pageOrder.order < 1) {
        throw new Error(
          `Invalid order value ${pageOrder.order} for page ${pageOrder.id}. Order must be a positive number.`
        );
      }
    }

    if (providedPageIds.size !== existingPages.length) {
      throw new Error("Must provide order for all pages in the funnel.");
    }

    const orderValues = pageOrders.map((p) => p.order);
    const uniqueOrders = new Set(orderValues);
    if (uniqueOrders.size !== orderValues.length) {
      throw new Error("Duplicate order values are not allowed.");
    }

    await prisma.$transaction(
      pageOrders.map(({ id, order }) =>
        prisma.page.update({
          where: { id },
          data: { order },
        })
      )
    );

    try {
      // Update individual page caches for each reordered page
      for (const { id: pageId, order } of pageOrders) {
        const pageFullKey = `user:${userId}:page:${pageId}:full`;
        const cachedPage = await cacheService.get<any>(pageFullKey);

        if (cachedPage) {
          const pageDataCopy = { ...cachedPage };
          await cacheService.del(pageFullKey);
          pageDataCopy.order = order;
          pageDataCopy.updatedAt = new Date();
          await cacheService.set(pageFullKey, pageDataCopy, { ttl: 0 });
        }
      }

      // Update funnel:full cache using copy->delete->update->save pattern
      const funnelFullKey = `user:${userId}:funnel:${funnelId}:full`;
      const cachedFunnel = await cacheService.get<CachedFunnelWithPages>(
        funnelFullKey
      );

      if (cachedFunnel?.pages) {
        const funnelDataCopy = { ...cachedFunnel };
        await cacheService.del(funnelFullKey);

        const orderMap = new Map(pageOrders.map((p) => [p.id, p.order]));

        funnelDataCopy.pages = funnelDataCopy.pages.map((page) => {
          const newOrder = orderMap.get(page.id);
          return newOrder !== undefined
            ? { ...page, order: newOrder, updatedAt: new Date() }
            : page;
        });

        funnelDataCopy.pages.sort((a, b) => a.order - b.order);
        funnelDataCopy.updatedAt = new Date();

        await cacheService.set(funnelFullKey, funnelDataCopy, { ttl: 0 });
      }
    } catch (cacheError) {
      console.warn(
        "Pages reordered, but cache couldn't be updated:",
        cacheError
      );
    }

    const response = {
      message: `Successfully reordered funnel pages`,
    };

    ReorderPagesResponseSchema.parse(response);
    return response;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`Invalid input: ${firstError.message}`);
    }
    if (error instanceof Error) {
      throw new Error(`Page reordering failed: ${error.message}`);
    }
    throw new Error("Couldn't reorder the pages. Please try again.");
  }
};
