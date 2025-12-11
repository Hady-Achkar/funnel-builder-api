import { getPrisma } from "../../../lib/prisma";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from "../../../errors";
import { ZodError } from "zod";
import {
  deleteInsightRequest,
  DeleteInsightRequest,
  deleteInsightResponse,
  DeleteInsightResponse,
} from "../../../types/insight/delete";
import {
  PermissionManager,
  PermissionAction,
} from "../../../utils/workspace-utils/workspace-permission-manager";

export const deleteInsight = async (
  userId: number,
  request: DeleteInsightRequest
): Promise<DeleteInsightResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    const validatedRequest = deleteInsightRequest.parse(request);

    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Verify insight exists and get funnel workspaceId for permission check
    const insight = await prisma.insight.findUnique({
      where: { id: validatedRequest.insightId },
      select: {
        id: true,
        name: true,
        funnel: {
          select: {
            workspaceId: true,
          },
        },
      },
    });

    if (!insight) {
      throw new NotFoundError("Insight not found");
    }

    // Use existing permission system: users who can delete funnels can delete insights
    await PermissionManager.requirePermission({
      userId,
      workspaceId: insight.funnel.workspaceId,
      action: PermissionAction.DELETE_FUNNEL,
    });

    // Delete the insight (cascade will handle submissions)
    await prisma.insight.delete({
      where: { id: validatedRequest.insightId },
    });

    const response = {
      message: "Insight deleted successfully",
    };

    const validatedResponse = deleteInsightResponse.parse(response);

    return validatedResponse;
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};