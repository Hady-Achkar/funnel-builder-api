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

    await checkFormSubmissionsViewPermission(
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
      form: {
        funnelId: funnel.id,
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
    const totalCount = await prisma.formSubmission.count({
      where: whereClause,
    });

    // Calculate pagination (skip if all=true)
    const totalPages = validatedRequest.all ? 1 : Math.ceil(totalCount / validatedRequest.limit);
    const skip = validatedRequest.all ? undefined : (validatedRequest.page - 1) * validatedRequest.limit;
    const take = validatedRequest.all ? undefined : validatedRequest.limit;

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
      take: take,
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
      pagination: validatedRequest.all
        ? {
            total: totalCount,
            totalPages: 1,
            currentPage: 1,
            limit: totalCount,
          }
        : {
            total: totalCount,
            totalPages: totalPages,
            currentPage: validatedRequest.page,
            limit: validatedRequest.limit,
          },
      filters: {
        formId: validatedRequest.formId,
        sessionId: validatedRequest.sessionId,
        startDate: validatedRequest.startDate,
        endDate: validatedRequest.endDate,
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