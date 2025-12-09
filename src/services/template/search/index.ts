import { getPrisma } from "../../../lib/prisma";
import {
  SearchTemplatesResponse,
  searchTemplatesResponse,
  SearchTemplatesQuery,
} from "../../../types/template/search";

export const searchTemplates = async (
  query: SearchTemplatesQuery
): Promise<SearchTemplatesResponse> => {
  const prisma = getPrisma();

  // Fetch all active and public templates with minimal fields
  const templates = await prisma.template.findMany({
    where: {
      isActive: true,
      isPublic: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // If search term provided, filter in-memory
  let filteredTemplates = templates;

  if (query.search) {
    const searchLower = query.search.toLowerCase();
    filteredTemplates = templates.filter((template) => {
      const nameMatch = template.name.toLowerCase().includes(searchLower);
      const slugMatch = template.slug.toLowerCase().includes(searchLower);
      const descriptionMatch = template.description
        ?.toLowerCase()
        .includes(searchLower);

      return nameMatch || slugMatch || descriptionMatch;
    });
  }

  // Map to response format (exclude description from response)
  const result = filteredTemplates.map((template) => ({
    id: template.id,
    name: template.name,
    slug: template.slug,
  }));

  return searchTemplatesResponse.parse({ templates: result });
};
