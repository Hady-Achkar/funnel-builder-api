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
} from "../../../types/insight-submission/get-all";
import { checkInsightSubmissionsViewPermission } from "../../../helpers/insight-submission/get-all";

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

    await checkInsightSubmissionsViewPermission(
      userId,
      validatedRequest.workspaceSlug,
      validatedRequest.funnelSlug
    );

    // Find workspace by slug
    const workspace = await prisma.workspace.findUnique({
      where: { slug: validatedRequest.workspaceSlug },
      select: { id: true },
    });

    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }

    // Find funnel by slug and workspaceId
    const funnel = await prisma.funnel.findFirst({
      where: {
        slug: validatedRequest.funnelSlug,
        workspaceId: workspace.id,
      },
      select: { id: true, name: true },
    });

    if (!funnel) {
      throw new NotFoundError("Funnel not found");
    }

    // Build where clause based on filters
    const whereClause: any = {
      insight: {
        funnelId: funnel.id,
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

    // Date range filtering on updatedAt
    if (validatedRequest.startDate || validatedRequest.endDate) {
      whereClause.updatedAt = {};
      if (validatedRequest.startDate) {
        // Set to start of day (00:00:00)
        const startOfDay = new Date(validatedRequest.startDate);
        startOfDay.setHours(0, 0, 0, 0);
        whereClause.updatedAt.gte = startOfDay;
      }
      if (validatedRequest.endDate) {
        // Set to end of day (23:59:59.999) to include entire day
        const endOfDay = new Date(validatedRequest.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        whereClause.updatedAt.lte = endOfDay;
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.insightSubmission.count({
      where: whereClause,
    });

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / validatedRequest.limit);
    const skip = (validatedRequest.page - 1) * validatedRequest.limit;

    // Get total number of unique sessions in this funnel
    const totalSessions = await prisma.session.count({
      where: {
        funnelId: funnel.id,
      },
    });

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

    // Get unique insight IDs from current page to calculate answer counts
    const uniqueInsightIds = [...new Set(submissions.map((s) => s.insightId))];

    // Calculate answer count for each insight (number of unique sessions that answered)
    const insightAnswerCounts = await Promise.all(
      uniqueInsightIds.map(async (insightId) => {
        const count = await prisma.insightSubmission.groupBy({
          by: ["sessionId"],
          where: {
            insightId: insightId,
            insight: {
              funnelId: funnel.id,
            },
          },
        });
        return {
          insightId,
          answerCount: count.length,
        };
      })
    );

    // Create a map for quick lookup
    const answerCountMap = new Map(
      insightAnswerCounts.map((item) => [item.insightId, item.answerCount])
    );

    // Transform the data to include insight details and answer counts
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
      answerCount: answerCountMap.get(submission.insightId) || 0,
      totalSessions: totalSessions,
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
        startDate: validatedRequest.startDate,
        endDate: validatedRequest.endDate,
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