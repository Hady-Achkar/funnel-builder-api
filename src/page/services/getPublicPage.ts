import z from "zod";
import { getPrisma } from "../../lib/prisma";
import {
  GetPublicPageParams,
  GetPublicPageResponse,
  GetPublicPageParamsSchema,
  GetPublicPageResponseSchema,
  PublicPageData,
} from "../types";
import { cacheService } from "../../services/cache/cache.service";

export const getPublicPage = async (
  params: GetPublicPageParams
): Promise<GetPublicPageResponse> => {
  try {
    const validatedParams = GetPublicPageParamsSchema.parse(params);

    const prisma = getPrisma();

    const page = await prisma.page.findFirst({
      where: {
        funnelId: validatedParams.funnelId,
        linkingId: validatedParams.linkingId,
      },
      include: {
        funnel: {
          select: { id: true, name: true, status: true, userId: true },
        },
      },
    });

    if (!page) throw new Error("Page not found");

    if (!page.funnel || page.funnel.status !== "LIVE") {
      throw new Error("This page is not publicly accessible");
    }

    const cacheKey = `user:${page.funnel.userId}:page:${page.id}:full`;
    const cachedPage = await cacheService.get(cacheKey);

    if (cachedPage) {
      const cached = cachedPage as PublicPageData;
      const response = {
        data: {
          id: cached.id,
          name: cached.name,
          content: cached.content,
          linkingId: cached.linkingId,
          seoTitle: cached.seoTitle,
          seoDescription: cached.seoDescription,
          seoKeywords: cached.seoKeywords,
          funnelName: page.funnel.name,
          funnelId: page.funnel.id,
        },
      };
      GetPublicPageResponseSchema.parse(response);
      return response;
    }

    const fullPageData = {
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
      await cacheService.set(cacheKey, fullPageData, { ttl: 0 });
    } catch (cacheError) {
      console.warn("Public page fetched but couldn't cache:", cacheError);
    }

    const response = {
      data: {
        id: page.id,
        name: page.name,
        content: page.content,
        linkingId: page.linkingId,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        seoKeywords: page.seoKeywords,
        funnelName: page.funnel.name,
        funnelId: page.funnel.id,
      },
    };

    GetPublicPageResponseSchema.parse(response);
    return response;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`Invalid input: ${firstError.message}`);
    }
    if (error instanceof Error) {
      throw new Error(`Public page retrieval failed: ${error.message}`);
    }
    throw new Error("Couldn't get the public page. Please try again");
  }
};
