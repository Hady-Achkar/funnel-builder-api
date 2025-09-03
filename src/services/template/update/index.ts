import { getPrisma } from "../../../lib/prisma";
import { cacheService } from "../../../services/cache/cache.service";
import {
  UpdateTemplateRequest,
  UpdateTemplateResponse,
  updateTemplateRequest,
  updateTemplateResponse,
} from "../../../types/template/update";
import { NotFoundError, BadRequestError } from "../../../errors";
import { ZodError } from "zod";

export const updateTemplate = async (
  params: UpdateTemplateRequest
): Promise<UpdateTemplateResponse> => {
  try {
    const validatedParams = updateTemplateRequest.parse(params);
    const {
      id: templateId,
      thumbnail,
      images,
      ...updateData
    } = validatedParams;

    const prisma = getPrisma();

    const existingTemplate = await prisma.template.findUnique({
      where: { id: templateId },
      include: {
        previewImages: true,
      },
    });

    if (!existingTemplate) {
      throw new NotFoundError("Template not found");
    }

    await prisma.$transaction(async (tx) => {
      // Prepare template update data - only include defined fields
      const templateUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );

      console.log(
        "Template update data prepared:",
        JSON.stringify(templateUpdateData, null, 2)
      );

      // Update template if there's data to update
      if (Object.keys(templateUpdateData).length > 0) {
        await tx.template.update({
          where: { id: templateId },
          data: templateUpdateData,
        });
      }

      // Handle image updates if provided
      if (thumbnail !== undefined || images !== undefined) {
        // Delete existing preview images
        await tx.templateImage.deleteMany({
          where: { templateId },
        });

        // Prepare new images to create
        const imagesToCreate = [];

        // Add thumbnail if provided
        if (thumbnail) {
          imagesToCreate.push({
            templateId,
            imageUrl: thumbnail,
            imageType: "THUMBNAIL" as const,
            order: 0,
            caption: null,
          });
        }

        // Add preview images if provided
        if (images?.length) {
          images.forEach((imageUrl, index) => {
            imagesToCreate.push({
              templateId,
              imageUrl,
              imageType: "PREVIEW" as const,
              order: index + 1,
              caption: null,
            });
          });
        }

        // Create all images
        if (imagesToCreate.length > 0) {
          await tx.templateImage.createMany({
            data: imagesToCreate,
          });
        }
      }
    });

    // Update cache with new data
    try {
      // Fetch the updated template with all relations for cache
      const updatedTemplateWithRelations = await prisma.template.findUnique({
        where: { id: templateId },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          pages: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              name: true,
              content: true,
              order: true,
              linkingId: true,
              seoTitle: true,
              seoDescription: true,
              seoKeywords: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          previewImages: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              imageUrl: true,
              imageType: true,
              caption: true,
              order: true,
            },
          },
          _count: {
            select: {
              pages: true,
            },
          },
        },
      });

      if (updatedTemplateWithRelations) {
        const fullCacheData = {
          id: updatedTemplateWithRelations.id,
          name: updatedTemplateWithRelations.name,
          slug: updatedTemplateWithRelations.slug,
          description: updatedTemplateWithRelations.description,
          categoryId: updatedTemplateWithRelations.categoryId,
          category: updatedTemplateWithRelations.category,
          tags: updatedTemplateWithRelations.tags,
          isActive: updatedTemplateWithRelations.isActive,
          isPublic: updatedTemplateWithRelations.isPublic,
          createdByUserId: updatedTemplateWithRelations.createdByUserId,
          usageCount: updatedTemplateWithRelations.usageCount,
          pages: updatedTemplateWithRelations.pages,
          previewImages: updatedTemplateWithRelations.previewImages,
          createdAt: updatedTemplateWithRelations.createdAt,
          updatedAt: updatedTemplateWithRelations.updatedAt,
        };
        await cacheService.setTemplateCache(templateId, "full", fullCacheData, {
          ttl: 0,
        });

        const thumbnailUrl =
          updatedTemplateWithRelations.previewImages.find(
            (img) => img.imageType === "THUMBNAIL"
          )?.imageUrl || null;

        const previewUrls = updatedTemplateWithRelations.previewImages
          .filter((img) => img.imageType === "PREVIEW")
          .map((img) => img.imageUrl);

        const summaryCacheData = {
          id: updatedTemplateWithRelations.id,
          name: updatedTemplateWithRelations.name,
          slug: updatedTemplateWithRelations.slug,
          description: updatedTemplateWithRelations.description,
          categoryId: updatedTemplateWithRelations.categoryId,
          categoryName: updatedTemplateWithRelations.category.name,
          categorySlug: updatedTemplateWithRelations.category.slug,
          tags: updatedTemplateWithRelations.tags,
          isActive: updatedTemplateWithRelations.isActive,
          isPublic: updatedTemplateWithRelations.isPublic,
          createdByUserId: updatedTemplateWithRelations.createdByUserId,
          usageCount: updatedTemplateWithRelations.usageCount,
          pagesCount: updatedTemplateWithRelations._count.pages,
          thumbnailUrl,
          previewUrls,
          createdAt: updatedTemplateWithRelations.createdAt,
          updatedAt: updatedTemplateWithRelations.updatedAt,
        };

        await cacheService.setTemplateCache(
          templateId,
          "summary",
          summaryCacheData,
          { ttl: 0 }
        );
      }
    } catch (cacheError) {
      console.error(
        `Failed to update cache for template ${templateId}:`,
        cacheError
      );
    }

    const response = {
      message: "Template updated successfully",
    };

    return updateTemplateResponse.parse(response);
  } catch (error) {
    console.error("Error in updateTemplate:", error);

    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid update data";
      throw new BadRequestError(message);
    }
    if (error instanceof NotFoundError || error instanceof BadRequestError) {
      throw error;
    }
    throw new Error(
      `Failed to update template: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// Export as default for backward compatibility
export const updateService = {
  update: updateTemplate,
};
