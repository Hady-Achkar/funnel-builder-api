import { getPrisma } from "../../../lib/prisma";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from "../../../errors";
import { ZodError } from "zod";
import {
  updateInsightRequest,
  UpdateInsightRequest,
  updateInsightResponse,
  UpdateInsightResponse,
} from "../types/update.types";
import { checkInsightUpdatePermission } from "../helpers/permissions.helper";

export const updateInsight = async (
  userId: number,
  request: UpdateInsightRequest
): Promise<UpdateInsightResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    const validatedRequest = updateInsightRequest.parse(request);

    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    await checkInsightUpdatePermission(userId, validatedRequest.insightId);

    const existingInsight = await prisma.insight.findUnique({
      where: { id: validatedRequest.insightId },
      select: { id: true, name: true },
    });

    if (!existingInsight) {
      throw new NotFoundError("Insight not found");
    }

    const updateData: any = {};
    if (validatedRequest.type !== undefined)
      updateData.type = validatedRequest.type;
    if (validatedRequest.name !== undefined)
      updateData.name = validatedRequest.name;
    if (validatedRequest.description !== undefined)
      updateData.description = validatedRequest.description;
    if (validatedRequest.content !== undefined)
      updateData.content = validatedRequest.content;
    if (validatedRequest.settings !== undefined)
      updateData.settings = validatedRequest.settings;

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestError("No fields provided to update");
    }

    const insight = await prisma.insight.update({
      where: { id: validatedRequest.insightId },
      data: updateData,
      include: {
        submissions: {
          take: 0,
        },
      },
    });

    const response = {
      message: "Insight updated successfully",
      insightId: insight.id,
    };

    const validatedResponse = updateInsightResponse.parse(response);

    return validatedResponse;
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};
