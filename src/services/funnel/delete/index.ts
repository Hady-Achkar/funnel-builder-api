import { z } from "zod";
import { cacheService } from "../../cache/cache.service";
import { getPrisma } from "../../../lib/prisma";
import { hasPermissionToDeleteFunnel } from "../../../helpers/funnel/delete";
import {
  deleteFunnelParams,
  DeleteFunnelParams,
  deleteFunnelResponse,
  DeleteFunnelResponse,
} from "../../../types/funnel/delete";

export const deleteFunnel = async (
  funnelId: number,
  userId: number
): Promise<DeleteFunnelResponse> => {
  let validatedParams: DeleteFunnelParams;

  try {
    if (!userId) throw new Error("User ID is required");

    validatedParams = deleteFunnelParams.parse({ funnelId });

    const prisma = getPrisma();

    const funnelToDelete = await prisma.funnel.findUnique({
      where: { id: validatedParams.funnelId },
      select: {
        id: true,
        name: true,
        workspaceId: true,
        pages: {
          select: {
            id: true,
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
      },
    });

    if (!funnelToDelete) {
      throw new Error("Funnel not found");
    }

    const isOwner = funnelToDelete.workspace.ownerId === userId;

    if (!isOwner) {
      const member = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: userId,
            workspaceId: funnelToDelete.workspaceId,
          },
        },
        select: {
          role: true,
          permissions: true,
        },
      });

      if (!member) {
        throw new Error(
          `You don't have access to this funnel. Please ask the workspace owner to invite you.`
        );
      }

      const canDeleteFunnel = hasPermissionToDeleteFunnel(
        member.role,
        member.permissions
      );

      if (!canDeleteFunnel) {
        throw new Error(
          `You don't have permission to delete funnels in this workspace. Please contact your workspace admin.`
        );
      }
    }

    await prisma.funnel.delete({
      where: { id: validatedParams.funnelId },
    });

    try {
      // Delete individual funnel cache
      const fullFunnelCacheKey = `workspace:${funnelToDelete.workspaceId}:funnel:${validatedParams.funnelId}:full`;
      await cacheService.del(fullFunnelCacheKey);

      // Delete all page cache keys for this funnel
      for (const page of funnelToDelete.pages) {
        const pageCacheKey = `funnel:${validatedParams.funnelId}:page:${page.id}:full`;
        await cacheService.del(pageCacheKey);
      }

      // Update all funnels cache
      const allFunnelsCacheKey = `workspace:${funnelToDelete.workspaceId}:funnels:all`;
      const existingFunnels = await cacheService.get<any[]>(allFunnelsCacheKey);

      if (existingFunnels) {
        const updatedFunnels = existingFunnels.filter(
          (f) => f.id !== validatedParams.funnelId
        );

        if (updatedFunnels.length === 0) {
          await cacheService.del(allFunnelsCacheKey);
        } else {
          await cacheService.set(allFunnelsCacheKey, updatedFunnels, {
            ttl: 0,
          });
        }
      }

      await cacheService.del(
        `workspace:${funnelToDelete.workspaceId}:funnels:list`
      );
      await cacheService.del(
        `user:${userId}:workspace:${funnelToDelete.workspaceId}:funnels`
      );
    } catch (cacheError) {
      console.warn(
        `Funnel deleted from database, but cache update failed for funnel ${validatedParams.funnelId}:`,
        cacheError
      );
    }

    const response = {
      message: "Funnel deleted successfully",
    };

    return deleteFunnelResponse.parse(response);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`Invalid input: ${firstError.message}`);
    }

    if (error instanceof Error) {
      throw new Error(`Failed to delete funnel: ${error.message}`);
    }

    throw new Error("Couldn't delete the funnel. Please try again.");
  }
};