import { getPrisma } from "../../../lib/prisma";
import { cacheService } from "../../../services/cache/cache.service";
import { BadRequestError } from "../../../errors";
import { ZodError } from "zod";
import {
  GetAllTemplatesQuery,
  getAllTemplatesQuery,
  getAllTemplatesResponse,
  GetAllTemplatesResponse,
} from "../../../types/template/get-all";

export const getAllTemplates = async (
  query: GetAllTemplatesQuery
): Promise<GetAllTemplatesResponse> => {
  try {
    const validatedQuery = getAllTemplatesQuery.parse(query);
    const prisma = getPrisma();

    const allTemplatesKey = "templates:ids:all";
    let allTemplateIds: number[] | null = null;

    try {
      allTemplateIds = await cacheService.get<number[]>(allTemplatesKey);
    } catch (cacheError) {
      console.warn("Failed to get template IDs from cache:", cacheError);
    }

    if (!allTemplateIds || allTemplateIds.length === 0) {
      console.log("Cache miss: Fetching all templates from database");

      const allTemplates = await prisma.template.findMany({
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
            },
          },
        },
      });

      const cachePromises = allTemplates.map(async (template) => {
        const thumbnailUrl =
          template.previewImages.find(
            (img: any) => img.imageType === "THUMBNAIL"
          )?.imageUrl || null;

        const previewUrls = template.previewImages
          .filter((img: any) => img.imageType === "PREVIEW")
          .map((img: any) => img.imageUrl);

        const summary = {
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
          thumbnailUrl,
          previewUrls,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
        };

        await cacheService.setTemplateCache(template.id, "summary", summary, {
          ttl: 0,
        });
        return summary;
      });

      await Promise.all(cachePromises);

      allTemplateIds = allTemplates.map((t) => t.id);
      await cacheService.set(allTemplatesKey, allTemplateIds, { ttl: 0 });
    }

    const templateSummaries: any[] = [];

    for (const templateId of allTemplateIds) {
      try {
        let summary = await cacheService.getTemplateCache<any>(
          templateId,
          "summary"
        );

        if (!summary) {
          console.log(
            `Cache miss for template ${templateId}, fetching from DB`
          );

          try {
            const template = await prisma.template.findUnique({
              where: { id: templateId },
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
                  },
                },
              },
            });

            if (template) {
              const thumbnailUrl =
                template.previewImages.find(
                  (img: any) => img.imageType === "THUMBNAIL"
                )?.imageUrl || null;

              const previewUrls = template.previewImages
                .filter((img: any) => img.imageType === "PREVIEW")
                .map((img: any) => img.imageUrl);

              summary = {
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
                thumbnailUrl,
                previewUrls,
                createdAt: template.createdAt,
                updatedAt: template.updatedAt,
              };

              await cacheService.setTemplateCache(
                template.id,
                "summary",
                summary,
                { ttl: 0 }
              );
            }
          } catch (dbError) {
            console.error(
              `Failed to fetch template ${templateId} from DB:`,
              dbError
            );
            continue;
          }
        }

        if (summary) {
          if (!summary.isActive || !summary.isPublic) continue;
          if (
            validatedQuery.category &&
            summary.categorySlug !== validatedQuery.category
          )
            continue;

          templateSummaries.push(summary);
        }
      } catch (err) {
        console.warn(`Failed to get template ${templateId} from cache:`, err);
      }
    }

    templateSummaries.sort((a, b) => {
      const field = validatedQuery.orderBy;
      const order = validatedQuery.order === "asc" ? 1 : -1;

      if (field === "name") {
        return order * a.name.localeCompare(b.name);
      } else if (field === "usageCount") {
        return order * (a.usageCount - b.usageCount);
      } else if (field === "createdAt" || field === "updatedAt") {
        return (
          order * (new Date(a[field]).getTime() - new Date(b[field]).getTime())
        );
      }
      return 0;
    });

    const total = templateSummaries.length;
    const skip = (validatedQuery.page - 1) * validatedQuery.limit;
    const paginatedTemplates = templateSummaries.slice(
      skip,
      skip + validatedQuery.limit
    );

    const totalPages = Math.ceil(total / validatedQuery.limit);
    const hasNext = validatedQuery.page < totalPages;
    const hasPrev = validatedQuery.page > 1;

    const response = {
      templates: paginatedTemplates,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
      filters: {
        orderBy: validatedQuery.orderBy,
        order: validatedQuery.order,
        category: validatedQuery.category,
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
