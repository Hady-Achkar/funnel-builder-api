import { z } from "zod";
import { cacheService } from "../../cache/cache.service";
import { getPrisma } from "../../../lib/prisma";
import { PermissionManager } from "../../../utils/workspace-utils/workspace-permission-manager";
import { PermissionAction } from "../../../utils/workspace-utils/workspace-permission-manager/types";
import {
  getFunnelParams,
  GetFunnelParams,
  getFunnelResponse,
  GetFunnelResponse,
} from "../../../types/funnel/get";

/**
 * Convert SEO keywords from database string to array format for frontend
 * Database stores JSON string arrays like '["keyword1", "keyword2"]'
 */
function convertSeoKeywordsToArray(keywords: string | null): string[] {
  if (!keywords) return [];

  // Try parsing as JSON first
  try {
    const parsed = JSON.parse(keywords);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Fall back to comma-separated parsing for backward compatibility with old data
    return keywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
  }

  return [];
}

export const getFunnel = async (
  funnelId: number,
  userId: number
): Promise<GetFunnelResponse> => {
  let validatedParams: GetFunnelParams;

  try {
    if (!userId) throw new Error("User ID is required");

    validatedParams = getFunnelParams.parse({ funnelId });

    const prisma = getPrisma();

    const funnelExists = await prisma.funnel.findUnique({
      where: { id: validatedParams.funnelId },
      select: {
        id: true,
        workspaceId: true,
        workspace: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
      },
    });

    if (!funnelExists) {
      throw new Error("Funnel not found");
    }

    // Check if user has permission to view this funnel
    const permissionCheck = await PermissionManager.can({
      userId,
      workspaceId: funnelExists.workspaceId,
      action: PermissionAction.VIEW_FUNNEL,
    });

    if (!permissionCheck.allowed) {
      throw new Error(
        permissionCheck.reason ||
          `You don't have permission to view this funnel. Please contact your workspace admin.`
      );
    }

    // Try to get funnel from cache first
    const fullFunnelCacheKey = `workspace:${funnelExists.workspaceId}:funnel:${validatedParams.funnelId}:full`;
    let funnel = await cacheService.get<any>(fullFunnelCacheKey);

    // If not in cache, fetch from database
    if (!funnel) {
      const funnelFromDb = await prisma.funnel.findUnique({
        where: { id: validatedParams.funnelId },
        include: {
          customTheme: true,
          pages: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              name: true,
              type: true,
              order: true,
              linkingId: true,
              seoTitle: true,
              seoDescription: true,
              seoKeywords: true,
              visits: true,
            },
          },
        },
      });

      if (!funnelFromDb) {
        throw new Error("Funnel not found");
      }

      funnel = {
        id: funnelFromDb.id,
        name: funnelFromDb.name,
        slug: funnelFromDb.slug,
        status: funnelFromDb.status,
        workspaceId: funnelFromDb.workspaceId,
        createdBy: funnelFromDb.createdBy,
        activeThemeId: funnelFromDb.activeThemeId,
        createdAt: funnelFromDb.createdAt,
        updatedAt: funnelFromDb.updatedAt,
        customTheme: funnelFromDb.customTheme,
        pages: funnelFromDb.pages.map((page) => ({
          ...page,
          visits: page.visits ?? 0,
          seoKeywords: convertSeoKeywordsToArray(page.seoKeywords),
        })),
      };

      // Cache the result
      try {
        await cacheService.set(fullFunnelCacheKey, funnel, { ttl: 0 });
      } catch (cacheError) {
        console.warn("Failed to cache funnel:", cacheError);
      }
    }

    // Ensure all pages have the visits field and convert SEO keywords (for backward compatibility with old cache)
    const funnelWithVisits = {
      ...funnel,
      pages: funnel.pages.map((page: any) => ({
        ...page,
        visits: page.visits ?? 0,
        seoKeywords: Array.isArray(page.seoKeywords)
          ? page.seoKeywords
          : convertSeoKeywordsToArray(page.seoKeywords),
      })),
    };

    return getFunnelResponse.parse(funnelWithVisits);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`Invalid input: ${firstError.message}`);
    }

    if (error instanceof Error) {
      throw new Error(`Failed to get funnel: ${error.message}`);
    }

    throw new Error("Couldn't retrieve the funnel. Please try again.");
  }
};
