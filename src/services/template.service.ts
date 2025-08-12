import {
  PrismaClient,
  Template,
  TemplateCategory,
  Funnel,
  Page,
} from "../generated/prisma-client";
import { azureBlobStorageService } from "./azure-blob-storage.service";
import { createSlug } from "../utils/slug";

const prisma = new PrismaClient();

interface CreateTemplateData {
  name: string;
  description?: string;
  categoryId: number;
  funnelId: number;
  tags?: string[];
  isPublic?: boolean;
}

interface CreateTemplateFromFunnelResult {
  template: Template;
  copiedPages: number;
  copiedImages: number;
}

interface TemplateWithDetails extends Template {
  category: TemplateCategory;
  previewImages: Array<{
    id: number;
    imageUrl: string;
    imageType: string;
    order: number;
    caption?: string;
  }>;
  pages: Array<{
    id: number;
    name: string;
    order: number;
  }>;
  createdBy: {
    id: number;
    name: string;
    email: string;
  };
}

export class TemplateService {
  async createTemplateFromFunnel(
    userId: number,
    data: CreateTemplateData
  ): Promise<CreateTemplateFromFunnelResult> {
    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.isAdmin) {
      throw new Error("Only admin users can create templates");
    }

    // Verify funnel exists and belongs to user or user is admin
    const funnel = await prisma.funnel.findFirst({
      where: {
        id: data.funnelId,
        OR: [
          { userId },
          { user: { isAdmin: true } }, // Admins can create templates from any funnel
        ],
      },
      include: {
        pages: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!funnel) {
      throw new Error("Funnel not found or access denied");
    }

    // Verify category exists
    const category = await prisma.templateCategory.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new Error("Template category not found");
    }

    // Generate unique slug
    const baseSlug = createSlug(data.name);
    const slug = await this.generateUniqueSlug(baseSlug);

    // Create template
    const template = await prisma.template.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        categoryId: data.categoryId,
        tags: data.tags || [],
        isPublic: data.isPublic ?? true,
        createdByUserId: userId,
      },
    });

    // Copy pages to template
    let copiedPages = 0;
    for (const page of funnel.pages) {
      await prisma.templatePages.create({
        data: {
          templateId: template.id,
          name: page.name,
          content: page.content,
          order: page.order,
          linkingIdPrefix: `template-${template.id}-page`,
          settings: {
            originalPageId: page.id,
            originalLinkingId: page.linkingId,
          },
        },
      });
      copiedPages++;
    }

    // Generate thumbnail from first page if available
    let copiedImages = 0;
    if (funnel.pages.length > 0) {
      try {
        // This would be enhanced to actually generate/capture page screenshots
        // For now, we'll create a placeholder entry
        await prisma.templateImage.create({
          data: {
            templateId: template.id,
            imageUrl: `/api/templates/${template.id}/thumbnail`, // Placeholder
            imageType: "thumbnail",
            order: 0,
            caption: "Auto-generated thumbnail",
          },
        });
        copiedImages++;
      } catch (error) {
        console.warn("Failed to create thumbnail:", error);
      }
    }

    return {
      template,
      copiedPages,
      copiedImages,
    };
  }

  async getTemplates(
    options: {
      categoryId?: number;
      isPublic?: boolean;
      search?: string;
      page?: number;
      limit?: number;
      orderBy?: "name" | "usageCount" | "createdAt";
      orderDirection?: "asc" | "desc";
    } = {}
  ): Promise<{
    templates: TemplateWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      categoryId,
      isPublic = true,
      search,
      page = 1,
      limit = 20,
      orderBy = "createdAt",
      orderDirection = "desc",
    } = options;

    const offset = (page - 1) * limit;

    const where: any = {
      isActive: true,
      isPublic,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ];
    }

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        include: {
          category: true,
          previewImages: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              imageUrl: true,
              imageType: true,
              order: true,
              caption: true,
            },
          },
          pages: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              name: true,
              order: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { [orderBy]: orderDirection },
        skip: offset,
        take: limit,
      }),
      prisma.template.count({ where }),
    ]);

    return {
      templates: templates as TemplateWithDetails[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTemplateById(id: number): Promise<TemplateWithDetails | null> {
    const template = await prisma.template.findUnique({
      where: { id, isActive: true },
      include: {
        category: true,
        previewImages: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            imageUrl: true,
            imageType: true,
            order: true,
            caption: true,
          },
        },
        pages: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            name: true,
            order: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return template as TemplateWithDetails | null;
  }

  async getTemplateBySlug(slug: string): Promise<TemplateWithDetails | null> {
    const template = await prisma.template.findUnique({
      where: { slug, isActive: true },
      include: {
        category: true,
        previewImages: {
          orderBy: { order: "asc" },
        },
        pages: {
          orderBy: { order: "asc" },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return template as TemplateWithDetails | null;
  }

  async addTemplateImage(
    templateId: number,
    userId: number,
    imageBuffer: Buffer,
    options: {
      imageType: string;
      caption?: string;
      contentType?: string;
    }
  ): Promise<void> {
    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.isAdmin) {
      throw new Error("Only admin users can manage template images");
    }

    // Verify template exists
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error("Template not found");
    }

    // Generate filename and upload to Azure
    const fileName = azureBlobStorageService.generateFileName(
      `template-${templateId}-${options.imageType}`,
      templateId,
      options.imageType
    );

    const uploadResult = await azureBlobStorageService.uploadBuffer(
      imageBuffer,
      {
        fileName,
        contentType: options.contentType,
        folder: "templates",
      }
    );

    // Get next order number
    const lastImage = await prisma.templateImage.findFirst({
      where: { templateId },
      orderBy: { order: "desc" },
    });

    const order = (lastImage?.order || 0) + 1;

    // Save image record
    await prisma.templateImage.create({
      data: {
        templateId,
        imageUrl: uploadResult.url,
        imageType: options.imageType,
        order,
        caption: options.caption,
      },
    });
  }

  async incrementUsageCount(templateId: number): Promise<void> {
    await prisma.template.update({
      where: { id: templateId },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
  }

  async getTemplateCategories(): Promise<TemplateCategory[]> {
    return prisma.templateCategory.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
  }

  private async generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (await this.slugExists(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  private async slugExists(slug: string): Promise<boolean> {
    const template = await prisma.template.findUnique({
      where: { slug },
    });
    return !!template;
  }
}

export const templateService = new TemplateService();
