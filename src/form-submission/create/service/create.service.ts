import {
  CreateFormSubmissionRequest,
  CreateFormSubmissionResponse,
  createFormSubmissionRequest,
  createFormSubmissionResponse,
} from "../types";
import { getPrisma } from "../../../lib/prisma";
import { BadRequestError, NotFoundError } from "../../../errors";
import { ZodError } from "zod";
import { triggerFormSubmissionWebhook } from "../../../services/form/webhook";

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
      throw new NotFoundError("Session not found or may have expired");
    }

    const existingSubmission = await prisma.formSubmission.findUnique({
      where: {
        formId_sessionId: {
          formId: validatedRequest.formId,
          sessionId: validatedRequest.sessionId,
        },
      },
    });

    // We'll handle both create and update in the transaction

    const result = await prisma.$transaction(async (tx) => {
      let formSubmission;
      let isUpdate = false;

      if (existingSubmission) {
        // Update existing submission
        formSubmission = await tx.formSubmission.update({
          where: {
            id: existingSubmission.id,
          },
          data: {
            submittedData: validatedRequest.submittedData || null,
            isCompleted: validatedRequest.isCompleted,
            completedAt: validatedRequest.isCompleted ? new Date() : null,
          },
        });
        isUpdate = true;
      } else {
        // Create new submission
        formSubmission = await tx.formSubmission.create({
          data: {
            formId: validatedRequest.formId,
            sessionId: validatedRequest.sessionId,
            submittedData: validatedRequest.submittedData || null,
            isCompleted: validatedRequest.isCompleted,
            completedAt: validatedRequest.isCompleted ? new Date() : null,
          },
        });
      }

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

      let updatedInteractions;
      if (isUpdate) {
        // Update existing interaction for the same form
        const formSubmissions = (currentInteractions.form_submissions ||
          []) as any[];
        const existingIndex = formSubmissions.findIndex(
          (interaction: any) => interaction.formId === validatedRequest.formId
        );

        if (existingIndex >= 0) {
          // Update the existing interaction
          formSubmissions[existingIndex] = {
            ...formSubmissions[existingIndex],
            ...newInteraction,
          };
        } else {
          // Add new interaction if not found
          formSubmissions.push(newInteraction);
        }

        updatedInteractions = {
          ...currentInteractions,
          form_submissions: formSubmissions,
        };
      } else {
        // Add the new interaction to the existing ones
        updatedInteractions = {
          ...currentInteractions,
          form_submissions: [
            ...(currentInteractions.form_submissions || []),
            newInteraction,
          ],
        };
      }

      await tx.session.update({
        where: { sessionId: validatedRequest.sessionId },
        data: {
          interactions: updatedInteractions,
        },
      });

      return formSubmission;
    });

    if (validatedRequest.isCompleted) {
      try {
        const webhookPayload = {
          formId: validatedRequest.formId,
          submissionId: result.id,
          formName: form.name,
          data: (validatedRequest.submittedData as Record<string, any>) || {},
          submittedAt:
            result.completedAt?.toISOString() || new Date().toISOString(),
          metadata: {
            sessionId: validatedRequest.sessionId,
            userAgent: undefined,
            ipAddress: undefined,
          },
        };

        triggerFormSubmissionWebhook(
          validatedRequest.formId,
          webhookPayload
        ).catch((error) => {
          console.error(
            `Failed to trigger webhook for form ${validatedRequest.formId}:`,
            error
          );
        });
      } catch (error) {
        console.error(
          `Error preparing webhook for form ${validatedRequest.formId}:`,
          error
        );
      }
    }

    const response = {
      message: existingSubmission
        ? "Form submission updated successfully"
        : "Form submission created successfully",
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
