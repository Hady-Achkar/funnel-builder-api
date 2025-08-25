import {
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
} from "../../../errors";
import { ZodError } from "zod";
import {
  checkTemplateCreationPermissions,
  createLinkingIdMap,
  replaceLinkingIdsInContent,
  generateShortUniqueId,
} from "../helpers";
import {
  createSlug,
  ensureUniqueSlug,
  uploadTemplateThumbnail,
  uploadTemplatePreviewImages,
} from "../../helpers";

export const createTemplateFromFunnel = async (
  userId: number,
  requestBody: Record<string, unknown>,
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] }
): Promise<CreateTemplateResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    let thumbnailFile: Express.Multer.File | undefined;
    let previewFiles: Express.Multer.File[] = [];

    if (Array.isArray(files)) {
      thumbnailFile = files.find((f) => f.fieldname === "thumbnail");
      previewFiles = files.filter((f) => f.fieldname === "preview_images");
    } else if (files && typeof files === "object") {
      const fileFields = files as {
        [fieldname: string]: Express.Multer.File[];
      };
      thumbnailFile = fileFields.thumbnail?.[0];
      previewFiles = fileFields.preview_images || [];
    }

    if (!thumbnailFile) {
      throw new BadRequestError("Thumbnail image is required");
    }

    const validatedRequest = createTemplateRequest.parse(requestBody);

    const prisma = getPrisma();

    // Check permissions (admin + workspace access)
    await checkTemplateCreationPermissions(userId, validatedRequest.funnelId);

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
          template.id
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

      // Create linking ID map for maintaining page relationships
      const linkingIdMap = createLinkingIdMap(funnel.pages);

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

    try {
      const thumbnailUrl =
        result.previewImages.find((img: any) => img.imageType === "THUMBNAIL")
          ?.imageUrl || null;
      const previewUrls = result.previewImages
        .filter((img: any) => img.imageType === "PREVIEW")
        .map((img: any) => img.imageUrl);

      const templateFullData = {
        id: result.id,
        name: result.name,
        slug: result.slug,
        description: result.description,
        categoryId: result.categoryId,
        category: result.category,
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

      await cacheService.set(`template:${result.id}:full`, templateFullData, {
        ttl: 0,
      });

      for (const page of result.pages) {
        const pageFullData = {
          id: page.id,
          templateId: page.templateId,
          name: page.name,
          content: page.content,
          order: page.order,
          linkingId: page.linkingId,
          seoTitle: page.seoTitle,
          seoDescription: page.seoDescription,
          seoKeywords: page.seoKeywords,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt,
        };

        await cacheService.set(
          `template:${result.id}:page:${page.id}:full`,
          pageFullData,
          { ttl: 0 }
        );
      }
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
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};
