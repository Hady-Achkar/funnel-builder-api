import {
  DeleteTemplateResponse,
  deleteTemplateRequest,
  deleteTemplateResponse,
} from "../../../types/template/delete";
import { getPrisma } from "../../../lib/prisma";
import { cacheService } from "../../../services/cache/cache.service";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
} from "../../../errors";
import { ZodError } from "zod";
import { deleteTemplateImage } from "../../../helpers/template/shared";

export const deleteTemplate = async (
  userId: number,
  templateId: number
): Promise<DeleteTemplateResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    const validatedRequest = deleteTemplateRequest.parse({ id: templateId });

    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isAdmin: true },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const template = await prisma.template.findUnique({
      where: { id: validatedRequest.id },
      include: {
        previewImages: true,
        pages: true,
      },
    });

    if (!template) {
      throw new NotFoundError("Template not found");
    }

    if (!user.isAdmin && template.createdByUserId !== userId) {
      throw new ForbiddenError("You can only delete your own templates");
    }

    const result = await prisma.$transaction(async (tx: any) => {
      if (template.previewImages && template.previewImages.length > 0) {
        for (const image of template.previewImages) {
          try {
            const urlParts = image.imageUrl.split("/");
            const fileName = urlParts[urlParts.length - 1];
            await deleteTemplateImage(fileName);
          } catch (imageError) {
            console.warn(
              `Failed to delete image ${image.imageUrl}:`,
              imageError
            );
          }
        }
      }

      await tx.templateImage.deleteMany({
        where: { templateId: validatedRequest.id },
      });

      await tx.templatePage.deleteMany({
        where: { templateId: validatedRequest.id },
      });

      await tx.template.delete({
        where: { id: validatedRequest.id },
      });

      return validatedRequest.id;
    });

    try {
      await cacheService.invalidateTemplateCache(result);
      await cacheService.del("templates:ids:all");
    } catch (cacheError) {
      console.warn(
        `Template cache invalidation failed but template was deleted:`,
        cacheError
      );
    }

    const response = {
      message: "Template deleted successfully",
      deletedTemplateId: result,
    };

    const validatedResponse = deleteTemplateResponse.parse(response);

    return validatedResponse;
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};
