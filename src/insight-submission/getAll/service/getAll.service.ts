import { getPrisma } from "../../../lib/prisma";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from "../../../errors";
import { ZodError } from "zod";
import {
  getAllInsightSubmissionsRequest,
  GetAllInsightSubmissionsRequest,
  getAllInsightSubmissionsResponse,
  GetAllInsightSubmissionsResponse,
} from "../types/getAll.types";
import { checkInsightSubmissionsViewPermission } from "../helpers/permissions.helper";

export const getAllInsightSubmissions = async (
  userId: number,
  request: GetAllInsightSubmissionsRequest
): Promise<GetAllInsightSubmissionsResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    const validatedRequest = getAllInsightSubmissionsRequest.parse(request);

    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    await checkInsightSubmissionsViewPermission(userId, validatedRequest.funnelId);

    const funnel = await prisma.funnel.findUnique({
      where: { id: validatedRequest.funnelId },
      select: { id: true, name: true },
    });

    if (!funnel) {
      throw new NotFoundError("Funnel not found");
    }

    // Build where clause based on filters
    const whereClause: any = {
      insight: {
        funnelId: validatedRequest.funnelId,
      },
    };

    // Apply filters
    if (validatedRequest.type) {
      whereClause.insight.type = validatedRequest.type;
    }

    if (validatedRequest.insightId) {
      whereClause.insightId = validatedRequest.insightId;
    }

    if (validatedRequest.sessionId) {
      whereClause.sessionId = validatedRequest.sessionId;
    }

    if (validatedRequest.completedOnly !== undefined) {
      if (validatedRequest.completedOnly) {
        whereClause.completedAt = { not: null };
      } else {
        whereClause.completedAt = null;
      }
    }

    // Date range filtering
    if (validatedRequest.dateFrom || validatedRequest.dateTo) {
      whereClause.createdAt = {};
      if (validatedRequest.dateFrom) {
        whereClause.createdAt.gte = validatedRequest.dateFrom;
      }
      if (validatedRequest.dateTo) {
        whereClause.createdAt.lte = validatedRequest.dateTo;
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.insightSubmission.count({
      where: whereClause,
    });

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / validatedRequest.limit);
    const skip = (validatedRequest.page - 1) * validatedRequest.limit;

    // Get paginated insight submissions with filters
    const submissions = await prisma.insightSubmission.findMany({
      where: whereClause,
      select: {
        id: true,
        insightId: true,
        sessionId: true,
        answers: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        insight: {
          select: {
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        [validatedRequest.sortBy]: validatedRequest.sortOrder,
      },
      skip: skip,
      take: validatedRequest.limit,
    });

    // Transform the data to include insight details
    const formattedSubmissions = submissions.map((submission) => ({
      id: submission.id,
      insightId: submission.insightId,
      insightName: submission.insight.name,
      insightType: submission.insight.type,
      sessionId: submission.sessionId,
      answers: submission.answers,
      completedAt: submission.completedAt,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    }));

    const response = {
      submissions: formattedSubmissions,
      funnelName: funnel.name,
      pagination: {
        total: totalCount,
        totalPages: totalPages,
        currentPage: validatedRequest.page,
        limit: validatedRequest.limit,
      },
      filters: {
        type: validatedRequest.type,
        insightId: validatedRequest.insightId,
        sessionId: validatedRequest.sessionId,
        dateFrom: validatedRequest.dateFrom,
        dateTo: validatedRequest.dateTo,
        completedOnly: validatedRequest.completedOnly,
        sortBy: validatedRequest.sortBy,
        sortOrder: validatedRequest.sortOrder,
      },
    };

    const validatedResponse = getAllInsightSubmissionsResponse.parse(response);

    return validatedResponse;
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};