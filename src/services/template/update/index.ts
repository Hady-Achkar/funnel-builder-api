import { getPrisma } from "../../../lib/prisma";
import { cacheService } from "../../../services/cache/cache.service";
import {
  UpdateTemplateRequest,
  UpdateTemplateResponse,
  updateTemplateBody,
  updateTemplateResponse,
} from "../../../types/template/update";
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from "../../../errors";
import { ZodError } from "zod";
import { transformSlug } from "../create-from-funnel/utils/transform-slug";

export const updateTemplate = async (
  params: UpdateTemplateRequest
): Promise<UpdateTemplateResponse> => {
  try {
    const { templateSlug, userId, isAdmin, body } = params;

    // Check admin permission
    if (!isAdmin) {
      throw new ForbiddenError("Only administrators can update templates");
    }

    // Validate body
    const validatedBody = updateTemplateBody.parse(body);
    const { images, ...updateFields } = validatedBody;

    const prisma = getPrisma();

    // Find template by slug
    const existingTemplate = await prisma.template.findUnique({
      where: { slug: templateSlug },
      include: {
        previewImages: true,
      },
    });

    if (!existingTemplate) {
      throw new NotFoundError("Template not found");
    }

    // If name is being updated, check uniqueness
    if (updateFields.name) {
      const nameConflict = await prisma.template.findFirst({
        where: {
          name: updateFields.name,
          id: { not: existingTemplate.id },
        },
        select: { id: true },
      });

      if (nameConflict) {
        throw new BadRequestError("A template with this name already exists");
      }
    }

    // If slug is being updated, check uniqueness
    if (updateFields.slug) {
      const transformedSlug = transformSlug(updateFields.slug);
      const slugConflict = await prisma.template.findFirst({
        where: {
          slug: transformedSlug,
          id: { not: existingTemplate.id },
        },
        select: { id: true },
      });

      if (slugConflict) {
        throw new BadRequestError("A template with this slug already exists");
      }

      updateFields.slug = transformedSlug;
    }

    // If categoryId is being updated, verify category exists
    if (updateFields.categoryId) {
      const category = await prisma.templateCategory.findUnique({
        where: { id: updateFields.categoryId },
        select: { id: true },
      });

      if (!category) {
        throw new NotFoundError("Template category not found");
      }
    }

    await prisma.$transaction(async (tx) => {
      // Prepare template update data - only include defined fields
      const templateUpdateData = Object.fromEntries(
        Object.entries(updateFields).filter(([_, value]) => value !== undefined)
      );

      // Update template if there's data to update
      if (Object.keys(templateUpdateData).length > 0) {
        await tx.template.update({
          where: { id: existingTemplate.id },
          data: templateUpdateData,
        });
      }

      // Handle image updates if provided
      if (images !== undefined) {
        // Delete existing preview images
        await tx.templateImage.deleteMany({
          where: { templateId: existingTemplate.id },
        });

        // Create new images if array is not empty
        if (images.length > 0) {
          await tx.templateImage.createMany({
            data: images.map((img) => ({
              templateId: existingTemplate.id,
              imageUrl: img.imageUrl,
              imageType: img.imageType,
              order: img.order,
              caption: img.caption ?? null,
            })),
          });
        }
      }
    });

    // Update cache with new data
    try {
      const updatedTemplateWithRelations = await prisma.template.findUnique({
        where: { id: existingTemplate.id },
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
        await cacheService.setTemplateCache(
          existingTemplate.id,
          "full",
          fullCacheData,
          { ttl: 0 }
        );

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
          existingTemplate.id,
          "summary",
          summaryCacheData,
          { ttl: 0 }
        );
      }
    } catch (cacheError) {
      console.error(
        `Failed to update cache for template ${existingTemplate.id}:`,
        cacheError
      );
    }

    const response = {
      message: "Template updated successfully",
    };

    return updateTemplateResponse.parse(response);
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid update data";
      throw new BadRequestError(message);
    }
    if (
      error instanceof NotFoundError ||
      error instanceof BadRequestError ||
      error instanceof ForbiddenError
    ) {
      throw error;
    }
    throw new Error(
      `Failed to update template: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const updateService = {
  update: updateTemplate,
};
