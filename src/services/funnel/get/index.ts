import { z } from "zod";
import { cacheService } from "../../cache/cache.service";
import { getPrisma } from "../../../lib/prisma";
import { hasPermissionToViewFunnel } from "../../../helpers/funnel/get";
import {
  getFunnelParams,
  GetFunnelParams,
  getFunnelResponse,
  GetFunnelResponse,
} from "../../../types/funnel/get";

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

    // Check permissions
    const isOwner = funnelExists.workspace.ownerId === userId;

    if (!isOwner) {
      const member = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: userId,
            workspaceId: funnelExists.workspaceId,
          },
        },
        select: {
          role: true,
        },
      });

      if (!member) {
        throw new Error(
          `You don't have access to this funnel. Please ask the workspace owner to invite you.`
        );
      }

      const canViewFunnel = hasPermissionToViewFunnel(member.role);

      if (!canViewFunnel) {
        throw new Error(
          `You don't have permission to view this funnel. Please contact your workspace admin.`
        );
      }
    }

    // Try to get funnel from cache first
    const fullFunnelCacheKey = `workspace:${funnelExists.workspaceId}:funnel:${validatedParams.funnelId}:full`;
    let funnel = await cacheService.get<any>(fullFunnelCacheKey);

    // If not in cache, fetch from database
    if (!funnel) {
      const funnelFromDb = await prisma.funnel.findUnique({
        where: { id: validatedParams.funnelId },
        include: {
          activeTheme: true,
          pages: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              name: true,
              order: true,
              linkingId: true,
              seoTitle: true,
              seoDescription: true,
              seoKeywords: true,
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
        activeTheme: funnelFromDb.activeTheme,
        pages: funnelFromDb.pages,
      };

      // Cache the result
      try {
        await cacheService.set(fullFunnelCacheKey, funnel, { ttl: 0 });
      } catch (cacheError) {
        console.warn("Failed to cache funnel:", cacheError);
      }
    }

    return getFunnelResponse.parse(funnel);
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