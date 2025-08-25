import { getPrisma } from "../../../lib/prisma";
import { cacheService } from "../../../services/cache/cache.service";
import { BadRequestError, NotFoundError } from "../../../errors";
import { ZodError } from "zod";
import {
  GetTemplateRequest,
  GetTemplateResponse,
  getTemplateRequest,
  getTemplateResponse,
} from "../types";

export const getTemplateById = async (
  params: GetTemplateRequest
): Promise<GetTemplateResponse> => {
  let fullTemplate: GetTemplateResponse | null = null;
  
  try {
    const validatedParams = getTemplateRequest.parse(params);
    const templateId = validatedParams.id;

    try {
      fullTemplate = await cacheService.getTemplateCache<GetTemplateResponse>(
        templateId,
        "full"
      );
    } catch (cacheError) {
      console.warn(
        `Failed to get template ${templateId} full data from cache:`,
        cacheError
      );
    }

    // Validate cache structure - if it doesn't have required arrays, ignore cached data
    if (fullTemplate && (!Array.isArray(fullTemplate.pages) || !Array.isArray(fullTemplate.previewImages))) {
      console.log(`Cache contains invalid structure for template ${templateId}, ignoring cache`);
      fullTemplate = null;
    }

    if (!fullTemplate) {
      console.log(
        `Cache miss for template ${templateId} full data, fetching from DB`
      );

      const prisma = getPrisma();

      const template = await prisma.template.findUnique({
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
        },
      });

      if (!template) {
        throw new NotFoundError("Template not found");
      }
      
      if (!template.isActive) {
        throw new NotFoundError("Template is not active");
      }
      
      if (!template.isPublic) {
        throw new NotFoundError("Template is not public");
      }

      fullTemplate = {
        id: template.id,
        name: template.name,
        slug: template.slug,
        description: template.description,
        categoryId: template.categoryId,
        category: {
          id: template.category.id,
          name: template.category.name,
          slug: template.category.slug,
        },
        tags: template.tags || [],
        isActive: template.isActive,
        isPublic: template.isPublic,
        createdByUserId: template.createdByUserId,
        usageCount: template.usageCount,
        pages: template.pages,
        previewImages: template.previewImages.map(img => ({
          ...img,
          imageType: img.imageType as "THUMBNAIL" | "PREVIEW",
          caption: img.caption || null
        })),
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      };

      try {
        await cacheService.setTemplateCache(templateId, "full", fullTemplate, {
          ttl: 0,
        });
      } catch (cacheError) {
        console.warn(
          `Failed to cache template ${templateId} full data:`,
          cacheError
        );
      }
    } else {
      if (!fullTemplate.isActive) {
        throw new NotFoundError("Template is not active");
      }
      
      if (!fullTemplate.isPublic) {
        throw new NotFoundError("Template is not public");
      }
    }

    const validatedResponse = getTemplateResponse.parse(fullTemplate);
    return validatedResponse;
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid template ID";
      throw new BadRequestError(`Invalid input: ${message}`);
    }
    throw error;
  }
};
