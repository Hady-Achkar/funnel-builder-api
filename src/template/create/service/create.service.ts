import {
  CreateTemplateRequest,
  CreateTemplateResponse,
  createTemplateRequest,
  createTemplateResponse,
} from "../types";
import { getPrisma } from "../../../lib/prisma";
import { cacheService } from "../../../services/cache/cache.service";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
} from "../../../errors";
import { ZodError } from "zod";
import {
  generateShortUniqueId,
  replaceLinkingIdsInContent,
  createSlug,
  ensureUniqueSlug,
  uploadTemplateThumbnail,
  uploadTemplatePreviewImages,
} from "../../helpers";

export const createTemplate = async (
  userId: number,
  request: CreateTemplateRequest,
  thumbnailFile: Express.Multer.File,
  previewFiles?: Express.Multer.File[]
): Promise<CreateTemplateResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    if (!thumbnailFile) {
      throw new BadRequestError("Thumbnail image is required");
    }

    const validatedRequest = createTemplateRequest.parse(request);

    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isAdmin: true },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (!user.isAdmin) {
      throw new ForbiddenError("Only admin users can create templates");
    }

    const category = await prisma.templateCategory.findUnique({
      where: { id: validatedRequest.categoryId },
      select: { id: true, name: true },
    });

    if (!category) {
      throw new NotFoundError("Template category not found");
    }

    const funnel = await prisma.funnel.findUnique({
      where: { id: validatedRequest.funnelId },
      include: {
        pages: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!funnel) {
      throw new NotFoundError("Funnel not found");
    }

    if (!user.isAdmin && funnel.userId !== userId) {
      throw new ForbiddenError(
        "You can only create templates from your own funnels"
      );
    }

    if (!funnel.pages || funnel.pages.length === 0) {
      throw new BadRequestError(
        "Cannot create template from funnel with no pages"
      );
    }

    const baseSlug = createSlug(validatedRequest.name);
    const uniqueSlug = await ensureUniqueSlug(prisma, baseSlug);

    const result = await prisma.$transaction(async (tx: any) => {
      const template = await tx.template.create({
        data: {
          name: validatedRequest.name,
          slug: uniqueSlug,
          description: validatedRequest.description,
          categoryId: validatedRequest.categoryId,
          tags: validatedRequest.tags,
          isPublic: validatedRequest.isPublic,
          createdByUserId: userId,
        },
      });

      // Upload thumbnail (required)
      try {
        const uploadResult = await uploadTemplateThumbnail(
          thumbnailFile,
          template.id,
          "thumbnail"
        );

        await tx.templateImage.create({
          data: {
            templateId: template.id,
            imageUrl: uploadResult.url,
            imageType: "THUMBNAIL",
            caption: thumbnailFile.originalname,
            order: 0,
          },
        });
      } catch (uploadError: any) {
        console.error("Failed to upload thumbnail:", uploadError);
        throw uploadError;
      }

      if (previewFiles && previewFiles.length > 0) {
        try {
          const uploadResults = await uploadTemplatePreviewImages(
            previewFiles,
            template.id
          );

          const previewImageData = uploadResults.map((result, index) => ({
            templateId: template.id,
            imageUrl: result.url,
            imageType: "PREVIEW",
            caption: previewFiles[index].originalname,
            order: index + 1,
          }));

          await tx.templateImage.createMany({
            data: previewImageData,
          });
        } catch (uploadError: any) {
          console.error("Failed to upload preview images:", uploadError);
          throw uploadError;
        }
      }

      const linkingIdMap = new Map<string, string>();
      funnel.pages.forEach((page: any) => {
        if (page.linkingId) {
          linkingIdMap.set(page.linkingId, generateShortUniqueId());
        }
      });

      const templatePagesData = funnel.pages.map((page: any) => {
        const newLinkingId = page.linkingId
          ? linkingIdMap.get(page.linkingId)
          : generateShortUniqueId();

        const updatedContent = replaceLinkingIdsInContent(
          page.content,
          linkingIdMap
        );

        return {
          templateId: template.id,
          name: page.name,
          content: updatedContent,
          order: page.order,
          linkingId: newLinkingId,
          seoTitle: page.seoTitle,
          seoDescription: page.seoDescription,
          seoKeywords: page.seoKeywords,
        };
      });

      await tx.templatePage.createMany({
        data: templatePagesData,
      });

      const templateWithPages = await tx.template.findUnique({
        where: { id: template.id },
        include: {
          pages: true,
          category: true,
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
            select: { pages: true },
          },
        },
      });

      return templateWithPages;
    });

    // Cache the created template summary and full details
    try {
      const thumbnailUrl =
        result.previewImages.find((img: any) => img.imageType === "THUMBNAIL")
          ?.imageUrl || null;
      const previewUrls = result.previewImages
        .filter((img: any) => img.imageType === "PREVIEW")
        .map((img: any) => img.imageUrl);

      const templateSummary = {
        id: result.id,
        name: result.name,
        slug: result.slug,
        description: result.description,
        categoryId: result.categoryId,
        tags: result.tags,
        isActive: result.isActive,
        isPublic: result.isPublic,
        createdByUserId: result.createdByUserId,
        usageCount: result.usageCount,
        pagesCount: result._count.pages,
        thumbnailUrl,
        previewUrls,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };

      await cacheService.setTemplateCache(
        result.id,
        "summary",
        templateSummary,
        { ttl: 0 }
      );

      await cacheService.setTemplateCache(result.id, "full", result, {
        ttl: 0,
      });
    } catch (cacheError) {
      console.warn(
        "Template cache update failed but template was created:",
        cacheError
      );
    }

    const response = {
      message: "Template created successfully",
    };

    const validatedResponse = createTemplateResponse.parse(response);

    return validatedResponse;
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};
