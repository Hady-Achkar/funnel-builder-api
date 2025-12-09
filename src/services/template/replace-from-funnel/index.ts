import { getPrisma } from "../../../lib/prisma";
import {
  ReplaceTemplateFromFunnelRequest,
  ReplaceTemplateFromFunnelResponse,
} from "../../../types/template/replace-from-funnel";
import { cacheService } from "../../cache/cache.service";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../errors";
import { ThemeType } from "../../../generated/prisma-client";

interface ReplaceTemplateFromFunnelParams {
  userId: number;
  templateSlug: string;
  data: ReplaceTemplateFromFunnelRequest;
}

export class ReplaceTemplateFromFunnelService {
  static async replace({
    userId,
    templateSlug,
    data,
  }: ReplaceTemplateFromFunnelParams): Promise<ReplaceTemplateFromFunnelResponse> {
    try {
      const prisma = getPrisma();

      // Validate user exists and is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, isAdmin: true },
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      if (!user.isAdmin) {
        throw new ForbiddenError("Only administrators can replace templates");
      }

      // Validate template exists by slug
      const template = await prisma.template.findUnique({
        where: { slug: templateSlug },
        select: {
          id: true,
          slug: true,
          name: true,
        },
      });

      if (!template) {
        throw new NotFoundError("Template not found");
      }

      // Validate workspace exists by slug
      const workspace = await prisma.workspace.findUnique({
        where: { slug: data.workspaceSlug },
        select: { id: true },
      });

      if (!workspace) {
        throw new NotFoundError("Workspace not found");
      }

      // Validate funnel exists in workspace and has pages
      const funnel = await prisma.funnel.findFirst({
        where: {
          slug: data.funnelSlug,
          workspaceId: workspace.id,
        },
        include: {
          pages: {
            orderBy: { order: "asc" },
          },
          activeTheme: true,
        },
      });

      if (!funnel) {
        throw new NotFoundError("Funnel not found");
      }

      if (!funnel.pages || funnel.pages.length === 0) {
        throw new BadRequestError(
          "Cannot replace template from a funnel with no pages"
        );
      }

      // Replace pages and theme in transaction
      await prisma.$transaction(async (tx) => {
        // Delete all existing template pages
        await tx.templatePage.deleteMany({
          where: { templateId: template.id },
        });

        // Delete existing template theme
        await tx.theme.deleteMany({
          where: { templateId: template.id },
        });

        // Create new theme from funnel's active theme
        if (funnel.activeTheme) {
          await tx.theme.create({
            data: {
              name: funnel.activeTheme.name,
              backgroundColor: funnel.activeTheme.backgroundColor,
              textColor: funnel.activeTheme.textColor,
              buttonColor: funnel.activeTheme.buttonColor,
              buttonTextColor: funnel.activeTheme.buttonTextColor,
              borderColor: funnel.activeTheme.borderColor,
              optionColor: funnel.activeTheme.optionColor,
              fontFamily: funnel.activeTheme.fontFamily,
              borderRadius: funnel.activeTheme.borderRadius,
              type: ThemeType.CUSTOM,
              templateId: template.id,
            },
          });
        }

        // Create new template pages from funnel pages
        const templatePagesData = funnel.pages.map((page) => ({
          templateId: template.id,
          name: page.name,
          content: page.content,
          order: page.order,
          type: page.type,
          settings: null,
          linkingId: page.linkingId,
          seoTitle: page.seoTitle,
          seoDescription: page.seoDescription,
          seoKeywords: page.seoKeywords,
        }));

        await tx.templatePage.createMany({
          data: templatePagesData,
        });

        // Touch the template to update updatedAt
        await tx.template.update({
          where: { id: template.id },
          data: {
            updatedAt: new Date(),
          },
        });
      });

      // Update cache with new data
      try {
        const updatedTemplateWithRelations = await prisma.template.findUnique({
          where: { id: template.id },
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
          await cacheService.setTemplateCache(template.id, "full", fullCacheData, {
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
            template.id,
            "summary",
            summaryCacheData,
            { ttl: 0 }
          );
        }
      } catch (cacheError) {
        console.warn(
          "Cache update failed but template pages were replaced:",
          cacheError
        );
      }

      return {
        message: "Template pages replaced successfully",
        templateId: template.id,
        templateSlug: template.slug,
      };
    } catch (error) {
      throw error;
    }
  }
}
