import {
  GetPageResponse,
  getPageRequest,
  getPageResponse,
} from "../../../types/page/get";
import { getPrisma } from "../../../lib/prisma";
import { cacheService } from "../../cache/cache.service";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from "../../../errors";
import { ZodError } from "zod";
import { PermissionManager } from "../../../utils/workspace-utils/workspace-permission-manager/permission-manager";
import { PermissionAction } from "../../../utils/workspace-utils/workspace-permission-manager/types";

export const getPage = async (
  userId: number,
  requestBody: Record<string, unknown>
): Promise<GetPageResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    const validatedRequest = getPageRequest.parse(requestBody);
    const prisma = getPrisma();

    // Get page with workspace info for permission check
    const page = await prisma.page.findUnique({
      where: { id: validatedRequest.pageId },
      select: {
        id: true,
        name: true,
        content: true,
        order: true,
        type: true,
        linkingId: true,
        seoTitle: true,
        seoDescription: true,
        seoKeywords: true,
        funnelId: true,
        visits: true,
        createdAt: true,
        updatedAt: true,
        funnel: {
          select: {
            id: true,
            workspaceId: true,
          },
        },
      },
    });

    if (!page) {
      throw new NotFoundError("Page not found");
    }

    // Check VIEW_PAGE permission
    await PermissionManager.requirePermission({
      userId,
      workspaceId: page.funnel.workspaceId,
      action: PermissionAction.VIEW_PAGE,
    });

    // Try cache first
    const cacheKey = `workspace:${page.funnel.workspaceId}:funnel:${page.funnelId}:page:${page.id}:full`;
    const cachedPage = await cacheService.get<any>(cacheKey);

    if (cachedPage) {
      return getPageResponse.parse(cachedPage);
    }

    // Prepare response data
    const responseData = {
      id: page.id,
      name: page.name,
      content: page.content,
      order: page.order,
      type: page.type,
      linkingId: page.linkingId,
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
      seoKeywords: page.seoKeywords,
      funnelId: page.funnelId,
      visits: page.visits ?? 0, // Explicitly set to 0 if null
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    };

    // Cache for future requests
    try {
      await cacheService.set(cacheKey, responseData, { ttl: 0 });
    } catch (cacheError) {
      console.warn("Failed to cache page data:", cacheError);
    }

    return getPageResponse.parse(responseData);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};
