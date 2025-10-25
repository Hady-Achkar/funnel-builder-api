import {
  CreateFormRequest,
  CreateFormResponse,
  createFormRequest,
  createFormResponse,
} from "../../../types/form/create";
import { getPrisma } from "../../../lib/prisma";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
} from "../../../errors";
import { ZodError } from "zod";

export const createForm = async (
  userId: number,
  request: CreateFormRequest
): Promise<CreateFormResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    const validatedRequest = createFormRequest.parse(request);

    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (validatedRequest.funnelId) {
      const funnel = await prisma.funnel.findUnique({
        where: { id: validatedRequest.funnelId },
        select: { id: true, createdBy: true },
      });

      if (!funnel) {
        throw new NotFoundError("Funnel not found");
      }

      if (funnel.createdBy !== userId) {
        throw new ForbiddenError(
          "You can only create forms for your own funnels"
        );
      }
    }

    const form = await prisma.form.create({
      data: {
        name: validatedRequest.name,
        description: validatedRequest.description,
        formContent: validatedRequest.formContent,
        isActive: validatedRequest.isActive,
        funnelId: validatedRequest.funnelId,
        webhookUrl: validatedRequest.webhookUrl,
        webhookEnabled: validatedRequest.webhookEnabled ?? false,
        webhookHeaders: validatedRequest.webhookHeaders || {},
        webhookSecret: validatedRequest.webhookSecret,
      },
      include: {
        submissions: {
          take: 0,
        },
      },
    });

    const response = {
      message: "Form created successfully",
      formId: form.id,
    };

    const validatedResponse = createFormResponse.parse(response);

    return validatedResponse;
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};
