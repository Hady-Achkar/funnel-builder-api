import { z } from "zod";
import { getPrisma } from "../../../lib/prisma";
import { PermissionManager } from "../../../utils/workspace-utils/workspace-permission-manager";
import { PermissionAction } from "../../../utils/workspace-utils/workspace-permission-manager/types";
import {
  getSessionsByFunnelParams,
  GetSessionsByFunnelParams,
  getSessionsByFunnelResponse,
  GetSessionsByFunnelResponse,
} from "../../../types/session/get-by-funnel";

export const getSessionsByFunnel = async (
  funnelId: number,
  userId: number
): Promise<GetSessionsByFunnelResponse> => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Validate params
    const validatedParams = getSessionsByFunnelParams.parse({ funnelId });

    const prisma = getPrisma();

    // Check if funnel exists and get workspace info
    const funnel = await prisma.funnel.findUnique({
      where: { id: validatedParams.funnelId },
      select: {
        id: true,
        workspaceId: true,
      },
    });

    if (!funnel) {
      throw new Error("Funnel not found");
    }

    // Check if user has permission to view this funnel
    const permissionCheck = await PermissionManager.can({
      userId,
      workspaceId: funnel.workspaceId,
      action: PermissionAction.VIEW_FUNNEL,
    });

    if (!permissionCheck.allowed) {
      throw new Error(
        permissionCheck.reason ||
          `You don't have permission to view this funnel's sessions. Please contact your workspace admin.`
      );
    }

    // Get all sessions for this funnel
    const sessions = await prisma.session.findMany({
      where: {
        funnelId: validatedParams.funnelId,
      },
      select: {
        id: true,
        sessionId: true,
        visitedPages: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const response = {
      sessions,
      total: sessions.length,
    };

    return getSessionsByFunnelResponse.parse(response);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`Invalid input: ${firstError.message}`);
    }

    if (error instanceof Error) {
      throw new Error(`Failed to get sessions: ${error.message}`);
    }

    throw new Error("Couldn't retrieve sessions. Please try again.");
  }
};
