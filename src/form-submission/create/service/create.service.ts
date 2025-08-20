import {
  CreateFormSubmissionRequest,
  CreateFormSubmissionResponse,
  createFormSubmissionRequest,
  createFormSubmissionResponse,
} from "../types";
import { getPrisma } from "../../../lib/prisma";
import { BadRequestError, NotFoundError } from "../../../errors";
import { ZodError } from "zod";

export const createFormSubmission = async (
  request: CreateFormSubmissionRequest
): Promise<CreateFormSubmissionResponse> => {
  try {
    const validatedRequest = createFormSubmissionRequest.parse(request);

    const prisma = getPrisma();

    const form = await prisma.form.findUnique({
      where: { id: validatedRequest.formId },
      select: {
        id: true,
        isActive: true,
        name: true,
      },
    });

    if (!form) {
      throw new NotFoundError("Form not found");
    }

    if (!form.isActive) {
      throw new BadRequestError("Form is not active");
    }

    const session = await prisma.session.findUnique({
      where: { sessionId: validatedRequest.sessionId },
      select: {
        id: true,
        sessionId: true,
        interactions: true,
      },
    });

    if (!session) {
      throw new NotFoundError("Session not found");
    }

    const existingSubmission = await prisma.formSubmission.findUnique({
      where: {
        formId_sessionId: {
          formId: validatedRequest.formId,
          sessionId: validatedRequest.sessionId,
        },
      },
    });

    if (existingSubmission) {
      throw new BadRequestError(
        "Submission already exists for this form and session"
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const formSubmission = await tx.formSubmission.create({
        data: {
          formId: validatedRequest.formId,
          sessionId: validatedRequest.sessionId,
          submittedData: validatedRequest.submittedData || null,
          isCompleted: validatedRequest.isCompleted,
          completedAt: validatedRequest.isCompleted ? new Date() : null,
        },
      });

      const currentInteractions =
        (session.interactions as Record<string, any>) || {};
      const newInteraction = {
        type: "form_submission",
        formId: validatedRequest.formId,
        formName: form.name,
        submissionId: formSubmission.id,
        isCompleted: validatedRequest.isCompleted,
        timestamp: new Date().toISOString(),
        submittedData: validatedRequest.submittedData,
      };

      const updatedInteractions = {
        ...currentInteractions,
        form_submissions: [
          ...(currentInteractions.form_submissions || []),
          newInteraction,
        ],
      };

      await tx.session.update({
        where: { sessionId: validatedRequest.sessionId },
        data: {
          interactions: updatedInteractions,
        },
      });

      return formSubmission;
    });

    const response = {
      message: "Form submission created successfully",
      submissionId: result.id,
    };

    const validatedResponse = createFormSubmissionResponse.parse(response);

    return validatedResponse;
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};
