import { z } from "zod";
import { cacheService } from "../../cache/cache.service";
import { getPrisma } from "../../../lib/prisma";
import { PermissionManager } from "../../../utils/workspace-utils/workspace-permission-manager";
import { PermissionAction } from "../../../utils/workspace-utils/workspace-permission-manager/types";
import {
  getAllFunnelsParams,
  GetAllFunnelsParams,
  getAllFunnelsRequest,
  GetAllFunnelsRequest,
  getAllFunnelsResponse,
  GetAllFunnelsResponse,
} from "../../../types/funnel/getAll";

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

export const getAllFunnels = async (
  workspaceSlug: string,
  userId: number,
  query: Partial<GetAllFunnelsRequest> = {}
): Promise<GetAllFunnelsResponse> => {
  let validatedParams: GetAllFunnelsParams;
  let validatedQuery: GetAllFunnelsRequest;

  try {
    if (!userId) throw new Error("User ID is required");

    validatedParams = getAllFunnelsParams.parse({ workspaceSlug });

    const parsedQuery = {
      page: query?.page ? parseInt(String(query.page), 10) : undefined,
      limit: query?.limit ? parseInt(String(query.limit), 10) : undefined,
      sortBy: query?.sortBy,
      sortOrder: query?.sortOrder,
      status: query?.status,
      search: query?.search ? String(query.search) : undefined,
      createdBy: query?.createdBy
        ? parseInt(String(query.createdBy), 10)
        : undefined,
    };

    validatedQuery = getAllFunnelsRequest.parse(parsedQuery);

    const prisma = getPrisma();

    const workspace = await prisma.workspace.findUnique({
      where: { slug: validatedParams.workspaceSlug },
      select: {
        id: true,
        name: true,
        ownerId: true,
      },
    });

    if (!workspace) {
      throw new Error("The workspace does not exist");
    }

    // Check if user has permission to view funnels in this workspace
    const permissionCheck = await PermissionManager.can({
      userId,
      workspaceId: workspace.id,
      action: PermissionAction.VIEW_FUNNEL,
    });

    if (!permissionCheck.allowed) {
      throw new Error(
        permissionCheck.reason ||
          `You don't have permission to view funnels in this workspace. Please contact your workspace admin.`
      );
    }

    const allFunnelsCacheKey = `workspace:${workspace.id}:funnels:all`;
    let allFunnels = await cacheService.get<any[]>(allFunnelsCacheKey);

    if (!allFunnels) {
      const funnelsFromDb = await prisma.funnel.findMany({
        where: { workspaceId: workspace.id },
        include: {
          settings: true,
        },
        orderBy: { createdAt: "desc" },
      });

      allFunnels = funnelsFromDb.map((funnel) => ({
        id: funnel.id,
        name: funnel.name,
        slug: funnel.slug,
        status: funnel.status,
        workspaceId: funnel.workspaceId,
        createdBy: funnel.createdBy,
        settings: funnel.settings
          ? {
              ...funnel.settings,
              customTrackingScripts: Array.isArray(
                funnel.settings.customTrackingScripts
              )
                ? funnel.settings.customTrackingScripts
                : funnel.settings.customTrackingScripts
                ? [funnel.settings.customTrackingScripts]
                : [],
              defaultSeoKeywords: convertSeoKeywordsToArray(
                funnel.settings.defaultSeoKeywords
              ),
            }
          : null,
        createdAt: funnel.createdAt,
        updatedAt: funnel.updatedAt,
      }));

      await cacheService.set(allFunnelsCacheKey, allFunnels, { ttl: 0 });
    }

    let filteredFunnels = [...allFunnels];

    // Filter by status
    if (validatedQuery.status) {
      filteredFunnels = filteredFunnels.filter(
        (f) => f.status === validatedQuery.status
      );
    }

    // Filter by creator
    if (validatedQuery.createdBy) {
      filteredFunnels = filteredFunnels.filter(
        (f) => f.createdBy === validatedQuery.createdBy
      );
    }

    // Search by name or slug (case-insensitive)
    if (validatedQuery.search) {
      const searchLower = validatedQuery.search.toLowerCase();
      filteredFunnels = filteredFunnels.filter(
        (f) =>
          f.name.toLowerCase().includes(searchLower) ||
          f.slug.toLowerCase().includes(searchLower)
      );
    }

    filteredFunnels.sort((a, b) => {
      const aValue = a[validatedQuery.sortBy as keyof typeof a];
      const bValue = b[validatedQuery.sortBy as keyof typeof b];

      if (validatedQuery.sortOrder === "desc") {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });

    const total = filteredFunnels.length;
    const totalPages = Math.ceil(total / validatedQuery.limit);
    const skip = (validatedQuery.page - 1) * validatedQuery.limit;
    const paginatedFunnels = filteredFunnels.slice(
      skip,
      skip + validatedQuery.limit
    );

    // Ensure SEO keywords are arrays (for backward compatibility with old cache)
    const funnelsWithArrayKeywords = paginatedFunnels.map((funnel: any) => ({
      ...funnel,
      settings: funnel.settings
        ? {
            ...funnel.settings,
            defaultSeoKeywords: Array.isArray(
              funnel.settings.defaultSeoKeywords
            )
              ? funnel.settings.defaultSeoKeywords
              : convertSeoKeywordsToArray(funnel.settings.defaultSeoKeywords),
          }
        : null,
    }));

    const response = {
      funnels: funnelsWithArrayKeywords,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total,
        totalPages,
        hasNext: validatedQuery.page < totalPages,
        hasPrev: validatedQuery.page > 1,
      },
    };

    return getAllFunnelsResponse.parse(response);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`Invalid input: ${firstError.message}`);
    }
    if (error instanceof Error) {
      throw new Error(`Failed to get funnels: ${error.message}`);
    }
    throw new Error("Couldn't retrieve the funnels. Please try again.");
  }
};
