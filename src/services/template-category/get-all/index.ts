import { getPrisma } from "../../../lib/prisma";
import { BadRequestError } from "../../../errors";
import { ZodError } from "zod";
import {
  GetAllCategoriesQuery,
  getAllCategoriesQuery,
  getAllCategoriesResponse,
  GetAllCategoriesResponse,
} from "../../../types/template-category/get-all";

export const getAllCategories = async (
  query: GetAllCategoriesQuery
): Promise<GetAllCategoriesResponse> => {
  try {
    const validatedQuery = getAllCategoriesQuery.parse(query);
    const prisma = getPrisma();

    const categories = await prisma.templateCategory.findMany({
      include: {
        _count: {
          select: { templates: true },
        },
      },
      orderBy: { name: "asc" },
    });

    let result = categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      templateCount: category._count.templates,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));

    if (validatedQuery.search) {
      const searchLower = validatedQuery.search.toLowerCase();
      result = result.filter((c) => {
        if (c.name.toLowerCase().includes(searchLower)) return true;
        if (c.slug.toLowerCase().includes(searchLower)) return true;
        if (c.description?.toLowerCase().includes(searchLower)) return true;
        return false;
      });
    }

    return getAllCategoriesResponse.parse({ categories: result });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid query parameters";
      throw new BadRequestError(message);
    }
    throw error;
  }
};
