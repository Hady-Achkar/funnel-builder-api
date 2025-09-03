import {
  CreateInsightRequest,
  CreateInsightResponse,
  createInsightRequest,
  createInsightResponse,
} from "../../../types/insight/create";
import { getPrisma } from "../../../lib/prisma";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from "../../../errors";
import { ZodError } from "zod";
import { checkInsightCreatePermission } from "../../../helpers/insight/create";

export const createInsight = async (
  userId: number,
  request: CreateInsightRequest
): Promise<CreateInsightResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    const validatedRequest = createInsightRequest.parse(request);

    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Check permissions using helper
    await checkInsightCreatePermission(userId, validatedRequest.funnelId);

    const insight = await prisma.insight.create({
      data: {
        type: validatedRequest.type,
        name: validatedRequest.name,
        description: validatedRequest.description,
        content: validatedRequest.content,
        settings: validatedRequest.settings,
        funnelId: validatedRequest.funnelId,
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

    const validatedResponse = createInsightResponse.parse(response);

    return validatedResponse;
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};