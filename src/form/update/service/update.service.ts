import {
  UpdateFormRequest,
  UpdateFormResponse,
  updateFormRequest,
  updateFormResponse,
} from "../types";
import { getPrisma } from "../../../lib/prisma";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
} from "../../../errors";
import { ZodError } from "zod";

export const updateForm = async (
  userId: number,
  formId: number,
  request: UpdateFormRequest
): Promise<UpdateFormResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");
    if (!formId) throw new BadRequestError("Form ID is required");

    const validatedRequest = updateFormRequest.parse(request);

    if (Object.keys(validatedRequest).length === 0) {
      throw new BadRequestError("No fields to update");
    }

    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const existingForm = await prisma.form.findUnique({
      where: { id: formId },
      select: { 
        id: true,
        funnelId: true,
      },
    });

    if (!existingForm) {
      throw new NotFoundError("Form not found");
    }

    if (existingForm.funnelId) {
      const funnel = await prisma.funnel.findUnique({
        where: { id: existingForm.funnelId },
        select: { createdBy: true },
      });

      if (funnel && funnel.createdBy !== userId) {
        throw new ForbiddenError("You can only update forms for your own funnels");
      }
    }

    const updateData = Object.fromEntries(
      Object.entries(validatedRequest).filter(([_, value]) => value !== undefined)
    );

    await prisma.form.update({
      where: { id: formId },
      data: updateData,
    });

    const response = {
      message: "Form updated successfully",
    };

    const validatedResponse = updateFormResponse.parse(response);

    return validatedResponse;
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};