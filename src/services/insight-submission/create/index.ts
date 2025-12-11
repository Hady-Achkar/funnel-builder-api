import { getPrisma } from "../../../lib/prisma";
import {
  BadRequestError,
  NotFoundError,
} from "../../../errors";
import { ZodError } from "zod";
import {
  createInsightSubmissionRequest,
  CreateInsightSubmissionRequest,
  createInsightSubmissionResponse,
  CreateInsightSubmissionResponse,
} from "../../../types/insight-submission/create";

export const createInsightSubmission = async (
  request: CreateInsightSubmissionRequest
): Promise<CreateInsightSubmissionResponse> => {
  try {
    const validatedRequest = createInsightSubmissionRequest.parse(request);

    const prisma = getPrisma();

    const insight = await prisma.insight.findUnique({
      where: { id: validatedRequest.insightId },
      select: { id: true, name: true, type: true },
    });

    if (!insight) {
      throw new NotFoundError("Insight not found");
    }

    // Ensure session exists before creating insight submission
    let session = await prisma.session.findUnique({
      where: { sessionId: validatedRequest.sessionId },
      select: { id: true, interactions: true, funnelId: true },
    });

    // If session doesn't exist, we need the funnelId to create it
    // Get funnelId from the insight
    if (!session) {
      const insightWithFunnel = await prisma.insight.findUnique({
        where: { id: validatedRequest.insightId },
        select: { funnelId: true },
      });

      if (!insightWithFunnel) {
        throw new NotFoundError("Insight not found");
      }

      // Create the session
      session = await prisma.session.create({
        data: {
          sessionId: validatedRequest.sessionId,
          funnelId: insightWithFunnel.funnelId,
          interactions: {},
        },
        select: { id: true, interactions: true, funnelId: true },
      });
    }

    const existingSubmission = await prisma.insightSubmission.findFirst({
      where: {
        insightId: validatedRequest.insightId,
        sessionId: validatedRequest.sessionId,
      },
    });

    let submission;

    if (existingSubmission) {
      submission = await prisma.insightSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          answers: validatedRequest.answers,
          updatedAt: new Date(),
        },
      });
    } else {
      submission = await prisma.insightSubmission.create({
        data: {
          insightId: validatedRequest.insightId,
          sessionId: validatedRequest.sessionId,
          answers: validatedRequest.answers,
        },
      });
    }

    // Update session interactions
    const currentInteractions = (session.interactions || {}) as Record<
      string,
      any
    >;
    const insightSubmissions = currentInteractions.insight_submissions || [];

    // Map InsightType to submission type string
    const submissionTypeMap = {
      QUIZ: "quiz_submission",
      SINGLE_CHOICE: "single_choice_submission",
      MULTIPLE_CHOICE: "multiple_choice_submission",
    } as const;

    const newInsightSubmission = {
      submissionId: submission.id,
      type: submissionTypeMap[insight.type],
      insightId: validatedRequest.insightId,
      insightName: insight.name,
      insightType: insight.type,
      timestamp: new Date().toISOString(),
      answers: validatedRequest.answers,
    };

    const existingIndex = insightSubmissions.findIndex(
      (sub: any) => sub.insightId === validatedRequest.insightId
    );

    if (existingIndex !== -1) {
      insightSubmissions[existingIndex] = newInsightSubmission;
    } else {
      insightSubmissions.push(newInsightSubmission);
    }

    const updatedInteractions = {
      ...currentInteractions,
      insight_submissions: insightSubmissions,
    };

    await prisma.session.update({
      where: { id: session.id },
      data: { interactions: updatedInteractions },
    });

    const response = {
      message: existingSubmission
        ? "Insight submission updated successfully"
        : "Insight submission created successfully",
      submissionId: submission.id,
    };

    const validatedResponse = createInsightSubmissionResponse.parse(response);

    return validatedResponse;
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};