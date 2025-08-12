import { z } from "zod";
import { getPrisma } from "../../lib/prisma";
import {
  UpdatePageBody,
  UpdatePageResponse,
  UpdatePageParamsSchema,
  UpdatePageBodySchema,
  UpdatePageResponseSchema,
  UpdatePageParams,
} from "../types";
import { cacheService } from "../../services/cache/cache.service";

export const updatePage = async (
  params: UpdatePageParams,
  userId: number,
  body: UpdatePageBody
): Promise<UpdatePageResponse> => {
  try {
    if (!userId) throw new Error("User ID is required");

    const validatedParams = UpdatePageParamsSchema.parse(params);
    const validatedBody = UpdatePageBodySchema.parse(body);

    const prisma = getPrisma();

    const existing = await prisma.page.findFirst({
      where: { id: validatedParams.pageId, funnel: { userId } },
    });

    if (!existing) throw new Error("Page not found or you don't have access");

    const updates = {};
    const changed = [];

    const fieldsToCheck = [
      { key: "name", displayName: "name" },
      { key: "content", displayName: "content" },
      { key: "order", displayName: "order" },
      { key: "linkingId", displayName: "linking ID" },
      { key: "seoTitle", displayName: "SEO title" },
      { key: "seoDescription", displayName: "SEO description" },
      { key: "seoKeywords", displayName: "SEO keywords" },
    ] as const;

    fieldsToCheck.forEach(({ key, displayName }) => {
      const value = validatedBody[key as keyof typeof validatedBody];
      const existingValue = existing[key as keyof typeof existing];
      if (value !== undefined && value !== existingValue) {
        updates[key] = value;
        changed.push(displayName);
      }
    });

    if (changed.length === 0) {
      const response = { message: "No changes detected" };
      UpdatePageResponseSchema.parse(response);
      return response;
    }

    const updated = await prisma.page.update({
      where: { id: validatedParams.pageId },
      data: updates,
    });

    try {
      const pageKey = `user:${userId}:page:${validatedParams.pageId}:full`;
      await cacheService.set(pageKey, updated, { ttl: 0 });

      const funnelKey = `user:${userId}:funnel:${existing.funnelId}:full`;
      const cachedFunnel = (await cacheService.get(funnelKey)) as any;

      if (cachedFunnel?.pages) {
        const pageWithoutContent = {
          id: updated.id,
          name: updated.name,
          order: updated.order,
          linkingId: updated.linkingId,
          seoTitle: updated.seoTitle,
          seoDescription: updated.seoDescription,
          seoKeywords: updated.seoKeywords,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        };

        const updatedPages = cachedFunnel.pages.map((p: any) =>
          p.id === updated.id ? pageWithoutContent : p
        );

        await cacheService.set(
          funnelKey,
          { ...cachedFunnel, pages: updatedPages, updatedAt: new Date() },
          { ttl: 0 }
        );
      }
    } catch (cacheError) {
      console.warn("Page updated, but cache couldn't be updated:", cacheError);
    }

    const response = {
      message: `The page was updated successfully`,
    };

    UpdatePageResponseSchema.parse(response);
    return response;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`Invalid input: ${firstError.message}`);
    }
    if (error instanceof Error) {
      throw new Error(`Page update failed: ${error.message}`);
    }
    throw new Error("Couldn't update the page. Please try again");
  }
};
