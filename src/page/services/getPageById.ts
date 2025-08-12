import { z } from "zod";
import { getPrisma } from "../../lib/prisma";
import {
  GetPageByIdResponse,
  GetPageByIdParamsSchema,
  GetPageByIdParams,
  PageData,
} from "../types";
import { cacheService } from "../../services/cache/cache.service";

export const getPageById = async (
  params: GetPageByIdParams,
  userId: number
): Promise<GetPageByIdResponse> => {
  try {
    if (!userId) throw new Error("User ID is required");

    const validatedParams = GetPageByIdParamsSchema.parse(params);

    const cacheKey = `user:${userId}:page:${validatedParams.pageId}:full`;
    const cachedPage = await cacheService.get(cacheKey);

    if (cachedPage) {
      return {
        data: cachedPage as PageData,
        message: "Page retrieved successfully",
      };
    }

    const prisma = getPrisma();

    const page = await prisma.page.findFirst({
      where: {
        id: validatedParams.pageId,
        funnel: { userId },
      },
    });

    if (!page) throw new Error("Page not found or you don't have access");

    const pageData = {
      id: page.id,
      name: page.name,
      content: page.content,
      order: page.order,
      linkingId: page.linkingId,
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
      seoKeywords: page.seoKeywords,
      funnelId: page.funnelId,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    };

    try {
      await cacheService.set(cacheKey, pageData, { ttl: 0 });
    } catch (cacheError) {
      console.warn("Page fetched but couldn't cache:", cacheError);
    }

    const response = {
      data: pageData,
      message: "Page retrieved successfully",
    };

    return response;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`Invalid input: ${firstError.message}`);
    }
    if (error instanceof Error) {
      throw new Error(`Page retrieval failed: ${error.message}`);
    }
    throw new Error("Couldn't get the page. Please try again");
  }
};
