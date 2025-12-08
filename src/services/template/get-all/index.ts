import { getPrisma } from "../../../lib/prisma";
import { BadRequestError } from "../../../errors";
import { ZodError } from "zod";
import { Prisma } from "../../../generated/prisma-client";
import {
  GetAllTemplatesQuery,
  getAllTemplatesQuery,
  getAllTemplatesResponse,
  GetAllTemplatesResponse,
  TemplateSummaryItem,
} from "../../../types/template/get-all";

export const getAllTemplates = async (
  query: GetAllTemplatesQuery
): Promise<GetAllTemplatesResponse> => {
  try {
    const validatedQuery = getAllTemplatesQuery.parse(query);
    const prisma = getPrisma();

    const where: Prisma.TemplateWhereInput = {};

    const searchTerm = validatedQuery.search;
    const searchAsNumber = searchTerm ? parseInt(searchTerm, 10) : NaN;
    const isNumericSearch = !isNaN(searchAsNumber);
    const hasSearch = !!searchTerm;

    if (validatedQuery.categoryId !== undefined) {
      where.categoryId = validatedQuery.categoryId;
    }

    if (validatedQuery.categorySlug) {
      where.category = { slug: validatedQuery.categorySlug };
    }

    if (validatedQuery.isActive !== undefined) {
      where.isActive = validatedQuery.isActive;
    }

    if (validatedQuery.isPublic !== undefined) {
      where.isPublic = validatedQuery.isPublic;
    }

    if (validatedQuery.createdByUserId !== undefined) {
      where.createdByUserId = validatedQuery.createdByUserId;
    }

    if (validatedQuery.tags) {
      const tagsArray = validatedQuery.tags.split(",").map((t) => t.trim());
      where.tags = { hasSome: tagsArray };
    }

    const isPagesCountSort = validatedQuery.orderBy === "pagesCount";
    const needsInMemoryProcessing = isPagesCountSort || hasSearch;

    let orderBy: Prisma.TemplateOrderByWithRelationInput | undefined;
    if (!isPagesCountSort) {
      orderBy = { [validatedQuery.orderBy]: validatedQuery.order };
    }

    const skip = (validatedQuery.page - 1) * validatedQuery.limit;

    const templates = await prisma.template.findMany({
      where,
      include: {
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
        previewImages: {
          orderBy: { order: "asc" },
          select: {
            imageUrl: true,
            imageType: true,
          },
        },
        _count: {
          select: {
            pages: true,
            previewImages: true,
          },
        },
      },
      orderBy,
      skip: needsInMemoryProcessing ? undefined : skip,
      take: needsInMemoryProcessing ? undefined : validatedQuery.limit,
    });

    let processedTemplates = templates.map((template) => {
      const thumbnailUrl =
        template.previewImages.find((img) => img.imageType === "THUMBNAIL")
          ?.imageUrl || null;

      const previewUrls = template.previewImages
        .filter((img) => img.imageType === "PREVIEW")
        .map((img) => img.imageUrl);

      return {
        id: template.id,
        name: template.name,
        slug: template.slug,
        description: template.description,
        categoryId: template.categoryId,
        categoryName: template.category.name,
        categorySlug: template.category.slug,
        tags: template.tags,
        isActive: template.isActive,
        isPublic: template.isPublic,
        createdByUserId: template.createdByUserId,
        usageCount: template.usageCount,
        pagesCount: template._count.pages,
        imagesCount: template._count.previewImages,
        thumbnailUrl,
        previewUrls,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      };
    });

    if (hasSearch) {
      const searchLower = searchTerm!.toLowerCase();

      processedTemplates = processedTemplates.filter((t) => {
        if (t.name.toLowerCase().includes(searchLower)) return true;
        if (t.slug.toLowerCase().includes(searchLower)) return true;
        if (t.description?.toLowerCase().includes(searchLower)) return true;
        if (t.categoryName.toLowerCase().includes(searchLower)) return true;
        if (t.categorySlug.toLowerCase().includes(searchLower)) return true;
        if (t.tags.some((tag) => tag.toLowerCase().includes(searchLower)))
          return true;

        if (isNumericSearch) {
          if (t.usageCount === searchAsNumber) return true;
          if (t.pagesCount === searchAsNumber) return true;
        }

        return false;
      });
    }

    if (isPagesCountSort) {
      processedTemplates.sort((a, b) => {
        const order = validatedQuery.order === "asc" ? 1 : -1;
        return order * (a.pagesCount - b.pagesCount);
      });
    }

    const total = processedTemplates.length;

    if (needsInMemoryProcessing) {
      processedTemplates = processedTemplates.slice(
        skip,
        skip + validatedQuery.limit
      );
    }

    const totalPages = Math.ceil(total / validatedQuery.limit);
    const hasNext = validatedQuery.page < totalPages;
    const hasPrev = validatedQuery.page > 1;

    const response = {
      templates: processedTemplates as TemplateSummaryItem[],
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
      filters: {
        search: validatedQuery.search ?? null,
        orderBy: validatedQuery.orderBy,
        order: validatedQuery.order,
        categoryId: validatedQuery.categoryId ?? null,
        categorySlug: validatedQuery.categorySlug ?? null,
        isActive: validatedQuery.isActive ?? null,
        isPublic: validatedQuery.isPublic ?? null,
        createdByUserId: validatedQuery.createdByUserId ?? null,
        tags: validatedQuery.tags ?? null,
      },
    };

    const validatedResponse = getAllTemplatesResponse.parse(response);
    return validatedResponse;
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid query parameters";
      throw new BadRequestError(message);
    }
    throw error;
  }
};
