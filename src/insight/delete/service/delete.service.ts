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
} from "../types/delete.types";
import { checkInsightDeletePermission } from "../helpers/permissions.helper";

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

    // Check permissions using helper
    await checkInsightDeletePermission(userId, validatedRequest.insightId);

    // Verify insight exists
    const insight = await prisma.insight.findUnique({
      where: { id: validatedRequest.insightId },
      select: { 
        id: true, 
        name: true,
      },
    });

    if (!insight) {
      throw new NotFoundError("Insight not found");
    }

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