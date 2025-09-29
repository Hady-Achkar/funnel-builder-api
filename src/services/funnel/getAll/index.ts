import { z } from "zod";
import { cacheService } from "../../cache/cache.service";
import { getPrisma } from "../../../lib/prisma";
import { hasPermissionToViewFunnels } from "../../../helpers/funnel/getAll";
import {
  getAllFunnelsParams,
  GetAllFunnelsParams,
  getAllFunnelsRequest,
  GetAllFunnelsRequest,
  getAllFunnelsResponse,
  GetAllFunnelsResponse,
} from "../../../types/funnel/getAll";

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

    const isOwner = workspace.ownerId === userId;

    if (!isOwner) {
      const member = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: userId,
            workspaceId: workspace.id,
          },
        },
        select: {
          role: true,
          permissions: true,
        },
      });

      if (!member) {
        throw new Error(
          `You don't have access to the ${workspace.name} workspace. Please ask the workspace owner to invite you.`
        );
      }

      const canViewFunnels = hasPermissionToViewFunnels(member.role);

      if (!canViewFunnels) {
        throw new Error(
          `You don't have permission to view funnels in this workspace. Please contact your workspace admin.`
        );
      }
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
        settings: funnel.settings ? {
          ...funnel.settings,
          customTrackingScripts: Array.isArray(funnel.settings.customTrackingScripts)
            ? funnel.settings.customTrackingScripts
            : funnel.settings.customTrackingScripts
              ? [funnel.settings.customTrackingScripts]
              : []
        } : null,
        createdAt: funnel.createdAt,
        updatedAt: funnel.updatedAt,
      }));

      await cacheService.set(allFunnelsCacheKey, allFunnels, { ttl: 0 });
    }

    let filteredFunnels = [...allFunnels];

    if (validatedQuery.status) {
      filteredFunnels = filteredFunnels.filter(
        (f) => f.status === validatedQuery.status
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

    const response = {
      message: `Successfully retrieved ${paginatedFunnels.length} funnels from workspace ${workspace.name}`,
      funnels: paginatedFunnels,
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
