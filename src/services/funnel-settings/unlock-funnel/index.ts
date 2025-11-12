import { getPrisma } from "../../../lib/prisma";
import { BadRequestError } from "../../../errors";
import {
  UnlockFunnelRequest,
  UnlockFunnelResponse,
  unlockFunnelRequest,
  unlockFunnelResponse,
} from "../../../types/funnel-settings/unlock-funnel";
import { ZodError } from "zod";
import { PermissionManager, PermissionAction } from "../../../utils/workspace-utils/workspace-permission-manager";
import { cacheService } from "../../cache/cache.service";
import { WorkspaceStatus } from "../../../generated/prisma-client";

export const unlockFunnel = async (
  userId: number,
  data: Partial<UnlockFunnelRequest>
): Promise<UnlockFunnelResponse> => {
  try {
    if (!userId) throw new Error("User ID is required");

    const validatedRequest = unlockFunnelRequest.parse(data);

    const prisma = getPrisma();

    // Get funnel with workspace information by slug
    const funnel = await prisma.funnel.findFirst({
      where: {
        slug: validatedRequest.funnelSlug,
        workspace: {
          slug: validatedRequest.workspaceSlug,
        },
      },
      select: {
        id: true,
        slug: true,
        workspaceId: true,
        workspace: {
          select: {
            id: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    if (!funnel) {
      throw new Error("Funnel not found");
    }

    // Check permissions using centralized PermissionManager
    await PermissionManager.requirePermission({
      userId,
      workspaceId: funnel.workspaceId,
      action: PermissionAction.EDIT_FUNNEL,
    });

    // Check if workspace has DRAFT status - prevent unlocking for DRAFT workspaces
    if (funnel.workspace.status === WorkspaceStatus.DRAFT) {
      throw new Error(
        "Password protection cannot be removed from funnels in your current workspace plan. This feature is available for workspaces with enhanced access."
      );
    }

    await prisma.funnelSettings.update({
      where: { funnelId: funnel.id },
      data: {
        isPasswordProtected: false,
        passwordHash: null,
      },
    });

    const cacheKeysToInvalidate = [
      `funnel:${funnel.id}:settings:full`,
      `workspace:${validatedRequest.workspaceSlug}:funnel:${funnel.slug}:full`,
      `workspace:${funnel.workspaceId}:funnels:all`,
    ];

    await Promise.all(
      cacheKeysToInvalidate.map(key =>
        cacheService.del(key).catch(err =>
          console.warn(`Failed to invalidate cache key ${key}:`, err)
        )
      )
    );

    const response = {
      message: "Funnel unlocked successfully",
      success: true,
    };

    return unlockFunnelResponse.parse(response);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};
