import { getPrisma } from "../../../lib/prisma";
import {
  CreateTemplateFromFunnelRequest,
  CreateTemplateFromFunnelResponse,
} from "../../../types/template/create-from-funnel";
import { transformSlug } from "./utils/transform-slug";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../errors";

interface CreateTemplateFromFunnelParams {
  userId: number;
  data: CreateTemplateFromFunnelRequest;
}

export class CreateTemplateFromFunnelService {
  static async create({
    userId,
    data,
  }: CreateTemplateFromFunnelParams): Promise<CreateTemplateFromFunnelResponse> {
    try {
      const prisma = getPrisma();

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, isAdmin: true },
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      if (!user.isAdmin) {
        throw new ForbiddenError("Only administrators can create templates");
      }

      // Validate category exists
      const category = await prisma.templateCategory.findUnique({
        where: { id: data.categoryId },
        select: { id: true },
      });

      if (!category) {
        throw new NotFoundError("Template category not found");
      }

      // Validate workspace exists
      const workspace = await prisma.workspace.findUnique({
        where: { slug: data.workspaceSlug },
        select: { id: true },
      });

      if (!workspace) {
        throw new NotFoundError("Workspace not found");
      }

      // Validate funnel exists and has pages (find by workspace + funnel slug)
      const funnel = await prisma.funnel.findFirst({
        where: {
          slug: data.funnelSlug,
          workspaceId: workspace.id,
        },
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
          "Cannot create template from a funnel with no pages"
        );
      }

      // Transform and validate slug
      const transformedSlug = transformSlug(data.slug);

      // Check slug uniqueness
      const existingTemplate = await prisma.template.findUnique({
        where: { slug: transformedSlug },
        select: { id: true },
      });

      if (existingTemplate) {
        throw new BadRequestError("A template with this slug already exists");
      }

      // Create template with pages and images in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create the template (inactive and private by default)
        const template = await tx.template.create({
          data: {
            name: data.name,
            slug: transformedSlug,
            description: data.description,
            categoryId: data.categoryId,
            tags: data.tags ?? [],
            isActive: false,
            isPublic: false,
            createdByUserId: userId,
          },
        });

        // Create template pages from funnel pages
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

        // Create template images
        const templateImagesData = data.images.map((image) => ({
          templateId: template.id,
          imageUrl: image.imageUrl,
          imageType: image.imageType,
          order: image.order,
          caption: image.caption ?? null,
        }));

        await tx.templateImage.createMany({
          data: templateImagesData,
        });

        return template;
      });

      return {
        message: "Template created successfully",
        templateId: result.id,
        slug: result.slug,
      };
    } catch (error) {
      throw error;
    }
  }
}
