import { z } from "zod";
import { getPrisma } from "../../lib/prisma";
import { 
  CreatePageParams, 
  CreatePageBody, 
  CreatePageResponse,
  CreatePageParamsSchema,
  CreatePageBodySchema,
  CreatePageResponseSchema
} from "../types";
import { cacheService } from "../../services/cache/cache.service";

export const createPage = async (
  params: CreatePageParams,
  userId: number,
  body: CreatePageBody
): Promise<CreatePageResponse> => {
  try {
    if (!userId) throw new Error("User ID is required");

    const validatedParams = CreatePageParamsSchema.parse(params);
    const validatedBody = CreatePageBodySchema.parse(body);

    const prisma = getPrisma();

    const funnel = await prisma.funnel.findFirst({
      where: { id: validatedParams.funnelId, userId },
    });
    if (!funnel) throw new Error("Funnel not found or you don't have access");

    const order = (await prisma.page.count({ where: { funnelId: validatedParams.funnelId } })) + 1;

    let name = validatedBody.name;
    if (!name) {
      let counter = order;
      let testName = `Page ${counter}`;

      while (
        await prisma.page.findFirst({
          where: { funnelId: validatedParams.funnelId, name: testName },
        })
      ) {
        counter++;
        testName = `Page ${counter}`;
      }
      name = testName;
    }

    let linkingId = validatedBody.linkingId;
    if (!linkingId) {
      let counter = order;
      let testId = `page${counter}`;

      while (
        await prisma.page.findFirst({
          where: { funnelId: validatedParams.funnelId, linkingId: testId },
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
        content: validatedBody.content || "",
        order,
        linkingId,
        seoTitle: validatedBody.seoTitle,
        seoDescription: validatedBody.seoDescription,
        seoKeywords: validatedBody.seoKeywords,
        funnelId: validatedParams.funnelId,
      },
    });

    try {
      const pageKey = `user:${userId}:page:${page.id}:full`;
      await cacheService.set(pageKey, page, { ttl: 0 });

      const funnelKey = `user:${userId}:funnel:${validatedParams.funnelId}:full`;
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

    const response = {
      message: `Page ${page.name} created successfully`,
    };

    CreatePageResponseSchema.parse(response);
    return response;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`Invalid input: ${firstError.message}`);
    }
    if (error instanceof Error) {
      throw new Error(`Page creation failed: ${error.message}`);
    }
    throw new Error("Couldn't create the page. Please try again");
  }
};
