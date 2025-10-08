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

    // Get funnel with workspace information
    const funnel = await prisma.funnel.findUnique({
      where: { id: validatedRequest.funnelId },
      select: {
        id: true,
        workspaceId: true,
        workspace: {
          select: {
            id: true,
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
      where: { funnelId: validatedRequest.funnelId },
      data: {
        isPasswordProtected: false,
        passwordHash: null,
      },
    });

    const cacheKey = `funnel:${validatedRequest.funnelId}:settings:full`;
    try {
      await cacheService.del(cacheKey);
    } catch (cacheError) {
      console.warn("Failed to invalidate funnel settings cache:", cacheError);
    }

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
