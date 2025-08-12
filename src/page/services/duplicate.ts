import { z } from "zod";
import { getPrisma } from "../../lib/prisma";
import {
  DuplicatePageBody,
  DuplicatePageResponse,
  DuplicatePageParamsSchema,
  DuplicatePageBodySchema,
  DuplicatePageResponseSchema,
  DuplicatePageParams,
} from "../types";
import { cacheService } from "../../services/cache/cache.service";

export const duplicatePage = async (
  params: DuplicatePageParams,
  userId: number,
  body: DuplicatePageBody = {}
): Promise<DuplicatePageResponse> => {
  try {
    if (!userId) throw new Error("User ID is required");

    const validatedParams = DuplicatePageParamsSchema.parse(params);
    const validatedBody = DuplicatePageBodySchema.parse(body);

    const prisma = getPrisma();

    const original = await prisma.page.findFirst({
      where: { id: validatedParams.pageId, funnel: { userId } },
    });
    if (!original) throw new Error("Page not found or you don't have access");

    const targetFunnelId = validatedBody.targetFunnelId ?? original.funnelId;
    const sameFunnel = targetFunnelId === original.funnelId;

    if (!sameFunnel) {
      const target = await prisma.funnel.findFirst({
        where: { id: targetFunnelId, userId },
      });
      if (!target)
        throw new Error("Target funnel not found or you don't have access");
    }

    const baseName = validatedBody.newName ?? original.name;
    let name =
      sameFunnel && !validatedBody.newName ? `${baseName} (Copy)` : baseName;

    while (
      await prisma.page.findFirst({ where: { funnelId: targetFunnelId, name } })
    ) {
      name = name.includes("(Copy")
        ? name.replace(
            /\(Copy( \d+)?\)/,
            (match, num) => `(Copy${num ? ` ${parseInt(num) + 1}` : " 2"})`
          )
        : `${name} (Copy)`;
    }

    let linkingId =
      validatedBody.newLinkingId ??
      (sameFunnel ? `${original.linkingId}-copy` : original.linkingId) ??
      `page-${Date.now()}`;

    while (
      await prisma.page.findFirst({
        where: { funnelId: targetFunnelId, linkingId },
      })
    ) {
      const base = original.linkingId || "page";
      linkingId = linkingId.includes("-copy")
        ? linkingId.replace(
            /-copy(\d*)$/,
            (match, num) => `-copy${num ? parseInt(num) + 1 : 2}`
          )
        : `${base}-copy`;
    }

    const order =
      (await prisma.page.count({ where: { funnelId: targetFunnelId } })) + 1;

    const duplicated = await prisma.page.create({
      data: {
        name,
        content: original.content,
        order,
        linkingId,
        seoTitle: original.seoTitle,
        seoDescription: original.seoDescription,
        seoKeywords: original.seoKeywords,
        funnelId: targetFunnelId,
      },
    });

    try {
      const pageKey = `user:${userId}:page:${duplicated.id}:full`;
      await cacheService.set(pageKey, duplicated, { ttl: 0 });

      const funnelKey = `user:${userId}:funnel:${targetFunnelId}:full`;
      const cached = (await cacheService.get(funnelKey)) as any;

      if (cached) {
        const pageWithoutContent = {
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
          { ...cached, pages: [...(cached.pages || []), pageWithoutContent] },
          { ttl: 0 }
        );
      }
    } catch (cacheError) {
      console.warn(
        "Page duplicated, but cache couldn't be updated:",
        cacheError
      );
    }

    const response = {
      message: `Page ${duplicated.name} duplicated successfully`,
    };

    DuplicatePageResponseSchema.parse(response);
    return response;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`Invalid input: ${firstError.message}`);
    }
    if (error instanceof Error) {
      throw new Error(`Page duplication failed: ${error.message}`);
    }
    throw new Error("Couldn't duplicate the page. Please try again");
  }
};
