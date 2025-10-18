import { z } from "zod";
import {
  UpdateFunnelParams,
  UpdateFunnelRequest,
  UpdateFunnelResponse,
  updateFunnelParams,
  updateFunnelRequest,
  updateFunnelResponse,
} from "../../../types/funnel/update";
import { cacheService } from "../../cache/cache.service";
import { getPrisma } from "../../../lib/prisma";
import { PermissionManager } from "../../../utils/workspace-utils/workspace-permission-manager";
import { PermissionAction } from "../../../utils/workspace-utils/workspace-permission-manager/types";
import { generateSlug } from "../../../utils/funnel-utils/generate-slug";

export const updateFunnel = async (
  funnelId: number,
  userId: number,
  data: UpdateFunnelRequest
): Promise<UpdateFunnelResponse> => {
  let validatedParams: UpdateFunnelParams;
  let validatedData: UpdateFunnelRequest = {} as UpdateFunnelRequest;

  try {
    if (!userId) throw new Error("User ID is required");

    validatedParams = updateFunnelParams.parse({ funnelId });
    validatedData = updateFunnelRequest.parse(data);

    if (!validatedData.name && !validatedData.status && !validatedData.slug) {
      throw new Error("Nothing to update");
    }

    const prisma = getPrisma();

    const existingFunnel = await prisma.funnel.findUnique({
      where: { id: validatedParams.funnelId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
      },
    });

    if (!existingFunnel) {
      throw new Error("Funnel not found");
    }

    // Check if user has permission to update this funnel
    const permissionCheck = await PermissionManager.can({
      userId,
      workspaceId: existingFunnel.workspaceId,
      action: PermissionAction.EDIT_FUNNEL,
    });

    if (!permissionCheck.allowed) {
      throw new Error(
        permissionCheck.reason ||
        `You don't have permission to update funnels in this workspace`
      );
    }

    // Build update object
    const updates: any = {};
    const changed: string[] = [];

    if (
      validatedData.name !== undefined &&
      validatedData.name.trim() !== existingFunnel.name
    ) {
      updates.name = validatedData.name.trim();
      changed.push("name");
    }

    // Handle slug update
    if (
      validatedData.slug !== undefined &&
      validatedData.slug.trim() !== existingFunnel.slug
    ) {
      updates.slug = await generateSlug(
        prisma,
        validatedData.slug.trim(),
        existingFunnel.workspaceId,
        validatedParams.funnelId
      );
      changed.push("slug");
    }

    // Auto-update slug when name changes (if slug wasn't explicitly provided)
    if (updates.name && !validatedData.slug) {
      updates.slug = await generateSlug(
        prisma,
        updates.name,
        existingFunnel.workspaceId,
        validatedParams.funnelId
      );
      changed.push("slug");
    }

    if (
      validatedData.status !== undefined &&
      validatedData.status !== existingFunnel.status
    ) {
      updates.status = validatedData.status;
      changed.push("status");
    }

    if (changed.length === 0) {
      throw new Error("Nothing to update");
    }

    // Update funnel
    const updatedFunnel = await prisma.funnel.update({
      where: { id: validatedParams.funnelId },
      data: updates,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        workspaceId: true,
      },
    });

    // Invalidate cache after successful update
    try {
      // Invalidate all relevant cache keys
      const cacheKeysToInvalidate = [
        // Individual funnel full cache
        `workspace:${existingFunnel.workspaceId}:funnel:${updatedFunnel.id}:full`,
        // Workspace's all funnels cache
        `workspace:${existingFunnel.workspaceId}:funnels:all`,
        // Legacy cache keys (for backward compatibility)
        `workspace:${existingFunnel.workspaceId}:funnels:list`,
        `user:${userId}:workspace:${existingFunnel.workspaceId}:funnels`,
        // Funnel settings cache
        `funnel:${updatedFunnel.id}:settings:full`
      ];

      // Delete all cache keys in parallel
      await Promise.all(
        cacheKeysToInvalidate.map(key =>
          cacheService.del(key).catch(err =>
            console.warn(`Failed to invalidate cache key ${key}:`, err)
          )
        )
      );

      console.log(`[Cache] Invalidated funnel caches for funnel ${updatedFunnel.id} in workspace ${existingFunnel.workspaceId}`);
    } catch (cacheError) {
      console.error("Failed to invalidate funnel cache:", cacheError);
      // Don't fail the operation if cache invalidation fails
    }

    const response = {
      message: `Funnel ${updatedFunnel.name} updated successfully`,
      funnelId: updatedFunnel.id,
    };

    return updateFunnelResponse.parse(response);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`Invalid input: ${firstError.message}`);
    }

    if (error instanceof Error) {
      if (
        error.message.includes("Unique constraint failed") ||
        error.message.includes("duplicate key value") ||
        error.message.includes("P2002")
      ) {
        if (error.message.includes("slug")) {
          throw new Error(
            "This funnel name is already in use in your workspace. Please choose a different name."
          );
        }
        throw new Error(
          `A funnel with the name "${validatedData.name}" already exists in this workspace. Please choose a different name.`
        );
      }

      throw new Error(`Failed to update funnel: ${error.message}`);
    }

    throw new Error("Couldn't update the funnel. Please try again.");
  }
};
