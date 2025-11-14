import {
  CreateInsightRequest,
  CreateInsightResponse,
  createInsightResponse,
} from "../../../types/insight/create";
import { getPrisma } from "../../../lib/prisma";
import {
  UnauthorizedError,
  NotFoundError,
} from "../../../errors";
import {
  PermissionManager,
  PermissionAction,
} from "../../../utils/workspace-utils/workspace-permission-manager";

export const createInsight = async (
  userId: number,
  workspaceSlug: string,
  funnelSlug: string,
  data: CreateInsightRequest
): Promise<CreateInsightResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    const prisma = getPrisma();

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Find funnel using slugs
    const funnel = await prisma.funnel.findFirst({
      where: {
        slug: funnelSlug,
        workspace: {
          slug: workspaceSlug,
        },
      },
      select: { id: true, workspaceId: true },
    });

    if (!funnel) {
      throw new NotFoundError(
        "Funnel not found in the specified workspace"
      );
    }

    // Check permissions
    await PermissionManager.requirePermission({
      userId,
      workspaceId: funnel.workspaceId,
      action: PermissionAction.EDIT_FUNNEL,
    });

    // Create insight linked to funnel
    const insight = await prisma.insight.create({
      data: {
        type: data.type,
        name: data.name,
        description: data.description,
        content: data.content,
        settings: data.settings,
        funnelId: funnel.id,
      },
      include: {
        submissions: {
          take: 0,
        },
      },
    });

    const response = {
      message: "Insight created successfully",
      insightId: insight.id,
    };

    return createInsightResponse.parse(response);
  } catch (error) {
    throw error;
  }
};