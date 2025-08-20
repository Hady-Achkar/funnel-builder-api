import {
  DeleteFormResponse,
  deleteFormResponse,
} from "../types";
import { getPrisma } from "../../../lib/prisma";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
} from "../../../errors";
import { ZodError } from "zod";

export const deleteForm = async (
  userId: number,
  formId: number
): Promise<DeleteFormResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");
    if (!formId) throw new BadRequestError("Form ID is required");

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
        select: { userId: true },
      });

      if (funnel && funnel.userId !== userId) {
        throw new ForbiddenError("You can only delete forms for your own funnels");
      }
    }

    // Delete the form - submissions will be cascade deleted automatically
    await prisma.form.delete({
      where: { id: formId },
    });

    const response = {
      message: "Form and all related submissions deleted successfully",
    };

    const validatedResponse = deleteFormResponse.parse(response);

    return validatedResponse;
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};