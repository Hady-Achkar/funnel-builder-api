import {
  CreatePageResponse,
  createPageRequest,
  createPageResponse,
} from "../../../types/page/create";
import { getPrisma } from "../../../lib/prisma";
import { cacheService } from "../../cache/cache.service";
import { BadRequestError, UnauthorizedError } from "../../../errors";
import { ZodError } from "zod";
import {
  checkFunnelEditPermissions,
  generateUniqueLinkingId,
} from "../../../helpers/page/create";

export const createPage = async (
  userId: number,
  requestBody: Record<string, unknown>
): Promise<CreatePageResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    const validatedRequest = createPageRequest.parse(requestBody);

    const prisma = getPrisma();

    const permissionCheck = await checkFunnelEditPermissions(
      userId,
      validatedRequest.funnelId
    );

    const lastPage = await prisma.page.findFirst({
      where: { funnelId: validatedRequest.funnelId },
      select: { order: true },
      orderBy: { order: "desc" },
    });

    const newOrder = (lastPage?.order || 0) + 1;

    const pageName = validatedRequest.name || `Page ${newOrder}`;

    const linkingId = await generateUniqueLinkingId(
      pageName,
      validatedRequest.funnelId
    );

    const result = await prisma.$transaction(async (tx) => {
      const page = await tx.page.create({
        data: {
          name: pageName,
          content: validatedRequest.content || "",
          type: validatedRequest.type || "PAGE",
          funnelId: validatedRequest.funnelId,
          linkingId: linkingId,
          order: newOrder,
        },
      });

      return page;
    });

    try {
      const pageFullData = {
        id: result.id,
        name: result.name,
        content: result.content,
        order: result.order,
        type: result.type,
        linkingId: result.linkingId,
        seoTitle: result.seoTitle,
        seoDescription: result.seoDescription,
        seoKeywords: result.seoKeywords,
        funnelId: result.funnelId,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };

      await cacheService.set(
        `funnel:${result.funnelId}:page:${result.id}:full`,
        pageFullData,
        { ttl: 0 }
      );

      const funnelCacheKey = `workspace:${permissionCheck.workspace.id}:funnel:${validatedRequest.funnelId}:full`;
      const cachedFunnel = await cacheService.get(funnelCacheKey);

      if (cachedFunnel && typeof cachedFunnel === "object") {
        const pageWithoutContent = {
          id: result.id,
          name: result.name,
          order: result.order,
          type: result.type,
          linkingId: result.linkingId,
          seoTitle: result.seoTitle,
          seoDescription: result.seoDescription,
          seoKeywords: result.seoKeywords,
          visits: result.visits,
          funnelId: result.funnelId,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
        };

        const funnel = cachedFunnel as any;
        const updatedFunnel = {
          ...funnel,
          pages: [...(funnel.pages || []), pageWithoutContent].sort(
            (a: any, b: any) => a.order - b.order
          ),
        };

        await cacheService.set(funnelCacheKey, updatedFunnel, { ttl: 0 });
      }
    } catch (cacheError) {
      console.warn("Cache update failed but page was created:", cacheError);
    }

    const response = {
      message: "Page created successfully",
      pageId: result.id,
    };

    return createPageResponse.parse(response);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};