import { z } from "zod";
import {
  UpdateFunnelParams,
  UpdateFunnelRequest,
  UpdateFunnelResponse,
  updateFunnelParams,
  updateFunnelRequest,
  updateFunnelResponse,
} from "../types";
import { cacheService } from "../../../services/cache/cache.service";
import { getPrisma } from "../../../lib/prisma";
import { hasPermissionToUpdateFunnel } from "../helpers";
import { 
  generateSlug, 
  generateUniqueSlug,
  validateSlugFormat 
} from "../../shared/helpers";

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

    // Check permissions
    const isOwner = existingFunnel.workspace.ownerId === userId;

    if (!isOwner) {
      const member = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: userId,
            workspaceId: existingFunnel.workspaceId,
          },
        },
        select: {
          role: true,
          permissions: true,
        },
      });

      if (!member) {
        throw new Error(`You don't have access to this workspace`);
      }

      const canUpdateFunnel = hasPermissionToUpdateFunnel(
        member.role,
        member.permissions
      );

      if (!canUpdateFunnel) {
        throw new Error(
          `You don't have permission to update funnels in this workspace`
        );
      }
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
    if (validatedData.slug !== undefined && validatedData.slug.trim() !== existingFunnel.slug) {
      const newSlug = validatedData.slug.trim();
      
      // Validate slug format
      if (!validateSlugFormat(newSlug)) {
        throw new Error("Funnel name contains invalid characters. Please use letters, numbers, and hyphens only.");
      }
      
      // Check if slug is unique in workspace
      const slugExists = await prisma.funnel.findFirst({
        where: {
          workspaceId: existingFunnel.workspaceId,
          slug: newSlug,
          id: { not: validatedParams.funnelId },
        },
        select: { id: true },
      });
      
      if (slugExists) {
        throw new Error("This funnel name is already in use in your workspace. Please choose a different name.");
      }
      
      updates.slug = newSlug;
      changed.push("slug");
    }

    // Auto-update slug when name changes (if slug wasn't explicitly provided)
    if (updates.name && !validatedData.slug) {
      const autoSlug = generateSlug(updates.name);
      const uniqueSlug = await generateUniqueSlug(autoSlug, existingFunnel.workspaceId, validatedParams.funnelId);
      updates.slug = uniqueSlug;
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
      include: {
        theme: true,
        pages: {
          omit: { content: true },
          orderBy: { order: "asc" },
        },
      },
    });

    // Update cache
    try {
      // Update the individual funnel full cache with pages (without content)
      const fullFunnelCacheKey = `workspace:${existingFunnel.workspaceId}:funnel:${updatedFunnel.id}:full`;
      const fullFunnelData = {
        id: updatedFunnel.id,
        name: updatedFunnel.name,
        slug: updatedFunnel.slug,
        status: updatedFunnel.status,
        workspaceId: updatedFunnel.workspaceId,
        createdBy: updatedFunnel.createdBy,
        themeId: updatedFunnel.themeId,
        createdAt: updatedFunnel.createdAt,
        updatedAt: updatedFunnel.updatedAt,
        theme: updatedFunnel.theme,
        pages: updatedFunnel.pages,
      };
      await cacheService.set(fullFunnelCacheKey, fullFunnelData, { ttl: 0 });

      // Update the workspace's all funnels cache
      const allFunnelsCacheKey = `workspace:${existingFunnel.workspaceId}:funnels:all`;
      const existingFunnels =
        (await cacheService.get<any[]>(allFunnelsCacheKey)) || [];

      // Update the funnel in the list
      const funnelSummary = {
        id: updatedFunnel.id,
        name: updatedFunnel.name,
        slug: updatedFunnel.slug,
        status: updatedFunnel.status,
        workspaceId: updatedFunnel.workspaceId,
        createdBy: updatedFunnel.createdBy,
        themeId: updatedFunnel.themeId,
        createdAt: updatedFunnel.createdAt,
        updatedAt: updatedFunnel.updatedAt,
        theme: updatedFunnel.theme,
      };

      const updatedFunnels = existingFunnels.map((f) =>
        f.id === updatedFunnel.id ? funnelSummary : f
      );

      // If funnel wasn't in the list, add it
      if (!existingFunnels.find((f) => f.id === updatedFunnel.id)) {
        updatedFunnels.push(funnelSummary);
      }

      await cacheService.set(allFunnelsCacheKey, updatedFunnels, { ttl: 0 });

      // Invalidate old list caches
      await cacheService.del(
        `workspace:${existingFunnel.workspaceId}:funnels:list`
      );
      await cacheService.del(
        `user:${userId}:workspace:${existingFunnel.workspaceId}:funnels`
      );
    } catch (cacheError) {
      console.warn(
        "Funnel updated, but cache couldn't be refreshed:",
        cacheError
      );
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
          throw new Error("This funnel name is already in use in your workspace. Please choose a different name.");
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
