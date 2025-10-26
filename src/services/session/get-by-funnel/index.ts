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
  userId: number,
  startDate?: string,
  endDate?: string
): Promise<GetSessionsByFunnelResponse> => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Validate params
    const validatedParams = getSessionsByFunnelParams.parse({
      funnelId,
      startDate,
      endDate,
    });

    const prisma = getPrisma();

    // Check if funnel exists and get workspace info and pages
    const funnel = await prisma.funnel.findUnique({
      where: { id: validatedParams.funnelId },
      select: {
        id: true,
        workspaceId: true,
        pages: {
          select: {
            id: true,
            name: true,
          },
          orderBy: {
            order: "asc",
          },
        },
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

    // Build where clause with optional date filters
    const whereClause: any = {
      funnelId: validatedParams.funnelId,
    };

    // Add date filters if provided
    if (validatedParams.startDate || validatedParams.endDate) {
      whereClause.updatedAt = {};
      if (validatedParams.startDate) {
        // Set to start of day (00:00:00) in UTC
        const startOfDay = new Date(validatedParams.startDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        whereClause.updatedAt.gte = startOfDay;
      }
      if (validatedParams.endDate) {
        // Set to end of day (23:59:59.999) in UTC to include entire day
        const endOfDay = new Date(validatedParams.endDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        whereClause.updatedAt.lte = endOfDay;
      }
    }

    // Get all sessions for this funnel
    const sessions = await prisma.session.findMany({
      where: whereClause,
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
      pages: funnel.pages,
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
