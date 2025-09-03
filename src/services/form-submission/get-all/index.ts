import { getPrisma } from "../../../lib/prisma";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from "../../../errors";
import { ZodError } from "zod";
import {
  getAllFormSubmissionsRequest,
  GetAllFormSubmissionsRequest,
  getAllFormSubmissionsResponse,
  GetAllFormSubmissionsResponse,
} from "../../../types/form-submission/get-all";
import { checkFormSubmissionsViewPermission } from "../../../helpers/form-submission/get-all";

export const getAllFormSubmissions = async (
  userId: number,
  request: GetAllFormSubmissionsRequest
): Promise<GetAllFormSubmissionsResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    const validatedRequest = getAllFormSubmissionsRequest.parse(request);

    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    await checkFormSubmissionsViewPermission(userId, validatedRequest.funnelId);

    const funnel = await prisma.funnel.findUnique({
      where: { id: validatedRequest.funnelId },
      select: { id: true, name: true },
    });

    if (!funnel) {
      throw new NotFoundError("Funnel not found");
    }

    // Build where clause based on filters
    const whereClause: any = {
      form: {
        funnelId: validatedRequest.funnelId,
      },
    };

    // Apply filters
    if (validatedRequest.formId) {
      whereClause.formId = validatedRequest.formId;
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
    const totalCount = await prisma.formSubmission.count({
      where: whereClause,
    });

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / validatedRequest.limit);
    const skip = (validatedRequest.page - 1) * validatedRequest.limit;

    // Get paginated form submissions with filters
    const submissions = await prisma.formSubmission.findMany({
      where: whereClause,
      select: {
        id: true,
        formId: true,
        sessionId: true,
        submittedData: true,
        isCompleted: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        form: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        [validatedRequest.sortBy]: validatedRequest.sortOrder,
      },
      skip: skip,
      take: validatedRequest.limit,
    });

    const formattedSubmissions = submissions.map((submission) => ({
      id: submission.id,
      formId: submission.formId,
      formName: submission.form.name,
      sessionId: submission.sessionId,
      submittedData: submission.submittedData,
      isCompleted: submission.isCompleted,
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
        formId: validatedRequest.formId,
        sessionId: validatedRequest.sessionId,
        dateFrom: validatedRequest.dateFrom,
        dateTo: validatedRequest.dateTo,
        completedOnly: validatedRequest.completedOnly,
        sortBy: validatedRequest.sortBy,
        sortOrder: validatedRequest.sortOrder,
      },
    };

    const validatedResponse = getAllFormSubmissionsResponse.parse(response);

    return validatedResponse;
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};